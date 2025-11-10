import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  X, 
  MapPin, 
  Building2, 
  DollarSign, 
  Calendar, 
  ExternalLink,
  Clock,
  AlertCircle,
  Eye,
  Edit2
} from 'lucide-react';
import { Job } from '@/types/jobs.types';


interface JobCardProps {
  job: Job;
  onDelete: (id: string) => void;
  onViewDetails: (jobId: string) => void;
  searchTerm?: string;
}

export default function JobCard({ job, onDelete, onViewDetails, searchTerm = '' }: JobCardProps) {
  
  // Helper function to format salary range
  const formatSalary = (min: string, max: string) => {
    if (!min && !max) return 'Not specified';
    if (min && max) return `$${parseInt(min).toLocaleString()} - $${parseInt(max).toLocaleString()}`;
    if (min) return `From $${parseInt(min).toLocaleString()}`;
    return `Up to $${parseInt(max).toLocaleString()}`;
  };

  // Helper function to highlight search terms
  const highlightText = (text: string, term: string) => {
    if (!term || !text) return text;
    
    const parts = text.split(new RegExp(`(${term})`, 'gi'));
    return (
      <>
        {parts.map((part, index) => 
          part.toLowerCase() === term.toLowerCase() ? (
            <mark key={index} className="bg-yellow-200 px-1 rounded">
              {part}
            </mark>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </>
    );
  };

  // Check if deadline is approaching (within 7 days)
  const isDeadlineApproaching = () => {
    if (!job.deadline) return false;
    const deadline = new Date(job.deadline);
    const today = new Date();
    const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 7 && daysUntil >= 0;
  };

  // Check if deadline has passed
  const isDeadlinePassed = () => {
    if (!job.deadline) return false;
    return new Date(job.deadline) < new Date();
  };

  const formatUrl = (url: string) => {
    if (!url) return '#';
    return url.startsWith('http://') || url.startsWith('https://') 
      ? url 
      : `https://${url}`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        {/* Header with Title and Delete Button */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {highlightText(job.title, searchTerm)}
            </h3>
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Building2 size={16} />
              <span className="font-medium">
                {highlightText(job.company, searchTerm)}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(job.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Delete job"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Job Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {job.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin size={16} className="text-gray-400 shrink-0" />
              <span>{job.location}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <DollarSign size={16} className="text-gray-400 shrink-0" />
            <span>{formatSalary(job.salaryMin, job.salaryMax)}</span>
          </div>
          
          {job.deadline && (
            <div className={`flex items-center gap-2 text-sm ${
              isDeadlinePassed() 
                ? 'text-red-600' 
                : isDeadlineApproaching() 
                ? 'text-yellow-600 font-medium' 
                : 'text-green-600'
            }`}>
              {isDeadlinePassed() ? (
                <AlertCircle size={16} className="shrink-0" />
              ) : isDeadlineApproaching() ? (
                <Clock size={16} className="shrink-0" />
              ) : (
                <Calendar size={16} className="text-gray-400 shrink-0" />
              )}
              <span>
                {isDeadlinePassed() ? 'Deadline passed: ' : 'Deadline: '}
                {new Date(job.deadline).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </span>
            </div>
          )}
          
          {job.postingUrl && (
            <div className="flex items-center gap-2 text-sm">
              <ExternalLink size={16} className="text-gray-400 shrink-0" />
              <a 
                href={formatUrl(job.postingUrl)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline truncate"
              >
                View Posting
              </a>
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
          
          {/* Deadline warning badge */}
          {isDeadlineApproaching() && !isDeadlinePassed() && (
            <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full flex items-center gap-1">
              <Clock size={12} />
              Deadline Soon
            </span>
          )}
          
          {isDeadlinePassed() && (
            <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full flex items-center gap-1">
              <AlertCircle size={12} />
              Expired
            </span>
          )}
        </div>

        {/* Description */}
        {job.description && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">
              {highlightText(job.description, searchTerm)}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
            <Button
                onClick={(e) => {
                e.stopPropagation();
                onViewDetails(job.id);
                }}
                variant="outline"
                size="sm"
                className="flex-1"
            >
                <Eye size={16} className="mr-2" />
                View Details
            </Button>
        </div>

        {/* Date Added Footer */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Added {new Date(job.createdAt).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}