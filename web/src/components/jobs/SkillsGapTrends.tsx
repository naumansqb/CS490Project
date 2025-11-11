import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  AlertCircle,
  Target,
  Briefcase,
  ArrowRight,
} from 'lucide-react';
import { getSkillsGapTrends, SkillsGapTrendsData } from '@/lib/company.api';

interface SkillsGapTrendsProps {
  onJobSelect?: (jobId: string) => void;
}

export default function SkillsGapTrends({ onJobSelect }: SkillsGapTrendsProps) {
  const [trendsData, setTrendsData] = useState<SkillsGapTrendsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTrends();
  }, []);

  const loadTrends = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSkillsGapTrends();
      if (response.success) {
        setTrendsData(response.data);
      }
    } catch (err: any) {
      console.error('Failed to load trends:', err);
      setError(err.message || 'Failed to load trends data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 size={20} />
            Skills Gap Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3bafba]"></div>
            <span className="ml-3 text-gray-600">Loading trends...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 size={20} />
            Skills Gap Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-red-600">
            <AlertCircle className="mx-auto mb-2" size={24} />
            <p>Failed to load trends: {error}</p>
            <button
              onClick={loadTrends}
              className="mt-4 text-blue-600 hover:underline"
            >
              Try again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!trendsData || trendsData.totalJobs === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 size={20} />
            Skills Gap Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Briefcase className="mx-auto mb-2" size={32} />
            <p>No skills gap analyses available yet.</p>
            <p className="text-sm mt-2">
              Analyze skills gaps for your job opportunities to see trends.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    if (score >= 30) return 'text-orange-600';
    return 'text-red-600';
  };

  const getImportanceBadgeColor = (importance: string) => {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 size={20} />
          Skills Gap Trends Across Jobs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-gray-600">Total Jobs Analyzed</p>
            <p className="text-3xl font-bold text-blue-600">{trendsData.totalJobs}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-sm text-gray-600">Average Gap Score</p>
            <p className={`text-3xl font-bold ${getScoreColor(trendsData.averageGapScore)}`}>
              {trendsData.averageGapScore}%
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <p className="text-sm text-gray-600">Common Gaps Identified</p>
            <p className="text-3xl font-bold text-purple-600">
              {trendsData.commonMissingSkills.length}
            </p>
          </div>
        </div>

        {/* Jobs Overview */}
        <div>
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Briefcase size={18} />
            Jobs Analyzed
          </h3>
          <div className="space-y-2">
            {trendsData.jobs.map((job) => (
              <div
                key={job.jobId}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onJobSelect?.(job.jobId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{job.jobTitle}</h4>
                      <span className="text-sm text-gray-500">at {job.companyName}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{job.matchedSkillsCount} matched</span>
                      <span>{job.missingSkillsCount} missing</span>
                      <span>{job.weakSkillsCount} weak</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xl font-bold ${getScoreColor(job.overallGapScore)}`}>
                      {job.overallGapScore}%
                    </span>
                    {onJobSelect && <ArrowRight size={16} className="text-gray-400" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Common Missing Skills */}
        {trendsData.commonMissingSkills.length > 0 && (
          <div>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Target size={18} className="text-red-600" />
              Most Common Missing Skills
            </h3>
            <div className="space-y-3">
              {trendsData.commonMissingSkills.map((skill, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 bg-red-50 border-red-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{skill.skillName}</span>
                      <Badge className="bg-blue-100 text-blue-800">
                        {skill.frequency}/{trendsData.totalJobs} jobs ({skill.percentage}%)
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {skill.importance.map((imp, idx) => (
                      <Badge
                        key={idx}
                        className={getImportanceBadgeColor(imp)}
                      >
                        {imp}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${skill.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Common Weak Skills */}
        {trendsData.commonWeakSkills.length > 0 && (
          <div>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-yellow-600" />
              Most Common Weak Skills
            </h3>
            <div className="space-y-3">
              {trendsData.commonWeakSkills.map((skill, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 bg-yellow-50 border-yellow-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{skill.skillName}</span>
                      <Badge className="bg-blue-100 text-blue-800">
                        {skill.frequency}/{trendsData.totalJobs} jobs ({skill.percentage}%)
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {skill.priority.map((pri, idx) => (
                      <Badge
                        key={idx}
                        className={`${
                          pri === 'high'
                            ? 'bg-red-100 text-red-800'
                            : pri === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {pri} priority
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{ width: `${skill.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-gray-900 mb-2">Key Insights</h4>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>
              • You've analyzed {trendsData.totalJobs} job{trendsData.totalJobs !== 1 ? 's' : ''} with an average gap score of {trendsData.averageGapScore}%
            </li>
            {trendsData.commonMissingSkills.length > 0 && (
              <li>
                • The most common missing skill is "{trendsData.commonMissingSkills[0].skillName}" 
                (appears in {trendsData.commonMissingSkills[0].percentage}% of jobs)
              </li>
            )}
            {trendsData.commonWeakSkills.length > 0 && (
              <li>
                • The most common weak skill is "{trendsData.commonWeakSkills[0].skillName}" 
                (appears in {trendsData.commonWeakSkills[0].percentage}% of jobs)
              </li>
            )}
            <li>
              • Focus on improving the common skills across all jobs to maximize your job match potential
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

