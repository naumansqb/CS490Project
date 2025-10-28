"use client";

import { useState } from "react";
import { createEducation, updateEducation } from "@/lib/educationHistory.api";

type EducationFormProps = {
  onSuccess?: () => void;          // refresh parent after save
  editingId?: string | null;       // if editing existing entry
  defaultValues?: any;             // prefill for edit mode
  onCancel?: () => void;           // cancel callback
};

const EDUCATION_LEVELS = [
  "High School",
  "Associate",
  "Bachelor's",
  "Master's",
  "PhD",
  "Other",
];

export default function AddEducationForm({
  onSuccess,
  editingId,
  defaultValues,
  onCancel,
}: EducationFormProps) {
  const [formData, setFormData] = useState({
    institutionName: defaultValues?.institutionName || "",
    degreeType: defaultValues?.degreeType || "",
    fieldOfStudy: defaultValues?.fieldOfStudy || "",
    educationLevel: defaultValues?.educationLevel || "Bachelor's",
    graduationDate: defaultValues?.graduationDate || "",
    gpa: defaultValues?.gpa || "",
    showGpa: defaultValues?.showGpa || false,
    isCurrent: defaultValues?.isCurrent || false,
    honors: defaultValues?.honors || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const target = e.currentTarget;
    const value =
      target instanceof HTMLInputElement && target.type === "checkbox"
        ? target.checked
        : target.value;
  
    setFormData((prev) => ({
      ...prev,
      [target.name]: value,
    }));
  };
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // basic required field validation
    if (
      !formData.institutionName ||
      !formData.degreeType ||
      !formData.fieldOfStudy
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    if (editingId) {
      await updateEducation(editingId, formData);
    } else {
      await createEducation(formData);
    }

    onSuccess?.();
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      institutionName: "",
      degreeType: "",
      fieldOfStudy: "",
      educationLevel: "Bachelor's",
      graduationDate: "",
      gpa: "",
      showGpa: false,
      isCurrent: false,
      honors: "",
    });
    onCancel?.();
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
          className="border p-2 rounded w-full"
          required
        />
        <input
          name="degreeType"
          placeholder="Degree Type *"
          value={formData.degreeType}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          required
        />
        <input
          name="fieldOfStudy"
          placeholder="Field of Study *"
          value={formData.fieldOfStudy}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          required
        />
        <select
          name="educationLevel"
          value={formData.educationLevel}
          onChange={handleChange}
          className="border p-2 rounded w-full"
        >
          {EDUCATION_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>

        <input
          type="date"
          name="graduationDate"
          value={formData.graduationDate}
          onChange={handleChange}
          disabled={formData.isCurrent}
          className="border p-2 rounded w-full"
        />

        <div className="flex items-center gap-2">
          <input
            type="number"
            name="gpa"
            placeholder="GPA (optional)"
            step="0.01"
            value={formData.gpa}
            onChange={handleChange}
            className="border p-2 rounded w-24"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="showGpa"
              checked={formData.showGpa}
              onChange={handleChange}
            />
            Show GPA
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isCurrent"
              checked={formData.isCurrent}
              onChange={handleChange}
            />
            Currently Enrolled
          </label>
        </div>
      </div>

      <textarea
        name="honors"
        placeholder="Achievements / Honors"
        value={formData.honors}
        onChange={handleChange}
        className="border p-2 rounded w-full"
        rows={2}
      />

      <div className="flex gap-3">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {editingId ? "Update Education" : "Save Education"}
        </button>
        <button
          type="button"
          onClick={resetForm}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
