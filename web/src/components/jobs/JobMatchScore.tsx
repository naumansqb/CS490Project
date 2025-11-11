import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Target, 
  AlertCircle, 
  CheckCircle2, 
  Lightbulb,
  BarChart3,
  XCircle,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

// Type definitions matching the backend schema
export interface JobMatchScoreData {
  overallMatchScore: number; // 0-100
  categoryScores: {
    skills: number; // 0-100
    experience: number; // 0-100
    education: number; // 0-100
    requirements: number; // 0-100
  };
  strengths: Array<{
    category: string;
    description: string;
    evidence: string[];
  }>;
  gaps: Array<{
    category: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    suggestions: string[];
  }>;
  improvementSuggestions: Array<{
    type: 'skill' | 'experience' | 'education';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  matchedSkills: Array<{
    skillName: string;
    relevance: number; // 0-100
  }>;
  missingSkills: Array<{
    skillName: string;
    importance: number; // 0-100
  }>;
}

export interface JobMatchWeights {
  skills: number;
  experience: number;
  education: number;
  requirements: number;
  customCriteria?: Record<string, number>;
}

interface JobMatchScoreProps {
  jobId: string;
  jobTitle?: string;
  companyName?: string;
  matchData?: JobMatchScoreData | null;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  analysisDate?: string | null;
  weightsUsed?: JobMatchWeights | null;
  isCached?: boolean;
}

// Progress component (since it might not exist in ui folder)
const ProgressBar: React.FC<{ value: number; className?: string }> = ({ value, className = '' }) => {
  const getColor = (val: number) => {
    if (val >= 80) return 'bg-green-500';
    if (val >= 60) return 'bg-yellow-500';
    if (val >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className={`w-full bg-gray-200 rounded-full h-2.5 ${className}`}>
      <div
        className={`h-2.5 rounded-full transition-all duration-500 ${getColor(value)}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
};

export default function JobMatchScore({
  jobId,
  jobTitle,
  companyName,
  matchData,
  loading = false,
  error = null,
  onRefresh,
  analysisDate,
  weightsUsed,
  isCached = false,
}: JobMatchScoreProps) {
  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 size={20} />
            Job Match Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3bafba]"></div>
            <span className="ml-3 text-gray-600">Analyzing job match...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 size={20} />
            Job Match Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-red-600">
            <AlertCircle className="mx-auto mb-2" size={24} />
            <p>Failed to load match analysis: {error}</p>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="mt-4 text-blue-600 hover:underline"
              >
                Try again
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!matchData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 size={20} />
            Job Match Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            <Target className="mx-auto mb-2" size={32} />
            <p>No match analysis available yet.</p>
            <p className="text-sm mt-1">Click "Analyze Match" to get started.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 border-green-300';
    if (score >= 60) return 'bg-yellow-100 border-yellow-300';
    if (score >= 40) return 'bg-orange-100 border-orange-300';
    return 'bg-red-100 border-red-300';
  };

  const getImpactBadgeColor = (impact: 'high' | 'medium' | 'low') => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityBadgeColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: 'skill' | 'experience' | 'education') => {
    switch (type) {
      case 'skill':
        return '🛠️';
      case 'experience':
        return '💼';
      case 'education':
        return '🎓';
      default:
        return '📝';
    }
  };

  const weightBreakdown = useMemo(() => {
    if (!weightsUsed) return null;

    const total =
      weightsUsed.skills +
      weightsUsed.experience +
      weightsUsed.education +
      weightsUsed.requirements +
      Object.values(weightsUsed.customCriteria ?? {}).reduce(
        (sum, value) => sum + value,
        0
      );

    if (!total || total <= 0) return null;

    const toPercent = (value: number) =>
      Math.round(((value / total) * 100 + Number.EPSILON) * 10) / 10;

    const breakdown: Array<{ label: string; value: number }> = [
      { label: "Skills", value: toPercent(weightsUsed.skills) },
      { label: "Experience", value: toPercent(weightsUsed.experience) },
      { label: "Education", value: toPercent(weightsUsed.education) },
      { label: "Requirements", value: toPercent(weightsUsed.requirements) },
    ];

    if (weightsUsed.customCriteria) {
      Object.entries(weightsUsed.customCriteria)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([label, weightValue]) => {
          breakdown.push({
            label,
            value: toPercent(weightValue),
          });
        });
    }

    return breakdown;
  }, [weightsUsed]);

  const formattedAnalysisDate = useMemo(() => {
    if (!analysisDate) return null;
    const date = new Date(analysisDate);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleString();
  }, [analysisDate]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 size={20} />
            Job Match Analysis
          </CardTitle>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-sm text-blue-600 hover:underline"
            >
              Refresh
            </button>
          )}
        </div>
        {(jobTitle || companyName || formattedAnalysisDate || isCached) && (
          <div className="mt-2 space-y-1 text-sm text-gray-600">
            {(jobTitle || companyName) && (
              <p>
                {jobTitle && <span>{jobTitle}</span>}
                {jobTitle && companyName && <span> at </span>}
                {companyName && <span className="font-medium">{companyName}</span>}
              </p>
            )}
            {(formattedAnalysisDate || isCached) && (
              <p className="text-xs text-gray-500">
                {formattedAnalysisDate
                  ? `Last analyzed ${formattedAnalysisDate}`
                  : "Analysis date unavailable"}
                {isCached && <span className="ml-1 text-blue-500">(cached result)</span>}
              </p>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Match Score */}
        <div className="text-center py-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Target size={24} className="text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Overall Match Score</span>
          </div>
          <div className={`text-5xl font-bold ${getScoreColor(matchData.overallMatchScore)}`}>
            {matchData.overallMatchScore}%
          </div>
          <ProgressBar value={matchData.overallMatchScore} className="mt-4 max-w-md mx-auto" />
          <p className="text-xs text-gray-600 mt-2">
            {matchData.overallMatchScore >= 80 && "Excellent match! You're a strong candidate."}
            {matchData.overallMatchScore >= 60 && matchData.overallMatchScore < 80 && "Good match with some areas to improve."}
            {matchData.overallMatchScore >= 40 && matchData.overallMatchScore < 60 && "Moderate match. Consider addressing gaps."}
            {matchData.overallMatchScore < 40 && "Weak match. Significant improvements needed."}
          </p>
          {weightBreakdown && (
            <div className="mt-4 text-xs text-gray-500 space-y-1">
              <p className="uppercase tracking-wide text-gray-500">
                Weighting mix
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {weightBreakdown.map((entry) => (
                  <span
                    key={entry.label}
                    className="px-2 py-1 bg-white/70 border border-blue-200 rounded-full text-gray-600"
                  >
                    {entry.label}: {entry.value.toFixed(1)}%
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Category Scores */}
        <div>
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-gray-400" />
            Category Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(matchData.categoryScores).map(([category, score]) => (
              <div
                key={category}
                className={`p-4 rounded-lg border-2 ${getScoreBgColor(score)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700 capitalize">
                    {category}
                  </span>
                  <span className={`text-lg font-bold ${getScoreColor(score)}`}>
                    {score}%
                  </span>
                </div>
                <ProgressBar value={score} />
              </div>
            ))}
          </div>
        </div>

        {/* Strengths */}
        {matchData.strengths && matchData.strengths.length > 0 && (
          <div>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-green-600" />
              Strengths
            </h3>
            <div className="space-y-4">
              {matchData.strengths.slice(0, 3).map((strength, index) => (
                <div key={index} className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 size={20} className="text-green-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                          {strength.category}
                        </Badge>
                      </div>
                      <p className="text-gray-700 mb-2">{strength.description}</p>
                      {strength.evidence && strength.evidence.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-600 mb-1">Evidence:</p>
                          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                            {strength.evidence.map((evidence, idx) => (
                              <li key={idx}>{evidence}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gaps */}
        {matchData.gaps && matchData.gaps.length > 0 && (
          <div>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <AlertCircle size={18} className="text-red-600" />
              Areas for Improvement
            </h3>
            <div className="space-y-4">
              {matchData.gaps.map((gap, index) => (
                <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                          {gap.category}
                        </Badge>
                        <Badge className={getImpactBadgeColor(gap.impact)}>
                          {gap.impact} impact
                        </Badge>
                      </div>
                      <p className="text-gray-700 mb-2">{gap.description}</p>
                      {gap.suggestions && gap.suggestions.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-600 mb-1">Suggestions:</p>
                          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                            {gap.suggestions.map((suggestion, idx) => (
                              <li key={idx}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Improvement Suggestions */}
        {matchData.improvementSuggestions && matchData.improvementSuggestions.length > 0 && (
          <div>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Lightbulb size={18} className="text-yellow-600" />
              Improvement Suggestions
            </h3>
            <div className="space-y-3">
              {matchData.improvementSuggestions.slice(0, 3).map((suggestion, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">{getTypeIcon(suggestion.type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">{suggestion.title}</span>
                        <Badge className={getPriorityBadgeColor(suggestion.priority)}>
                          {suggestion.priority} priority
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {suggestion.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700">{suggestion.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Matched Skills */}
        {matchData.matchedSkills && matchData.matchedSkills.length > 0 && (
          <div>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-green-600" />
              Matched Skills ({matchData.matchedSkills.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {matchData.matchedSkills
                .sort((a, b) => b.relevance - a.relevance)
                .map((skill, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-full border border-green-300"
                  >
                    <span className="font-medium">{skill.skillName}</span>
                    <span className="text-xs font-semibold">({skill.relevance}%)</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Missing Skills */}
        {matchData.missingSkills && matchData.missingSkills.length > 0 && (
          <div>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <XCircle size={18} className="text-red-600" />
              Missing Skills ({matchData.missingSkills.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {matchData.missingSkills
                .sort((a, b) => b.importance - a.importance)
                .slice(0, 15) // Show top 15
                .map((skill, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-800 rounded-full border border-red-300"
                  >
                    <span className="font-medium">{skill.skillName}</span>
                    <span className="text-xs font-semibold">({skill.importance}%)</span>
                  </div>
                ))}
            </div>
            {matchData.missingSkills.length > 15 && (
              <p className="text-sm text-gray-600 mt-2">
                and {matchData.missingSkills.length - 15} more...
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

