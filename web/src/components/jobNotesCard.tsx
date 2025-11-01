import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function JobNotesCard() {
  const [activeTab, setActiveTab] = useState('personal');
  const [formData, setFormData] = useState({
    personalNotes: '',
    interviewNotes: '',
    salaryNegotiationNotes: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="">
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
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
                    value={formData.personalNotes}
                    onChange={handleChange}
                    placeholder="Add your personal thoughts about this opportunity, company culture insights, gut feelings, pros/cons..."
                    rows={8}
                    className="w-full px-4 py-3 border  rounded-md focus:outline-none focus:ring-2 focus:ring-[#3bafba] focus:border-transparent resize-none bg-white placeholder:text-gray-500"
                  />
              </div>
            )}

            {/* Interview Notes Tab */}
            {activeTab === 'interview' && (
              <div className="space-y-4">
                  <textarea
                    name="interviewNotes"
                    value={formData.interviewNotes}
                    onChange={handleChange}
                    placeholder="Record interview questions, your responses, interviewer impressions, follow-up items, feedback received..."
                    rows={8}
                    className="w-full px-4 py-3 border  rounded-md focus:outline-none focus:ring-2 focus:ring-[#3bafba] focus:border-transparent resize-none bg-white placeholder:text-gray-500"
                  />
              </div>
            )}

            {/* Salary Notes Tab */}
            {activeTab === 'salary' && (
              <div className="space-y-4">
                  <textarea
                    name="salaryNegotiationNotes"
                    value={formData.salaryNegotiationNotes}
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