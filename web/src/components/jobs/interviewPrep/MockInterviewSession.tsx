import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Play,
  MessageSquare,
  Send,
  Loader2,
  CheckCircle2,
  Clock,
  Target,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  BarChart3
} from 'lucide-react';
import { InterviewInsightsData } from '../InterviewPrepDashboard';
import { evaluateMockInterviewResponse, generateMockInterviewQuestions, generateMockInterviewSummary } from '@/lib/mockInterviews.api';

interface MockInterviewSessionProps {
  companyName: string;
  jobTitle: string;
  insightsData?: InterviewInsightsData | null;
  onClose: () => void;
}

interface InterviewQuestion {
  id: string;
  question: string;
  category: 'technical' | 'behavioral' | 'cultural' | 'situational';
  difficulty: 'easy' | 'medium' | 'hard';
  expectedPoints?: string[];
}

interface InterviewResponse {
  questionId: string;
  question: string;
  response: string;
  feedback?: {
    strengths: string[];
    improvements: string[];
    score: number;
    detailedFeedback: string;
  };
}

interface PerformanceSummary {
  overallScore: number;
  categoryScores: {
    technical?: number;
    behavioral?: number;
    cultural?: number;
    situational?: number;
  };
  strengths: string[];
  areasForImprovement: string[];
  confidenceTips: string[];
  readinessLevel: 'needs-practice' | 'good' | 'excellent';
  detailedAnalysis: string;
}

type SessionState = 'intro' | 'active' | 'summary';

