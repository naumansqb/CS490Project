'use client';

import { Home, FileText, Briefcase, Calendar, Bookmark } from "lucide-react"
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
} from '@/components/ui/sidebar';
import UserFooter from './sidebar-footer';
import Link from 'next/link';

export function SideBar() {
  const { user } = useAuth();
  // Standardize menu items so keys are consistent
  const items = [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: Home,
    },
    {
      title: "Jobs",
      url: `/jobs/${user?.uid}`,
      icon: Briefcase,
    },
    {
      title: "Calendar",
      url: `/calender/${user?.uid}`,
      icon: Calendar,
    },
    {
      title: 'Resumes',
      url: '/dashboard/resumes',
      icon: FileText,
    },
    {
      title: 'Job Status Tracker',
      url: `/job-status-tracker/${user?.uid}`,
      icon: Bookmark,
    }
  ]

  return (
    <Sidebar>
      <SidebarHeader>
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-slate-800 hover:opacity-80 transition-opacity"
        >
          <img
            src="/Logo/favicon-32x32.png"
            alt="JobBuddy"
            className="h-7 w-auto"
          />
          JobBuddy
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <UserFooter />
      </SidebarFooter>
    </Sidebar>
  );
}
