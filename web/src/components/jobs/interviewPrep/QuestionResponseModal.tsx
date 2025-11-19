import React, { useState } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Lightbulb, 
  Loader2,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Target,
  Sparkles
} from 'lucide-react';

interface Question {
  question: string;
  category: 'technical' | 'behavioral' | 'cultural' | 'situational';
  difficulty: 'easy' | 'medium' | 'hard';
  tips: string;
}

interface ResponseAnalysis {
  score: number;
  strengths: string[];
  improvements: string[];
  starFrameworkUsed: boolean;
  detailedFeedback: string;
  alternativeApproaches?: string[];
}

interface QuestionResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question | null;
  jobTitle?: string;
  companyName?: string;
  onSubmit: (response: string) => Promise<ResponseAnalysis>;
}

export default function QuestionResponseModal({
  isOpen,
  onClose,
  question,
  jobTitle,
  companyName,
  onSubmit
}: QuestionResponseModalProps) {
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTips, setShowTips] = useState(true);
  const [analysis, setAnalysis] = useState<ResponseAnalysis | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  if (!question) return null;

  const handleSubmit = async () => {
    if (!response.trim()) {
      alert('Please write a response before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onSubmit(response);
      console.log("Type is:", typeof result);
      console.log("Value is:", result);
      setAnalysis(result);
      setShowAnalysis(true);
    } catch (error) {
      console.error('Failed to submit response:', error);
      alert('Failed to analyze response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setResponse('');
    setShowTips(true);
    setAnalysis(null);
    setShowAnalysis(false);
    onClose();
  };

  const handleRevise = () => {
    setShowAnalysis(false);
    setAnalysis(null);
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors = {
      technical: 'bg-blue-100 text-blue-800',
      behavioral: 'bg-purple-100 text-purple-800',
      cultural: 'bg-green-100 text-green-800',
      situational: 'bg-yellow-100 text-yellow-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getDifficultyBadgeColor = (difficulty: string) => {
    const colors = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      hard: 'bg-red-100 text-red-800',
    };
    return colors[difficulty as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const wordCount = response.trim().split(/\s+/).filter(Boolean).length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {showAnalysis ? (
              <>
                <Sparkles size={20} className="text-purple-600" />
                AI Feedback & Analysis
              </>
            ) : (
              'Practice Response'
            )}
          </DialogTitle>
          <DialogDescription>
              <Badge className={getCategoryBadgeColor(question.category)}>
                {question.category}
              </Badge>
              <Badge className={getDifficultyBadgeColor(question.difficulty)}>
                {question.difficulty}
              </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Question */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Question:</h3>
            <p className="text-gray-700">{question.question}</p>
          </div>

          {!showAnalysis ? (
            <>
              {/* Tips Section */}
              {showTips && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Lightbulb size={18} className="text-yellow-600" />
                      <h4 className="font-semibold text-gray-900">Answer Guidance</h4>
                    </div>
                    <button
                      onClick={() => setShowTips(false)}
                      className="text-gray-500 hover:text-gray-700 text-sm"
                    >
                      Hide
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{question.tips}</p>
                  
                  {question.category === 'behavioral' && (
                    <div className="bg-white rounded border border-yellow-300 p-3">
                      <p className="text-xs font-semibold text-gray-700 mb-2">
                        Use the STAR Framework:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
                        <div>
                          <strong className="text-gray-900">Situation:</strong> Set the context and background
                        </div>
                        <div>
                          <strong className="text-gray-900">Task:</strong> Describe your responsibility or goal
                        </div>
                        <div>
                          <strong className="text-gray-900">Action:</strong> Explain the specific steps you took
                        </div>
                        <div>
                          <strong className="text-gray-900">Result:</strong> Share measurable outcomes and learnings
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!showTips && (
                <button
                  onClick={() => setShowTips(true)}
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Lightbulb size={14} />
                  Show answer guidance
                </button>
              )}

              {/* Response Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Your Response
                  </label>
                  <span className="text-xs text-gray-500">
                    {wordCount} words {wordCount < 50 && '(aim for 100-300 words)'}
                  </span>
                </div>
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Write your response here... Be specific and provide examples."
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tip: Aim for 100-300 words with specific examples and measurable results
                </p>
              </div>
            </>
          ) : analysis ? (
            <>
              {/* AI Analysis Results */}
              <div className="space-y-4">
                {/* Score */}
                <div className="bg-linear-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Overall Score
                      </h3>
                      <p className="text-sm text-gray-600">
                        Based on clarity, structure, relevance, and depth
                      </p>
                    </div>
                    <div className={`text-5xl font-bold ${getScoreColor(analysis.score)}`}>
                      {analysis.score}%
                    </div>
                  </div>
                  
                  {analysis.starFrameworkUsed && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded px-3 py-2 border border-green-200">
                      <CheckCircle2 size={16} />
                      STAR framework successfully applied
                    </div>
                  )}
                </div>

                {/* Your Response */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Your Response:</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{response}</p>
                </div>

                {/* Detailed Feedback */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Target size={18} className="text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Detailed Feedback</h4>
                      <p className="text-sm text-gray-700">{analysis.detailedFeedback}</p>
                    </div>
                  </div>
                </div>

                {/* Strengths */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={18} className="text-green-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-3">Strengths</h4>
                      <ul className="space-y-2">
                        {analysis?.strengths?.map((strength, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle2 size={14} className="text-green-600 shrink-0 mt-0.5" />
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Areas for Improvement */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={18} className="text-orange-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-3">Areas for Improvement</h4>
                      <ul className="space-y-2">
                        {analysis?.improvements?.map((improvement, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                            <TrendingUp size={14} className="text-orange-600 shrink-0 mt-0.5" />
                            <span>{improvement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Alternative Approaches */}
                {analysis.alternativeApproaches && analysis.alternativeApproaches.length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Lightbulb size={18} className="text-purple-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-3">Alternative Approaches</h4>
                        <ul className="space-y-2">
                          {analysis.alternativeApproaches.map((approach, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="text-purple-600 font-bold shrink-0">{index + 1}.</span>
                              <span>{approach}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        <DialogFooter>
          {!showAnalysis ? (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !response.trim()}
                className="bg-[#3bafba] hover:bg-[#34a0ab]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Analyzing with AI...
                  </>
                ) : (
                  'Submit for AI Feedback'
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleRevise}
              >
                Revise Response
              </Button>
              <Button
                onClick={handleClose}
                className="bg-[#3bafba] hover:bg-[#34a0ab]"
              >
                Close
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}