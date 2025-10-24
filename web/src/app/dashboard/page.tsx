'use client'

import { SideBar } from "@/components/app-sidebar"
import Dashboard from "@/components/Dashboard"
import { Sidebar, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { useAuth } from '@/contexts/AuthContext';
import { MobileNav } from "@/components/mobile-nav"

export default function dashboard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    window.location.href = '/signin';
  }

  return (
    <SidebarProvider>
      <SideBar />
      <main className="flex-1 flex flex-col min-h-screen">
        <div className="flex items-center justify-between p-4 border-b">
          <MobileNav>
            <a href="/dashboard" className="block px-3 py-2 rounded-md hover:bg-accent">
              Dashboard
            </a>
            <a href="/profile" className="block px-3 py-2 rounded-md hover:bg-accent">
              Profile
            </a>
            <a href="/settings" className="block px-3 py-2 rounded-md hover:bg-accent">
              Settings
            </a>
          </MobileNav>
          <div className="hidden lg:block">
            <SidebarTrigger />
          </div>
        </div>
        <div className="flex-1 p-4">
          <Dashboard />
        </div>
      </main>
    </SidebarProvider>
  )
}