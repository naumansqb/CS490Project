"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { SkillsManagement } from "@/components/skills/skills-management";
import { useState } from "react";
export default function Dashboard() {
  const [skills, setSkills] = useState([
    { id: "1", name: "JavaScript", proficiency: "advanced", category: "technical" },
    { id: "2", name: "React", proficiency: "intermediate", category: "technical" },
    { id: "3", name: "Communication", proficiency: "expert", category: "soft-skills" }
  ]);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handleAddSkill = (newSkill: any) => {
    const skill = { ...newSkill, id: Date.now().toString() };
    setSkills([...skills, skill]);
  };

  const handleUpdateSkill = (id: string, updates: any) => {
    setSkills(skills.map(skill => 
      skill.id === id ? { ...skill, ...updates } : skill
    ));
  };

  const handleRemoveSkill = (id: string) => {
    setSkills(skills.filter(skill => skill.id !== id));
  };

  const handleAvatarUpload = async (file: File) => {
    // Simulate upload and create a preview URL
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create a preview URL for the uploaded file
    const imageUrl = URL.createObjectURL(file);
    setProfileImage(imageUrl);
    
    console.log("Avatar uploaded:", file.name);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Picture Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
          </CardHeader>
          <CardContent>
            <AvatarUpload 
              onUpload={handleAvatarUpload}
              currentImage={profileImage || undefined}
            />
          </CardContent>
        </Card>

        {/* Profile Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Full Name</label>
              <input 
                type="text" 
                placeholder="Enter your full name"
                className="w-full mt-1 px-3 py-2 border border-input rounded-md"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Professional Headline</label>
              <input 
                type="text" 
                placeholder="e.g., Senior Software Engineer"
                className="w-full mt-1 px-3 py-2 border border-input rounded-md"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Bio</label>
              <textarea 
                placeholder="Tell us about yourself..."
                className="w-full mt-1 px-3 py-2 border border-input rounded-md h-20"
              />
            </div>
            <Button className="w-full">Save Profile</Button>
          </CardContent>
        </Card>
      </div>

      {/* Skills Management */}
      <Card>
        <CardHeader>
          <CardTitle>Skills Management</CardTitle>
        </CardHeader>
        <CardContent>
          <SkillsManagement
            skills={skills}
            onAddSkill={handleAddSkill}
            onUpdateSkill={handleUpdateSkill}
            onRemoveSkill={handleRemoveSkill}
          />
        </CardContent>
      </Card>
    </div>

  );
}
