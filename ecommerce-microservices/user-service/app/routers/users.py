import math

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.dependencies import get_current_user, require_admin
from app.models import User
from app.schemas import (
    MessageResponse,
    PaginatedUsersResponse,
    UserResponse,
    UserUpdateRequest,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    body: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> UserResponse:
    if body.full_name is not None:
        current_user.full_name = body.full_name
    if body.username is not None:
        existing = await session.execute(
            select(User).where(User.username == body.username, User.id != current_user.id)
        )
        if existing.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already taken",
            )
        current_user.username = body.username

    session.add(current_user)
    await session.flush()
    return UserResponse.model_validate(current_user)


@router.delete("/me", response_model=MessageResponse)
async def deactivate_current_user(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> MessageResponse:
    current_user.is_active = False
    session.add(current_user)
    await session.flush()
    return MessageResponse(message="Account deactivated successfully")


@router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: str,
    current_user: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> UserResponse:
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return UserResponse.model_validate(user)


@router.get("", response_model=PaginatedUsersResponse)
async def list_users(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> PaginatedUsersResponse:
    count_result = await session.execute(select(func.count(User.id)))
    total = count_result.scalar_one()

    offset = (page - 1) * size
    result = await session.execute(
        select(User).order_by(User.created_at.desc()).offset(offset).limit(size)
    )
    users = result.scalars().all()

    return PaginatedUsersResponse(
        items=[UserResponse.model_validate(u) for u in users],
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 1,
    )
