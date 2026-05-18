import { useQuery } from "@tanstack/react-query";
import * as usersApi from "../api/users.api";

export function useUsers(params?: { page?: number; size?: number }) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => usersApi.getUsers(params),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => usersApi.getUser(id),
    enabled: !!id,
  });
}
