"use client";
import { Check, UserPlus } from "lucide-react";
import { useSocial } from "./social";
import { cn } from "@/lib/utils";
export function FollowButton({ slug, className, size = "md" }: { slug: string; className?: string; size?: "sm" | "md" }) {
  const { isFollowing, toggleFollow } = useSocial();
  const on = isFollowing(slug);
  return (
    <button onClick={() => toggleFollow(slug)} aria-pressed={on}
      className={cn("inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md border font-bn font-medium transition-colors", size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm", on ? "border-teal/40 bg-teal-50 text-teal-700 hover:bg-white" : "border-navy bg-navy text-white hover:bg-teal hover:border-teal", className)}>
      {on ? <Check className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}{on ? "ফলো করছেন" : "ফলো করুন"}
    </button>
  );
}
