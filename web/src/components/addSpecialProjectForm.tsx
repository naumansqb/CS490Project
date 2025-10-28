"use client";

import { useState } from "react";
import { createProject, updateProject, SpecialProject } from "@/lib/specialProjects.api";

type Props = {
  onSuccess?: () => void;
  editingId?: string | null;
  defaultValues?: Partial<SpecialProject>;
  onCancel?: () => void;
};

const STATUS_OPTIONS = ["Completed", "Ongoing", "Planned"];

export default function AddProjectForm({
  onSuccess,
  editingId,
  defaultValues,
  onCancel,
}: Props) {
  const [formData, setFormData] = useState({
    projectName: defaultValues?.projectName || "",
    description: defaultValues?.description || "",
    role: defaultValues?.role || "",
    startDate: defaultValues?.startDate || "",
    endDate: defaultValues?.endDate || "",
    technologies: defaultValues?.technologies?.join(", ") || "",
    projectUrl: defaultValues?.projectUrl || "",
    repositoryUrl: defaultValues?.repositoryUrl || "",
    teamSize: defaultValues?.teamSize?.toString() || "",
    collaborationDetails: defaultValues?.collaborationDetails || "",
    outcomes: defaultValues?.outcomes || "",
    industry: defaultValues?.industry || "",
    status: defaultValues?.status || "Completed",
    media: null as File | null,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = e.currentTarget;
    setFormData((prev) => ({ ...prev, [target.name]: target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, media: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = new FormData();
    payload.append("projectName", formData.projectName);
    payload.append("description", formData.description);
    payload.append("role", formData.role);
    if (formData.startDate) payload.append("startDate", formData.startDate);
    if (formData.endDate) payload.append("endDate", formData.endDate);
    if (formData.technologies)
      payload.append(
        "technologies",
        JSON.stringify(
          formData.technologies.split(",").map((t) => t.trim()).filter(Boolean)
        )
      );
    if (formData.projectUrl) payload.append("projectUrl", formData.projectUrl);
    if (formData.repositoryUrl) payload.append("repositoryUrl", formData.repositoryUrl);
    if (formData.teamSize) payload.append("teamSize", formData.teamSize);
    if (formData.collaborationDetails) payload.append("collaborationDetails", formData.collaborationDetails);
    if (formData.outcomes) payload.append("outcomes", formData.outcomes);
    if (formData.industry) payload.append("industry", formData.industry);
    payload.append("status", formData.status);
    if (formData.media) payload.append("media", formData.media);

    if (editingId) {
      await updateProject(editingId, payload);
    } else {
      await createProject(payload);
    }

    onSuccess?.();
    onCancel?.();
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      projectName: "",
      description: "",
      role: "",
      startDate: "",
      endDate: "",
      technologies: "",
      projectUrl: "",
      repositoryUrl: "",
      teamSize: "",
      collaborationDetails: "",
      outcomes: "",
      industry: "",
      status: "Completed",
      media: null,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-4 border rounded-lg bg-white shadow-sm"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          name="projectName"
          placeholder="Project Name *"
          value={formData.projectName}
          onChange={handleChange}
          required
          className="border p-2 rounded"
        />
        <input
          name="role"
          placeholder="Your Role *"
          value={formData.role}
          onChange={handleChange}
          required
          className="border p-2 rounded"
        />
        <input
          type="date"
          name="startDate"
          value={formData.startDate}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="date"
          name="endDate"
          value={formData.endDate}
          onChange={handleChange}
          className="border p-2 rounded"
        />
      </div>

      <textarea
        name="description"
        placeholder="Project Description"
        value={formData.description}
        onChange={handleChange}
        className="border p-2 rounded w-full"
        rows={3}
      />

      <input
        name="technologies"
        placeholder="Technologies/Skills (comma separated)"
        value={formData.technologies}
        onChange={handleChange}
        className="border p-2 rounded w-full"
      />

      <input
        name="projectUrl"
        placeholder="Project URL (optional)"
        value={formData.projectUrl}
        onChange={handleChange}
        className="border p-2 rounded w-full"
      />

      <input
        name="repositoryUrl"
        placeholder="Repository URL (optional)"
        value={formData.repositoryUrl}
        onChange={handleChange}
        className="border p-2 rounded w-full"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="number"
          name="teamSize"
          placeholder="Team Size"
          value={formData.teamSize}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          name="industry"
          placeholder="Industry / Project Type"
          value={formData.industry}
          onChange={handleChange}
          className="border p-2 rounded"
        />
      </div>

      <textarea
        name="collaborationDetails"
        placeholder="Collaboration Details"
        value={formData.collaborationDetails}
        onChange={handleChange}
        className="border p-2 rounded w-full"
        rows={2}
      />

      <textarea
        name="outcomes"
        placeholder="Outcomes / Achievements"
        value={formData.outcomes}
        onChange={handleChange}
        className="border p-2 rounded w-full"
        rows={2}
      />

      <select
        name="status"
        value={formData.status}
        onChange={handleChange}
        className="border p-2 rounded"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="w-full"
      />

      <div className="flex gap-3">
        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          {editingId ? "Update Project" : "Save Project"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
