'use client'

import { SideBar } from "@/components/app-sidebar"
import {SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import JobDeadlinesCalendar from "@/components/jobs/JobDeadlinesCalender";

export default function profile({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const params = useParams();
  const urlUid = params.uid as string;
  const [shouldRedirect, setShouldRedirect] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      setShouldRedirect('/');
      return;
    }

    if (user.uid !== urlUid) {
      setShouldRedirect(`/calender/${user.uid}`);
      return;
    }

    setShouldRedirect(null);
  }, [user, loading, urlUid]);

  // Handle redirect
  useEffect(() => {
    if (shouldRedirect) {
      window.location.href = shouldRedirect;
    }
  }, [shouldRedirect]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user || user.uid !== urlUid || shouldRedirect) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Redirecting...</div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <SideBar />
      <main className="w-full">
        <SidebarTrigger />
        <div className="container mx-auto  px-4 space-y-6">
          <JobDeadlinesCalendar />
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
}