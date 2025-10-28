"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkillsManagement } from "@/components/skills/skills-management";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import your components for each section
import CertificationList from "@/components/CertificationList";
import EducationList from "@/components/educationHistory";
import ProjectPortfolio from "@/components/ProjectsList";


export default function ProfileContent() {
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
        <TabsList className="flex flex-wrap gap-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>
        
        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-4 mt-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center py-8">
                Overview content coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* SKILLS */}
        <TabsContent value="skills" className="space-y-4 mt-6">
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

        {/* EDUCATION */}
        <TabsContent value="education" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Education</CardTitle>
            </CardHeader>
            <CardContent>
              <EducationList />
            </CardContent>
          </Card>
        </TabsContent>

        {/* CERTIFICATIONS */}
        <TabsContent value="certifications" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Certifications</CardTitle>
            </CardHeader>
            <CardContent>
              <CertificationList />
            </CardContent>
          </Card>
        </TabsContent>

        {/* PROJECTS */}
        <TabsContent value="projects" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectPortfolio />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
