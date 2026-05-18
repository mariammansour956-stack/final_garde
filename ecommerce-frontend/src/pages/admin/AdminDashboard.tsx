import { Package, Users, ShoppingBag, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { PageTitle } from "../../components/ui/PageTitle";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { useOrderStats } from "../../hooks/useOrders";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useOrderStats();

  const totalOrders = stats?.reduce((sum, s) => sum + s.count, 0) || 0;
  const totalRevenue = stats?.reduce((sum, s) => sum + s.total_revenue, 0) || 0;

  const adminCards = [
    {
      label: "Total Orders",
      value: totalOrders,
      icon: ShoppingBag,
      color: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30",
      link: "/admin/orders",
    },
    {
      label: "Total Revenue",
      value: `$${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30",
      link: "/admin/orders",
    },
    {
      label: "Users",
      value: "-",
      icon: Users,
      color: "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30",
      link: "/admin/users",
    },
    {
      label: "Pending Orders",
      value: stats?.find((s) => s.status === "pending")?.count || 0,
      icon: Package,
      color: "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30",
      link: "/admin/orders",
    },
  ];

  return (
    <div>
      <PageTitle title="Admin Dashboard" subtitle="Platform overview and management" />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {adminCards.map((card) => (
            <Link
              key={card.label}
              to={card.link}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
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
            </Link>
          ))}
        </div>
      )}

      {/* Order stats breakdown */}
      {stats && stats.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Orders by Status
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.status}
                className="rounded-lg border border-gray-200 bg-white px-5 py-4 dark:border-gray-700 dark:bg-gray-800"
              >
                <p className="text-sm capitalize text-gray-500 dark:text-gray-400">{stat.status}</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">{stat.count}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    ${stat.total_revenue.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
