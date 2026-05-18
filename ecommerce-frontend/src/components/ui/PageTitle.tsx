import { useEffect } from "react";

interface PageTitleProps {
  title: string;
  subtitle?: string;
}

export function PageTitle({ title, subtitle }: PageTitleProps) {
  useEffect(() => {
    document.title = `${title} | ${import.meta.env.VITE_APP_NAME || "EcommerceApp"}`;
  }, [title]);

  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
}
