import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  Clock,
  Search,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/firebase/useAuth';
import { createApplicationHistory, getApplicationHistoryByJobId, getJobOpportunitiesByUserId } from '@/lib/jobs.api';

interface ApplicationHistoryEntry {
  id: string;
  status: ApplicationStatus;
  timestamp: string;
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryMin: string;
  salaryMax: string;
  deadline?: string;
  industry: string;
  jobType: string;
  applicationHistory: ApplicationHistoryEntry[];
}

type ApplicationStatus = 
  | 'interested'
  | 'applied'
  | 'phone_screen'
  | 'interview'
  | 'offer'
  | 'rejected';

const PIPELINE_STAGES: { status: ApplicationStatus; label: string; color: string; bgColor: string }[] = [
  { status: 'interested', label: 'Interested', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  { status: 'applied', label: 'Applied', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  { status: 'phone_screen', label: 'Phone Screen', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  { status: 'interview', label: 'Interview', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  { status: 'offer', label: 'Offer', color: 'text-green-700', bgColor: 'bg-green-100' },
  { status: 'rejected', label: 'Rejected', color: 'text-red-700', bgColor: 'bg-red-100' },
];

export default function JobApplicationPipeline() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [jobs, setJobs] = useState<Job[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [draggedJob, setDraggedJob] = useState<Job | null>(null);

    useEffect(() => {
        if (user?.uid) {
            loadJobs();
        }
        }, [user]);

        const loadJobs = async () => {
        if (!user?.uid) return;
        setLoading(true);
        try {
            const jobsData = await getJobOpportunitiesByUserId(user.uid) as Job[];
            const jobsWithHistory = await Promise.all(
            jobsData.map(async (job: Job) => {
                const history = await getApplicationHistoryByJobId(job.id);
                return { ...job, applicationHistory: history };
            })
            );
            setJobs(jobsWithHistory as Job[]);
        } catch (error) {
            console.error("Failed to load jobs:", error);
            setErrorMessage("Failed to load jobs. Please try again.");
        } finally {
            setLoading(false);
        }
    };

  // Helper: Get current status from most recent history entry
  const getCurrentStatus = (job: Job): ApplicationStatus => {
    if (!job.applicationHistory.length) return 'interested';
    const sorted = [...job.applicationHistory].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return sorted[0].status;
  };

  // Helper: Get days in current stage
  const getDaysInStage = (job: Job): number => {
    if (!job.applicationHistory.length) return 0;
    const sorted = [...job.applicationHistory].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const mostRecent = sorted[0];
    const daysDiff = Math.floor(
      (Date.now() - new Date(mostRecent.timestamp).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysDiff;
  };

  // Helper: Check if deadline is approaching
  const isDeadlineApproaching = (job: Job): boolean => {
    if (!job.deadline) return false;
    const deadline = new Date(job.deadline);
    const today = new Date();
    const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 7 && daysUntil >= 0;
  };

  // Filter jobs by search term
  const filteredJobs = useMemo(() => {
    if (!searchTerm) return jobs;
    const term = searchTerm.toLowerCase();
    return jobs.filter(job =>
      job.title.toLowerCase().includes(term) ||
      job.company.toLowerCase().includes(term) ||
      job.location.toLowerCase().includes(term)
    );
  }, [jobs, searchTerm]);

  // Group jobs by current status
  const jobsByStage = useMemo(() => {
    const grouped: Record<ApplicationStatus, Job[]> = {
      interested: [],
      applied: [],
      phone_screen: [],
      interview: [],
      offer: [],
      rejected: [],
    };

    filteredJobs.forEach(job => {
      const status = getCurrentStatus(job);
      grouped[status].push(job);
    });

    return grouped;
  }, [filteredJobs]);

  // Drag and drop handlers
  const handleDragStart = (job: Job) => {
    setDraggedJob(job);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetStatus: ApplicationStatus) => {
    if (!draggedJob) return;

    const currentStatus = getCurrentStatus(draggedJob);
    if (currentStatus === targetStatus) {
        setDraggedJob(null);
        return;
    }

    try {
        // Call API to create new application history entry
        await createApplicationHistory({ 
        jobId: draggedJob.id, 
        status: targetStatus 
        });

        // Reload jobs to get updated history
        await loadJobs();
        
    } catch (error) {
        console.error("Failed to update status:", error);
        setErrorMessage("Failed to update job status. Please try again.");
        setTimeout(() => setErrorMessage(''), 3000);
    } finally {
        setDraggedJob(null);
    }
    };

  const formatSalary = (min: string, max: string) => {
    if (!min && !max) return 'Not specified';
    if (min && max) return `$${parseInt(min).toLocaleString()} - $${parseInt(max).toLocaleString()}`;
    if (min) return `From $${parseInt(min).toLocaleString()}`;
    return `Up to $${parseInt(max).toLocaleString()}`;
  };

  return (
    <div className="w-full h-screen flex flex-col border border-[#3bafba] rounded-xl p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Application Pipeline</h1>
            <p className="text-gray-600 mt-1">Track your applications through each stage</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <span className="font-semibold">{filteredJobs.length}</span> active applications
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            type="text"
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Pipeline Stages */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 h-full min-w-max pb-4">
          {PIPELINE_STAGES.map(stage => (
            <div
              key={stage.status}
              className="flex-shrink-0 w-80 flex flex-col"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage.status)}
            >
              {/* Stage Header */}
              <div className={`${stage.bgColor} rounded-t-lg px-4 py-3 border-b-2 ${stage.color.replace('text-', 'border-')}`}>
                <div className="flex items-center justify-between">
                  <h3 className={`font-semibold ${stage.color}`}>
                    {stage.label}
                  </h3>
                  <span className={`${stage.bgColor} ${stage.color} px-2 py-1 rounded-full text-sm font-medium`}>
                    {jobsByStage[stage.status].length}
                  </span>
                </div>
              </div>

              {/* Stage Content */}
              <div className="flex-1 bg-gray-100 rounded-b-lg p-3 overflow-y-auto space-y-3">
                {jobsByStage[stage.status].length === 0 ? (
                  <div className="text-center text-gray-400 text-sm mt-8">
                    No jobs in this stage
                  </div>
                ) : (
                  jobsByStage[stage.status].map(job => (
                    <Card
                      key={job.id}
                      draggable
                      onDragStart={() => handleDragStart(job)}
                      className="cursor-move hover:shadow-lg transition-shadow bg-white"
                    >
                      <CardContent className="p-4 space-y-3">
                        {/* Title & Company */}
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
                            {job.title}
                          </h4>
                          <div className="flex items-center gap-2 text-gray-600 text-xs">
                            <Building2 size={14} />
                            <span className="font-medium">{job.company}</span>
                          </div>
                        </div>

                        {/* Location & Salary */}
                        <div className="space-y-1.5 text-xs text-gray-600">
                          {job.location && (
                            <div className="flex items-center gap-2">
                              <MapPin size={14} className="text-gray-400" />
                              <span>{job.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <DollarSign size={14} className="text-gray-400" />
                            <span>{formatSalary(job.salaryMin, job.salaryMax)}</span>
                          </div>
                        </div>

                        {/* Days in Stage */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Clock size={14} className="text-gray-400" />
                            <span>{getDaysInStage(job)} days in stage</span>
                          </div>
                        </div>

                        {/* Warnings & Actions */}
                        <div className="flex items-center justify-between">
                          {isDeadlineApproaching(job) && (
                            <div className="flex items-center gap-1 text-xs text-orange-600 font-medium">
                              <AlertCircle size={14} />
                              <span>Deadline soon</span>
                            </div>
                          )}
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                            {job.industry}
                          </span>
                          <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">
                            {job.jobType}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Footer */}
      <div className="mt-6 grid grid-cols-6 gap-4">
        {PIPELINE_STAGES.map(stage => {
          const count = jobsByStage[stage.status].length;
          const percentage = filteredJobs.length > 0 
            ? ((count / filteredJobs.length) * 100).toFixed(0)
            : 0;
          
          return (
            <Card key={stage.status} className={stage.bgColor}>
              <CardContent className="p-4 text-center">
                <div className={`text-2xl font-bold ${stage.color}`}>{count}</div>
                <div className="text-xs text-gray-600 mt-1">{stage.label}</div>
                <div className="text-xs text-gray-500 mt-1">{percentage}%</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}