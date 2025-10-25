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


export default function UserFooter() {
    const user = getCurrentUser();
    const router = useRouter();

    const handleSignOut = async () => {
        try {
            await signOutUser();
            router.push('/signin');
        } catch (error) {
        console.error("Error signing out:", error);
        }

    }
    

    console.log("UserFooter user:", user);
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button 
                    variant="ghost"
                    className="w-full h-auto flex items-center gap-2 justify-start p-2"
                >
                    <Image
                        className="rounded-lg"
                        src={user?.photoURL || "/default_profile.png"}
                        alt="User Profile"
                        width={40}
                        height={40}
                    />
                    <span>{user?.displayName || user?.email || "Profile"}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => router.push(`/profile/${user?.uid}`)}>
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