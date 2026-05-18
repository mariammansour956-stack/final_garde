// import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// import toast from "react-hot-toast";
// import * as authApi from "../api/auth.api";
// import { useAuthStore } from "../store/authStore";
// import type { LoginRequest, RegisterRequest, UserUpdateRequest } from "../types";

// export function useLogin() {
//   const loginStore = useAuthStore((s) => s.login);
//   return useMutation({
//     mutationFn: (data: LoginRequest) => authApi.login(data),
//     onSuccess: async (tokens) => {
//       const me = await authApi.getMe();
//       loginStore(tokens, me);
//       toast.success("Login successful!");
//     },
//     onError: (err: unknown) => {
//       const msg =
//         (err as { response?: { data?: { detail?: string } } })?.response?.data
//           ?.detail || "Login failed";
//       toast.error(msg);
//     },
//   });
// }

// export function useRegister() {
//   const loginStore = useAuthStore((s) => s.login);
//   return useMutation({
//     mutationFn: (data: RegisterRequest) => authApi.register(data),
//     onSuccess: async (tokens) => {
//       const me = await authApi.getMe();
//       loginStore(tokens, me);
//       toast.success("Registration successful!");
//     },
//     onError: (err: unknown) => {
//       const msg =
//         (err as { response?: { data?: { detail?: string } } })?.response?.data
//           ?.detail || "Registration failed";
//       toast.error(msg);
//     },
//   });
// }

// export function useGetMe() {
//   const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
//   const updateUser = useAuthStore((s) => s.updateUser);
//   return useQuery({
//     queryKey: ["me"],
//     queryFn: async () => {
//       const user = await authApi.getMe();
//       updateUser(user);
//       return user;
//     },
//     enabled: isAuthenticated,
//   });
// }

// export function useUpdateProfile() {
//   const updateUser = useAuthStore((s) => s.updateUser);
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: (data: UserUpdateRequest) => authApi.updateMe(data),
//     onSuccess: (user) => {
//       updateUser(user);
//       queryClient.invalidateQueries({ queryKey: ["me"] });
//       toast.success("Profile updated!");
//     },
//     onError: (err: unknown) => {
//       const msg =
//         (err as { response?: { data?: { detail?: string } } })?.response?.data
//           ?.detail || "Update failed";
//       toast.error(msg);
//     },
//   });
// }

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import * as authApi from "../api/auth.api";
import { useAuthStore } from "../store/authStore";
import type { LoginRequest, RegisterRequest, UserUpdateRequest } from "../types";

export function useLogin() {
  const loginStore = useAuthStore((s) => s.login);
  const setTokens = useAuthStore((s) => s.setTokens);

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),

    onSuccess: async (tokens) => {
      // مهم جدًا: خزّن التوكن قبل getMe
      setTokens(tokens);

      const me = await authApi.getMe();

      loginStore(tokens, me);

      toast.success("Login successful!");
    },

    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Login failed";

      toast.error(msg);
    },
  });
}

export function useRegister() {
  const loginStore = useAuthStore((s) => s.login);
  const setTokens = useAuthStore((s) => s.setTokens);

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),

    onSuccess: async (tokens) => {
      // مهم جدًا: خزّن التوكن قبل getMe
      setTokens(tokens);

      const me = await authApi.getMe();

      loginStore(tokens, me);

      toast.success("Registration successful!");
    },

    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Registration failed";

      toast.error(msg);
    },
  });
}

// export function useGetMe() {
//   const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
//   const updateUser = useAuthStore((s) => s.updateUser);

//   return useQuery({
//     queryKey: ["me"],
//     queryFn: async () => {
//       const user = await authApi.getMe();
//       updateUser(user);
//       return user;
//     },
//     enabled: isAuthenticated,
//   });
// }

export function useGetMe() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const updateUser = useAuthStore((s) => s.updateUser);

  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const user = await authApi.getMe();
      updateUser(user);
      return user;
    },
    enabled: !!accessToken,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useUpdateProfile() {
  const updateUser = useAuthStore((s) => s.updateUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserUpdateRequest) => authApi.updateMe(data),

    onSuccess: (user) => {
      updateUser(user);
      queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Profile updated!");
    },

    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Update failed";

      toast.error(msg);
    },
  });
}