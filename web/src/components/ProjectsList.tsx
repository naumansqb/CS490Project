"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getProjectsByUserId,
  deleteProject,
  SpecialProject,
} from "@/lib/specialProjects.api";
import AddProjectForm from "@/components/addSpecialProjectForm";

export default function ProjectList() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<SpecialProject[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<Partial<SpecialProject>>();

  useEffect(() => {
    if (user?.uid) loadProjects();
  }, [user]);

  const loadProjects = async () => {
    if (!user?.uid) return;
    const data = await getProjectsByUserId(user.uid);
    const sorted = [...data].sort((a, b) =>
      (b.startDate || "").localeCompare(a.startDate || "")
    );
    setProjects(sorted);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this project?")) {
      await deleteProject(id);
      loadProjects();
    }
  };

  return (
    <div className="space-y-6 mt-8">
      <h2 className="text-2xl font-bold">Special Projects</h2>

      <AddProjectForm onSuccess={loadProjects} />

      <ul className="space-y-4">
        {projects.map((proj) => (
          <li
            key={proj.id}
            className="border p-4 rounded bg-white shadow-sm flex justify-between items-start"
          >
            <div>
              <h3 className="font-semibold text-lg">
                {proj.projectName}{" "}
                <span
                  className={`ml-2 text-xs px-2 py-0.5 rounded ${
                    proj.status === "Completed"
                      ? "bg-green-100 text-green-700"
                      : proj.status === "Ongoing"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {proj.status}
                </span>
              </h3>

              {proj.role && (
                <p className="text-sm text-gray-600 mt-1">Role: {proj.role}</p>
              )}

              <p className="text-sm text-gray-600 mt-1">
                {proj.startDate &&
                  `From ${new Date(proj.startDate).toLocaleDateString()} `}
                {proj.endDate &&
                  `to ${new Date(proj.endDate).toLocaleDateString()}`}
              </p>

              <p className="text-sm mt-2 text-gray-800">{proj.description}</p>

              {proj.technologies && (
                <p className="text-xs text-gray-500 mt-1">
                  Skills: {proj.technologies.join(", ")}
                </p>
              )}

              {proj.outcomes && (
                <p className="text-xs text-gray-500 mt-1 italic">
                  Outcome: {proj.outcomes}
                </p>
              )}

              {proj.projectUrl && (
                <a
                  href={proj.projectUrl}
                  target="_blank"
                  className="text-blue-600 text-xs underline mt-1 block"
                >
                  View Project
                </a>
              )}
              {proj.repositoryUrl && (
                <a
                  href={proj.repositoryUrl}
                  target="_blank"
                  className="text-blue-600 text-xs underline"
                >
                  Repository
                </a>
              )}

              {proj.mediaUrl && (
                <img
                  src={proj.mediaUrl}
                  alt="Project screenshot"
                  className="mt-2 w-48 rounded border"
                />
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingId(proj.id!);
                  setEditingValues(proj);
                }}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(proj.id!)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {editingId && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Edit Project</h3>
          <AddProjectForm
            editingId={editingId}
            defaultValues={editingValues}
            onCancel={() => setEditingId(null)}
            onSuccess={() => {
              setEditingId(null);
              loadProjects();
            }}
          />
        </div>
      )}
    </div>
  );
}
