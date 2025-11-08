import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAutoSaveNotes } from '@/hooks/autoSaveNotes';

interface Job {
  id: string;
  personalNotes?: string;
  interviewNotes?: string;
  salaryNegotiationNotes?: string;
}

interface JobNotesCardProps {
  job: Job;
  onNotesUpdate: (jobId: string, field: string, value: string) => void;
}

export default function JobNotesCard({ job, onNotesUpdate }: JobNotesCardProps) {
  const [activeTab, setActiveTab] = useState('personal');
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saving' | 'saved' | 'error' | null>(null);
  
  const { debouncedSave } = useAutoSaveNotes({
    jobId: job.id,
    enabled: true,
    onSaveSuccess: () => {
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus(null), 2000);
    },
    onSaveError: (error) => {
      setAutoSaveStatus('error');
      console.error('Auto-save failed:', error);
      setTimeout(() => setAutoSaveStatus(null), 3000);
    },
    debounceMs: 1000,
  });

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Update local state immediately for instant feedback
    onNotesUpdate(job.id, name, value);
    
    // Trigger debounced save
    setAutoSaveStatus('saving');
    debouncedSave(name as 'personalNotes' | 'salaryNegotiationNotes' | 'interviewNotes', value);
  };

  return (
    <div className="">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Additional Notes</CardTitle>
            {autoSaveStatus === 'saving' && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </span>
            )}
            {autoSaveStatus === 'saved' && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Saved
              </span>
            )}
            {autoSaveStatus === 'error' && (
              <span className="text-xs text-red-600 flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Failed to save
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Centered Tab Triggers */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex rounded-lg border border-gray-300 p-1 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setActiveTab('personal')}
                className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'personal'
                    ? 'bg-[#3bafba] text-white shadow-sm'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Personal Notes
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('interview')}
                className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'interview'
                    ? 'bg-[#3bafba] text-white shadow-sm'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Interview Notes
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('salary')}
                className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'salary'
                    ? 'bg-[#3bafba] text-white shadow-sm'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Salary Notes
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {/* Personal Notes Tab */}
            {activeTab === 'personal' && (
              <div className="space-y-4">
                <textarea
                  name="personalNotes"
                  value={job.personalNotes || ''}
                  onChange={handleChange}
                  placeholder="Add your personal thoughts about this opportunity, company culture insights, gut feelings, pros/cons..."
                  rows={8}
                  className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#3bafba] focus:border-transparent resize-none bg-white placeholder:text-gray-500"
                />
              </div>
            )}

            {/* Interview Notes Tab */}
            {activeTab === 'interview' && (
              <div className="space-y-4">
                <textarea
                  name="interviewNotes"
                  value={job.interviewNotes || ''}
                  onChange={handleChange}
                  placeholder="Record interview questions, your responses, interviewer impressions, follow-up items, feedback received..."
                  rows={8}
                  className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#3bafba] focus:border-transparent resize-none bg-white placeholder:text-gray-500"
                />
              </div>
            )}

            {/* Salary Notes Tab */}
            {activeTab === 'salary' && (
              <div className="space-y-4">
                <textarea
                  name="salaryNegotiationNotes"
                  value={job.salaryNegotiationNotes || ''}
                  onChange={handleChange}
                  placeholder="Market research, target salary range, negotiation talking points, benefits to discuss, counter-offer strategy..."
                  rows={8}
                  className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#3bafba] focus:border-transparent resize-none bg-white placeholder:text-gray-500"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}