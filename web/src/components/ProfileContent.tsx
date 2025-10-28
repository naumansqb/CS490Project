"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkillsManagement } from "@/components/skills/skills-management";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUserSkills, createSkill, updateSkill, deleteSkill, Skill } from "@/lib/skills.api";

// Import your components for each section
import WorkHistory from "@/components/workHistory";
import CertificationList from "@/components/CertificationList";
import EducationList from "@/components/educationHistory";
import ProjectPortfolio from "@/components/ProjectsList";

interface ProfileContentProps {
  userId: string;
}

export default function ProfileContent({ userId }: ProfileContentProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(true);

  // Fetch skills from database when component mounts
  useEffect(() => {
    fetchSkills();
  }, [userId]);

  const fetchSkills = async () => {
    try {
      setLoadingSkills(true);
      const data = await getUserSkills(userId);
      setSkills(data);
    } catch (error) {
      console.error('Failed to fetch skills:', error);
    } finally {
      setLoadingSkills(false);
    }
  };

  const handleAddSkill = async (newSkill: Omit<Skill, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      const created = await createSkill(newSkill);
      setSkills([...skills, created]);
    } catch (error) {
      console.error('Failed to add skill:', error);
      alert('Failed to add skill. Please try again.');
    }
  };

  const handleUpdateSkill = async (id: string, updates: Partial<Skill>) => {
    try {
      const updated = await updateSkill(id, updates);
      setSkills(skills.map(skill =>
        skill.id === id ? updated : skill
      ));
    } catch (error) {
      console.error('Failed to update skill:', error);
      alert('Failed to update skill. Please try again.');
    }
  };

  const handleRemoveSkill = async (id: string) => {
    try {
      await deleteSkill(id);
      setSkills(skills.filter(skill => skill.id !== id));
    } catch (error) {
      console.error('Failed to delete skill:', error);
      alert('Failed to delete skill. Please try again.');
    }
  };

  return (
    <div className="space-y-6 mt-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex flex-wrap gap-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
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

        {/* WORK EXPERIENCE */}
        <TabsContent value="experience" className="space-y-4 mt-6">
          <WorkHistory userId={userId} />
        </TabsContent>

        {/* SKILLS */}
        <TabsContent value="skills" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Skills Management</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingSkills ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-slate-500">Loading skills...</p>
                </div>
              ) : (
                <SkillsManagement
                  skills={skills}
                  onAddSkill={handleAddSkill}
                  onUpdateSkill={handleUpdateSkill}
                  onRemoveSkill={handleRemoveSkill}
                />
              )}
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