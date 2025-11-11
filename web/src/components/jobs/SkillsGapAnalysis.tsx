import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  BookOpen,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Video,
  FileText,
  Award,
  Book,
  Link as LinkIcon,
  ArrowRight,
  Target,
  BarChart3,
  TrendingDown
} from 'lucide-react';
import { getSkillsGapProgress, SkillsGapProgressData } from '@/lib/company.api';

// Type definitions matching the backend schema
export interface SkillsGapData {
  matchedSkills: Array<{
    skillName: string;
    userProficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    jobRequirement: 'required' | 'preferred' | 'nice-to-have';
    matchStrength: 'strong' | 'moderate' | 'weak';
  }>;
  missingSkills: Array<{
    skillName: string;
    importance: 'critical' | 'important' | 'nice-to-have';
    impact: number; // 0-100
    estimatedLearningTime: string;
  }>;
  weakSkills: Array<{
    skillName: string;
    currentProficiency: string;
    recommendedProficiency: string;
    improvementPriority: 'high' | 'medium' | 'low';
  }>;
  learningResources: Array<{
    skillName: string;
    resources: Array<{
      title: string;
      type: 'course' | 'tutorial' | 'certification' | 'book' | 'article';
      provider: string;
      url?: string;
      estimatedTime: string;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
      cost: 'free' | 'paid' | 'freemium';
    }>;
  }>;
  prioritizedLearningPath: Array<{
    skillName: string;
    priority: number;
    reason: string;
    estimatedTime: string;
  }>;
  overallGapScore: number; // 0-100, lower = more gaps
}

