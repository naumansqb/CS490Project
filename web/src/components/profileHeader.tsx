'use client'
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Mail, MapPin, Phone, Briefcase, Flower2 } from "lucide-react";
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
  }, [urlUid]);

  return (
    <Card>
      <CardContent>
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={firebaseUser?.photoURL || "/default_profile.png"} alt="Profile" />
            </Avatar>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <h1 className="text-2xl font-bold">{user?.firstName} {user?.lastName}</h1>
            </div>
            <p className="text-muted-foreground">{user?.headline || 'Edit to personalize your profile.'}</p>
            <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Mail className="size-4" />
                {user?.email || <span className="text-gray-500 italic">N/A</span>}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="size-4" />
                {user?.locationCity || user?.locationState
                  ? [user?.locationCity, user?.locationState].filter(Boolean).join(', ')
                  : <span className="text-gray-500 italic">No location</span>}
              </div>
              <div className="flex items-center gap-1">
                <Phone className="size-4" />
                {user?.phone_number || <span className="text-gray-500 italic">No number</span>}
              </div>
            </div>

            <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Briefcase className="size-4" />
                {user?.industry || <span className="text-gray-500 italic">Not specified</span>}
              </div>
              <div className="flex items-center gap-1">
                <Flower2 className="size-4" />
                {user?.careerLevel || <span className="text-gray-500 italic">Not specified</span>}
              </div>
            </div>
          </div>
          <div></div>
          <Button variant="default" className="bg-[#3bafba] hover:bg-[#34a0ab] disabled:opacity-60 disabled:cursor-not-allowed"onClick={() => router.push(`/profile/${firebaseUser?.uid}/edit`)}>Edit Profile</Button>
        </div>
      </CardContent>
      <CardContent>
        <div className="border-full border-t pt-4">
          <p>{user?.bio || ''}</p>
        </div>
      </CardContent>
    </Card>
  );
}