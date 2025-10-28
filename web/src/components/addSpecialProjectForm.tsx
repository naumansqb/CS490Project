"use client";

import { useState } from "react";
import {
  createProject,
  updateProject,
  SpecialProject,
} from "@/lib/specialProjects.api";

type Props = {
  onSuccess?: () => void;
  editingId?: string | null;
  defaultValues?: Partial<SpecialProject>;
  onCancel?: () => void;
};

export default function AddProjectForm({
  onSuccess,
  editingId,
  defaultValues,
  onCancel,
}: Props) {
  const [formData, setFormData] = useState({
    projectName: defaultValues?.projectName || "",
    description: defaultValues?.description || "",
    startDate: defaultValues?.startDate || "",
    endDate: defaultValues?.endDate || "",
    status: defaultValues?.status || "",
    projectUrl: defaultValues?.projectUrl || "",
    repositoryUrl: defaultValues?.repositoryUrl || "",
    skillsDemonstrated: defaultValues?.skillsDemonstrated?.join(", ") || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Build the payload expected by the backend
    const payload: Partial<SpecialProject> = {
      projectName: formData.projectName,
      description: formData.description,
      startDate: formData.startDate
        ? new Date(formData.startDate).toISOString()
        : undefined,
      endDate: formData.endDate
        ? new Date(formData.endDate).toISOString()
        : undefined,
      status: formData.status,
      projectUrl: formData.projectUrl || undefined,
      repositoryUrl: formData.repositoryUrl || undefined,
      skillsDemonstrated: formData.skillsDemonstrated
        ? formData.skillsDemonstrated.split(",").map((s) => s.trim())
        : [],
    };

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
      startDate: "",
      endDate: "",
      status: "",
      projectUrl: "",
      repositoryUrl: "",
      skillsDemonstrated: "",
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
          name="status"
          placeholder="Status (e.g. Completed)"
          value={formData.status}
          onChange={handleChange}
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
        <input
          name="projectUrl"
          placeholder="Project URL"
          value={formData.projectUrl}
          onChange={handleChange}
          className="border p-2 rounded col-span-2"
        />
        <input
          name="repositoryUrl"
          placeholder="Repository URL"
          value={formData.repositoryUrl}
          onChange={handleChange}
          className="border p-2 rounded col-span-2"
        />
      </div>

      <textarea
        name="description"
        placeholder="Project Description *"
        value={formData.description}
        onChange={handleChange}
        required
        className="border p-2 rounded w-full"
        rows={4}
      />

      <input
        name="skillsDemonstrated"
        placeholder="Skills (comma separated)"
        value={formData.skillsDemonstrated}
        onChange={handleChange}
        className="border p-2 rounded w-full"
      />

      <div className="flex gap-3 mt-3">
        <button
          type="submit"
          className="text-white px-4 py-2 rounded bg-[#3bafba] hover:bg-[#34a0ab] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {editingId ? "Update Project" : "Save Project"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
