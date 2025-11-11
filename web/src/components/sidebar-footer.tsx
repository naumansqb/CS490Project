'use client'

import { signOutUser } from "@/lib/firebase/firebase-auth-service";
import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import Image from "next/image";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User, ChevronUp } from "lucide-react"
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { useAuth } from '@/contexts/AuthContext';

export default function UserFooter() {
    const router = useRouter();
    const [user, setUser] = useState<Record<string, any> | null>(null);
    const { user: firebase } = useAuth();

    console.log('Auth user in UserFooter:', firebase);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!firebase?.uid) return;

            try {
              const token = await firebase.getIdToken?.();
              const headers: Record<string, string> = {};
              if (token) headers.Authorization = `Bearer ${token}`;

              const data = await apiClient.fetch(`/user-profiles/${firebase.uid}`, {
                headers,
              }) as Record<string, any>;

              setUser(data);
              console.log("Fetched profile data:", data);
            } catch (error: any) {
              console.error("Failed to load profile:", {
                message: error?.message,
                body: typeof error === "object" ? JSON.stringify(error) : String(error),
              });
            }
          };

        fetchProfile();
    }, []);

    const handleSignOut = async () => {
        try {
            await signOutUser();
            router.push('/');
        } catch (error) {
        console.error("Error signing out:", error);
        }

    }
    

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button 
                    variant="ghost"
                    className="w-full h-auto flex items-center gap-2 justify-start p-2 hover:bg-accent"
                >
                    <Image
                        className="rounded-lg"
                        src={firebase?.photoURL || "/default_profile.png"}
                        alt="User Profile"
                        width={40}
                        height={40}
                    />
                    <div className="flex-1 flex flex-col items-start min-w-0">
                        <span className="font-medium truncate w-full">{user?.firstName} {user?.lastName}</span>
                    </div>
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => router.push(`/profile/${firebase?.uid}`)}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log Out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}