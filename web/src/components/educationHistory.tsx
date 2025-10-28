"use client";

import { useEffect, useState } from "react";
import {
  createEducation,
  getEducationsByUserId,
  deleteEducation,
  updateEducation,
} from "@/lib/educationHistory.api";
import { useAuth } from "@/contexts/AuthContext";

type Education = {
  id?: string;
  institutionName: string;
  degreeType: string;
  fieldOfStudy: string;
  graduationDate: string;
  gpa?: number | string;
  showGpa?: boolean;
  isCurrent?: boolean;
  educationLevel: string;
  honors?: string;
};

const EDUCATION_LEVELS = [
  "High School",
  "Associate",
  "Bachelor's",
  "Master's",
  "PhD",
  "Other",
];

export default function EducationHistory() {
  const { user } = useAuth();
  const [educations, setEducations] = useState<Education[]>([]);
  const [formData, setFormData] = useState<Education>({
    institutionName: "",
    degreeType: "",
    fieldOfStudy: "",
    graduationDate: "",
    gpa: "",
    showGpa: false,
    isCurrent: false,
    educationLevel: "Bachelor's",
    honors: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.uid) loadEducations();
  }, [user]);

  const loadEducations = async () => {
    if (!user || !user.uid) return; // ✅ null check first
  
    try {
        const data = await getEducationsByUserId(user.uid) as Education[];
        setEducations(data);        
    } catch (error) {
      console.error("Failed to load educations:", error);
    }
  };
  

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

    if (!formData.institutionName || !formData.degreeType || !formData.fieldOfStudy) {
      alert("Please fill in all required fields.");
      return;
    }

    if (editingId) {
      await updateEducation(editingId, formData);
      setEditingId(null);
    } else {
      await createEducation(formData);
    }

    resetForm();
    loadEducations();
  };

  const handleEdit = (edu: Education) => {
    setEditingId(edu.id!);
    setFormData(edu);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      await deleteEducation(id);
      loadEducations();
    }
  };

  const resetForm = () => {
    setFormData({
      institutionName: "",
      degreeType: "",
      fieldOfStudy: "",
      graduationDate: "",
      gpa: "",
      showGpa: false,
      isCurrent: false,
      educationLevel: "Bachelor's",
      honors: "",
    });
  };

  const handleCancel = () => {
    resetForm();
    setEditingId(null);
  };

  return (
    <div className="mt-8 space-y-6">
      <h2 className="text-2xl font-bold">Education History</h2>

      {/* FORM */}
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
            className="border p-2 rounded w-full"
            disabled={formData.isCurrent}
          />
          <div className="flex items-center gap-2">
            <input
              type="number"
              name="gpa"
              placeholder="GPA (optional)"
              step="0.01"
              value={formData.gpa ?? ""}
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
            onClick={handleCancel}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* LIST */}
      <ul className="space-y-3">
        {educations.map((edu) => (
          <li
            key={edu.id}
            className="border p-4 rounded bg-gray-50 flex justify-between items-center"
          >
            <div>
              <h3 className="font-semibold text-lg">{edu.institutionName}</h3>
              <p className="text-sm text-gray-700">
                {edu.degreeType} — {edu.fieldOfStudy}
              </p>
              <p className="text-xs text-gray-500">{edu.educationLevel}</p>

              {edu.isCurrent ? (
                <p className="text-xs text-green-600 mt-1">
                  Currently Enrolled
                </p>
              ) : (
                edu.graduationDate && (
                  <p className="text-xs text-gray-500 mt-1">
                    Graduated {new Date(edu.graduationDate).toLocaleDateString()}
                  </p>
                )
              )}

              {edu.showGpa && edu.gpa && (
                <p className="text-xs text-gray-500 mt-1">GPA: {edu.gpa}</p>
              )}

              {edu.honors && (
                <p className="text-xs text-gray-600 mt-1 italic">
                  Honors: {edu.honors}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleEdit(edu)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(edu.id!)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
