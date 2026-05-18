import { orderApi } from "./axios";
import type {
  Order,
  OrderCreateRequest,
  OrderStatus,
  OrderStats,
  PaginatedResponse,
} from "../types";

export async function getOrders(params?: {
  page?: number;
  size?: number;
  status?: string;
}): Promise<PaginatedResponse<Order>> {
  const resp = await orderApi.get<PaginatedResponse<Order>>("/orders", {
    params,
  });
  return resp.data;
}

export async function getOrder(id: string): Promise<Order> {
  const resp = await orderApi.get<Order>(`/orders/${id}`);
  return resp.data;
}

export async function createOrder(data: OrderCreateRequest): Promise<Order> {
  const resp = await orderApi.post<Order>("/orders", data);
  return resp.data;
}

export async function cancelOrder(id: string): Promise<{ message: string }> {
  const resp = await orderApi.delete<{ message: string }>(`/orders/${id}`);
  return resp.data;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<Order> {
  const resp = await orderApi.put<Order>(`/orders/${id}/status`, { status });
  return resp.data;
}

export async function getOrderStats(): Promise<OrderStats[]> {
  const resp = await orderApi.get<OrderStats[]>("/orders/stats");
  return resp.data;
}
