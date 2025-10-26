'use client'

import { SideBar } from "@/components/app-sidebar"
import Dashboard from "@/components/Dashboard"
import { Sidebar, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { useAuth } from '@/contexts/AuthContext';

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
      <main>
        <SidebarTrigger />
        <Dashboard />
      </main>
    </SidebarProvider>
  )
}