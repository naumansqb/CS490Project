"use client";

import { useEffect, useState } from "react";
import { getEducationsByUserId } from "@/lib/educationHistory.api";
import { useAuth } from "@/contexts/AuthContext";

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

  return (
    <div className="mt-8 space-y-6">
      <h2 className="text-2xl font-bold mb-4">Education Timeline</h2>

      {educations.length === 0 ? (
        <p className="text-gray-500 italic">No education history found.</p>
      ) : (
        <div className="relative border-l border-gray-300 mt-6">
          {educations.map((edu) => (
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
                    <>Graduated {new Date(edu.graduationDate).toLocaleDateString()}</>
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
