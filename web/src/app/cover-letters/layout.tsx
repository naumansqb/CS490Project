// @ts-nocheck
"use client";

import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SideBar as AppSidebar } from "@/components/app-sidebar";
import UserFooter from "@/components/sidebar-footer";

export default function CoverLettersLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        {/* Left: your existing sidebar */}
        <AppSidebar />

        {/* Right: page content area */}
        <div className="flex-1 flex flex-col">
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {children}
          </main>
          <div className="p-3">
            <UserFooter />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
