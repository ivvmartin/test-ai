"use client";

import { SidebarProvider } from "@components/ui/sidebar";

import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";

export function AppLayout({ children }: { children?: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <TopBar />
          <main className="flex-1 overflow-auto pt-14">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

