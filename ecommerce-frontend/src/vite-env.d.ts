/// <reference types="vite/client" />

declare module "*.css" {
  const content: string;
  export default content;
}

declare module "date-fns" {
  export function format(
    date: Date | string | number,
    format: string,
    options?: Record<string, unknown>
  ): string;
  export function formatDistanceToNow(
    date: Date | string | number,
    options?: Record<string, unknown>
  ): string;
  export function parseISO(dateStr: string): Date;
}
