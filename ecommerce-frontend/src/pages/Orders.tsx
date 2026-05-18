import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { PageTitle } from "../components/ui/PageTitle";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { EmptyState } from "../components/ui/EmptyState";
import { Pagination } from "../components/ui/Pagination";
import { OrderTable } from "../components/ui/OrderTable";
import { useOrders } from "../hooks/useOrders";
import { Package } from "lucide-react";

const statusFilters = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default function Orders() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const limit = 10;

  const { data, isLoading, isError } = useOrders({ page, size: limit, status: status || undefined });

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageTitle title="Orders" subtitle="View and manage your orders" />
        <Link
          to="/orders/new"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          New Order
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="mb-6 mt-4 flex flex-wrap gap-2">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => {
              setStatus(filter.value);
              setPage(1);
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              status === filter.value
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-900/20">
          <p className="text-sm text-red-600 dark:text-red-400">Failed to load orders. Please try again.</p>
        </div>
      ) : data && data.items.length > 0 ? (
        <>
          <OrderTable orders={data.items} />
          <div className="mt-6">
            <Pagination
              page={page}
              pages={data.pages}
              onPageChange={setPage}
            />
          </div>
        </>
      ) : (
        <EmptyState
          icon={Package}
          title="No orders found"
          description={
            status
              ? `No orders with status "${status}". Try a different filter.`
              : "You haven't placed any orders yet."
          }
          action={
            <Link
              to="/orders/new"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Create Order
            </Link>
          }
        />
      )}
    </div>
  );
}
