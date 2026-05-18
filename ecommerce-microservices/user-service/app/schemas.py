from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# ── Auth Schemas ──

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefreshRequest(BaseModel):
    refresh_token: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=1, max_length=100)


# ── User Schemas ──

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    is_active: bool
    role: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    username: Optional[str] = Field(None, min_length=3, max_length=50)


class PaginatedUsersResponse(BaseModel):
    items: list[UserResponse]
    total: int
    page: int
    size: int
    pages: int


# ── Generic ──

class MessageResponse(BaseModel):
    message: str


class ErrorResponse(BaseModel):
    detail: str
