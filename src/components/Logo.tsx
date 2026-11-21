import { cn } from "@/lib/utils";
export function LogoMark({ className, tone = "ink" }: { className?: string; tone?: "ink" | "white" }) {
  const main = tone === "white" ? "#ffffff" : "#292524";
  return (
    <svg viewBox="340 190 1000 1200" className={cn("h-9 w-auto", className)} aria-hidden>
      <path fill={main} d="M405 214H920C960 214 1000 222 1030 240C1100 282 1170 340 1220 384C1280 438 1312 492 1312 552V895C1312 960 1280 1015 1228 1050L820 1290C800 1300 765 1296 765 1288L762 1085C762 1060 775 1040 800 1026L960 933C1005 906 1036 862 1036 817L1034 627C1032 553 970 489 895 488L487 485C440 485 388 445 378 404C368 360 372 300 372 244C372 230 392 214 405 214Z" />
      <path fill={main} d="M416 541L640 656V1212C640 1240 625 1258 598 1273L442 1358C420 1370 370 1368 370 1337V572C370 550 395 530 416 541Z" />
      <path fill="#C2410C" d="M640 656L748 706L880 774C892 780 894 825 880 833L714 928L640 964Z" />
    </svg>
  );
}
export function Logo({ tone = "ink", className }: { tone?: "ink" | "white"; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark tone={tone} />
      <span className="flex flex-col leading-none">
        <span className={cn("text-[19px] font-extrabold tracking-tight", tone === "white" ? "text-white" : "text-ink")}>PosraBazar</span>
        <span className={cn("mt-1 font-bn text-[12px]", tone === "white" ? "text-white/70" : "text-primary")}>পসরাবাজার</span>
      </span>
    </span>
  );
}
