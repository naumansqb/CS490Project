// SkillsManagement.tsx
"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Skill, CreateSkillInput } from "@/lib/skills.api";

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
] as const;

const SKILL_CATEGORIES = [
  { value: "technical", label: "Technical" },
  { value: "soft-skills", label: "Soft Skills" },
  { value: "languages", label: "Languages" },
  { value: "industry-specific", label: "Industry-Specific" }
] as const;

type Category = (typeof SKILL_CATEGORIES)[number]["value"];

interface SkillsManagementProps {
  skills: Skill[];
  onAddSkill: (skill: CreateSkillInput) => Promise<void> | void;
  onUpdateSkill: (id: string, skill: Partial<CreateSkillInput>) => Promise<void> | void;
  onRemoveSkill: (id: string) => Promise<void> | void;
  className?: string;
}

export function SkillsManagement({
  skills,
  onAddSkill,
  onUpdateSkill,
  onRemoveSkill,
  className
}: SkillsManagementProps) {
  // form state
  const [newSkill, setNewSkill] = useState<CreateSkillInput>({
    skillName: "",
    proficiencyLevel: "beginner",
    skillCategory: "technical",
    displayOrder: undefined
  });

  const [filter, setFilter] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | Category>("all");

  // edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<CreateSkillInput>>({});

  // drag state
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // client-side duplicate guard
  const isDuplicate = (name: string, category: Category, excludeId?: string) =>
    skills.some(
      (s) =>
        s.skillName.toLowerCase() === name.trim().toLowerCase() &&
        s.skillCategory === category &&
        s.id !== excludeId
    );

  const filteredSkills = useMemo(
    () =>
      skills
        .filter((s) => {
          const matchesText = s.skillName.toLowerCase().includes(filter.toLowerCase());
          const matchesCat = selectedCategory === "all" || s.skillCategory === selectedCategory;
          return matchesText && matchesCat;
        })
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.skillName.localeCompare(b.skillName)),
    [skills, filter, selectedCategory]
  );

  const groupedSkills = useMemo(() => {
    return filteredSkills.reduce((acc, s) => {
      (acc[s.skillCategory] ??= []).push(s);
      return acc;
    }, {} as Record<Category, Skill[]>);
  }, [filteredSkills]);

  const handleAddSkill = async () => {
    const name = newSkill.skillName.trim();
    if (!name) return;

    if (isDuplicate(name, newSkill.skillCategory)) {
      alert("Entry already exists");
      return;
    }

    try {
      await onAddSkill({
        ...newSkill,
        skillName: name,
        // put new one at the end of its category
        displayOrder:
          (skills
            .filter((s) => s.skillCategory === newSkill.skillCategory)
            .reduce((max, s) => Math.max(max, s.displayOrder ?? 0), 0) || 0) + 1,
      });
      setNewSkill({ skillName: "", proficiencyLevel: "beginner", skillCategory: "technical", displayOrder: undefined });
    } catch (e: any) {
      // surface friendly duplicate message if server replies 409 (see api wrapper)
      alert(e?.message || "Failed to create skill");
    }
  };

  const startEdit = (s: Skill) => {
    setEditingId(s.id);
    setEditDraft({
      skillName: s.skillName,
      proficiencyLevel: s.proficiencyLevel,
      skillCategory: s.skillCategory,
    });
  };

  const saveEdit = async (s: Skill) => {
    const name = (editDraft.skillName ?? s.skillName).trim();
    const cat = (editDraft.skillCategory ?? s.skillCategory) as Category;

    if (!name) return;

    if (isDuplicate(name, cat, s.id)) {
      alert("Entry already exists");
      return;
    }

    await onUpdateSkill(s.id, {
      skillName: name,
      proficiencyLevel: editDraft.proficiencyLevel ?? s.proficiencyLevel,
      skillCategory: cat,
    });
    setEditingId(null);
    setEditDraft({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({});
  };

  const handleRemoveSkill = (id: string) => {
    if (window.confirm("Are you sure you want to remove this skill?")) onRemoveSkill(id);
  };

  // --- Drag & Drop (HTML5, no external libs) ---

  const onDragStart = (e: React.DragEvent, s: Skill) => {
    setDraggingId(s.id);
    e.dataTransfer.setData("text/plain", JSON.stringify({ id: s.id }));
    // allow move effect
    e.dataTransfer.dropEffect = "move";
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // allow drop
  };

  // Drop on a category container to move to end of that category
  const onDropOnCategory = async (e: React.DragEvent, targetCategory: Category) => {
    e.preventDefault();
    try {
      const { id } = JSON.parse(e.dataTransfer.getData("text/plain")) as { id: string };
      const dragged = skills.find((s) => s.id === id);
      if (!dragged) return;

      // compute new displayOrder at end
      const nextOrder =
        (skills
          .filter((s) => s.skillCategory === targetCategory)
          .reduce((max, s) => Math.max(max, s.displayOrder ?? 0), 0) || 0) + 1;

      await onUpdateSkill(id, {
        skillCategory: targetCategory,
        displayOrder: nextOrder,
      });
    } finally {
      setDraggingId(null);
    }
  };

  // Drop on another skill to reorder within that category (place before target)
  const onDropOnSkill = async (e: React.DragEvent, target: Skill) => {
    e.preventDefault();
    try {
      const { id } = JSON.parse(e.dataTransfer.getData("text/plain")) as { id: string };
      if (id === target.id) return;

      const dragged = skills.find((s) => s.id === id);
      if (!dragged) return;

      const category = target.skillCategory;

      // Rebuild order list with dragged inserted before target
      const list = skills
        .filter((s) => s.skillCategory === category && s.id !== id)
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

      const insertIndex = list.findIndex((s) => s.id === target.id);
      list.splice(insertIndex, 0, { ...dragged, skillCategory: category });

      // Assign compact orders 1..n
      const updates: { id: string; displayOrder: number }[] = list.map((s, i) => ({
        id: s.id,
        displayOrder: i + 1,
      }));

      // Update dragged category if moving across
      const draggedNeedsCategoryUpdate = dragged.skillCategory !== category;

      // Persist: update dragged (order + maybe category), then adjust others
      await onUpdateSkill(id, {
        skillCategory: category,
        displayOrder: updates.find((u) => u.id === id)!.displayOrder,
      });

      // Update the rest (fire-and-forget sequence)
      for (const u of updates) {
        if (u.id !== id) await onUpdateSkill(u.id, { displayOrder: u.displayOrder });
      }

      if (draggedNeedsCategoryUpdate) {
        // no-op; already done above by setting skillCategory
      }
    } finally {
      setDraggingId(null);
    }
  };

  // per-category level summaries
  const summaries = useMemo(() => {
    const base: Record<Category, Record<Skill["proficiencyLevel"], number>> = {
      "technical": { beginner: 0, intermediate: 0, advanced: 0, expert: 0 },
      "soft-skills": { beginner: 0, intermediate: 0, advanced: 0, expert: 0 },
      "languages": { beginner: 0, intermediate: 0, advanced: 0, expert: 0 },
      "industry-specific": { beginner: 0, intermediate: 0, advanced: 0, expert: 0 },
    };
    for (const s of skills) base[s.skillCategory][s.proficiencyLevel]++;
    return base;
  }, [skills]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Add New Skill */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Skill</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Skill Name</label>
              <Input
                value={newSkill.skillName}
                onChange={(e) => setNewSkill({ ...newSkill, skillName: e.target.value })}
                placeholder="Enter skill name"
                list="skills-list"
              />
              <datalist id="skills-list">
                {COMMON_SKILLS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Proficiency</label>
              <select
                value={newSkill.proficiencyLevel}
                onChange={(e) =>
                  setNewSkill({ ...newSkill, proficiencyLevel: e.target.value as Skill["proficiencyLevel"] })
                }
                className="w-full h-9 px-3 py-1 border border-input rounded-md bg-background"
              >
                {PROFICIENCY_LEVELS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <select
                value={newSkill.skillCategory}
                onChange={(e) =>
                  setNewSkill({ ...newSkill, skillCategory: e.target.value as Category })
                }
                className="w-full h-9 px-3 py-1 border border-input rounded-md bg-background"
              >
                {SKILL_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <Button onClick={handleAddSkill} className="bg-[#24747C] text-white px-4 py-2 rounded hover:bg-[#1E636A] transition">
            Add Skill
          </Button>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search skills..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as "all" | Category)}
          className="h-9 px-3 py-1 border border-input rounded-md bg-background"
        >
          <option value="all">All Categories</option>
          {SKILL_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Category summaries */}
      {selectedCategory === "all" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {SKILL_CATEGORIES.map((c) => {
            const count = skills.filter((s) => s.skillCategory === c.value).length;
            const sum = summaries[c.value as Category];
            return (
              <Card key={c.value}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>{c.label}</span>
                    <span className="text-muted-foreground font-normal">({count})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1">
                  <div>Beginner: {sum.beginner}</div>
                  <div>Intermediate: {sum.intermediate}</div>
                  <div>Advanced: {sum.advanced}</div>
                  <div>Expert: {sum.expert}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Skills by Category – drag & drop enabled containers */}
      <div className="space-y-4">
        {(selectedCategory === "all"
          ? SKILL_CATEGORIES.map((c) => c.value as Category)
          : [selectedCategory as Category]
        ).map((category) => {
          const label = SKILL_CATEGORIES.find((c) => c.value === category)?.label ?? category;
          const items = groupedSkills[category] ?? [];

          return (
            <Card
              key={category}
              onDragOver={onDragOver}
              onDrop={(e) => onDropOnCategory(e, category)}
              className="border-dashed"
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{label}</span>
                  <span className="text-sm font-normal text-muted-foreground">({items.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {items.map((s) => {
                    const isEditing = editingId === s.id;
                    return (
                      <div
                        key={s.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, s)}
                        onDragOver={onDragOver}
                        onDrop={(e) => onDropOnSkill(e, s)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1 rounded-full border",
                          "bg-muted",
                          draggingId === s.id && "opacity-60",
                        )}
                      >
                        {isEditing ? (
                          <>
                            <Input
                              value={editDraft.skillName ?? s.skillName}
                              onChange={(e) => setEditDraft((d) => ({ ...d, skillName: e.target.value }))}
                              className="h-7 w-28"
                            />
                            <select
                              value={editDraft.proficiencyLevel ?? s.proficiencyLevel}
                              onChange={(e) =>
                                setEditDraft((d) => ({
                                  ...d,
                                  proficiencyLevel: e.target.value as Skill["proficiencyLevel"],
                                }))
                              }
                              className="h-7 text-xs border rounded px-1"
                            >
                              {PROFICIENCY_LEVELS.map((p) => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                              ))}
                            </select>
                            <select
                              value={editDraft.skillCategory ?? s.skillCategory}
                              onChange={(e) =>
                                setEditDraft((d) => ({ ...d, skillCategory: e.target.value as Category }))
                              }
                              className="h-7 text-xs border rounded px-1"
                            >
                              {SKILL_CATEGORIES.map((c) => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                              ))}
                            </select>
                            <Button size="sm" variant="secondary" className="h-7 px-2" onClick={() => saveEdit(s)}>
                              Save
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={cancelEdit}>
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <span className="text-sm font-medium">{s.skillName}</span>
                            <span className="text-xs text-muted-foreground">
                              {PROFICIENCY_LEVELS.find((p) => p.value === s.proficiencyLevel)?.label}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2"
                              onClick={() => startEdit(s)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveSkill(s.id)}
                              className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                            >
                              ×
                            </Button>
                          </>
                        )}
                      </div>
                    );
                  })}
                  {items.length === 0 && (
                    <div className="text-sm text-muted-foreground">No skills in {label}.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
