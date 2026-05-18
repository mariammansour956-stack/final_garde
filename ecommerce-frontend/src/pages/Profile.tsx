import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Mail, Shield, Calendar } from "lucide-react";
import { PageTitle } from "../components/ui/PageTitle";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { useUpdateProfile } from "../hooks/useAuth";
import { useAuthStore } from "../store/authStore";
import { formatDate } from "../utils/formatDate";

const profileSchema = z.object({
  full_name: z.string().min(1, "Full name is required").max(100),
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user } = useAuthStore();
  const updateProfile = useUpdateProfile();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      full_name: user?.full_name || "",
      username: user?.username || "",
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfile.mutate(data);
  };

  if (!user) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <PageTitle title="Profile" subtitle="Manage your account settings" />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Profile Info Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
              {user.full_name?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase()}
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
              {user.full_name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
            <span className="mt-2 inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium capitalize text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
              {user.role}
            </span>
          </div>

          <div className="mt-6 space-y-3 border-t border-gray-200 pt-4 dark:border-gray-700">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">{user.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Shield className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400 capitalize">{user.role}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                Joined {formatDate(user.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Edit Profile Form */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Edit Profile</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Full Name
                </label>
                <input
                  id="full_name"
                  type="text"
                  {...register("full_name")}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                {errors.full_name && (
                  <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  {...register("username")}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                {errors.username && (
                  <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="mt-1 block w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400"
                />
                <p className="mt-1 text-xs text-gray-400">Email cannot be changed.</p>
              </div>

              {isDirty && (
                <button
                  type="submit"
                  disabled={updateProfile.isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {updateProfile.isPending ? <LoadingSpinner size="sm" /> : "Save Changes"}
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
