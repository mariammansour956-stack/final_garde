import json
import math

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.dependencies import get_current_user_id
from app.models import Notification
from app.schemas import (
    MessageResponse,
    NotificationCreateRequest,
    NotificationResponse,
    PaginatedNotificationsResponse,
    UnreadCountResponse,
)

router = APIRouter(prefix="/notifications", tags=["notifications"])


def _notification_to_response(notif: Notification) -> NotificationResponse:
    meta = {}
    if notif.metadata_json:
        try:
            meta = json.loads(notif.metadata_json)
        except (json.JSONDecodeError, TypeError):
            meta = {}
    return NotificationResponse(
        id=notif.id,
        user_id=notif.user_id,
        type=notif.type,
        title=notif.title,
        message=notif.message,
        is_read=notif.is_read,
        metadata=meta,
        created_at=notif.created_at,
    )


@router.post("/send", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
async def send_notification(
    body: NotificationCreateRequest,
    session: AsyncSession = Depends(get_session),
) -> NotificationResponse:
    notification = Notification(
        user_id=body.user_id,
        type=body.type,
        title=body.title,
        message=body.message,
        metadata_json=json.dumps(body.metadata) if body.metadata else None,
    )
    session.add(notification)
    await session.flush()
    await session.refresh(notification)
    return _notification_to_response(notification)


@router.get("", response_model=PaginatedNotificationsResponse)
async def list_notifications(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    is_read: bool | None = Query(None),
    user_info: tuple[str, str] = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
) -> PaginatedNotificationsResponse:
    user_id, _ = user_info

    query = select(Notification).where(Notification.user_id == user_id)
    count_query = select(func.count(Notification.id)).where(Notification.user_id == user_id)

    if is_read is not None:
        query = query.where(Notification.is_read == is_read)
        count_query = count_query.where(Notification.is_read == is_read)

    count_result = await session.execute(count_query)
    total = count_result.scalar_one()

    offset = (page - 1) * size
    result = await session.execute(
        query.order_by(Notification.created_at.desc()).offset(offset).limit(size)
    )
    notifications = result.scalars().all()

    return PaginatedNotificationsResponse(
        items=[_notification_to_response(n) for n in notifications],
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 1,
    )


@router.get("/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(
    user_info: tuple[str, str] = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
) -> UnreadCountResponse:
    user_id, _ = user_info
    result = await session.execute(
        select(func.count(Notification.id)).where(
            Notification.user_id == user_id, Notification.is_read == False  # noqa: E712
        )
    )
    count = result.scalar_one()
    return UnreadCountResponse(count=count)


@router.get("/{notification_id}", response_model=NotificationResponse)
async def get_notification(
    notification_id: str,
    user_info: tuple[str, str] = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
) -> NotificationResponse:
    user_id, _ = user_info
    result = await session.execute(
        select(Notification).where(
            Notification.id == notification_id, Notification.user_id == user_id
        )
    )
    notif = result.scalar_one_or_none()
    if notif is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
    return _notification_to_response(notif)


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_as_read(
    notification_id: str,
    user_info: tuple[str, str] = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
) -> NotificationResponse:
    user_id, _ = user_info
    result = await session.execute(
        select(Notification).where(
            Notification.id == notification_id, Notification.user_id == user_id
        )
    )
    notif = result.scalar_one_or_none()
    if notif is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
    notif.is_read = True
    session.add(notif)
    await session.flush()
    return _notification_to_response(notif)


@router.patch("/read-all", response_model=MessageResponse)
async def mark_all_as_read(
    user_info: tuple[str, str] = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
) -> MessageResponse:
    user_id, _ = user_info
    await session.execute(
        select(Notification)
        .where(Notification.user_id == user_id, Notification.is_read == False)  # noqa: E712
    )
    await session.execute(
        Notification.__table__.update()
        .where(Notification.user_id == user_id, Notification.is_read == False)  # noqa: E712
        .values(is_read=True)
    )
    await session.flush()
    return MessageResponse(message="All notifications marked as read")


@router.delete("/{notification_id}", response_model=MessageResponse)
async def delete_notification(
    notification_id: str,
    user_info: tuple[str, str] = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
) -> MessageResponse:
    user_id, _ = user_info
    result = await session.execute(
        select(Notification).where(
            Notification.id == notification_id, Notification.user_id == user_id
        )
    )
    notif = result.scalar_one_or_none()
    if notif is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
    await session.delete(notif)
    await session.flush()
    return MessageResponse(message="Notification deleted successfully")
