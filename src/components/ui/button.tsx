import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-bn font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 active:translate-y-px",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-primary-700",
        dark: "bg-ink text-white hover:bg-ink-700",
        accent: "bg-accent text-ink hover:bg-[#E08E00]",
        outline: "border border-ink/25 bg-surface text-ink hover:border-ink hover:bg-tint",
        ghost: "text-ink hover:bg-tint",
        light: "bg-white text-ink hover:bg-cream",
        "outline-light": "border border-white/40 text-white hover:bg-white/10",
      },
      size: { sm: "h-9 px-3 text-sm", md: "h-11 px-5 text-[15px]", lg: "h-12 px-6 text-base", icon: "h-10 w-10" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);
type P = VariantProps<typeof buttonVariants> & { className?: string };
export function Button({ variant, size, className, ...props }: P & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
export function LinkButton({ variant, size, className, href, ...props }: P & { href: string; children: React.ReactNode } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return <Link href={href} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
