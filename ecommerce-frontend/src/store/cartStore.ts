import { create } from "zustand";

interface CartItem {
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
}

interface CartState {
  items: CartItem[];
  shippingAddress: string;

  addItem: (item: CartItem) => void;
  removeItem: (index: number) => void;
  updateItem: (index: number, item: CartItem) => void;
  setShippingAddress: (address: string) => void;
  clearCart: () => void;
  getTotalAmount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  shippingAddress: "",

  addItem: (item) => {
    set((state) => ({ items: [...state.items, item] }));
  },

  removeItem: (index) => {
    set((state) => ({
      items: state.items.filter((_, i) => i !== index),
    }));
  },

  updateItem: (index, item) => {
    set((state) => {
      const newItems = [...state.items];
      newItems[index] = item;
      return { items: newItems };
    });
  },

  setShippingAddress: (address) => {
    set({ shippingAddress: address });
  },

  clearCart: () => {
    set({ items: [], shippingAddress: "" });
  },

  getTotalAmount: () => {
    return get().items.reduce(
      (total, item) => total + item.quantity * item.unit_price,
      0
    );
  },
}));
