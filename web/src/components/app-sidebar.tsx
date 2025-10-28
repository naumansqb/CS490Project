"use client";

import { Home, User } from "lucide-react"
import { useAuth } from '@/contexts/AuthContext';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import UserFooter from "./sidebar-footer"

export function SideBar() {
  const { user } = useAuth();
  
  // Menu items.
  const items = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
    },
  ]

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="relative hidden lg:block h-[40px] bg-gradient-to-br from-[#E0F7F7] to-[#CDE4FF] pt-4">
          <img
             src="/Logo/Logo.svg"
             alt="JobBuddy"
             className="absolute inset-0 m-auto h-auto w-3/4 object-contain"
           />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="bg-gradient-to-t from-[#3BAFBA] to-[#E0F7F7] p-3">
        <UserFooter />
      </SidebarFooter>
    </Sidebar>
  )
}