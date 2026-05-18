import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { useAuthStore } from "./store/authStore";

// Initialize theme from localStorage
if (
  localStorage.getItem("theme") === "dark" ||
  (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches)
) {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}

// Hydrate auth state from localStorage before rendering
useAuthStore.getState().hydrate();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
