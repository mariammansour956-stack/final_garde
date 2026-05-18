import { Outlet, Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 px-4 py-12 dark:from-gray-900 dark:to-gray-800">
      <div className="mb-8 text-center">
        <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
          <ShoppingBag className="h-8 w-8" />
          <span>ShopEase</span>
        </Link>
      </div>

      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <Outlet />
      </div>

      <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} ShopEase. All rights reserved.
      </p>
    </div>
  );
}