interface SkillsGapAnalysisProps {
  jobId: string;
  jobTitle?: string;
  companyName?: string;
  gapData?: SkillsGapData | null;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

// Progress bar component
const ProgressBar: React.FC<{ value: number; className?: string }> = ({ value, className = '' }) => {
  const getColor = (val: number) => {
    if (val >= 70) return 'bg-green-500';
    if (val >= 50) return 'bg-yellow-500';
    if (val >= 30) return 'bg-orange-500';
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

export default function SkillsGapAnalysis({
  jobId,
  jobTitle,
  companyName,
  gapData,
  loading = false,
  error = null,
  onRefresh
}: SkillsGapAnalysisProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [progressData, setProgressData] = useState<SkillsGapProgressData | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);

  // Reset progress data when jobId changes
  useEffect(() => {
    setProgressData(null);
    setProgressError(null);
  }, [jobId]);

  // Load progress data when progress tab is selected
  useEffect(() => {
    if (activeTab === 'progress' && !progressData && !progressLoading && jobId) {
      loadProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, jobId]);

  const loadProgress = async () => {
    try {
      setProgressLoading(true);
      setProgressError(null);
      const response = await getSkillsGapProgress(jobId);
      if (response.success) {
        setProgressData(response.data);
      }
    } catch (err: any) {
      console.error('Failed to load progress:', err);
      setProgressError(err.message || 'Failed to load progress data');
    } finally {
      setProgressLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen size={20} />
            Skills Gap Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3bafba]"></div>
            <span className="ml-3 text-gray-600">Analyzing skills gap...</span>
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
            <BookOpen size={20} />
            Skills Gap Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-red-600">
            <AlertCircle className="mx-auto mb-2" size={24} />
            <p>Failed to load skills gap analysis: {error}</p>
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

  // Empty state - show button to trigger analysis
  if (!gapData && !loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen size={20} />
            Skills Gap Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Target className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-lg font-medium text-gray-700 mb-2">No skills gap analysis yet</p>
            <p className="text-sm mb-6">Analyze your skills against this job's requirements to identify gaps and get personalized learning recommendations.</p>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="px-6 py-3 bg-[#3bafba] hover:bg-[#34a0ab] text-white font-medium rounded-lg transition-colors flex items-center gap-2 mx-auto"
              >
                <BookOpen size={18} />
                Analyze Skills Gap
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Type guard: if we get here and gapData is still null, return null
  // (This should not happen, but TypeScript needs this check)
  if (!gapData) {
    return null;
  }

  const getImportanceBadgeColor = (importance: 'critical' | 'important' | 'nice-to-have') => {
    switch (importance) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'important':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'nice-to-have':
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

  const getMatchStrengthColor = (strength: 'strong' | 'moderate' | 'weak') => {
    switch (strength) {
      case 'strong':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'weak':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getResourceTypeIcon = (type: 'course' | 'tutorial' | 'certification' | 'book' | 'article') => {
    switch (type) {
      case 'course':
        return <GraduationCap size={16} className="text-blue-600" />;
      case 'tutorial':
        return <Video size={16} className="text-purple-600" />;
      case 'certification':
        return <Award size={16} className="text-yellow-600" />;
      case 'book':
        return <Book size={16} className="text-green-600" />;
      case 'article':
        return <FileText size={16} className="text-gray-600" />;
      default:
        return <LinkIcon size={16} className="text-gray-600" />;
    }
  };

  const getCostBadgeColor = (cost: 'free' | 'paid' | 'freemium') => {
    switch (cost) {
      case 'free':
        return 'bg-green-100 text-green-800';
      case 'paid':
        return 'bg-blue-100 text-blue-800';
      case 'freemium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyBadgeColor = (difficulty: 'beginner' | 'intermediate' | 'advanced') => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen size={20} />
            Skills Gap Analysis
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
        {(jobTitle || companyName) && (
          <p className="text-sm text-gray-600 mt-1">
            {jobTitle && <span>{jobTitle}</span>}
            {jobTitle && companyName && <span> at </span>}
            {companyName && <span className="font-medium">{companyName}</span>}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {/* Overall Gap Score */}
        <div className="mb-6 text-center py-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp size={20} className="text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Overall Gap Score</span>
          </div>
          <div className={`text-4xl font-bold ${gapData.overallGapScore >= 70 ? 'text-green-600' : gapData.overallGapScore >= 50 ? 'text-yellow-600' : gapData.overallGapScore >= 30 ? 'text-orange-600' : 'text-red-600'}`}>
            {gapData.overallGapScore}%
          </div>
          <ProgressBar value={gapData.overallGapScore} className="mt-3 max-w-md mx-auto" />
          <p className="text-xs text-gray-600 mt-2">
            {gapData.overallGapScore >= 70 && "Minimal gaps - you're well prepared!"}
            {gapData.overallGapScore >= 50 && gapData.overallGapScore < 70 && "Small gaps - some skills to improve."}
            {gapData.overallGapScore >= 30 && gapData.overallGapScore < 50 && "Moderate gaps - focus on key skills."}
            {gapData.overallGapScore < 30 && "Large gaps - significant learning needed."}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="path">Learning Path</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-4">
            {/* Matched Skills Summary */}
            {gapData.matchedSkills && gapData.matchedSkills.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-green-600" />
                  Matched Skills ({gapData.matchedSkills.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {gapData.matchedSkills.slice(0, 6).map((skill, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-3 bg-green-50 border-green-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{skill.skillName}</span>
                        <Badge className={getMatchStrengthColor(skill.matchStrength)}>
                          {skill.matchStrength}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600">Your level: {skill.userProficiency}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600">Required: {skill.jobRequirement}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {gapData.matchedSkills.length > 6 && (
                  <p className="text-sm text-gray-600 mt-2">
                    and {gapData.matchedSkills.length - 6} more matched skills...
                  </p>
                )}
              </div>
            )}

            {/* Missing Skills Summary */}
            {gapData.missingSkills && gapData.missingSkills.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <AlertCircle size={18} className="text-red-600" />
                  Missing Skills ({gapData.missingSkills.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {gapData.missingSkills
                    .sort((a, b) => {
                      const importanceOrder = { critical: 3, important: 2, 'nice-to-have': 1 };
                      return importanceOrder[b.importance] - importanceOrder[a.importance];
                    })
                    .slice(0, 6)
                    .map((skill, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-3 bg-red-50 border-red-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{skill.skillName}</span>
                          <Badge className={getImportanceBadgeColor(skill.importance)}>
                            {skill.importance}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock size={14} className="text-gray-500" />
                          <span className="text-gray-600">{skill.estimatedLearningTime}</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-600">Impact: {skill.impact}%</span>
                        </div>
                      </div>
                    ))}
                </div>
                {gapData.missingSkills.length > 6 && (
                  <p className="text-sm text-gray-600 mt-2">
                    and {gapData.missingSkills.length - 6} more missing skills...
                  </p>
                )}
              </div>
            )}

            {/* Weak Skills Summary */}
            {gapData.weakSkills && gapData.weakSkills.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <AlertCircle size={18} className="text-yellow-600" />
                  Skills to Improve ({gapData.weakSkills.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {gapData.weakSkills
                    .sort((a, b) => {
                      const priorityOrder = { high: 3, medium: 2, low: 1 };
                      return priorityOrder[b.improvementPriority] - priorityOrder[a.improvementPriority];
                    })
                    .slice(0, 6)
                    .map((skill, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-3 bg-yellow-50 border-yellow-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{skill.skillName}</span>
                          <Badge className={getPriorityBadgeColor(skill.improvementPriority)}>
                            {skill.improvementPriority}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span>Current: {skill.currentProficiency}</span>
                          <ArrowRight size={12} className="inline mx-2" />
                          <span>Target: {skill.recommendedProficiency}</span>
                        </div>
                      </div>
                    ))}
                </div>
                {gapData.weakSkills.length > 6 && (
                  <p className="text-sm text-gray-600 mt-2">
                    and {gapData.weakSkills.length - 6} more skills to improve...
                  </p>
                )}
              </div>
            )}
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills" className="space-y-6 mt-4">
            {/* Matched Skills */}
            {gapData.matchedSkills && gapData.matchedSkills.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-green-600" />
                  Matched Skills
                </h3>
                <div className="space-y-3">
                  {gapData.matchedSkills.map((skill, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 bg-green-50 border-green-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{skill.skillName}</span>
                        <Badge className={getMatchStrengthColor(skill.matchStrength)}>
                          {skill.matchStrength} match
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Your Proficiency: </span>
                          <span className="font-medium">{skill.userProficiency}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Job Requirement: </span>
                          <span className="font-medium">{skill.jobRequirement}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Skills */}
            {gapData.missingSkills && gapData.missingSkills.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <AlertCircle size={18} className="text-red-600" />
                  Missing Skills
                </h3>
                <div className="space-y-3">
                  {gapData.missingSkills
                    .sort((a, b) => {
                      const importanceOrder = { critical: 3, important: 2, 'nice-to-have': 1 };
                      return importanceOrder[b.importance] - importanceOrder[a.importance];
                    })
                    .map((skill, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 bg-red-50 border-red-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{skill.skillName}</span>
                          <Badge className={getImportanceBadgeColor(skill.importance)}>
                            {skill.importance}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Impact: </span>
                            <span className="font-medium">{skill.impact}%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-gray-500" />
                            <span className="text-gray-600">{skill.estimatedLearningTime}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Weak Skills */}
            {gapData.weakSkills && gapData.weakSkills.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <AlertCircle size={18} className="text-yellow-600" />
                  Skills to Improve
                </h3>
                <div className="space-y-3">
                  {gapData.weakSkills
                    .sort((a, b) => {
                      const priorityOrder = { high: 3, medium: 2, low: 1 };
                      return priorityOrder[b.improvementPriority] - priorityOrder[a.improvementPriority];
                    })
                    .map((skill, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 bg-yellow-50 border-yellow-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{skill.skillName}</span>
                          <Badge className={getPriorityBadgeColor(skill.improvementPriority)}>
                            {skill.improvementPriority} priority
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">Current: {skill.currentProficiency}</span>
                          <ArrowRight size={14} className="text-gray-400" />
                          <span className="text-gray-900 font-medium">Target: {skill.recommendedProficiency}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-6 mt-4">
            {gapData.learningResources && gapData.learningResources.length > 0 ? (
              gapData.learningResources.map((skillResources, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-4 text-gray-900">
                    Learning Resources for: {skillResources.skillName}
                  </h3>
                  <div className="space-y-3">
                    {skillResources.resources.map((resource, resIndex) => (
                      <div
                        key={resIndex}
                        className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="shrink-0 mt-1">
                            {getResourceTypeIcon(resource.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-gray-900">{resource.title}</h4>
                              <Badge className={getCostBadgeColor(resource.cost)}>
                                {resource.cost}
                              </Badge>
                              <Badge className={getDifficultyBadgeColor(resource.difficulty)}>
                                {resource.difficulty}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                              <span className="flex items-center gap-1">
                                <span className="font-medium">Provider:</span> {resource.provider}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock size={14} />
                                {resource.estimatedTime}
                              </span>
                            </div>
                            {resource.url && (
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                              >
                                <ExternalLink size={14} />
                                Visit Resource
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="mx-auto mb-2" size={32} />
                <p>No learning resources available yet.</p>
              </div>
            )}
          </TabsContent>

          {/* Learning Path Tab */}
          <TabsContent value="path" className="space-y-6 mt-4">
            {gapData.prioritizedLearningPath && gapData.prioritizedLearningPath.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Target size={18} className="text-blue-600" />
                  <h3 className="font-semibold text-lg">Prioritized Learning Path</h3>
                </div>
                {gapData.prioritizedLearningPath
                  .sort((a, b) => a.priority - b.priority)
                  .map((skill, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-blue-500 pl-4 py-3 bg-blue-50 rounded-r-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-bold text-sm">
                            {skill.priority}
                          </div>
                          <h4 className="font-semibold text-gray-900">{skill.skillName}</h4>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock size={14} />
                          <span>{skill.estimatedTime}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 ml-11">{skill.reason}</p>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Target className="mx-auto mb-2" size={32} />
                <p>No learning path available yet.</p>
              </div>
            )}
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6 mt-4">
            {progressLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3bafba]"></div>
                <span className="ml-3 text-gray-600">Loading progress data...</span>
              </div>
            ) : progressError ? (
              <div className="text-center py-4 text-red-600">
                <AlertCircle className="mx-auto mb-2" size={24} />
                <p>Failed to load progress: {progressError}</p>
                <button
                  onClick={loadProgress}
                  className="mt-4 text-blue-600 hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : progressData ? (
              <div className="space-y-6">
                {/* Progress Metrics */}
                {progressData.progressMetrics && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-200">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <BarChart3 size={20} className="text-green-600" />
                      Progress Overview
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Initial Score</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {progressData.progressMetrics.firstScore}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Current Score</p>
                        <p className="text-2xl font-bold text-green-600">
                          {progressData.progressMetrics.latestScore}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Improvement</p>
                        <p
                          className={`text-2xl font-bold ${
                            progressData.progressMetrics.scoreImprovement > 0
                              ? "text-green-600"
                              : progressData.progressMetrics.scoreImprovement < 0
                              ? "text-red-600"
                              : "text-gray-600"
                          }`}
                        >
                          {progressData.progressMetrics.scoreImprovement > 0 ? "+" : ""}
                          {progressData.progressMetrics.scoreImprovement}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Time Span</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {progressData.progressMetrics.timeSpanDays} days
                        </p>
                      </div>
                    </div>
                    {progressData.progressMetrics.scoreImprovement > 0 && (
                      <div className="mt-4 flex items-center gap-2 text-green-700">
                        <TrendingUp size={16} />
                        <span className="text-sm font-medium">
                          Great progress! Your gap score has improved by{" "}
                          {progressData.progressMetrics.scoreImprovement} points.
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Current Analysis */}
                {progressData.currentAnalysis && (
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Current Analysis</h3>
                    <div className="border rounded-lg p-4 bg-blue-50">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Gap Score</p>
                          <p className="text-xl font-bold text-blue-600">
                            {progressData.currentAnalysis.overallGapScore}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Matched Skills</p>
                          <p className="text-xl font-bold text-green-600">
                            {progressData.currentAnalysis.matchedSkillsCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Missing Skills</p>
                          <p className="text-xl font-bold text-red-600">
                            {progressData.currentAnalysis.missingSkillsCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Weak Skills</p>
                          <p className="text-xl font-bold text-yellow-600">
                            {progressData.currentAnalysis.weakSkillsCount}
                          </p>
                        </div>
                      </div>
                      {progressData.currentAnalysis.analysisDate && (
                        <p className="text-xs text-gray-500 mt-2">
                          Last updated:{" "}
                          {new Date(progressData.currentAnalysis.analysisDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* History Timeline */}
                {progressData.history && progressData.history.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Progress History</h3>
                    <div className="space-y-4">
                      {progressData.history.map((snapshot, index) => {
                        const isLatest = index === 0;
                        const prevSnapshot = progressData.history[index + 1];
                        const scoreChange = prevSnapshot
                          ? snapshot.overallGapScore - prevSnapshot.overallGapScore
                          : 0;

                        return (
                          <div
                            key={snapshot.id}
                            className={`border-l-4 ${
                              isLatest ? "border-blue-500" : "border-gray-300"
                            } pl-4 py-3 bg-gray-50 rounded-r-lg`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div
                                    className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${
                                      isLatest
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-300 text-gray-700"
                                    }`}
                                  >
                                    {snapshot.overallGapScore}%
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {new Date(snapshot.snapshotDate).toLocaleDateString()}
                                    </p>
                                    {scoreChange !== 0 && (
                                      <p
                                        className={`text-sm flex items-center gap-1 ${
                                          scoreChange > 0
                                            ? "text-green-600"
                                            : "text-red-600"
                                        }`}
                                      >
                                        {scoreChange > 0 ? (
                                          <TrendingUp size={14} />
                                        ) : (
                                          <TrendingDown size={14} />
                                        )}
                                        {scoreChange > 0 ? "+" : ""}
                                        {scoreChange} points
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span>
                                    {snapshot.matchedSkillsCount} matched
                                  </span>
                                  <span>{snapshot.missingSkillsCount} missing</span>
                                  <span>{snapshot.weakSkillsCount} weak</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(!progressData.history || progressData.history.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="mx-auto mb-2" size={32} />
                    <p>No progress history available yet.</p>
                    <p className="text-sm mt-2">
                      Progress will be tracked as you update your skills and re-analyze.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="mx-auto mb-2" size={32} />
                <p>No progress data available.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

