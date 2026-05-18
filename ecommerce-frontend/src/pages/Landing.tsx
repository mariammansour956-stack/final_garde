import { Link } from "react-router-dom";
import { ShoppingBag, ShieldCheck, Truck, Bell, ArrowRight } from "lucide-react";
import { useAuthStore } from "../store/authStore";

export default function Landing() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-indigo-600 dark:text-indigo-400">
          <ShoppingBag className="h-7 w-7" />
          ShopEase
        </Link>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-gray-900 dark:text-white md:text-5xl lg:text-6xl">
          Modern E-Commerce{" "}
          <span className="text-indigo-600 dark:text-indigo-400">Platform</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-gray-600 dark:text-gray-400">
          A full-featured e-commerce solution with real-time order tracking, notifications, and role-based administration.
        </p>
        <div className="mt-8 flex gap-4">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-gray-200 px-6 py-16 dark:border-gray-800">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-xl border border-gray-200 p-6 text-center dark:border-gray-700">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900">
                <ShoppingBag className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Order Management</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Create, track, and manage orders with real-time status updates.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-6 text-center dark:border-gray-700">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900">
                <Bell className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Real-time Notifications</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Get instant notifications for order confirmations, shipments, and more.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-6 text-center dark:border-gray-700">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900">
                <ShieldCheck className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Admin Dashboard</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Full admin panel for user and order management with role-based access.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="border-t border-gray-200 px-6 py-16 dark:border-gray-800">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Built With Modern Technology</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {[
              "React 18",
              "TypeScript",
              "Tailwind CSS",
              "FastAPI",
              "SQLAlchemy",
              "Docker",
              "Zustand",
              "React Query",
            ].map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 px-6 py-6 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-500">
        &copy; {new Date().getFullYear()} ShopEase. All rights reserved.
      </footer>
    </div>
  );
}
