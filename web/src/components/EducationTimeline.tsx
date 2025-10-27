"use client";

import { useEffect, useState } from "react";
import {
  getEducationsByUserId,
  updateEducation,
  deleteEducation,
} from "@/lib/educationHistory.api";
import { useAuth } from "@/contexts/AuthContext";
import AddEducationForm from "@/components/addEducationForm";

export type Education = {
  id: string;
  institutionName: string;
  degreeType: string;
  fieldOfStudy: string;
  graduationDate?: string;
  gpa?: number | string;
  showGpa?: boolean;
  isCurrent?: boolean;
  educationLevel: string;
  honors?: string;
  startDate?: string;
};

export default function EducationTimeline() {
  const { user } = useAuth();
  const [educations, setEducations] = useState<Education[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<Education>>({});

  useEffect(() => {
    if (user?.uid) loadEducations();
  }, [user]);

  const loadEducations = async () => {
    if (!user?.uid) return;
    const data = (await getEducationsByUserId(user.uid)) as Education[];
const sorted = [...data].sort((a, b) => {
  const dateA = a.graduationDate || a.startDate || "";
  const dateB = b.graduationDate || b.startDate || "";
  return dateB.localeCompare(dateA);
});
setEducations(sorted);

  };

  const handleEdit = (edu: Education) => {
    setEditingId(edu.id);
    setEditingData(edu);
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    await updateEducation(editingId, editingData);
    setEditingId(null);
    setEditingData({});
    loadEducations();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      await deleteEducation(id);
      loadEducations();
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData({});
  };

  return (
    <div className="mt-8 space-y-6">
      <h2 className="text-2xl font-bold mb-4">Education Timeline</h2>

      {/* Add Form */}
      <AddEducationForm onSuccess={loadEducations} />

      {/* Timeline View */}
      <div className="relative border-l border-gray-300 mt-6">
        {educations.map((edu, index) => (
          <div key={edu.id} className="mb-8 ml-4">
            {/* Timeline node */}
            <div className="absolute w-3 h-3 bg-blue-600 rounded-full -left-1.5 mt-2" />

            <div
              className={`p-4 rounded-lg shadow-sm border ${
                edu.isCurrent
                  ? "bg-green-50 border-green-300"
                  : "bg-white border-gray-200"
              }`}
            >
              {editingId === edu.id ? (
                <>
                  {/* Inline Edit */}
                  <input
                    className="border p-2 w-full mb-2 rounded"
                    value={editingData.institutionName ?? ""}
                    onChange={(e) =>
                      setEditingData({
                        ...editingData,
                        institutionName: e.target.value,
                      })
                    }
                  />
                  <input
                    className="border p-2 w-full mb-2 rounded"
                    value={editingData.degreeType ?? ""}
                    onChange={(e) =>
                      setEditingData({
                        ...editingData,
                        degreeType: e.target.value,
                      })
                    }
                  />
                  <input
                    className="border p-2 w-full mb-2 rounded"
                    value={editingData.fieldOfStudy ?? ""}
                    onChange={(e) =>
                      setEditingData({
                        ...editingData,
                        fieldOfStudy: e.target.value,
                      })
                    }
                  />
                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={handleUpdate}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Display Entry */}
                  <h3 className="text-lg font-semibold text-gray-800">
                    {edu.degreeType} — {edu.institutionName}
                  </h3>
                  <p className="text-sm text-gray-700 mb-1">
                    {edu.fieldOfStudy}
                  </p>

                  <div className="text-xs text-gray-500">
                    {edu.isCurrent ? (
                      <span className="text-green-600">Currently Enrolled</span>
                    ) : edu.graduationDate ? (
                      <>
                        Graduated{" "}
                        {new Date(edu.graduationDate).toLocaleDateString()}
                      </>
                    ) : null}
                  </div>

                  {edu.showGpa && edu.gpa && (
                    <p className="text-xs mt-1 text-gray-600">
                      GPA: {edu.gpa}
                    </p>
                  )}

                  {edu.honors && (
                    <p className="mt-1 text-xs font-semibold text-amber-700 italic">
                      Honors: {edu.honors}
                    </p>
                  )}

                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => handleEdit(edu)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(edu.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
