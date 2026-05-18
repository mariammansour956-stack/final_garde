import { Link } from "react-router-dom";
import { ShoppingBag, Bell, User, ArrowRight, Package, Plus, Clock } from "lucide-react";
import { PageTitle } from "../components/ui/PageTitle";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { StatusBadge } from "../components/ui/StatusBadge";
import { EmptyState } from "../components/ui/EmptyState";
import { useOrders } from "../hooks/useOrders";
import { useUnreadCount } from "../hooks/useNotifications";
import { useAuthStore } from "../store/authStore";
import { formatDateTime } from "../utils/formatDate";

export default function Dashboard() {
  const { user } = useAuthStore();
  const { data: ordersData, isLoading: ordersLoading } = useOrders({ size: 5 });
  const { data: unreadCount } = useUnreadCount();

  const statsCards = [
    {
      label: "Total Orders",
      value: ordersData?.total ?? "-",
      icon: Package,
      color: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30",
    },
    {
      label: "Unread Notifications",
      value: unreadCount ?? 0,
      icon: Bell,
      color: "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30",
    },
  ];

  return (
    <div>
      <PageTitle title="Dashboard" subtitle={`Welcome back, ${user?.full_name || user?.username}`} />

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        {statsCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              </div>
              <div className={`rounded-lg p-3 ${card.color}`}>
                <card.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/orders/new"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            New Order
          </Link>
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <ShoppingBag className="h-4 w-4" />
            View Orders
          </Link>
          <Link
            to="/notifications"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <Bell className="h-4 w-4" />
            Notifications
            {unreadCount && unreadCount > 0 ? (
              <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
                {unreadCount}
              </span>
            ) : null}
          </Link>
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <User className="h-4 w-4" />
            Profile
          </Link>
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Recent Orders
          </h3>
          <Link
            to="/orders"
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            View All
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {ordersLoading ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner size="lg" />
          </div>
        ) : ordersData?.items && ordersData.items.length > 0 ? (
          <div className="space-y-3">
            {ordersData.items.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-750"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-indigo-50 p-2 dark:bg-indigo-900/20">
                    <Package className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Order #{order.id.slice(0, 8)}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="h-3 w-3" />
                      {formatDateTime(order.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    ${order.total_amount.toFixed(2)}
                  </span>
                  <StatusBadge status={order.status} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Package}
            title="No orders yet"
            description="Create your first order to get started."
            action={
              <Link
                to="/orders/new"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                New Order
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
