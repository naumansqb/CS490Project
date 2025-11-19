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
  Shield,
  Info,
  HelpCircle,
  Edit3
} from 'lucide-react';
import QuestionResponseModal from './interviewPrep/QuestionResponseModal';
import { Button } from '../ui/button';

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
    category: 'technical' | 'behavioral' | 'cultural' | 'situational';
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
      resources?: string[];
    }>;
    keyAreasToReview: string[];
    preparationChecklist: Array<{
      item: string;
      category: 'research' | 'practice' | 'preparation' | 'logistics';
    }>;
    estimatedPreparationTime: string;
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
  const [selectedQuestion, setSelectedQuestion] = useState<any | null>(null);
  const [responseModalOpen, setResponseModalOpen] = useState(false);

  const handleSubmitResponse = async (response: string) => {
    console.log('User response:', response);
    console.log('Question:', selectedQuestion);
    
    // TODO: This is where we'll call the AI API next
    // For now, just show a success message
    alert('Response submitted! AI feedback will be shown here.');
  };

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

  const getCategoryBadgeColor = (category: 'technical' | 'behavioral' | 'cultural' | 'situational') => {
    switch (category) {
      case 'technical':
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
            <TabsTrigger value="preparation">Preparation</TabsTrigger>
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
                      {/* ADD THIS NEW BUTTON */}
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
            {/* Preparation Time */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-blue-600" />
                <div>
                  <div className="font-semibold text-gray-900">Estimated Preparation Time</div>
                  <div className="text-sm text-gray-600">{insightsData.preparationRecommendations.estimatedPreparationTime}</div>
                </div>
              </div>
            </div>

            {/* Study Topics */}
            {insightsData.preparationRecommendations.studyTopics && insightsData.preparationRecommendations.studyTopics.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <BookOpen size={18} className="text-gray-400" />
                  Study Topics
                </h3>
                <div className="space-y-3">
                  {insightsData.preparationRecommendations.studyTopics.map((topic, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{topic.topic}</span>
                        <Badge className={getImportanceBadgeColor(topic.importance)}>
                          {topic.importance}
                        </Badge>
                      </div>
                      {topic.resources && topic.resources.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-600 mb-1">Resources:</p>
                          <ul className="list-disc list-inside text-sm text-gray-700">
                            {topic.resources.map((resource, resIndex) => (
                              <li key={resIndex}>{resource}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Areas to Review */}
            {insightsData.preparationRecommendations.keyAreasToReview && insightsData.preparationRecommendations.keyAreasToReview.length > 0 && (
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

            {/* Preparation Checklist */}
            {insightsData.preparationRecommendations.preparationChecklist && insightsData.preparationRecommendations.preparationChecklist.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-gray-400" />
                  Preparation Checklist
                </h3>
                <div className="space-y-3">
                  {insightsData.preparationRecommendations.preparationChecklist.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 border rounded-lg p-3 bg-gray-50"
                    >
                      <div className="shrink-0 mt-0.5">
                        {getChecklistCategoryIcon(item.category)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">{item.item}</span>
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
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
      {/* Add this before the final </Card> closing tag */}
      {selectedQuestion && (
        <QuestionResponseModal
          isOpen={responseModalOpen}
          onClose={() => {
            setResponseModalOpen(false);
            setSelectedQuestion(null);
          }}
          question={selectedQuestion}
          onSubmit={handleSubmitResponse}
        />
      )}
    </Card>
  );
}

