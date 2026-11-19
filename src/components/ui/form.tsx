import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(function Input({ className, invalid, ...p }, ref) {
  return <input ref={ref} className={cn("h-11 w-full rounded-md border bg-white px-3 text-[15px] placeholder:text-mist-500 transition-colors focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20", invalid ? "border-red-500" : "border-mist-300", className)} {...p} />;
});
export function Select({ className, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("h-10 rounded-md border border-mist-300 bg-white px-2.5 text-sm font-bn focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20", className)} {...p} />;
}
export function Field({ label, error, hint, children, className }: { label: string; error?: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block font-bn text-sm font-medium text-navy">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-red-600" role="alert">{error}</span> : hint ? <span className="mt-1 block text-xs text-mist-500">{hint}</span> : null}
    </label>
  );
}
