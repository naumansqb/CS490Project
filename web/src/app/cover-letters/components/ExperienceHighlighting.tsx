"use client";

import { useState, useEffect } from "react";
import { Target, TrendingUp, Lightbulb, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface Experience {
  index: number;
  relevanceScore: number;
  keyStrengths: string[];
  quantifiableAchievements?: string[];
  connectionToJob: string;
  presentationSuggestion: string;
}

interface ExperienceAnalysis {
  experiences: Experience[];
  top3Experiences: number[];
  missingExperiences?: string[];
  alternativeAngles?: string[];
  overallRecommendation: string;
}

interface ExperienceHighlightingProps {
  userId: string;
  jobId: string;
  onExperiencesSelected?: (selectedIndices: number[], analysis: ExperienceAnalysis) => void;
}

export default function ExperienceHighlighting({
  userId,
  jobId,
  onExperiencesSelected,
}: ExperienceHighlightingProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ExperienceAnalysis | null>(null);
  const [selectedExperiences, setSelectedExperiences] = useState<Set<number>>(new Set());
  const [expandedExperience, setExpandedExperience] = useState<number | null>(null);

  // Fetch experience analysis on mount
  useEffect(() => {
    if (userId && jobId) {
      fetchAnalysis();
    }
  }, [userId, jobId]);

  async function fetchAnalysis() {
    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/ai/experience-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, jobId }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze experiences");
      }

      const data = await response.json();
      setAnalysis(data.data);

      // Pre-select top 3 experiences
      if (data.data.top3Experiences && data.data.top3Experiences.length > 0) {
        setSelectedExperiences(new Set(data.data.top3Experiences));
      }
    } catch (err: any) {
      console.error("Experience analysis error:", err);
      setError(err.message || "Failed to analyze experiences");
    } finally {
      setLoading(false);
    }
  }

  function toggleExperience(index: number) {
    const newSelected = new Set(selectedExperiences);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedExperiences(newSelected);

    // Notify parent
    if (onExperiencesSelected && analysis) {
      onExperiencesSelected(Array.from(newSelected), analysis);
    }
  }

  function getScoreColor(score: number): string {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    if (score >= 40) return "text-orange-600 bg-orange-100";
    return "text-red-600 bg-red-100";
  }

  function getScoreLabel(score: number): string {
    if (score >= 80) return "Highly Relevant";
    if (score >= 60) return "Relevant";
    if (score >= 40) return "Somewhat Relevant";
    return "Less Relevant";
  }

  if (loading) {
    return (
      <div className="border rounded-lg p-6 bg-white shadow-sm">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[#3BAFBA] mr-2" />
          <span className="text-gray-600">Analyzing your experiences...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border rounded-lg p-6 bg-white shadow-sm">
        <div className="flex items-center gap-2 text-red-600 mb-2">
          <AlertCircle className="w-5 h-5" />
          <h3 className="font-semibold">Analysis Error</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchAnalysis}
          className="px-4 py-2 bg-[#3BAFBA] hover:bg-[#2d9ba5] text-white rounded transition-colors text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-5 h-5 text-[#3BAFBA]" />
          <h2 className="text-lg font-semibold">Experience Highlighting</h2>
        </div>
        <p className="text-sm text-gray-600">
          Select the most relevant experiences to emphasize in your cover letter
        </p>
      </div>

      {/* Overall Recommendation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-blue-900 mb-1">Overall Strategy</h3>
            <p className="text-sm text-blue-800">{analysis.overallRecommendation}</p>
          </div>
        </div>
      </div>

      {/* Experience Cards */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-900">Your Experiences</h3>
        {analysis.experiences.map((exp) => {
          const isSelected = selectedExperiences.has(exp.index);
          const isExpanded = expandedExperience === exp.index;
          const isTopExperience = analysis.top3Experiences.includes(exp.index);

          return (
            <div
              key={exp.index}
              className={`border rounded-lg p-4 transition-all ${isSelected
                  ? "border-[#3BAFBA] bg-[#3BAFBA]/5"
                  : "border-gray-200 hover:border-gray-300"
                }`}
            >
              {/* Experience Header */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleExperience(exp.index)}
                  className="mt-1 w-4 h-4 text-[#3BAFBA] border-gray-300 rounded focus:ring-[#3BAFBA]"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        Experience #{exp.index}
                      </span>
                      {isTopExperience && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                          Top Pick
                        </span>
                      )}
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getScoreColor(
                        exp.relevanceScore
                      )}`}
                    >
                      {exp.relevanceScore}% • {getScoreLabel(exp.relevanceScore)}
                    </div>
                  </div>

                  {/* Connection to Job */}
                  <p className="text-sm text-gray-700 mb-2">{exp.connectionToJob}</p>

                  {/* Key Strengths */}
                  {exp.keyStrengths && exp.keyStrengths.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {exp.keyStrengths.map((strength, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs"
                        >
                          {strength}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Toggle Details */}
                  <button
                    onClick={() =>
                      setExpandedExperience(isExpanded ? null : exp.index)
                    }
                    className="text-sm text-[#3BAFBA] hover:text-[#2d9ba5] font-medium"
                  >
                    {isExpanded ? "Hide Details" : "Show Details"}
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
                      {/* Presentation Suggestion */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">
                          How to Present This
                        </h4>
                        <p className="text-sm text-gray-600">
                          {exp.presentationSuggestion}
                        </p>
                      </div>

                      {/* Quantifiable Achievements */}
                      {exp.quantifiableAchievements &&
                        exp.quantifiableAchievements.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-1 flex items-center gap-1">
                              <TrendingUp className="w-4 h-4" />
                              Suggested Metrics
                            </h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {exp.quantifiableAchievements.map((achievement, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-[#3BAFBA] mt-1">•</span>
                                  <span>{achievement}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alternative Angles */}
      {analysis.alternativeAngles && analysis.alternativeAngles.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-medium text-purple-900 mb-2">
            Alternative Presentation Angles
          </h3>
          <ul className="text-sm text-purple-800 space-y-1">
            {analysis.alternativeAngles.map((angle, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">•</span>
                <span>{angle}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing Experiences */}
      {analysis.missingExperiences && analysis.missingExperiences.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="font-medium text-orange-900 mb-2">
            Consider Adding These Experiences
          </h3>
          <ul className="text-sm text-orange-800 space-y-1">
            {analysis.missingExperiences.map((missing, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">•</span>
                <span>{missing}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Selection Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#3BAFBA]" />
            <span className="font-medium text-gray-900">
              {selectedExperiences.size} experience{selectedExperiences.size !== 1 ? "s" : ""} selected
            </span>
          </div>
          {selectedExperiences.size > 0 && (
            <span className="text-sm text-gray-600">
              These will be emphasized in your cover letter
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
