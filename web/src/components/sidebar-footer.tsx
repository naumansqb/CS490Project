'use client'

import { getCurrentUser, signOutUser } from "@/lib/firebase/firebase-auth-service";
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
import { LogOut, User } from "lucide-react"
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";

export default function UserFooter() {
    const router = useRouter();
    const [user, setUser] = useState<Record<string, any> | null>(null);
    const firebase = getCurrentUser();


    useEffect(() => {
        const fetchProfile = async () => {
        try {
            const userId = firebase?.uid; 
            const data = await apiClient.fetch(`/users/me`) as Record<string, any>;
            setUser(data);
            console.log('Fetched profile data:', data);
        } catch (error) {
            console.error('Failed to load profile:', error);
        } finally {
        }
        };
        
        fetchProfile();
    }, []);

    const handleSignOut = async () => {
        try {
            await signOutUser();
            router.push('/signin');
        } catch (error) {
        console.error("Error signing out:", error);
        }

    }
    

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button 
                    variant="ghost"
                    className="w-full h-auto flex items-center gap-2 justify-start p-2"
                >
                    <Image
                        className="rounded-lg"
                        src={firebase?.photoURL || "/default_profile.png"}
                        alt="User Profile"
                        width={40}
                        height={40}
                    />
                    <span>{user?.firstName} {user?.lastName}</span>
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