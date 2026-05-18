import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  Bell,
  User,
  ShieldCheck,
  Users,
  Package,
  X,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { useAuthStore } from "../../store/authStore";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
  { to: "/orders", label: "Orders", icon: ShoppingBag, adminOnly: false },
  { to: "/notifications", label: "Notifications", icon: Bell, adminOnly: false },
  { to: "/profile", label: "Profile", icon: User, adminOnly: false },
  { to: "/admin", label: "Admin Dashboard", icon: ShieldCheck, adminOnly: true },
  { to: "/admin/users", label: "Manage Users", icon: Users, adminOnly: true },
  { to: "/admin/orders", label: "Manage Orders", icon: Package, adminOnly: true },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const isAdmin = useAuthStore((s) => s.isAdmin);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-lg transition-transform duration-200 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <span className="text-lg font-bold text-gray-900">E-Commerce</span>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  )
                }
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {item.label}
              </NavLink>
            ))}
        </nav>
      </aside>
    </>
  );
}
