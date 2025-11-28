'use client';

import { SideBar } from "@/components/app-sidebar";
import LinkedInIntegration from '@/components/linkedin/LinkedInIntegration';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from '@/contexts/AuthContext';

export default function LinkedInPage() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div>Loading...</div>
            </div>
        );
    }

    if (!user) {
        if (typeof window !== 'undefined') {
            window.location.href = '/';
        }
        return null;
    }

    return (
        <SidebarProvider>
            <SideBar />
            <main className="flex-1 flex flex-col min-h-screen">
                <div className="flex items-center justify-between p-4 border-b">
                    <div>
                        <SidebarTrigger />
                    </div>
                </div>
                <div className="flex-1 overflow-auto">
                    <div className="container mx-auto py-6 px-4">
                        <LinkedInIntegration />
                    </div>
                </div>
            </main>
        </SidebarProvider>
    );
}


