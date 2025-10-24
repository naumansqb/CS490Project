import { SideBar } from "@/components/app-sidebar"
import Dashboard from "@/components/Dashboard"
import { Sidebar, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { MobileNav } from "@/components/mobile-nav"

export default function dashboard({ children }: { children: React.ReactNode }) {
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