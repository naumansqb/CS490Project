import { SideBar } from "@/components/app-sidebar"
import ProfileForm from "@/components/editProfile"
import ProfileHeader from "@/components/profileHeader"
import { Sidebar, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

export default function edit({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <SideBar />
      <main className="w-full">
        <SidebarTrigger />
        <div className="container mx-auto max-w-4xl px-4">
          <ProfileForm />
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
}