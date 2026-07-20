import type { ReactNode } from "react";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface Props {
  title: string;
  children: ReactNode;
}

export function AppShell({
  title,
  children,
}: Props) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <Header title={title} />

        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}