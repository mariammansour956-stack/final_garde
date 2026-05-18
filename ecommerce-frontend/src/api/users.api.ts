import { userApi } from "./axios";
import type { PaginatedResponse, User } from "../types";

export async function getUsers(params?: {
  page?: number;
  size?: number;
}): Promise<PaginatedResponse<User>> {
  const resp = await userApi.get<PaginatedResponse<User>>("/users", {
    params,
  });
  return resp.data;
}

export async function getUser(id: string): Promise<User> {
  const resp = await userApi.get<User>(`/users/${id}`);
  return resp.data;
}
