// import axios from "axios";
// import { useAuthStore } from "../store/authStore";

// const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL || "http://localhost:8001";
// const ORDER_SERVICE_URL = import.meta.env.VITE_ORDER_SERVICE_URL || "http://localhost:8002";
// const NOTIFICATION_SERVICE_URL =
//   import.meta.env.VITE_NOTIFICATION_SERVICE_URL || "http://localhost:8003";

// function createApiInstance(baseURL: string) {
//   const instance = axios.create({
//     baseURL,
//     headers: { "Content-Type": "application/json" },
//     timeout: 15000,
//   });

//   instance.interceptors.request.use((config) => {
//     const token = useAuthStore.getState().accessToken;
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   });

//   instance.interceptors.response.use(
//     (response) => response,
//     async (error) => {
//       const originalRequest = error.config;
//       if (error.response?.status === 401 && !originalRequest._retry) {
//         originalRequest._retry = true;
//         const refreshToken = useAuthStore.getState().refreshToken;
//         if (refreshToken) {
//           try {
//             const resp = await axios.post(
//               `${USER_SERVICE_URL}/auth/refresh`,
//               { refresh_token: refreshToken }
//             );
//             const { access_token, refresh_token } = resp.data;
//             useAuthStore.getState().setTokens({
//               access_token,
//               refresh_token,
//             });
//             originalRequest.headers.Authorization = `Bearer ${access_token}`;
//             return instance(originalRequest);
//           } catch {
//             useAuthStore.getState().logout();
//           }
//         } else {
//           useAuthStore.getState().logout();
//         }
//       }
//       return Promise.reject(error);
//     }
//   );

//   return instance;
// }

// export const userApi = createApiInstance(USER_SERVICE_URL);
// export const orderApi = createApiInstance(ORDER_SERVICE_URL);
// export const notifApi = createApiInstance(NOTIFICATION_SERVICE_URL);

import axios from "axios";
import { useAuthStore } from "../store/authStore";

const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL || "http://localhost:8001";
const ORDER_SERVICE_URL = import.meta.env.VITE_ORDER_SERVICE_URL || "http://localhost:8002";
const NOTIFICATION_SERVICE_URL =
  import.meta.env.VITE_NOTIFICATION_SERVICE_URL || "http://localhost:8003";

function createApiInstance(baseURL: string) {
  const instance = axios.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
    timeout: 15000,
  });

  instance.interceptors.request.use((config) => {
    const token =
      useAuthStore.getState().accessToken ||
      localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

if (error.response?.status === 401 && !originalRequest._retry) {
  
        originalRequest._retry = true;

        const refreshToken =
          useAuthStore.getState().refreshToken ||
          localStorage.getItem("refreshToken");

        if (refreshToken) {
          try {
            const resp = await axios.post(`${USER_SERVICE_URL}/auth/refresh`, {
              refresh_token: refreshToken,
            });

            const { access_token, refresh_token } = resp.data;

            useAuthStore.getState().setTokens({
              access_token,
              refresh_token,
            });

            originalRequest.headers.Authorization = `Bearer ${access_token}`;

            return instance(originalRequest);
          } catch {
            useAuthStore.getState().logout();
          }
        } else {
          useAuthStore.getState().logout();
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
}

export const userApi = createApiInstance(USER_SERVICE_URL);
export const orderApi = createApiInstance(ORDER_SERVICE_URL);
export const notifApi = createApiInstance(NOTIFICATION_SERVICE_URL);