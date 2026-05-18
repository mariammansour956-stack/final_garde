import json
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class NotificationCreateRequest(BaseModel):
    user_id: str
    type: str = Field(
        ...,
        pattern="^(order_created|order_shipped|order_delivered|account_update)$",
    )
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=1000)
    metadata: dict[str, Any] = Field(default_factory=dict)


class NotificationResponse(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    message: str
    is_read: bool
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        data = super().model_validate(obj, *args, **kwargs)
        if isinstance(obj, BaseModel):
            return data
        # Deserialize metadata_json to dict
        meta_raw = getattr(obj, "metadata_json", None)
        if meta_raw:
            try:
                data.metadata = json.loads(meta_raw)
            except (json.JSONDecodeError, TypeError):
                data.metadata = {}
        else:
            data.metadata = {}
        return data


class PaginatedNotificationsResponse(BaseModel):
    items: list[NotificationResponse]
    total: int
    page: int
    size: int
    pages: int


class UnreadCountResponse(BaseModel):
    count: int


class MessageResponse(BaseModel):
    message: str
