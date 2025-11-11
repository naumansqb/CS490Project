import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Archive, 
  ArchiveRestore, 
  Search,
  Trash2,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  ArrowLeft,
  Eye
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getArchivedJobs, 
  restoreJobOpportunity,
  permanentlyDeleteJob 
} from '@/lib/jobs.api';
import { Job } from '@/types/jobs.types';
import { PermanentDeleteConfirmation, ArchiveBadge, RestoreButton } from './ArchiveUIComponents';

export default function ArchivedJobsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{id: string; title: string} | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (user?.uid) {
      loadArchivedJobs();
    }
  }, [user]);

  const loadArchivedJobs = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const data = await getArchivedJobs(user.uid) as Job[];
      setJobs(data);
    } catch (error) {
      console.error('Failed to load archived jobs:', error);
      setErrorMessage('Failed to load archived jobs');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (jobId: string) => {
    try {
      await restoreJobOpportunity(jobId);
      setSuccessMessage('Job restored successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      await loadArchivedJobs();
    } catch (error) {
      console.error('Failed to restore job:', error);
      setErrorMessage('Failed to restore job');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handlePermanentDelete = async (jobId: string) => {
    try {
      await permanentlyDeleteJob(jobId);
      setDeleteConfirm(null);
      setSuccessMessage('Job permanently deleted');
      setTimeout(() => setSuccessMessage(''), 3000);
      await loadArchivedJobs();
    } catch (error) {
      console.error('Failed to delete job:', error);
      setErrorMessage('Failed to delete job');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      job.title.toLowerCase().includes(term) ||
      job.company.toLowerCase().includes(term) ||
      job.location?.toLowerCase().includes(term)
    );
  });

  const formatSalary = (min: string, max: string) => {
    if (!min && !max) return 'Not specified';
    if (min && max) return `$${parseInt(min).toLocaleString()} - $${parseInt(max).toLocaleString()}`;
    if (min) return `From $${parseInt(min).toLocaleString()}`;
    return `Up to $${parseInt(max).toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading archived jobs...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.history.back()}
            >
              <ArrowLeft size={16} className="mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Archive size={32} className="text-gray-600" />
              Archived Jobs
            </h1>
          </div>
          <p className="text-gray-600">
            {jobs.length} archived job{jobs.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center justify-between">
          <span className="font-medium">{successMessage}</span>
          <button onClick={() => setSuccessMessage('')}>
            <X size={18} />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center justify-between">
          <span className="font-medium">{errorMessage}</span>
          <button onClick={() => setErrorMessage('')}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <Input
          type="text"
          placeholder="Search archived jobs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Archive className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No matching archived jobs' : 'No archived jobs'}
            </h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try a different search term' : 'Archived jobs will appear here'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map(job => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {job.title}
                    </h3>
                    <div className="flex items-center gap-2 text-gray-600 mb-3">
                      <Building2 size={16} />
                      <span className="font-medium">{job.company}</span>
                    </div>
                    <ArchiveBadge 
                      reason={job.archiveReason} 
                      archivedAt={job.archivedAt} 
                    />
                  </div>
                </div>

                {/* Job Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {job.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin size={16} className="text-gray-400" />
                      <span>{job.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign size={16} className="text-gray-400" />
                    <span>{formatSalary(job.salaryMin, job.salaryMax)}</span>
                  </div>
                  {job.deadline && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={16} className="text-gray-400" />
                      <span>
                        Deadline: {new Date(job.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    {job.industry}
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    {job.jobType}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <RestoreButton jobId={job.id} onRestore={handleRestore} />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirm({ id: job.id, title: job.title })}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                    Delete Permanently
                  </Button>
                </div>

                {/* Original Date */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Originally added {new Date(job.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <PermanentDeleteConfirmation
          jobId={deleteConfirm.id}
          jobTitle={deleteConfirm.title}
          onConfirm={handlePermanentDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}