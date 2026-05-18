import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_user(async_client: AsyncClient):
    response = await async_client.post(
        "/auth/register",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "password123",
            "full_name": "Test User",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_register_duplicate_email(async_client: AsyncClient):
    payload = {
        "username": "user1",
        "email": "dupe@example.com",
        "password": "password123",
        "full_name": "User One",
    }
    await async_client.post("/auth/register", json=payload)
    response = await async_client.post("/auth/register", json=payload)
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_success(async_client: AsyncClient):
    await async_client.post(
        "/auth/register",
        json={
            "username": "loginuser",
            "email": "login@example.com",
            "password": "password123",
            "full_name": "Login User",
        },
    )
    response = await async_client.post(
        "/auth/login",
        json={"email": "login@example.com", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_login_wrong_password(async_client: AsyncClient):
    await async_client.post(
        "/auth/register",
        json={
            "username": "wrongpwuser",
            "email": "wrongpw@example.com",
            "password": "password123",
            "full_name": "Wrong PW",
        },
    )
    response = await async_client.post(
        "/auth/login",
        json={"email": "wrongpw@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert "Invalid" in response.json()["detail"]


@pytest.mark.asyncio
async def test_refresh_token(async_client: AsyncClient):
    reg_resp = await async_client.post(
        "/auth/register",
        json={
            "username": "refreshtest",
            "email": "refresh@example.com",
            "password": "password123",
            "full_name": "Refresh Test",
        },
    )
    refresh_token = reg_resp.json()["refresh_token"]

    response = await async_client.post(
        "/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_get_current_user(async_client: AsyncClient):
    reg_resp = await async_client.post(
        "/auth/register",
        json={
            "username": "meuser",
            "email": "me@example.com",
            "password": "password123",
            "full_name": "Me User",
        },
    )
    token = reg_resp.json()["access_token"]

    response = await async_client.get(
        "/users/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "me@example.com"
    assert data["username"] == "meuser"
    assert data["full_name"] == "Me User"


@pytest.mark.asyncio
async def test_unauthorized_access(async_client: AsyncClient):
    response = await async_client.get("/users/me")
    assert response.status_code == 403
