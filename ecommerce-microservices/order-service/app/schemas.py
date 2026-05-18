from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ── Order Schemas ──

class OrderItemCreate(BaseModel):
    product_name: str = Field(..., min_length=1, max_length=200)
    product_sku: str = Field(..., min_length=1, max_length=50)
    quantity: int = Field(..., ge=1)
    unit_price: float = Field(..., ge=0)


class OrderCreateRequest(BaseModel):
    items: list[OrderItemCreate] = Field(..., min_length=1)
    shipping_address: str = Field(..., min_length=1, max_length=500)


class OrderItemResponse(BaseModel):
    id: str
    order_id: str
    product_name: str
    product_sku: str
    quantity: int
    unit_price: float
    subtotal: float

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    id: str
    user_id: str
    status: str
    total_amount: float
    shipping_address: str
    items: list[OrderItemResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PaginatedOrdersResponse(BaseModel):
    items: list[OrderResponse]
    total: int
    page: int
    size: int
    pages: int


class OrderStatusUpdate(BaseModel):
    status: str = Field(
        ...,
        pattern="^(pending|confirmed|shipped|delivered|cancelled)$",
    )


class OrderStatsResponse(BaseModel):
    status: str
    count: int
    total_revenue: float


class MessageResponse(BaseModel):
    message: str
