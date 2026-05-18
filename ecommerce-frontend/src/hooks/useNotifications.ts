import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import * as notifApi from "../api/notifications.api";

export function useNotifications(params?: {
  page?: number;
  size?: number;
  is_read?: boolean;
}) {
  return useQuery({
    queryKey: ["notifications", params],
    queryFn: () => notifApi.getNotifications(params),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ["unread-count"],
    queryFn: async () => {
      const result = await notifApi.getUnreadCount();
      return result.count;
    },
    refetchInterval: 30000,
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notifApi.markRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      await queryClient.cancelQueries({ queryKey: ["unread-count"] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
    onError: () => {
      toast.error("Failed to mark as read");
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notifApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
      toast.success("All marked as read");
    },
    onError: () => {
      toast.error("Failed to mark all as read");
    },
  });
}
