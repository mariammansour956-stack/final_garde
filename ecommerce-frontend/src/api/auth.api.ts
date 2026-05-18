import { userApi } from "./axios";
import type {
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  User,
  UserUpdateRequest,
} from "../types";

export async function login(data: LoginRequest): Promise<AuthTokens> {
  const resp = await userApi.post<AuthTokens>("/auth/login", data);
  return resp.data;
}

export async function register(data: RegisterRequest): Promise<AuthTokens> {
  const resp = await userApi.post<AuthTokens>("/auth/register", data);
  return resp.data;
}

export async function refresh(token: string): Promise<AuthTokens> {
  const resp = await userApi.post<AuthTokens>("/auth/refresh", {
    refresh_token: token,
  });
  return resp.data;
}

export async function getMe(): Promise<User> {
  const resp = await userApi.get<User>("/users/me");
  return resp.data;
}

export async function updateMe(data: UserUpdateRequest): Promise<User> {
  const resp = await userApi.put<User>("/users/me", data);
  return resp.data;
}
