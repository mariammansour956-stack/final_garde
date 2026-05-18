import { notifApi } from "./axios";
import type {
  Notification,
  PaginatedResponse,
  UnreadCount,
} from "../types";

export async function getNotifications(params?: {
  page?: number;
  size?: number;
  is_read?: boolean;
}): Promise<PaginatedResponse<Notification>> {
  const resp = await notifApi.get<PaginatedResponse<Notification>>(
    "/notifications",
    { params }
  );
  return resp.data;
}

export async function markRead(
  id: string
): Promise<Notification> {
  const resp = await notifApi.patch<Notification>(
    `/notifications/${id}/read`
  );
  return resp.data;
}

export async function markAllRead(): Promise<{ message: string }> {
  const resp = await notifApi.patch<{ message: string }>(
    "/notifications/read-all"
  );
  return resp.data;
}

export async function getUnreadCount(): Promise<UnreadCount> {
  const resp = await notifApi.get<UnreadCount>(
    "/notifications/unread-count"
  );
  return resp.data;
}

export async function deleteNotification(
  id: string
): Promise<{ message: string }> {
  const resp = await notifApi.delete<{ message: string }>(
    `/notifications/${id}`
  );
  return resp.data;
}
