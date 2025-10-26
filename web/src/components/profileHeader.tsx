'use client'
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Mail, MapPin, Phone, Briefcase, Flower2  } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";

export default function ProfileHeader() {
    const router = useRouter();
    const [user, setUser] = useState<Record<string, any> | null>(null);
    const { user: firebaseUser } = useAuth();
    const params = useParams();
     const urlUid = params.uid as string;

    useEffect(() => {
        const fetchProfile = async () => {
        try {
            const data = await apiClient.fetch(`/user-profiles/${urlUid}`) as Record<string, any>;
            setUser(data);
            console.log('Fetched profile data:', data);
        } catch (error) {
            console.error('Failed to load profile:', error);
        } finally {
        }
        };
        
        fetchProfile();
    }, []);

  return (
    <Card>
      <CardContent>
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={firebaseUser?.photoURL || "default_profile.png"} alt="Profile" />
              <AvatarFallback className="text-2xl">JD</AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              variant="outline"
              className="absolute -right-2 -bottom-2 h-8 w-8 rounded-full">
              <Camera />
            </Button>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <h1 className="text-2xl font-bold">{user?.firstName} {user?.lastName}</h1>
            </div>
            <p className="text-muted-foreground">{user?.headline || 'Edit to personalize your profile.'}</p>
            <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Mail className="size-4" />
                {firebaseUser?.email || "N/A"}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="size-4" />
                {user?.locationCity}, {user?.locationState}
              </div>
              <div className="flex items-center gap-1">
                <Phone className="size-4" />
                123-456-7890
              </div>
            </div>

            <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Briefcase className="size-4" />
                Technology
              </div>
              <div className="flex items-center gap-1">
                <Flower2 className="size-4" />
                Entry Level
              </div>
            </div>
          </div>
          <div></div>
          <Button variant="default" onClick={() => router.push(`/profile/${firebaseUser?.uid}/edit`)}>Edit Profile</Button>
        </div>
      </CardContent>
      <CardContent>
        <div className="border-full border-t pt-4">
            <p>{user?.bio || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'}</p>
        </div>
      </CardContent>
    </Card>
  );
}