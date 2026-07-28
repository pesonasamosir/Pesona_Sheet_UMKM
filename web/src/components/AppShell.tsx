"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Boxes,
  Wallet,
  Coins,
  DatabaseBackup,
  ShieldCheck,
} from "lucide-react";
import { clsx } from "@/lib/format";
import type { ReactNode } from "react";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/produk", label: "Produk & HPP", icon: Package },
  { href: "/inventori", label: "Inventori & EOQ", icon: Boxes },
  { href: "/arus-kas", label: "Arus Kas", icon: Wallet },
  { href: "/biaya", label: "Biaya & Overhead", icon: Coins },
  { href: "/data", label: "Data Backup", icon: DatabaseBackup },
];

function NavLink({
  href,
  label,
  icon: Icon,
  compact,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  compact?: boolean;
}) {
  const pathname = usePathname();
  const active =
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  if (compact) {
    return (
      <Link
        href={href}
        className={clsx(
          "flex min-h-14 flex-1 flex-col items-center justify-center gap-1 px-1 text-[0.7rem] font-medium",
          active ? "text-primary" : "text-muted",
        )}
      >
        <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
        <span className="truncate">{label.split(" ")[0]}</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={clsx(
        "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition",
        active
          ? "bg-white/10 text-white"
          : "text-sidebar-muted hover:bg-white/5 hover:text-sidebar-fg",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[16.5rem_1fr]">
      <aside className="hidden border-r border-border bg-sidebar text-sidebar-fg md:flex md:flex-col md:gap-6 md:p-5">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-[#1e3a24] to-primary font-display text-lg font-bold text-white shadow-lg">
            P
          </span>
          <span>
            <span className="font-display block text-xl font-semibold tracking-tight">
              PESONA
            </span>
            <span className="block text-xs text-sidebar-muted">
              Inventori &amp; Finansial UMKM
            </span>
          </span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1" aria-label="Navigasi utama">
          {NAV.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs leading-relaxed text-sidebar-muted">
          <p className="mb-1 flex items-center gap-1.5 font-semibold text-sidebar-fg">
            <ShieldCheck className="size-3.5 text-primary" />
            Privasi perangkat
          </p>
          Data hanya tersimpan di browser ini (IndexedDB). Tidak ada sinkronisasi
          antar perangkat kecuali via Export/Import.
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] px-4 py-3 backdrop-blur-md md:hidden">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg bg-primary font-display font-bold text-primary-fg">
              P
            </span>
            <span>
              <span className="font-display block text-lg font-semibold leading-none">
                PESONA
              </span>
              <span className="text-[0.65rem] text-muted">Lokal di perangkat Anda</span>
            </span>
          </Link>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 pb-24 sm:px-6 lg:px-8 md:pb-8">
          {children}
        </main>
      </div>

      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-[color-mix(in_srgb,var(--bg-elevated)_94%,transparent)] pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <div className="mx-auto flex max-w-lg">
          {NAV.slice(0, 5).map((item) => (
            <NavLink key={item.href} {...item} compact />
          ))}
        </div>
      </nav>
    </div>
  );
}
