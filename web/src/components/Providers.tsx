"use client";

import { StoreProvider } from "@/lib/store";
import { AppShell } from "@/components/AppShell";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <StoreProvider>
      <AppShell>{children}</AppShell>
    </StoreProvider>
  );
}
