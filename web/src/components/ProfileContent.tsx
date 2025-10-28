"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkillsManagement } from "@/components/skills/skills-management";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WorkHistory from "@/components/workHistory"
import { useParams } from "next/navigation";
import EducationHistory from "./educationHistory";
import CertificationList from "./CertificationList";
import ProjectList from "./ProjectsList";

export default function ProfileContent() {
  const params = useParams();
  const urlUid = params.uid as string;
  const [shouldRedirect, setShouldRedirect] = useState<string | null>(null);

  const [skills, setSkills] = useState([
    { id: "1", name: "JavaScript", proficiency: "advanced", category: "technical" },
    { id: "2", name: "React", proficiency: "intermediate", category: "technical" },
    { id: "3", name: "Communication", proficiency: "expert", category: "soft-skills" }
  ]);

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

  return (
    <div className="space-y-6 mt-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mx-auto flex justify-center">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="work experience">Work Experience</TabsTrigger>
          <TabsTrigger value="education history">Education History</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="special projects">Special Projects</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 mt-6">
          {/* Overview content will go here in the future */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center py-8">Overview content coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="skills" className="space-y-4 mt-6">
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
        </TabsContent>
        <TabsContent value="work experience">
          <Card>
            <CardContent>
              <WorkHistory userId={urlUid} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="education history">
          <Card>
            <CardContent>
              <EducationHistory />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="certifications">
          <Card>
            <CardContent>
              <CertificationList />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="special projects">
          <Card>
            <CardContent>
              <ProjectList />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
