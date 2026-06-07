import math
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from prometheus_client import Counter

from app.database import get_session
from app.dependencies import get_current_user_id, require_admin
from app.http_client import send_notification
from app.models import Order, OrderItem
from app.schemas import (
    MessageResponse,
    OrderCreateRequest,
    OrderResponse,
    OrderStatsResponse,
    OrderStatusUpdate,
    PaginatedOrdersResponse,
)
from app.config import settings

logger = logging.getLogger(settings.service_name)

router = APIRouter(prefix="/orders", tags=["orders"])

orders_created_total = Counter(
    "orders_created_total",
    "Total number of orders created successfully",
    ["service"],
)


def _order_to_response(order: Order) -> OrderResponse:
    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        status=order.status,
        total_amount=order.total_amount,
        shipping_address=order.shipping_address,
        items=[
            {
                "id": item.id,
                "order_id": item.order_id,
                "product_name": item.product_name,
                "product_sku": item.product_sku,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "subtotal": item.subtotal,
            }
            for item in order.items
        ],
        created_at=order.created_at,
        updated_at=order.updated_at,
    )


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    body: OrderCreateRequest,
    user_info: tuple[str, str] = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
) -> OrderResponse:
    user_id, _ = user_info

    total_amount = sum(
        item.quantity * item.unit_price for item in body.items
    )

    order = Order(
        user_id=user_id,
        status="pending",
        total_amount=total_amount,
        shipping_address=body.shipping_address,
    )
    session.add(order)
    await session.flush()

    for item_data in body.items:
        subtotal = item_data.quantity * item_data.unit_price
        order_item = OrderItem(
            order_id=order.id,
            product_name=item_data.product_name,
            product_sku=item_data.product_sku,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            subtotal=subtotal,
        )
        session.add(order_item)
    await session.flush()

    # Reload with items
    result = await session.execute(
        select(Order).where(Order.id == order.id).options(selectinload(Order.items))
    )
    created_order = result.scalar_one()

    # Fire-and-forget notification
    await send_notification(
        user_id=user_id,
        notification_type="order_created",
        title="Order Confirmed",
        message=f"Your order #{created_order.id[:8]} has been placed.",
        metadata={"order_id": created_order.id},
    )

    orders_created_total.labels(service="order-service").inc()

    return _order_to_response(created_order)


@router.get("", response_model=PaginatedOrdersResponse)
async def list_my_orders(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    user_info: tuple[str, str] = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
) -> PaginatedOrdersResponse:
    user_id, _ = user_info

    query = select(Order).where(Order.user_id == user_id).options(selectinload(Order.items))
    count_query = select(func.count(Order.id)).where(Order.user_id == user_id)

    if status_filter:
        query = query.where(Order.status == status_filter)
        count_query = count_query.where(Order.status == status_filter)

    count_result = await session.execute(count_query)
    total = count_result.scalar_one()

    offset = (page - 1) * size
    result = await session.execute(
        query.order_by(Order.created_at.desc()).offset(offset).limit(size)
    )
    orders = result.scalars().all()

    return PaginatedOrdersResponse(
        items=[_order_to_response(o) for o in orders],
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 1,
    )


@router.get("/stats", response_model=list[OrderStatsResponse])
async def get_order_stats(
    user_info: tuple[str, str] = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> list[OrderStatsResponse]:
    result = await session.execute(
        select(Order.status, func.count(Order.id), func.coalesce(func.sum(Order.total_amount), 0))
        .group_by(Order.status)
    )
    rows = result.all()
    return [
        OrderStatsResponse(status=row[0], count=row[1], total_revenue=float(row[2]))
        for row in rows
    ]


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: str,
    user_info: tuple[str, str] = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
) -> OrderResponse:
    user_id, role = user_info

    result = await session.execute(
        select(Order).where(Order.id == order_id).options(selectinload(Order.items))
    )
    order = result.scalar_one_or_none()

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    if order.user_id != user_id and role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    return _order_to_response(order)


@router.put("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: str,
    body: OrderStatusUpdate,
    user_info: tuple[str, str] = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> OrderResponse:
    result = await session.execute(
        select(Order).where(Order.id == order_id).options(selectinload(Order.items))
    )
    order = result.scalar_one_or_none()

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    order.status = body.status
    session.add(order)
    await session.flush()

    await send_notification(
        user_id=order.user_id,
        notification_type=f"order_{body.status}",
        title=f"Order {body.status.capitalize()}",
        message=f"Your order #{order.id[:8]} has been {body.status}.",
        metadata={"order_id": order.id},
    )

    return _order_to_response(order)


@router.delete("/{order_id}", response_model=MessageResponse)
async def cancel_order(
    order_id: str,
    user_info: tuple[str, str] = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
) -> MessageResponse:
    user_id, _ = user_info

    result = await session.execute(
        select(Order).where(Order.id == order_id).options(selectinload(Order.items))
    )
    order = result.scalar_one_or_none()

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    if order.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    if order.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel order in '{order.status}' status",
        )

    order.status = "cancelled"
    session.add(order)
    await session.flush()

    return MessageResponse(message="Order cancelled successfully")
