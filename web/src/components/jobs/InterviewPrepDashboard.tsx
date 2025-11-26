import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Users,
  Clock,
  Phone,
  Video,
  Building2,
  FileQuestion,
  UserCheck,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Target,
  BookOpen,
  Calendar,
  TrendingUp,
  Play,
  Info,
  HelpCircle,
  Edit3,
  Search,
  MessageSquare,
  MapPin,
  FileText,
  Send,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Briefcase,
  Eye
} from 'lucide-react';
import QuestionResponseModal from './interviewPrep/QuestionResponseModal';
import { Button } from '../ui/button';
import { analyzeInterviewResponse, ResponseAnalysis } from '@/lib/interviews.api';
import MockInterviewSession from './interviewPrep/MockInterviewSession';
import { Checkbox } from '@/components/ui/checkbox';

// Type definitions matching the backend schema
export interface InterviewInsightsData {
  companyName: string;
  jobTitle: string;
  interviewProcess: {
    stages: Array<{
      stageName: string;
      stageNumber: number;
      description: string;
      typicalDuration: string;
      format: 'phone' | 'video' | 'onsite' | 'hybrid';
      focus: string;
    }>;
    totalRounds: number;
    estimatedTimeline: string;
    typicalTimeBetweenRounds: string;
  };
  commonQuestions: Array<{
    question: string;
    category: 'technical' | 'behavioral' | 'cultural' | 'situational' |'coding-challenges' | 'system-design';
    difficulty: 'easy' | 'medium' | 'hard';
    tips: string;
    frequency: 'very-common' | 'common' | 'occasional';
  }>;
  interviewerInformation: Array<{
    role: string;
    focus: string;
    typicalBackground?: string;
    questionsToExpect: string[];
  }>;
  companySpecificInsights: {
    interviewCulture: string;
    valuedTraits: string[];
    interviewFormats: string[];
    redFlags: string[];
    successTips: string[];
  };
  preparationRecommendations: {
  studyTopics: Array<{
    topic: string;
    importance: 'critical' | 'important' | 'nice-to-have';
    timeEstimate?: string;
    resources?: Array<{
      name: string;
      url?: string;
      type: 'documentation' | 'course' | 'article' | 'video' | 'book';
    }>;
  }>;
  preparationChecklist: Array<{
    task: string;
    category: 'company-research' | 'technical-practice' | 'behavioral-prep' | 'logistics' | 'materials' | 'follow-up';
    priority: 'high' | 'medium' | 'low';
    estimatedTime?: string;
    dueDate?: string;
    completed: boolean;
    notes?: string;
  }>;
  keyAreasToReview: string[];
  questionsToAsk?: {
    roleQuestions?: string[];
    teamQuestions?: string[];
    companyQuestions?: string[];
    growthQuestions?: string[];
  };
  estimatedPreparationTime?: string;
  recommendedStartDate?: string;
  criticalDeadlines?: string[];
  interviewDayTips?: string[];
  redFlagsToWatch?: string[];
};
  researchDate: string;
  confidence: 'high' | 'medium' | 'low';
}

interface InterviewPrepDashboardProps {
  companyName: string;
  jobTitle: string;
  insightsData?: InterviewInsightsData | null;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

export default function InterviewPrepDashboard({
  companyName,
  jobTitle,
  insightsData,
  loading = false,
  error = null,
  onRefresh
}: InterviewPrepDashboardProps) {
  const [activeTab, setActiveTab] = useState('process');
  const [selectedQuestionCategory, setSelectedQuestionCategory] = useState<string | null>(null);
  const [showMockInterview, setShowMockInterview] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any | null>(null);
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'company-research': true,
    'technical-practice': true,
    'behavioral-prep': true,
    'logistics': true,
    'materials': true,
    'follow-up': true,
  });

  const toggleChecklistItem = (taskId: string) => {
  setChecklistState(prev => ({
    ...prev,
    [taskId]: !prev[taskId]
  }));
};

const toggleCategory = (category: string) => {
  setExpandedCategories(prev => ({
    ...prev,
    [category]: !prev[category]
  }));
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'company-research':
      return <Search size={16} className="text-blue-600" />;
    case 'technical-practice':
      return <Target size={16} className="text-purple-600" />;
    case 'behavioral-prep':
      return <MessageSquare size={16} className="text-green-600" />;
    case 'logistics':
      return <MapPin size={16} className="text-orange-600" />;
    case 'materials':
      return <FileText size={16} className="text-indigo-600" />;
    case 'follow-up':
      return <Send size={16} className="text-pink-600" />;
    default:
      return <CheckCircle2 size={16} className="text-gray-600" />;
  }
};

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    'company-research': 'Company Research',
    'technical-practice': 'Technical Practice',
    'behavioral-prep': 'Behavioral Preparation',
    'logistics': 'Logistics & Setup',
    'materials': 'Materials Preparation',
    'follow-up': 'Post-Interview Follow-up'
  };
  return labels[category] || category;
};

