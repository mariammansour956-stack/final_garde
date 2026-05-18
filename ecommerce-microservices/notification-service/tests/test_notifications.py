import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_send_notification(async_client: AsyncClient):
    response = await async_client.post(
        "/notifications/send",
        json={
            "user_id": "user-123",
            "type": "order_created",
            "title": "Order Confirmed",
            "message": "Your order has been placed.",
            "metadata": {"order_id": "ord-001"},
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["type"] == "order_created"
    assert data["title"] == "Order Confirmed"
    assert data["is_read"] is False
    assert data["metadata"]["order_id"] == "ord-001"


@pytest.mark.asyncio
async def test_list_notifications(async_client: AsyncClient, auth_headers: dict):
    # Create a notification for the test user
    await async_client.post(
        "/notifications/send",
        json={
            "user_id": "test-user-id",
            "type": "order_shipped",
            "title": "Order Shipped",
            "message": "Your order has shipped.",
            "metadata": {},
        },
    )

    response = await async_client.get("/notifications", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert len(data["items"]) >= 1


@pytest.mark.asyncio
async def test_get_unread_count(async_client: AsyncClient, auth_headers: dict):
    await async_client.post(
        "/notifications/send",
        json={
            "user_id": "test-user-id",
            "type": "order_delivered",
            "title": "Delivered",
            "message": "Your order was delivered.",
            "metadata": {},
        },
    )

    response = await async_client.get("/notifications/unread-count", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["count"] >= 1


@pytest.mark.asyncio
async def test_mark_as_read(async_client: AsyncClient, auth_headers: dict):
    create_resp = await async_client.post(
        "/notifications/send",
        json={
            "user_id": "test-user-id",
            "type": "account_update",
            "title": "Profile Updated",
            "message": "Your profile was updated.",
            "metadata": {},
        },
    )
    notif_id = create_resp.json()["id"]

    response = await async_client.patch(
        f"/notifications/{notif_id}/read",
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["is_read"] is True


@pytest.mark.asyncio
async def test_mark_all_as_read(async_client: AsyncClient, auth_headers: dict):
    await async_client.post(
        "/notifications/send",
        json={
            "user_id": "test-user-id",
            "type": "order_created",
            "title": "New Order",
            "message": "New order created.",
            "metadata": {},
        },
    )
    await async_client.post(
        "/notifications/send",
        json={
            "user_id": "test-user-id",
            "type": "order_shipped",
            "title": "Shipped",
            "message": "Order shipped.",
            "metadata": {},
        },
    )

    response = await async_client.patch("/notifications/read-all", headers=auth_headers)
    assert response.status_code == 200
    assert "All notifications marked as read" in response.json()["message"]

    # Verify unread count is 0
    count_resp = await async_client.get("/notifications/unread-count", headers=auth_headers)
    assert count_resp.json()["count"] == 0


@pytest.mark.asyncio
async def test_delete_notification(async_client: AsyncClient, auth_headers: dict):
    create_resp = await async_client.post(
        "/notifications/send",
        json={
            "user_id": "test-user-id",
            "type": "order_created",
            "title": "To Delete",
            "message": "This will be deleted.",
            "metadata": {},
        },
    )
    notif_id = create_resp.json()["id"]

    response = await async_client.delete(
        f"/notifications/{notif_id}",
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert "deleted" in response.json()["message"]
