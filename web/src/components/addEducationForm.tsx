"use client";

import { useState } from "react";
import { createEducation, updateEducation } from "@/lib/educationHistory.api";

type Props = {
  onSuccess?: () => void;
  editingId?: string | null;
  defaultValues?: {
    institutionName?: string;
    degreeType?: string;
    major?: string;
    startDate?: string;
    graduationDate?: string;
  };
  onCancel?: () => void;
};

export default function AddEducationForm({
  onSuccess,
  editingId,
  defaultValues,
  onCancel,
}: Props) {
  const [formData, setFormData] = useState({
    institutionName: defaultValues?.institutionName || "",
    degreeType: defaultValues?.degreeType || "",
    major: defaultValues?.major || "",
    startDate: defaultValues?.startDate || "",
    graduationDate: defaultValues?.graduationDate || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      institutionName: formData.institutionName,
      degreeType: formData.degreeType,
      major: formData.major,
      startDate: formData.startDate
        ? new Date(formData.startDate).toISOString()
        : undefined,
      graduationDate: formData.graduationDate
        ? new Date(formData.graduationDate).toISOString()
        : undefined,
    };

    try {
      if (editingId) {
        await updateEducation(editingId, payload);
      } else {
        await createEducation(payload);
      }

      onSuccess?.();
      onCancel?.();
      resetForm();
    } catch (error) {
      console.error("Error saving education:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      institutionName: "",
      degreeType: "",
      major: "",
      startDate: "",
      graduationDate: "",
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-4 border rounded-lg bg-white shadow-sm"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          name="institutionName"
          placeholder="Institution Name *"
          value={formData.institutionName}
          onChange={handleChange}
          required
          className="border p-2 rounded"
        />

        <input
          name="degreeType"
          placeholder="Degree Type (e.g. Bachelor's)"
          value={formData.degreeType}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <input
          name="major"
          placeholder="Field of Study / Major"
          value={formData.major}
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
          name="graduationDate"
          value={formData.graduationDate}
          onChange={handleChange}
          className="border p-2 rounded"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {editingId ? "Update Education" : "Save Education"}
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
