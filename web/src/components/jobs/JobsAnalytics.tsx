import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Briefcase, 
  TrendingUp, 
  Clock, 
  Calendar,
  Target,
  Award,
  BarChart3,
  PieChart
} from 'lucide-react';
import { ApplicationHistoryEntry, Job } from '@/types/jobs.types';
import { useAuth } from '@/contexts/AuthContext';
import { getJobOpportunitiesByUserId, getApplicationHistoryByJobId } from '@/lib/jobs.api';

interface JobWithStats extends Job {
  currentStatus: string;
  appliedOnTime: boolean | null;
}

export default function JobStatisticsDashboard() {
  const [jobs, setJobs] = useState<JobWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('all');
  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      if (!user?.uid) return;
      setLoading(true);
      try {
        const jobsData = await getJobOpportunitiesByUserId(user.uid) as Job[];
        const jobsWithHistory = await Promise.all(
          jobsData.map(async (job) => {
            const history = await getApplicationHistoryByJobId(job.id) as ApplicationHistoryEntry[];
            
            // Determine current status
            const currentStatus = history.length > 0 
              ? history[history.length - 1].status 
              : 'saved';
            
            // Calculate if applied on time
            let appliedOnTime: boolean | null = null;
            if (job.deadline) {
              const appliedEntry = history.find(h => h.status === 'applied');
              if (appliedEntry) {
                appliedOnTime = new Date(appliedEntry.timestamp) <= new Date(job.deadline);
              }
            }
            
            return { 
              ...job, 
              applicationHistory: history,
              currentStatus,
              appliedOnTime
            } as JobWithStats;
          })
        );
        setJobs(jobsWithHistory);
      } catch (error) {
        console.error("Failed to load jobs:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const filteredJobs = useMemo(() => {
    if (timeframe === 'all') return jobs;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeframe));
    
    return jobs.filter(job => new Date(job.createdAt) >= cutoffDate);
  }, [jobs, timeframe]);

  // Calculate statistics
  const stats = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    let totalApplied = 0;
    let totalResponses = 0;
    let totalDeadlines = 0;
    let metDeadlines = 0;
    let timeToOfferSum = 0;
    let offersReceived = 0;
    
    const stageTimes: Record<string, number[]> = {
      saved: [],
      applied: [],
      phone_screen: [],
      interview_scheduled: [],
      interviewed: [],
      offer_received: []
    };
    
    const monthlyApplications: Record<string, number> = {};

    filteredJobs.forEach(job => {
      const currentStatus = job.currentStatus;
      statusCounts[currentStatus] = (statusCounts[currentStatus] || 0) + 1;
      
      // Check if job was applied to
      const appliedStage = job.applicationHistory.find(h => h.status === 'applied');
      if (appliedStage) {
        totalApplied++;
        
        // Check for responses (any stage past applied)
        const hasResponse = job.applicationHistory.some(h => 
          ['phone_screen', 'interview_scheduled', 'interviewed', 'offer_received', 'accepted', 'rejected'].includes(h.status)
        );
        if (hasResponse) totalResponses++;
        
        // Track monthly applications
        const month = new Date(appliedStage.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        monthlyApplications[month] = (monthlyApplications[month] || 0) + 1;
      }
      
      // Deadline tracking
      if (job.deadline) {
        totalDeadlines++;
        if (job.appliedOnTime) metDeadlines++;
      }
      
      // Time in each stage
      job.applicationHistory.forEach((entry, index) => {
        if (stageTimes[entry.status] !== undefined) {
          // Calculate days in this stage
          let daysInStage = 0;
          if (index < job.applicationHistory.length - 1) {
            const currentDate = new Date(entry.timestamp);
            const nextDate = new Date(job.applicationHistory[index + 1].timestamp);
            daysInStage = Math.floor((nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
          } else {
            // For the last stage, calculate from entry to now
            const currentDate = new Date(entry.timestamp);
            const now = new Date();
            daysInStage = Math.floor((now.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
          }
          stageTimes[entry.status].push(daysInStage);
        }
      });
      
      // Time to offer
      if (currentStatus === 'offer_received' || currentStatus === 'accepted') {
        const firstEntry = new Date(job.applicationHistory[0]?.timestamp || job.createdAt);
        const offerEntry = job.applicationHistory.find(h => h.status === 'offer_received');
        if (offerEntry) {
          const offerDate = new Date(offerEntry.timestamp);
          const days = Math.floor((offerDate.getTime() - firstEntry.getTime()) / (1000 * 60 * 60 * 24));
          timeToOfferSum += days;
          offersReceived++;
        }
      }
    });

    // Calculate averages
    const avgStageTimes: Record<string, number> = {};
    Object.keys(stageTimes).forEach(stage => {
      const times = stageTimes[stage];
      avgStageTimes[stage] = times.length > 0 
        ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) 
        : 0;
    });

    const responseRate = totalApplied > 0 ? Math.round((totalResponses / totalApplied) * 100) : 0;
    const deadlineAdherence = totalDeadlines > 0 ? Math.round((metDeadlines / totalDeadlines) * 100) : 0;
    const avgTimeToOffer = offersReceived > 0 ? Math.round(timeToOfferSum / offersReceived) : 0;

    return {
      statusCounts,
      totalJobs: filteredJobs.length,
      totalApplied,
      responseRate,
      deadlineAdherence,
      avgTimeToOffer,
      avgStageTimes,
      monthlyApplications
    };
  }, [filteredJobs]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      saved: 'bg-gray-100 text-gray-800',
      applied: 'bg-blue-100 text-blue-800',
      phone_screen: 'bg-purple-100 text-purple-800',
      interview: 'bg-orange-100 text-orange-800',
      offer_received: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatStatusLabel = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading statistics...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Search Statistics</h1>
          <p className="text-gray-600 mt-1">Track your progress and identify patterns</p>
        </div>
        <div>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="h-10 px-4 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Time</option>
            <option value="30">Last 30 Days</option>
            <option value="60">Last 60 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Jobs Tracked</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalJobs}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Briefcase className="text-blue-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Applications Sent</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalApplied}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Target className="text-green-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Response Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.responseRate}%</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.totalApplied > 0 ? `${Object.values(stats.statusCounts).reduce((a, b) => a + b, 0) - (stats.statusCounts.saved || 0) - (stats.statusCounts.applied || 0)} responses` : 'No applications yet'}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="text-purple-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Time to Offer</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.avgTimeToOffer > 0 ? `${stats.avgTimeToOffer}d` : 'N/A'}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="text-orange-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs by Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart size={20} />
            Jobs by Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(stats.statusCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([status, count]) => (
                <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-2 ${getStatusColor(status)}`}>
                    {formatStatusLabel(status)}
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {Math.round((count / stats.totalJobs) * 100)}% of total
                  </p>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Average Time in Each Stage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock size={20} />
            Average Time in Each Stage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(stats.avgStageTimes)
              .filter(([, days]) => days > 0)
              .map(([stage, days]) => (
                <div key={stage}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {formatStatusLabel(stage)}
                    </span>
                    <span className="text-sm font-bold text-gray-900">{days} days</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((days / 30) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Application Volume */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 size={20} />
            Monthly Application Volume
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(stats.monthlyApplications).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.monthlyApplications)
                .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                .map(([month, count]) => {
                  const maxCount = Math.max(...Object.values(stats.monthlyApplications));
                  return (
                    <div key={month}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{month}</span>
                        <span className="text-sm font-bold text-gray-900">{count} applications</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-green-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${(count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No applications tracked yet</p>
          )}
        </CardContent>
      </Card>

      {/* Deadline Adherence */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar size={20} />
            Application Deadline Adherence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white mb-4">
              <div className="text-center">
                <p className="text-4xl font-bold">{stats.deadlineAdherence}%</p>
                <p className="text-xs opacity-90">On Time</p>
              </div>
            </div>
            <p className="text-gray-600 mt-4">
              Applied before deadline in {stats.deadlineAdherence}% of cases with deadlines
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award size={20} />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.responseRate >= 20 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800">
                  🎉 Great response rate! Your {stats.responseRate}% response rate is above average.
                </p>
              </div>
            )}
            
            {stats.responseRate < 10 && stats.totalApplied >= 10 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-800">
                  💡 Consider refining your application strategy. Your response rate could be improved.
                </p>
              </div>
            )}
            
            {stats.deadlineAdherence >= 90 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800">
                  ⏰ Excellent time management! You're meeting {stats.deadlineAdherence}% of deadlines.
                </p>
              </div>
            )}
            
            {stats.avgTimeToOffer > 0 && stats.avgTimeToOffer <= 30 && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm font-medium text-purple-800">
                  🚀 Fast hiring process! Average time to offer is just {stats.avgTimeToOffer} days.
                </p>
              </div>
            )}
            
            {Object.keys(stats.monthlyApplications).length === 0 && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm font-medium text-gray-800">
                  📝 Start tracking your applications to see detailed statistics and insights.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}