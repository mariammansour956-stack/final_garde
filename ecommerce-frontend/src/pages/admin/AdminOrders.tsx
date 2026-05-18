import { useState } from "react";
import { PageTitle } from "../../components/ui/PageTitle";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { EmptyState } from "../../components/ui/EmptyState";
import { Pagination } from "../../components/ui/Pagination";
import { OrderTable } from "../../components/ui/OrderTable";
import { useOrders } from "../../hooks/useOrders";
import { Package } from "lucide-react";

const statusFilters = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AdminOrders() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const limit = 10;

  const { data, isLoading, isError } = useOrders({ page, size: limit, status: status || undefined });

  return (
    <div>
      <PageTitle title="Manage Orders" subtitle="View and manage all orders" />

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

      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-900/20">
          <p className="text-sm text-red-600 dark:text-red-400">Failed to load orders.</p>
        </div>
      ) : data && data.items.length > 0 ? (
        <>
          <OrderTable orders={data.items} />
          <div className="mt-6">
            <Pagination page={page} pages={data.pages} onPageChange={setPage} />
          </div>
        </>
      ) : (
        <EmptyState
          icon={Package}
          title="No orders"
          description={
            status ? `No orders with status "${status}".` : "No orders have been placed yet."
          }
        />
      )}
    </div>
  );
}
