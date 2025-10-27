"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Predefined list of common skills
const COMMON_SKILLS = [
  "JavaScript", "TypeScript", "React", "Node.js", "Python", "Java", "C++", "C#",
  "HTML", "CSS", "SQL", "MongoDB", "PostgreSQL", "Git", "Docker", "AWS",
  "Communication", "Leadership", "Problem Solving", "Teamwork", "Time Management",
  "Project Management", "Agile", "Scrum", "English", "Spanish", "French", "German",
  "Machine Learning", "Data Analysis", "UI/UX Design", "Figma", "Photoshop"
];

const PROFICIENCY_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" }
];

const SKILL_CATEGORIES = [
  { value: "technical", label: "Technical" },
  { value: "soft-skills", label: "Soft Skills" },
  { value: "languages", label: "Languages" },
  { value: "industry-specific", label: "Industry-Specific" }
];

interface Skill {
  id: string;
  name: string;
  proficiency: string;
  category: string;
}

interface SkillsManagementProps {
  skills: Skill[];
  onAddSkill: (skill: Omit<Skill, 'id'>) => void;
  onUpdateSkill: (id: string, skill: Partial<Skill>) => void;
  onRemoveSkill: (id: string) => void;
  className?: string;
}

export function SkillsManagement({ 
  skills, 
  onAddSkill, 
  onUpdateSkill, 
  onRemoveSkill, 
  className 
}: SkillsManagementProps) {
  const [newSkill, setNewSkill] = useState({
    name: "",
    proficiency: "beginner",
    category: "technical"
  });
  const [filter, setFilter] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredSkills = skills.filter(skill => {
    const matchesFilter = skill.name.toLowerCase().includes(filter.toLowerCase());
    const matchesCategory = selectedCategory === "all" || skill.category === selectedCategory;
    return matchesFilter && matchesCategory;
  });

  const handleAddSkill = () => {
    if (!newSkill.name.trim()) return;
    
    // Check for duplicates
    const isDuplicate = skills.some(skill => 
      skill.name.toLowerCase() === newSkill.name.toLowerCase()
    );
    
    if (isDuplicate) {
      alert("This skill already exists");
      return;
    }

    onAddSkill(newSkill);
    setNewSkill({ name: "", proficiency: "beginner", category: "technical" });
  };

  const handleRemoveSkill = (id: string) => {
    if (window.confirm("Are you sure you want to remove this skill?")) {
      onRemoveSkill(id);
    }
  };

  const groupedSkills = filteredSkills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Add New Skill Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Skill</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Skill Name</label>
              <Input
                value={newSkill.name}
                onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                placeholder="Enter skill name"
                list="skills-list"
              />
              <datalist id="skills-list">
                {COMMON_SKILLS.map((skill) => (
                  <option key={skill} value={skill} />
                ))}
              </datalist>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Proficiency</label>
              <select
                value={newSkill.proficiency}
                onChange={(e) => setNewSkill({ ...newSkill, proficiency: e.target.value })}
                className="w-full h-9 px-3 py-1 border border-input rounded-md bg-background"
              >
                {PROFICIENCY_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <select
                value={newSkill.category}
                onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
                className="w-full h-9 px-3 py-1 border border-input rounded-md bg-background"
              >
                {SKILL_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <Button onClick={handleAddSkill} className="w-full md:w-auto">
            Add Skill
          </Button>
        </CardContent>
      </Card>

      {/* Skills Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search skills..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="h-9 px-3 py-1 border border-input rounded-md bg-background"
        >
          <option value="all">All Categories</option>
          {SKILL_CATEGORIES.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      {/* Skills Display */}
      <div className="space-y-4">
        {Object.keys(groupedSkills).length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No skills found. Add your first skill above!
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedSkills).map(([category, categorySkills]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="capitalize">
                  {SKILL_CATEGORIES.find(c => c.value === category)?.label || category}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({categorySkills.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {categorySkills.map((skill) => (
                    <div
                      key={skill.id}
                      className="flex items-center gap-2 bg-muted px-3 py-1 rounded-full"
                    >
                      <span className="text-sm font-medium">{skill.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {PROFICIENCY_LEVELS.find(p => p.value === skill.proficiency)?.label}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSkill(skill.id)}
                        className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