const getPriorityBadgeColor = (priority: 'high' | 'medium' | 'low') => {
  switch (priority) {
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

const getResourceTypeIcon = (type: string) => {
  switch (type) {
      case 'documentation':
        return <FileText size={14} className="text-blue-600" />;
      case 'course':
        return <BookOpen size={14} className="text-purple-600" />;
      case 'article':
        return <FileText size={14} className="text-green-600" />;
      case 'video':
        return <Play size={14} className="text-red-600" />;
      case 'book':
        return <BookOpen size={14} className="text-orange-600" />;
      default:
        return <ExternalLink size={14} className="text-gray-600" />;
    }
  };

  // Group checklist items by category
  const checklistByCategory = insightsData?.preparationRecommendations.preparationChecklist?.reduce((acc, item, index) => {
    const category = item.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push({ ...item, id: `task-${index}` });
    return acc;
  }, {} as Record<string, Array<any>>) || {};

// Calculate progress
const totalTasks = insightsData?.preparationRecommendations.preparationChecklist?.length || 0;
const completedTasks = Object.values(checklistState).filter(Boolean).length;
const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

const capitalize = (s: string) =>
  s.charAt(0).toUpperCase() + s.slice(1);

  const handleSubmitResponse = async (response: string): Promise<ResponseAnalysis> => {
  if (!selectedQuestion) {
    // must return a valid ResponseAnalysis — never undefined
    return {
      score: 0,
      strengths: [],
      improvements: [],
      starFrameworkUsed: false,
      detailedFeedback: "No question was selected for analysis.",
      alternativeApproaches: []
    };
  }

  try {
    const result = await analyzeInterviewResponse({
      question: selectedQuestion.question,
      questionCategory: selectedQuestion.category,
      response: response,
      jobTitle: jobTitle,
      companyName: companyName,
    });

    if (!result.success || !result.data) {
      throw new Error(result.error || "Invalid response from analysis API");
    }

    //console.log('[Interview Response] Analysis Result:', result.data);
    return result.data;   // valid ResponseAnalysis
  } catch (error) {
    console.error('[Interview Response] Error:', error);

    return {
      score: 0,
      strengths: [],
      improvements: [],
      starFrameworkUsed: false,
      detailedFeedback: "An error occurred while analyzing the response.",
      alternativeApproaches: []
    };
  }
};

  if (showMockInterview) {
  return (
    <MockInterviewSession
      companyName={companyName}
      jobTitle={jobTitle}
      insightsData={insightsData}
      onClose={() => setShowMockInterview(false)}
    />
  );
}

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={20} />
            Interview Preparation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3bafba]"></div>
            <span className="ml-3 text-gray-600">Researching interview insights...</span>
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
            <Users size={20} />
            Interview Preparation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-red-600">
            <AlertTriangle className="mx-auto mb-2" size={24} />
            <p>Failed to load interview insights: {error}</p>
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
  if (!insightsData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={20} />
            Interview Preparation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            <HelpCircle className="mx-auto mb-2" size={32} />
            <p>No interview insights available yet.</p>
            <p className="text-sm mt-1">Click "Research Interview Insights" to get started.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getFormatIcon = (format: 'phone' | 'video' | 'onsite' | 'hybrid') => {
    switch (format) {
      case 'phone':
        return <Phone size={16} className="text-blue-600" />;
      case 'video':
        return <Video size={16} className="text-purple-600" />;
      case 'onsite':
        return <Building2 size={16} className="text-green-600" />;
      case 'hybrid':
        return <Users size={16} className="text-orange-600" />;
      default:
        return <HelpCircle size={16} className="text-gray-600" />;
    }
  };

  const getDifficultyBadgeColor = (difficulty: 'easy' | 'medium' | 'hard') => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFrequencyBadgeColor = (frequency: 'very-common' | 'common' | 'occasional') => {
    switch (frequency) {
      case 'very-common':
        return 'bg-red-100 text-red-800';
      case 'common':
        return 'bg-orange-100 text-orange-800';
      case 'occasional':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryBadgeColor = (category: 'technical' | 'behavioral' | 'cultural' | 'situational' | 'coding-challenges' | 'system-design') => {
    switch (category) {
      case 'technical':
      case 'coding-challenges':
      case 'system-design':
        return 'bg-blue-100 text-blue-800';
      case 'behavioral':
        return 'bg-purple-100 text-purple-800';
      case 'cultural':
        return 'bg-green-100 text-green-800';
      case 'situational':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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

  const getChecklistCategoryIcon = (category: 'research' | 'practice' | 'preparation' | 'logistics') => {
    switch (category) {
      case 'research':
        return <BookOpen size={16} className="text-blue-600" />;
      case 'practice':
        return <Target size={16} className="text-green-600" />;
      case 'preparation':
        return <CheckCircle2 size={16} className="text-purple-600" />;
      case 'logistics':
        return <Calendar size={16} className="text-orange-600" />;
      default:
        return <Info size={16} className="text-gray-600" />;
    }
  };

  const getConfidenceBadgeColor = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredQuestions = selectedQuestionCategory
    ? insightsData.commonQuestions.filter(q => q.category === selectedQuestionCategory)
    : insightsData.commonQuestions;

  const questionCategories = Array.from(new Set(insightsData.commonQuestions.map(q => q.category)));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users size={20} />
              Interview Preparation
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {jobTitle} at {companyName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowMockInterview(true)}
              className="bg-[#3bafba] hover:bg-[#34a0ab] flex items-center gap-2"
              disabled={loading}
            >
              <Play size={16} />
              Practice Interview
            </Button>
            <Badge className={getConfidenceBadgeColor(insightsData.confidence)}>
              {insightsData.confidence} confidence
            </Badge>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="text-sm text-blue-600 hover:underline"
              >
                Refresh
              </button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="process">Process</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="interviewers">Interviewers</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="preparation">
            Preparation
            {totalTasks > 0 && (
              <Badge className="ml-2 bg-blue-600 text-white text-xs">
                {completedTasks}/{totalTasks}
              </Badge>
            )}
          </TabsTrigger>
          </TabsList>

          {/* Interview Process Tab */}
          <TabsContent value="process" className="space-y-6 mt-4">
            {/* Process Overview */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{insightsData.interviewProcess.totalRounds}</div>
                  <div className="text-sm text-gray-600">Total Rounds</div>
                </div>
                <div className="text-center">
                  <Clock size={20} className="mx-auto text-blue-600 mb-1" />
                  <div className="text-sm font-medium text-gray-900">{insightsData.interviewProcess.estimatedTimeline}</div>
                  <div className="text-sm text-gray-600">Estimated Timeline</div>
                </div>
                <div className="text-center">
                  <Calendar size={20} className="mx-auto text-blue-600 mb-1" />
                  <div className="text-sm font-medium text-gray-900">{insightsData.interviewProcess.typicalTimeBetweenRounds}</div>
                  <div className="text-sm text-gray-600">Between Rounds</div>
                </div>
              </div>
            </div>

            {/* Interview Stages */}
            <div>
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-gray-400" />
                Interview Stages
              </h3>
              <div className="space-y-4">
                {insightsData.interviewProcess.stages
                  .sort((a, b) => a.stageNumber - b.stageNumber)
                  .map((stage, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-blue-500 pl-4 py-3 bg-blue-50 rounded-r-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-bold text-sm">
                            {stage.stageNumber}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{stage.stageName}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              {getFormatIcon(stage.format)}
                              <span className="text-sm text-gray-600 capitalize">{stage.format}</span>
                              <span className="text-gray-400">•</span>
                              <Clock size={14} className="text-gray-500" />
                              <span className="text-sm text-gray-600">{stage.typicalDuration}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="ml-11">
                        <p className="text-sm text-gray-700 mb-2">{stage.description}</p>
                        <div className="flex items-center gap-2">
                          <Target size={14} className="text-gray-500" />
                          <span className="text-sm text-gray-600 font-medium">Focus: {stage.focus}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </TabsContent>

          {/* Common Questions Tab */}
          <TabsContent value="questions" className="space-y-6 mt-4">
            {/* Question Categories Filter */}
            {questionCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setSelectedQuestionCategory(null)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    !selectedQuestionCategory
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Questions
                </button>
                {questionCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedQuestionCategory(category)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedQuestionCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>
            )}

            {/* Questions List */}
            <div className="space-y-4">
              {filteredQuestions.map((question, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <FileQuestion size={20} className="text-blue-600 shrink-0 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge className={getCategoryBadgeColor(question.category)}>
                          {question.category}
                        </Badge>
                        <Badge className={getDifficultyBadgeColor(question.difficulty)}>
                          {question.difficulty}
                        </Badge>
                        <Badge className={getFrequencyBadgeColor(question.frequency)}>
                          {question.frequency.replace('-', ' ')}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-2">{question.question}</h4>
                      <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                        <div className="flex items-start gap-2">
                          <Lightbulb size={16} className="text-yellow-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">How to Answer:</p>
                            <p className="text-sm text-gray-700">{question.tips}</p>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={() => {
                          setSelectedQuestion(question);
                          setResponseModalOpen(true);
                        }}
                        size="sm"
                        className="bg-[#3bafba] hover:bg-[#34a0ab] flex items-center gap-2"
                      >
                        <Edit3 size={16} />
                        Practice Response
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Interviewers Tab */}
          <TabsContent value="interviewers" className="space-y-6 mt-4">
            {insightsData.interviewerInformation && insightsData.interviewerInformation.length > 0 ? (
              <div className="space-y-4">
                {insightsData.interviewerInformation.map((interviewer, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-start gap-3">
                      <UserCheck size={20} className="text-purple-600 shrink-0 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">{interviewer.role}</h4>
                        <p className="text-sm text-gray-700 mb-3">{interviewer.focus}</p>
                        {interviewer.typicalBackground && (
                          <div className="mb-3">
                            <span className="text-sm font-medium text-gray-600">Typical Background: </span>
                            <span className="text-sm text-gray-700">{interviewer.typicalBackground}</span>
                          </div>
                        )}
                        {interviewer.questionsToExpect && interviewer.questionsToExpect.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-600 mb-2">Questions to Expect:</p>
                            <ul className="list-disc list-inside space-y-1">
                              {interviewer.questionsToExpect.map((q, qIndex) => (
                                <li key={qIndex} className="text-sm text-gray-700">{q}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <UserCheck className="mx-auto mb-2" size={32} />
                <p>No interviewer information available.</p>
              </div>
            )}
          </TabsContent>

          {/* Company Insights Tab */}
          <TabsContent value="insights" className="space-y-6 mt-4">
            {/* Interview Culture */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Building2 size={18} className="text-gray-400" />
                Interview Culture
              </h3>
              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-gray-700">{insightsData.companySpecificInsights.interviewCulture}</p>
              </div>
            </div>

            {/* Valued Traits */}
            {insightsData.companySpecificInsights.valuedTraits && insightsData.companySpecificInsights.valuedTraits.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Target size={18} className="text-gray-400" />
                  Valued Traits
                </h3>
                <div className="flex flex-wrap gap-2">
                  {insightsData.companySpecificInsights.valuedTraits.map((trait, index) => (
                    <Badge key={index} className="bg-green-100 text-green-800">
                      {trait}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Interview Formats */}
            {insightsData.companySpecificInsights.interviewFormats && insightsData.companySpecificInsights.interviewFormats.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <FileQuestion size={18} className="text-gray-400" />
                  Interview Formats
                </h3>
                <div className="flex flex-wrap gap-2">
                  {insightsData.companySpecificInsights.interviewFormats.map((format, index) => (
                    <Badge key={index} className="bg-blue-100 text-blue-800">
                      {format}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Red Flags */}
            {insightsData.companySpecificInsights.redFlags && insightsData.companySpecificInsights.redFlags.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-red-600" />
                  What to Avoid
                </h3>
                <div className="space-y-2">
                  {insightsData.companySpecificInsights.redFlags.map((flag, index) => (
                    <div key={index} className="flex items-start gap-2 border border-red-200 rounded-lg p-3 bg-red-50">
                      <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{flag}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Success Tips */}
            {insightsData.companySpecificInsights.successTips && insightsData.companySpecificInsights.successTips.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Lightbulb size={18} className="text-yellow-600" />
                  Success Tips
                </h3>
                <div className="space-y-2">
                  {insightsData.companySpecificInsights.successTips.map((tip, index) => (
                    <div key={index} className="flex items-start gap-2 border border-green-200 rounded-lg p-3 bg-green-50">
                      <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Preparation Tab */}
          <TabsContent value="preparation" className="space-y-6 mt-4">
            {/* Overall Progress */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-blue-600" />
                  <div>
                    <div className="font-semibold text-gray-900">Preparation Progress</div>
                    <div className="text-sm text-gray-600">
                      {completedTasks} of {totalTasks} tasks completed
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{progressPercentage}%</div>
                  <div className="text-xs text-gray-600">Complete</div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

            {/* Preparation Timeline */}
            {insightsData.preparationRecommendations.estimatedPreparationTime && (
              <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-blue-600" />
                    <span className="text-gray-700">
                      <strong>Estimated Time:</strong> {insightsData.preparationRecommendations.estimatedPreparationTime}
                    </span>
                  </div>
                  {insightsData.preparationRecommendations.recommendedStartDate && (
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-blue-600" />
                      <span className="text-gray-700">
                        <strong>Start:</strong> {insightsData.preparationRecommendations.recommendedStartDate}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              )}
            </div>

            {/* Critical Deadlines */}
            {insightsData.preparationRecommendations.criticalDeadlines && 
            insightsData.preparationRecommendations.criticalDeadlines.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-orange-600" />
                  Critical Deadlines
                </h4>
                <ul className="space-y-1">
                  {insightsData.preparationRecommendations.criticalDeadlines.map((deadline, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-orange-600 rounded-full" />
                      {deadline}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Study Topics */}
            {insightsData.preparationRecommendations.studyTopics &&
              insightsData.preparationRecommendations.studyTopics.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <BookOpen size={18} className="text-gray-400" />
                    Study Topics
                  </h3>

                  <div className="space-y-3">
                    {insightsData.preparationRecommendations.studyTopics.map((topic, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-gray-900">{topic.topic}</span>
                              <Badge className={getImportanceBadgeColor(topic.importance)}>
                                {topic.importance}
                              </Badge>
                            </div>

                            {topic.timeEstimate && (
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                <Clock size={14} />
                                <span>{topic.timeEstimate}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {topic.resources && topic.resources.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-600 mb-2">Resources:</p>

                            <div className="space-y-2">
                              {topic.resources.map((resource, resIndex) => (
                                <div key={resIndex} className="flex items-center gap-2 text-sm">
                                  {getResourceTypeIcon(resource.type)}

                                  {resource.url ? (
                                    <a
                                      href={resource.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline"
                                    >
                                      {resource.name}
                                    </a>
                                  ) : (
                                    <span className="text-gray-700">{resource.name}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
          
            {/* Preparation Checklist */}
            {insightsData.preparationRecommendations.preparationChecklist && 
            insightsData.preparationRecommendations.preparationChecklist.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-gray-400" />
                  Preparation Checklist
                </h3>
                <div className="space-y-4">
                  {Object.entries(checklistByCategory).map(([category, items]) => (
                    <div key={category} className="border rounded-lg overflow-hidden">
                      {/* Category Header */}
                      <button
                        onClick={() => toggleCategory(category)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {getCategoryIcon(category)}
                          <span className="font-semibold text-gray-900">
                            {capitalize(getCategoryLabel(category))}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {items.filter(item => checklistState[item.id]).length}/{items.length}
                          </Badge>
                        </div>
                        {expandedCategories[category] ? (
                          <ChevronUp size={20} className="text-gray-600" />
                        ) : (
                          <ChevronDown size={20} className="text-gray-600" />
                        )}
                      </button>

                      {/* Category Items */}
                      {expandedCategories[category] && (
                        <div className="p-4 space-y-3 bg-white">
                          {items.map((item: any) => (
                            <div
                              key={item.id}
                              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                                checklistState[item.id]
                                  ? 'bg-green-50 border-green-200'
                                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <Checkbox
                                id={item.id}
                                checked={checklistState[item.id] || false}
                                onCheckedChange={() => toggleChecklistItem(item.id)}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <label
                                  htmlFor={item.id}
                                  className={`cursor-pointer block text-sm font-medium ${
                                    checklistState[item.id]
                                      ? 'text-gray-500 line-through'
                                      : 'text-gray-900'
                                  }`}
                                >
                                  {item.item}
                                </label>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <Badge className={getPriorityBadgeColor(item.priority)} variant="outline">
                                    {item.priority} priority
                                  </Badge>
                                  {item.estimatedTime && (
                                    <span className="text-xs text-gray-600 flex items-center gap-1">
                                      <Clock size={12} />
                                      {item.estimatedTime}
                                    </span>
                                  )}
                                  {item.dueDate && (
                                    <span className="text-xs text-gray-600 flex items-center gap-1">
                                      <Calendar size={12} />
                                      {item.dueDate}
                                    </span>
                                  )}
                                </div>
                                {item.notes && (
                                  <p className="text-xs text-gray-600 mt-2 italic">{item.notes}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

             {/* Questions to Ask Interviewer */}
            {insightsData.preparationRecommendations.questionsToAsk && (
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <HelpCircle size={18} className="text-gray-400" />
                  Questions to Ask Interviewer
                </h3>
                <div className="space-y-4">
                  {insightsData.preparationRecommendations.questionsToAsk.roleQuestions && 
                  insightsData.preparationRecommendations.questionsToAsk.roleQuestions.length > 0 && (
                    <div className="border rounded-lg p-4 bg-blue-50">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Briefcase size={16} className="text-blue-600" />
                        About the Role
                      </h4>
                      <ul className="space-y-2">
                        {insightsData.preparationRecommendations.questionsToAsk.roleQuestions.map((q, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-blue-600 font-bold mt-0.5">?</span>
                            {q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {insightsData.preparationRecommendations.questionsToAsk.teamQuestions && 
                  insightsData.preparationRecommendations.questionsToAsk.teamQuestions.length > 0 && (
                    <div className="border rounded-lg p-4 bg-purple-50">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Users size={16} className="text-purple-600" />
                        About the Team
                      </h4>
                      <ul className="space-y-2">
                        {insightsData.preparationRecommendations.questionsToAsk.teamQuestions.map((q, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-purple-600 font-bold mt-0.5">?</span>
                            {q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {insightsData.preparationRecommendations.questionsToAsk.companyQuestions && 
                  insightsData.preparationRecommendations.questionsToAsk.companyQuestions.length > 0 && (
                    <div className="border rounded-lg p-4 bg-green-50">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Building2 size={16} className="text-green-600" />
                        About the Company
                      </h4>
                      <ul className="space-y-2">
                        {insightsData.preparationRecommendations.questionsToAsk.companyQuestions.map((q, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-green-600 font-bold mt-0.5">?</span>
                            {q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {insightsData.preparationRecommendations.questionsToAsk.growthQuestions && 
                  insightsData.preparationRecommendations.questionsToAsk.growthQuestions.length > 0 && (
                    <div className="border rounded-lg p-4 bg-orange-50">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <TrendingUp size={16} className="text-orange-600" />
                        About Growth & Development
                      </h4>
                      <ul className="space-y-2">
                        {insightsData.preparationRecommendations.questionsToAsk.growthQuestions.map((q, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-orange-600 font-bold mt-0.5">?</span>
                            {q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Interview Day Tips */}
            {insightsData.preparationRecommendations.interviewDayTips && 
            insightsData.preparationRecommendations.interviewDayTips.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Lightbulb size={18} className="text-yellow-600" />
                  Interview Day Tips
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {insightsData.preparationRecommendations.interviewDayTips.map((tip, index) => (
                    <div key={index} className="flex items-start gap-2 border border-yellow-200 rounded-lg p-3 bg-yellow-50">
                      <CheckCircle2 size={16} className="text-yellow-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Red Flags to Watch */}
            {insightsData.preparationRecommendations.redFlagsToWatch && 
            insightsData.preparationRecommendations.redFlagsToWatch.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Eye size={18} className="text-red-600" />
                  Red Flags to Watch For
                </h3>
                <div className="space-y-2">
                  {insightsData.preparationRecommendations.redFlagsToWatch.map((flag, index) => (
                    <div key={index} className="flex items-start gap-2 border border-red-200 rounded-lg p-3 bg-red-50">
                      <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{flag}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Key Areas to Review */}
            {insightsData.preparationRecommendations.keyAreasToReview && 
            insightsData.preparationRecommendations.keyAreasToReview.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Target size={18} className="text-gray-400" />
                  Key Areas to Review
                </h3>
                <div className="flex flex-wrap gap-2">
                  {insightsData.preparationRecommendations.keyAreasToReview.map((area, index) => (
                    <Badge key={index} className="bg-blue-100 text-blue-800">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Research Date */}
        <div className="mt-6 pt-4 border-t text-center">
          <p className="text-xs text-gray-500">
            Research conducted on {new Date(insightsData.researchDate).toLocaleDateString()}
          </p>
        </div>
      </CardContent>

      {selectedQuestion && (
       <QuestionResponseModal
        isOpen={responseModalOpen}
        onClose={() => {
          setResponseModalOpen(false);
          setSelectedQuestion(null);
        }}
        question={selectedQuestion}
        jobTitle={jobTitle}
        companyName={companyName}
        onSubmit={handleSubmitResponse}
      />
      )}
    </Card>
  );
}

