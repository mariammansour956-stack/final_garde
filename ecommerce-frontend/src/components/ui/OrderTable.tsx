import { useNavigate } from "react-router-dom";
import { StatusBadge } from "./StatusBadge";
import { formatPrice } from "../../utils/formatPrice";
import { formatDate } from "../../utils/formatDate";
import type { Order } from "../../types";

interface OrderTableProps {
  orders: Order[];
  showUser?: boolean;
  onCancel?: (id: string) => void;
}

export function OrderTable({ orders, showUser = false, onCancel }: OrderTableProps) {
  const navigate = useNavigate();

  if (orders.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-gray-500">
        No orders found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Order ID
            </th>
            {showUser && (
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Customer
              </th>
            )}
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Items
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Total
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Status
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {orders.map((order) => (
            <tr
              key={order.id}
              className="cursor-pointer transition-colors hover:bg-gray-50"
              onClick={() => navigate(`/orders/${order.id}`)}
            >
              <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-gray-900">
                #{order.id.slice(0, 8)}
              </td>
              {showUser && (
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                  {order.user_id.slice(0, 8)}
                </td>
              )}
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                {formatDate(order.created_at)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                {order.items.length}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                {formatPrice(order.total_amount)}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <StatusBadge status={order.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                {order.status === "pending" && onCancel && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCancel(order.id);
                    }}
                    className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Cancel
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
