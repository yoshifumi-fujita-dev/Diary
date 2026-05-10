"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, BookOpen, Settings, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

const HIDE_PATHS = ["/login", "/reset-password"];

const NAV_ITEMS = [
  { href: "/", icon: CalendarDays, label: "カレンダー" },
  { href: "/entries", icon: BookOpen, label: "日記一覧" },
  { href: "/settings", icon: Settings, label: "設定" },
];

export function BottomNav() {
  const pathname = usePathname();

  if (HIDE_PATHS.includes(pathname) || pathname.endsWith("/edit")) return null;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 sm:hidden z-20 bg-zinc-900/95 backdrop-blur-sm border-t border-zinc-800"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-stretch justify-around">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 flex-1 py-2.5 transition-colors ${
                isActive ? "text-zinc-100" : "text-zinc-500"
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[10px] leading-none tracking-wide">
                {label}
              </span>
            </Link>
          );
        })}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex flex-col items-center gap-1 flex-1 py-2.5 transition-colors text-zinc-500"
        >
          <LogOut className="w-5 h-5" strokeWidth={1.5} />
          <span className="text-[10px] leading-none tracking-wide">ログアウト</span>
        </button>
      </div>
    </nav>
  );
}