export default function MockInterviewSession({
  companyName,
  jobTitle,
  insightsData,
  onClose
}: MockInterviewSessionProps) {
  const [sessionState, setSessionState] = useState<SessionState>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [responses, setResponses] = useState<InterviewResponse[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  const startInterview = async () => {
  setGeneratingQuestions(true);
  try {
    // Call API to generate questions
    const generatedQuestions = await generateMockInterviewQuestions({
      jobTitle,
      companyName,
      jobDescription: undefined, // Can be added if you have it
      insightsData: insightsData || undefined,
      numberOfQuestions: 5
    });

    setQuestions(generatedQuestions);
    setSessionState('active');
  } catch (error: any) {
    console.error('[Mock Interview] Failed to generate questions:', error);
    alert(error.message || 'Failed to start interview. Please try again.');
  } finally {
    setGeneratingQuestions(false);
  }
};

  const submitResponse = async () => {
  if (!currentResponse.trim() || !currentQuestion) return;

  setLoading(true);
  try {
    // Call API to evaluate response
    const feedback = await evaluateMockInterviewResponse({
      question: currentQuestion.question,
      category: currentQuestion.category,
      difficulty: currentQuestion.difficulty,
      expectedPoints: currentQuestion.expectedPoints,
      userResponse: currentResponse,
      jobTitle,
      companyName
    });

    const newResponse: InterviewResponse = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      response: currentResponse,
      feedback
    };

    setResponses([...responses, newResponse]);
    setCurrentResponse('');

    // Move to next question or finish
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Generate summary
      await generateSummary([...responses, newResponse]);
    }
  } catch (error: any) {
    console.error('[Mock Interview] Failed to submit response:', error);
    alert(error.message || 'Failed to submit response. Please try again.');
  } finally {
    setLoading(false);
  }
};

  const generateSummary = async (allResponses: InterviewResponse[]) => {
  setLoading(true);
  try {
    // Call API to generate performance summary
    const summaryData = await generateMockInterviewSummary({
      jobTitle,
      companyName,
      responses: allResponses.map(r => ({
        question: r.question,
        category: questions.find(q => q.id === r.questionId)?.category || 'behavioral',
        response: r.response,
        feedback: r.feedback!
      }))
    });

    setSummary(summaryData);
    setSessionState('summary');
  } catch (error: any) {
    console.error('[Mock Interview] Failed to generate summary:', error);
    alert(error.message || 'Failed to generate summary. Please try again.');
  } finally {
    setLoading(false);
  }
};

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical': return 'bg-blue-100 text-blue-800';
      case 'behavioral': return 'bg-purple-100 text-purple-800';
      case 'cultural': return 'bg-green-100 text-green-800';
      case 'situational': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReadinessColor = (level: string) => {
    switch (level) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-yellow-100 text-yellow-800';
      case 'needs-practice': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Intro Screen
  if (sessionState === 'intro') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Button
          variant="outline"
          onClick={onClose}
          className="mb-4 flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Back to Interview Prep
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play size={24} className="text-[#3bafba]" />
              Mock Interview Practice
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              {jobTitle} at {companyName}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <MessageSquare size={18} className="text-blue-600" />
                How It Works
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
                  <span>Answer interview questions with written responses</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
                  <span>Receive AI-powered feedback on each response</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
                  <span>Get a comprehensive performance summary at the end</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
                  <span>Learn areas to improve and build confidence</span>
                </li>
              </ul>
            </div>

            {insightsData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Lightbulb size={18} className="text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">
                      Tailored to {companyName}
                    </p>
                    <p className="text-sm text-gray-700">
                      This mock interview will use insights from {companyName}'s actual interview process
                      to provide realistic practice questions.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock size={16} />
                <span>Estimated time: 15-20 minutes</span>
              </div>
              <Button
                onClick={startInterview}
                disabled={generatingQuestions}
                className="bg-[#3bafba] hover:bg-[#34a0ab] flex items-center gap-2"
              >
                {generatingQuestions ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Preparing Questions...
                  </>
                ) : (
                  <>
                    <Play size={18} />
                    Start Interview
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active Interview Screen
  if (sessionState === 'active' && currentQuestion) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Exit Interview
          </Button>
          <div className="text-sm text-gray-600">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#3bafba] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-lg">Interview Question</CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={getCategoryColor(currentQuestion.category)}>
                  {currentQuestion.category}
                </Badge>
                <Badge className={getDifficultyColor(currentQuestion.difficulty)}>
                  {currentQuestion.difficulty}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Question */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-lg font-medium text-gray-900">
                {currentQuestion.question}
              </p>
            </div>

            {/* Expected Points (if available) */}
            {currentQuestion.expectedPoints && currentQuestion.expectedPoints.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Target size={16} className="text-yellow-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      Key Points to Cover:
                    </p>
                    <ul className="space-y-1">
                      {currentQuestion.expectedPoints.map((point, index) => (
                        <li key={index} className="text-sm text-gray-700">
                          • {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Response Textarea */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Response
              </label>
              <textarea
                value={currentResponse}
                onChange={(e) => setCurrentResponse(e.target.value)}
                placeholder="Type your answer here... Take your time to provide a thoughtful response."
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3bafba] resize-none"
              />
              <p className="text-sm text-gray-500 mt-2">
                {currentResponse.length} characters
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                onClick={submitResponse}
                disabled={loading || !currentResponse.trim()}
                className="bg-[#3bafba] hover:bg-[#34a0ab] flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Processing...
                  </>
                ) : currentQuestionIndex < questions.length - 1 ? (
                  <>
                    <Send size={18} />
                    Submit & Continue
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    Submit & Finish
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Previous Responses (if any) */}
        {responses.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Previous Responses</h3>
            <div className="space-y-4">
              {responses.map((resp, index) => (
                <Card key={resp.questionId}>
                  <CardContent className="pt-4">
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-900 mb-2">
                        Question {index + 1}: {resp.question}
                      </p>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                        {resp.response}
                      </p>
                    </div>
                    {resp.feedback && (
                      <div className="border-t pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-900">
                            Feedback
                          </span>
                          <span className={`text-lg font-bold ${getScoreColor(resp.feedback.score)}`}>
                            {resp.feedback.score}/100
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          {resp.feedback.detailedFeedback}
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs font-semibold text-green-700 mb-1">
                              Strengths:
                            </p>
                            <ul className="text-xs text-gray-700 space-y-0.5">
                              {resp.feedback.strengths.map((s, i) => (
                                <li key={i}>✓ {s}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-orange-700 mb-1">
                              Improvements:
                            </p>
                            <ul className="text-xs text-gray-700 space-y-0.5">
                              {resp.feedback.improvements.map((imp, i) => (
                                <li key={i}>→ {imp}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Summary Screen
  if (sessionState === 'summary' && summary) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Button
          variant="outline"
          onClick={onClose}
          className="mb-4 flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Back to Interview Prep
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 size={24} className="text-[#3bafba]" />
              Interview Performance Summary
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              {jobTitle} at {companyName}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Score */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 text-center">
              <div className="mb-2">
                <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Overall Score
                </span>
              </div>
              <div className={`text-5xl font-bold mb-2 ${getScoreColor(summary.overallScore)}`}>
                {summary.overallScore}
              </div>
              <div className="text-sm text-gray-600">out of 100</div>
              <div className="mt-4">
                <Badge className={getReadinessColor(summary.readinessLevel)}>
                  {summary.readinessLevel.replace('-', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Detailed Analysis */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <TrendingUp size={18} className="text-gray-400" />
                Analysis
              </h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-700">{summary.detailedAnalysis}</p>
              </div>
            </div>

            {/* Category Scores */}
            {Object.keys(summary.categoryScores).length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Target size={18} className="text-gray-400" />
                  Category Breakdown
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(summary.categoryScores).map(([category, score]) => (
                    <div key={category} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {category}
                        </span>
                        <span className={`text-xl font-bold ${getScoreColor(score)}`}>
                          {score}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths */}
            {summary.strengths.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-green-600" />
                  Strengths
                </h3>
                <div className="space-y-2">
                  {summary.strengths.map((strength, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 border border-green-200 rounded-lg p-3 bg-green-50"
                    >
                      <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{strength}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Areas for Improvement */}
            {summary.areasForImprovement.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <AlertCircle size={18} className="text-orange-600" />
                  Areas for Improvement
                </h3>
                <div className="space-y-2">
                  {summary.areasForImprovement.map((area, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 border border-orange-200 rounded-lg p-3 bg-orange-50"
                    >
                      <AlertCircle size={16} className="text-orange-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{area}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confidence Tips */}
            {summary.confidenceTips.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Lightbulb size={18} className="text-yellow-600" />
                  Confidence Tips
                </h3>
                <div className="space-y-2">
                  {summary.confidenceTips.map((tip, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 border border-yellow-200 rounded-lg p-3 bg-yellow-50"
                    >
                      <Lightbulb size={16} className="text-yellow-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  setSessionState('intro');
                  setCurrentQuestionIndex(0);
                  setQuestions([]);
                  setResponses([]);
                  setCurrentResponse('');
                  setSummary(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Practice Again
              </Button>
              <Button
                onClick={onClose}
                className="flex-1 bg-[#3bafba] hover:bg-[#34a0ab]"
              >
                Back to Interview Prep
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* All Responses Review */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Response Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {responses.map((resp, index) => (
                <div key={resp.questionId} className="border-b pb-4 last:border-b-0">
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-900 mb-2">
                      Question {index + 1}: {resp.question}
                    </p>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      {resp.response}
                    </p>
                  </div>
                  {resp.feedback && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-900">
                          Feedback
                        </span>
                        <span className={`text-lg font-bold ${getScoreColor(resp.feedback.score)}`}>
                          {resp.feedback.score}/100
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        {resp.feedback.detailedFeedback}
                      </p>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <p className="text-xs font-semibold text-green-700 mb-1">
                            Strengths:
                          </p>
                          <ul className="text-xs text-gray-700 space-y-0.5">
                            {resp.feedback.strengths.map((s, i) => (
                              <li key={i}>✓ {s}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-orange-700 mb-1">
                            Improvements:
                          </p>
                          <ul className="text-xs text-gray-700 space-y-0.5">
                            {resp.feedback.improvements.map((imp, i) => (
                              <li key={i}>→ {imp}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}