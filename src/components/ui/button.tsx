import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-bn font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 active:translate-y-px",
  {
    variants: {
      variant: {
        primary: "bg-gradient-to-b from-[#1f9089] to-teal text-white shadow-[inset_0_1px_0_rgba(255,255,255,.28),0_6px_14px_-6px_rgba(22,124,120,.7)] hover:from-teal hover:to-teal-600",
        navy: "bg-gradient-to-b from-[#24476d] to-navy text-white shadow-[inset_0_1px_0_rgba(255,255,255,.2),0_6px_14px_-6px_rgba(20,43,69,.7)] hover:from-navy-700 hover:to-navy-800",
        gold: "bg-gradient-to-b from-[#dcbb76] to-gold text-navy shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_6px_14px_-6px_rgba(198,161,91,.9)] hover:from-gold hover:to-[#b8933f]",
        outline: "border border-navy/25 bg-white/60 text-navy backdrop-blur hover:border-navy hover:bg-white/90",
        ghost: "text-navy hover:bg-mist",
        light: "bg-white text-navy hover:bg-paper",
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
