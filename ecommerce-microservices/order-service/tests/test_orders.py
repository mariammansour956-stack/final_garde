import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_order(async_client: AsyncClient, auth_headers: dict):
    response = await async_client.post(
        "/orders",
        json={
            "items": [
                {
                    "product_name": "Test Product",
                    "product_sku": "TST-001",
                    "quantity": 2,
                    "unit_price": 29.99,
                }
            ],
            "shipping_address": "123 Test St, Test City",
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "pending"
    assert data["total_amount"] == 59.98
    assert len(data["items"]) == 1
    assert data["items"][0]["subtotal"] == 59.98


@pytest.mark.asyncio
async def test_list_my_orders(async_client: AsyncClient, auth_headers: dict):
    # Create an order first
    await async_client.post(
        "/orders",
        json={
            "items": [
                {
                    "product_name": "Item A",
                    "product_sku": "A-001",
                    "quantity": 1,
                    "unit_price": 10.0,
                }
            ],
            "shipping_address": "456 Test Ave",
        },
        headers=auth_headers,
    )

    response = await async_client.get("/orders", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert len(data["items"]) >= 1


@pytest.mark.asyncio
async def test_get_order_by_id(async_client: AsyncClient, auth_headers: dict):
    create_resp = await async_client.post(
        "/orders",
        json={
            "items": [
                {
                    "product_name": "Specific Item",
                    "product_sku": "SPC-001",
                    "quantity": 1,
                    "unit_price": 99.99,
                }
            ],
            "shipping_address": "789 Test Blvd",
        },
        headers=auth_headers,
    )
    order_id = create_resp.json()["id"]

    response = await async_client.get(f"/orders/{order_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == order_id
    assert data["total_amount"] == 99.99


@pytest.mark.asyncio
async def test_cancel_order(async_client: AsyncClient, auth_headers: dict):
    create_resp = await async_client.post(
        "/orders",
        json={
            "items": [
                {
                    "product_name": "Cancellable Item",
                    "product_sku": "CNL-001",
                    "quantity": 1,
                    "unit_price": 50.0,
                }
            ],
            "shipping_address": "321 Cancel St",
        },
        headers=auth_headers,
    )
    order_id = create_resp.json()["id"]

    response = await async_client.delete(f"/orders/{order_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["message"] == "Order cancelled successfully"


@pytest.mark.asyncio
async def test_unauthorized_access(async_client: AsyncClient):
    response = await async_client.get("/orders")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_cancel_non_pending_order(async_client: AsyncClient, auth_headers: dict, admin_headers: dict):
    create_resp = await async_client.post(
        "/orders",
        json={
            "items": [
                {
                    "product_name": "Shipped Item",
                    "product_sku": "SHP-001",
                    "quantity": 1,
                    "unit_price": 75.0,
                }
            ],
            "shipping_address": "654 Ship Ave",
        },
        headers=auth_headers,
    )
    order_id = create_resp.json()["id"]

    # Admin updates status to confirmed
    await async_client.put(
        f"/orders/{order_id}/status",
        json={"status": "confirmed"},
        headers=admin_headers,
    )

    # Try to cancel - should fail
    response = await async_client.delete(f"/orders/{order_id}", headers=auth_headers)
    assert response.status_code == 400
    assert "Cannot cancel" in response.json()["detail"]
