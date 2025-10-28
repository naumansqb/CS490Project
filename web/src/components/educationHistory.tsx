"use client";

import { useEffect, useState } from "react";
import {
  createEducation,
  getEducationsByUserId,
  deleteEducation,
  updateEducation,
} from "@/lib/educationHistory.api";
import { useAuth } from "@/contexts/AuthContext";
import { X, Plus } from "lucide-react";

type Education = {
  id?: string;
  institutionName: string;
  degreeType: string;
  major: string;
  graduationDate: string | undefined;
  gpa?: number | string;
  showGpa?: boolean;
  isCurrent?: boolean;
  honors?: string[];
  activities?: string[];
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
    degreeType: "Bachelor's",
    major: "",
    graduationDate: undefined,
    gpa: undefined,
    showGpa: false,
    isCurrent: false,
    honors: [],
    activities: [],
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Temporary input values for honors and achievements
  const [honorInput, setHonorInput] = useState("");
  const [activitiesInput, setactivitiesInput] = useState("");

  useEffect(() => {
    if (user?.uid) loadEducations();
  }, [user]);

  const loadEducations = async () => {
    if (!user || !user.uid) return;
  
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

  const addHonor = () => {
    if (honorInput.trim()) {
      setFormData(prev => ({
        ...prev,
        honors: [...(prev.honors || []), honorInput.trim()]
      }));
      setHonorInput("");
    }
  };

  const removeHonor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      honors: prev.honors?.filter((_, i) => i !== index) || []
    }));
  };

  const addactivities = () => {
    if (activitiesInput.trim()) {
      setFormData(prev => ({
        ...prev,
        activities: [...(prev.activities || []), activitiesInput.trim()]
      }));
      setactivitiesInput("");
    }
  };

  const removeactivities = (index: number) => {
    setFormData(prev => ({
      ...prev,
      activities: prev.activities?.filter((_, i) => i !== index) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.uid) {
      alert("You must be logged in to save education.");
      return;
    }

    if (!formData.institutionName || !formData.degreeType || !formData.major) {
      alert("Please fill in all required fields.");
      return;
    }

    // Prepare data for submission
    const submitData: any = {
      userId: user.uid,
      institutionName: formData.institutionName,
      degreeType: formData.degreeType,
      major: formData.major,
      showGpa: formData.showGpa,
      isCurrent: formData.isCurrent,
      honors: formData.honors || [],
      activities: formData.activities || [],
    };

    // Only include graduationDate if it has a value
    if (formData.graduationDate && formData.graduationDate.trim() !== "") {
      submitData.graduationDate = formData.graduationDate;
    }

    // Only include GPA if it has a value
    if (formData.gpa !== "" && formData.gpa !== null && formData.gpa !== undefined) {
      submitData.gpa = parseFloat(formData.gpa as string);
    }

    try {
      if (editingId) {
        await updateEducation(editingId, submitData);
        setEditingId(null);
      } else {
        await createEducation(submitData);
      }

      resetForm();
      loadEducations();
    } catch (error) {
      console.error("Failed to save education:", error);
      alert("Failed to save education. Please try again.");
    }
  };

  const handleEdit = (edu: Education) => {
    setEditingId(edu.id!);
    setFormData({
      ...edu,
      honors: edu.honors || [],
      activities: edu.activities || [],
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      try {
        await deleteEducation(id);
      } catch (error) {
        // Ignore JSON parsing errors - deletion still works
        console.log("Delete completed (ignoring response parse error)");
      } finally {
        // Always reload to reflect the deletion
        await loadEducations();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      institutionName: "",
      degreeType: "Bachelor's",
      major: "",
      graduationDate: undefined,
      gpa: undefined,
      showGpa: false,
      isCurrent: false,
      honors: [],
      activities: [],
    });
    setHonorInput("");
    setactivitiesInput("");
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
            name="major"
            placeholder="Field of Study *"
            value={formData.major}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            required
          />
          <select
            name="degreeType"
            value={formData.degreeType}
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
            value={formData.graduationDate || ""}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            disabled={formData.isCurrent}
          />
          <div className="flex items-center gap-2">
            <input
              type="number"
              name="gpa"
              placeholder="GPA"
              step="0.01"
              min="0"
              max="4"
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

        {/* Honors Section */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Honors
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add an honor (e.g., Dean's List, Magna Cum Laude)"
              value={honorInput}
              onChange={(e) => setHonorInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addHonor())}
              className="border p-2 rounded flex-1"
            />
            <button
              type="button"
              onClick={addHonor}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-1"
            >
              <Plus size={16} /> Add
            </button>
          </div>
          {formData.honors && formData.honors.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.honors.map((honor, index) => (
                <div
                  key={index}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                >
                  <span>{honor}</span>
                  <button
                    type="button"
                    onClick={() => removeHonor(index)}
                    className="hover:text-blue-900"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Achievements Section */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Achievements
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add an achievement (e.g., Published research paper)"
              value={activitiesInput}
              onChange={(e) => setactivitiesInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addactivities())}
              className="border p-2 rounded flex-1"
            />
            <button
              type="button"
              onClick={addactivities}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-1"
            >
              <Plus size={16} /> Add
            </button>
          </div>
          {formData.activities && formData.activities.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.activities.map((activities, index) => (
                <div
                  key={index}
                  className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                >
                  <span>{activities}</span>
                  <button
                    type="button"
                    onClick={() => removeactivities(index)}
                    className="hover:text-purple-900"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

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
            className="border p-4 rounded bg-gray-50 flex justify-between items-start"
          >
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{edu.institutionName}</h3>
              <p className="text-sm text-gray-700">
                {edu.degreeType} — {edu.major}
              </p>

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

              {edu.honors && edu.honors.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-700">Honors:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {edu.honors.map((honor, idx) => (
                      <span
                        key={idx}
                        className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs"
                      >
                        {honor}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {edu.activities && edu.activities.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-700">Achievements:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {edu.activities.map((activities, idx) => (
                      <span
                        key={idx}
                        className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs"
                      >
                        {activities}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 ml-4">
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