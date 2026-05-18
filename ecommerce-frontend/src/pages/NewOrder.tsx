import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { PageTitle } from "../components/ui/PageTitle";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { useCreateOrder } from "../hooks/useOrders";

const orderItemSchema = z.object({
  product_name: z.string().min(1, "Product name is required"),
  product_sku: z.string().min(1, "SKU is required"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  unit_price: z.coerce.number().min(0.01, "Price must be greater than 0"),
});

const orderSchema = z.object({
  shipping_address: z.string().min(5, "Please enter a complete shipping address"),
  items: z.array(orderItemSchema).min(1, "Add at least one item"),
});

type OrderFormData = z.infer<typeof orderSchema>;

const defaultItem = { product_name: "", product_sku: "", quantity: 1, unit_price: 0 };

export default function NewOrder() {
  const navigate = useNavigate();
  const createOrder = useCreateOrder();

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      shipping_address: "",
      items: [defaultItem],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items");

  const calculateTotal = () => {
    if (!watchedItems) return 0;
    return watchedItems.reduce((sum, item) => {
      const qty = Number(item?.quantity) || 0;
      const price = Number(item?.unit_price) || 0;
      return sum + qty * price;
    }, 0);
  };

  const onSubmit = (data: OrderFormData) => {
    createOrder.mutate(data, {
      onSuccess: (order) => {
        navigate(`/orders/${order.id}`);
      },
    });
  };

  return (
    <div>
      <Link
        to="/orders"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Orders
      </Link>

      <PageTitle title="New Order" subtitle="Create a new purchase order" />

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
        {/* Shipping Address */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Shipping Address</h3>
          <div>
            <textarea
              {...register("shipping_address")}
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
              placeholder="Enter full shipping address"
            />
            {errors.shipping_address && (
              <p className="mt-1 text-xs text-red-500">{errors.shipping_address.message}</p>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Order Items</h3>
            <button
              type="button"
              onClick={() => append(defaultItem)}
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
            >
              <Plus className="h-3 w-3" />
              Add Item
            </button>
          </div>

          {errors.items?.message && (
            <p className="mb-3 text-xs text-red-500">{errors.items.message}</p>
          )}

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Item #{index + 1}
                  </span>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                      Product Name
                    </label>
                    <input
                      type="text"
                      {...register(`items.${index}.product_name`)}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      placeholder="Product name"
                    />
                    {errors.items?.[index]?.product_name && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.items[index]?.product_name?.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                      SKU
                    </label>
                    <input
                      type="text"
                      {...register(`items.${index}.product_sku`)}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      placeholder="SKU-001"
                    />
                    {errors.items?.[index]?.product_sku && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.items[index]?.product_sku?.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                      Quantity
                    </label>
                    <input
                      type="number"
                      {...register(`items.${index}.quantity`)}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      min="1"
                    />
                    {errors.items?.[index]?.quantity && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.items[index]?.quantity?.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                      Unit Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register(`items.${index}.unit_price`)}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      min="0.01"
                    />
                    {errors.items?.[index]?.unit_price && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.items[index]?.unit_price?.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 flex justify-end border-t border-gray-200 pt-4 dark:border-gray-700">
            <div className="text-right">
              <span className="text-sm text-gray-500 dark:text-gray-400">Estimated Total: </span>
              <span className="ml-2 text-lg font-bold text-gray-900 dark:text-white">
                ${calculateTotal().toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link
            to="/orders"
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createOrder.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createOrder.isPending ? <LoadingSpinner size="sm" /> : "Place Order"}
          </button>
        </div>
      </form>
    </div>
  );
}
