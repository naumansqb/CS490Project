// @ts-nocheck
"use client";

import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SideBar as AppSidebar } from "@/components/app-sidebar";

export default function CoverLettersLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        {/* Left: your existing sidebar */}
        <AppSidebar />

        {/* Right: page content area */}
        <div className="flex-1 flex flex-col">
          {/* Sidebar Toggle */}
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <SidebarTrigger />
            </div>
          </div>

          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
