import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Package, Trash2, Truck, CheckCircle, XCircle } from "lucide-react";
import { PageTitle } from "../components/ui/PageTitle";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { StatusBadge } from "../components/ui/StatusBadge";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useOrder, useCancelOrder, useUpdateOrderStatus } from "../hooks/useOrders";
import { formatDateTime } from "../utils/formatDate";
import { formatPrice } from "../utils/formatPrice";
import { useAuthStore } from "../store/authStore";
import { useState } from "react";
import type { OrderStatus } from "../types";

const statusActions: { status: OrderStatus; label: string; icon: React.ReactNode }[] = [
  { status: "confirmed", label: "Confirm", icon: <CheckCircle className="h-4 w-4" /> },
  { status: "shipped", label: "Mark Shipped", icon: <Truck className="h-4 w-4" /> },
  { status: "delivered", label: "Mark Delivered", icon: <CheckCircle className="h-4 w-4" /> },
];

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, isError } = useOrder(id!);
  const cancelOrder = useCancelOrder();
  const updateStatus = useUpdateOrderStatus();
  const { isAdmin } = useAuthStore();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-900/20">
        <p className="text-sm text-red-600 dark:text-red-400">Failed to load order details.</p>
        <Link
          to="/orders"
          className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  const handleCancel = () => {
    cancelOrder.mutate(order.id, {
      onSuccess: () => setShowCancelDialog(false),
    });
  };

  const handleStatusUpdate = (status: OrderStatus) => {
    updateStatus.mutate({ id: order.id, status });
  };

  const canCancel = order.status === "pending" || order.status === "confirmed";

  return (
    <div>
      <Link
        to="/orders"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Orders
      </Link>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <PageTitle
          title={`Order #${order.id.slice(0, 8)}`}
          subtitle={`Placed on ${formatDateTime(order.created_at)}`}
        />
        <StatusBadge status={order.status} />
      </div>

      {/* Admin status actions */}
      {isAdmin && order.status !== "cancelled" && order.status !== "delivered" && (
        <div className="mb-6 mt-4 flex flex-wrap gap-2">
          {statusActions
            .filter((action) => {
              const statusOrder: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered"];
              const currentIdx = statusOrder.indexOf(order.status);
              const actionIdx = statusOrder.indexOf(action.status);
              return actionIdx === currentIdx + 1;
            })
            .map((action) => (
              <button
                key={action.status}
                onClick={() => handleStatusUpdate(action.status)}
                disabled={updateStatus.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {action.icon}
                {action.label}
              </button>
            ))}
        </div>
      )}

      {/* Order items */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Order Items</h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-gray-100 p-2 dark:bg-gray-700">
                  <Package className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.product_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {item.product_sku}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-900 dark:text-white">
                  {item.quantity} &times; {formatPrice(item.unit_price)}
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatPrice(item.subtotal)}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="flex justify-between">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Total</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {formatPrice(order.total_amount)}
            </span>
          </div>
        </div>
      </div>

      {/* Shipping info */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Shipping Address</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{order.shipping_address}</p>
      </div>

      {/* Cancel button */}
      {canCancel && (
        <div className="mt-6">
          <button
            onClick={() => setShowCancelDialog(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <XCircle className="h-4 w-4" />
            Cancel Order
          </button>
        </div>
      )}

      <ConfirmDialog
        open={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancel}
        title="Cancel Order"
        message={`Are you sure you want to cancel order #${order.id.slice(0, 8)}? This action cannot be undone.`}
        confirmLabel="Cancel Order"
        variant="danger"
        isLoading={cancelOrder.isPending}
      />
    </div>
  );
}
