import { SideBar } from "@/components/app-sidebar"
import Dashboard from "@/components/Dashboard"
import { Sidebar, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

export default function dashboard({ children }: { children: React.ReactNode }) {
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