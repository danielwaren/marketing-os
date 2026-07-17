import type { ReactNode } from "react";

import { Header } from "@/features/navigation/components/header";
import { Sidebar } from "@/features/navigation/components/sidebar";

interface Props {
  children: ReactNode;
}

export function AppShell({ children }: Props) {
  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <Header />

        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}