import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Phone,
  User,
  Edit2,
  Trash2,
  Plus,
  Save,
  AlertTriangle
} from 'lucide-react';
import {
  createInterview,
  getInterviewByJobId,
  updateInterview,
  deleteInterview,
  Interview,
} from '@/lib/interviews.api';

interface InterviewManagementProps {
  jobId: string;
  jobTitle: string;
  companyName: string;
  onClose: () => void;
  onInterviewChange?: () => void;
}

const INTERVIEW_TYPES = [
  { value: 'phone', label: 'Phone Interview', icon: Phone },
  { value: 'video', label: 'Video Interview', icon: Video },
  { value: 'in-person', label: 'In-Person Interview', icon: MapPin },
];

const INTERVIEW_STATUSES = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rescheduled', label: 'Rescheduled' },
];

export default function InterviewManagement({
  jobId,
  jobTitle,
  companyName,
  onClose,
  onInterviewChange,
}: InterviewManagementProps) {
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    scheduled_date: '',
    scheduled_time: '',
    interview_type: 'video' as 'phone' | 'video' | 'in-person',
    duration_minutes: 60,
    status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled' | 'rescheduled',
    location: '',
    meeting_link: '',
    phone_number: '',
    interviewer_name: '',
  });

  useEffect(() => {
    loadInterview();
  }, [jobId]);

  const loadInterview = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await getInterviewByJobId(jobId);
      if (data) {
        setInterview(data);
        populateFormData(data);
      }
    } catch (error) {
      console.error('Failed to load interview:', error);
      setErrorMessage('Failed to load interview data');
    } finally {
      setLoading(false);
    }
  };

  const populateFormData = (interviewData: Interview) => {
    const date = new Date(interviewData.scheduled_date);
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = date.toTimeString().slice(0, 5);

    setFormData({
      scheduled_date: dateStr,
      scheduled_time: timeStr,
      interview_type: interviewData.interview_type,
      duration_minutes: interviewData.duration_minutes,
      status: interviewData.status,
      location: interviewData.location || '',
      meeting_link: interviewData.meeting_link || '',
      phone_number: interviewData.phone_number || '',
      interviewer_name: interviewData.interviewer_name || '',
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration_minutes' ? parseInt(value) : value,
    }));
  };

  const validateForm = (): boolean => {
    setErrorMessage('');

    if (!formData.scheduled_date) {
      setErrorMessage('Interview date is required');
      return false;
    }

    if (!formData.scheduled_time) {
      setErrorMessage('Interview time is required');
      return false;
    }

    // Validate conditional fields based on interview type
    if (formData.interview_type === 'in-person' && !formData.location.trim()) {
      setErrorMessage('Location is required for in-person interviews');
      return false;
    }

    if (formData.interview_type === 'video' && !formData.meeting_link.trim()) {
      setErrorMessage('Meeting link is required for video interviews');
      return false;
    }

    if (formData.interview_type === 'phone' && !formData.phone_number.trim()) {
      setErrorMessage('Phone number is required for phone interviews');
      return false;
    }

    // Validate meeting link format if provided
    if (formData.meeting_link && !isValidUrl(formData.meeting_link)) {
      setErrorMessage('Please enter a valid meeting link URL');
      return false;
    }

    return true;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setErrorMessage('');
    try {
      // Combine date and time into ISO string
      const scheduledDateTime = new Date(
        `${formData.scheduled_date}T${formData.scheduled_time}:00`
      ).toISOString();

      const payload = {
        jobId: jobId,
        scheduled_date: scheduledDateTime,  // camelCase for API
        interview_type: formData.interview_type,  // camelCase for API
        duration_minutes: formData.duration_minutes,  // camelCase for API
        status: formData.status,
        location: formData.location || undefined,
        meeting_link: formData.meeting_link || undefined,  // camelCase for API
        phone_number: formData.phone_number || undefined,  // camelCase for API
        interviewer_name: formData.interviewer_name || undefined,  // camelCase for API
      };

      if (isEditing && interview) {
        // Update existing interview - remove jobId from payload
        const { jobId: _, ...updatePayload } = payload;
        const updatedInterview = await updateInterview(interview.id, updatePayload);
        setInterview(updatedInterview);
        setSuccessMessage('Interview updated successfully');
      } else {
        // Create new interview - use full payload with jobId
        const newInterview = await createInterview(payload);
        setInterview(newInterview);
        setSuccessMessage('Interview scheduled successfully');
      }

      setIsEditing(false);
      setIsAdding(false);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      if (onInterviewChange) {
        onInterviewChange();
      }
    } catch (error: any) {
      console.error('Failed to save interview:', error);
      const errorMsg = error?.message || 'Failed to save interview. Please try again.';
      setErrorMessage(errorMsg);
    }
  };

  const handleDelete = async () => {
    if (!interview) return;

    setErrorMessage('');
    try {
      await deleteInterview(interview.id);
      setInterview(null);
      setDeleteConfirm(false);
      setSuccessMessage('Interview deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      if (onInterviewChange) {
        onInterviewChange();
      }
    } catch (error: any) {
      console.error('Failed to delete interview:', error);
      setDeleteConfirm(false);
      const errorMsg = error?.message || 'Failed to delete interview. Please try again.';
      setErrorMessage(errorMsg);
    }
  };

  const handleCancel = () => {
    if (interview) {
      populateFormData(interview);
    }
    setIsEditing(false);
    setIsAdding(false);
    setErrorMessage('');
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
    };
  };

  const getInterviewTypeIcon = (type: string) => {
    const typeData = INTERVIEW_TYPES.find(t => t.value === type);
    return typeData ? typeData.icon : Calendar;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'rescheduled':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
        <Card className="w-full max-w-2xl mx-4">
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3bafba] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading interview data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl my-8">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">Manage Interview</CardTitle>
              <p className="text-gray-600 font-medium">{jobTitle}</p>
              <p className="text-gray-500 text-sm">{companyName}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
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

          {/* Delete Confirmation Modal */}
          {deleteConfirm && (
            <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="text-red-600" size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">Delete Interview?</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    This will permanently delete this interview. This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <Button 
                      onClick={handleDelete} 
                      className="bg-red-600 hover:bg-red-700"
                      size="sm"
                    >
                      Delete
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setDeleteConfirm(false)}
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* View Mode */}
          {interview && !isEditing && !isAdding && (
            <div className="space-y-4">
              <div className="border rounded-lg p-6 space-y-4">
                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(interview.status)}`}>
                    {INTERVIEW_STATUSES.find(s => s.value === interview.status)?.label}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    INTERVIEW_TYPES.find(t => t.value === interview.interview_type)?.value === 'phone' 
                      ? 'bg-purple-100 text-purple-800'
                      : INTERVIEW_TYPES.find(t => t.value === interview.interview_type)?.value === 'video'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {INTERVIEW_TYPES.find(t => t.value === interview.interview_type)?.label}
                  </span>
                </div>

                {/* Date & Time */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar size={18} className="text-gray-400" />
                    <span className="font-medium">{formatDateTime(interview.scheduled_date).date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock size={18} className="text-gray-400" />
                    <span>{formatDateTime(interview.scheduled_date).time} ({interview.duration_minutes} minutes)</span>
                  </div>
                </div>

                {/* Interview Details */}
                {interview.location && (
                  <div className="flex items-start gap-2 text-gray-700">
                    <MapPin size={18} className="text-gray-400 mt-0.5 shrink-0" />
                    <span>{interview.location}</span>
                  </div>
                )}

                {interview.meeting_link && (
                  <div className="flex items-start gap-2 text-gray-700">
                    <Video size={18} className="text-gray-400 mt-0.5 shrink-0" />
                    <a 
                      href={interview.meeting_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {interview.meeting_link}
                    </a>
                  </div>
                )}

                {interview.phone_number && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone size={18} className="text-gray-400" />
                    <a href={`tel:${interview.phone_number}`} className="text-blue-600 hover:underline">
                      {interview.phone_number}
                    </a>
                  </div>
                )}

                {interview.interviewer_name && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <User size={18} className="text-gray-400" />
                    <span>{interview.interviewer_name}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button 
                  onClick={() => setIsEditing(true)} 
                  className="flex-1 bg-[#3bafba] hover:bg-[#34a0ab]"
                >
                  <Edit2 size={18} className="mr-2" />
                  Edit Interview
                </Button>
                <Button 
                  onClick={() => setDeleteConfirm(true)} 
                  variant="outline"
                  className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                >
                  <Trash2 size={18} className="mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}

          {/* No Interview - Add Button */}
          {!interview && !isAdding && (
            <div className="text-center py-12">
              <Calendar className="mx-auto mb-4 text-gray-400" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Interview Scheduled</h3>
              <p className="text-gray-600 mb-6">Schedule an interview for this job opportunity</p>
              <Button 
                onClick={() => setIsAdding(true)} 
                className="bg-[#3bafba] hover:bg-[#34a0ab]"
              >
                <Plus size={18} className="mr-2" />
                Schedule Interview
              </Button>
            </div>
          )}

          {/* Edit/Add Form */}
          {(isEditing || isAdding) && (
            <div className="space-y-4 border rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interview Date <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    name="scheduled_date"
                    value={formData.scheduled_date}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interview Time <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="time"
                    name="scheduled_time"
                    value={formData.scheduled_time}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Interview Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interview Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="interview_type"
                    value={formData.interview_type}
                    onChange={handleInputChange}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#3bafba]"
                  >
                    {INTERVIEW_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <Input
                    type="number"
                    name="duration_minutes"
                    value={formData.duration_minutes}
                    onChange={handleInputChange}
                    min="15"
                    max="480"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#3bafba]"
                  >
                    {INTERVIEW_STATUSES.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Interviewer Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interviewer Name
                  </label>
                  <Input
                    name="interviewer_name"
                    value={formData.interviewer_name}
                    onChange={handleInputChange}
                    placeholder="e.g., John Smith"
                  />
                </div>
              </div>

              {/* Conditional Fields Based on Interview Type */}
              {formData.interview_type === 'in-person' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g., 123 Main St, Building A, Floor 5"
                  />
                </div>
              )}

              {formData.interview_type === 'video' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Link <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="meeting_link"
                    value={formData.meeting_link}
                    onChange={handleInputChange}
                    placeholder="https://zoom.us/j/..."
                  />
                </div>
              )}

              {formData.interview_type === 'phone' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    placeholder="e.g., +1 (555) 123-4567"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleSave} 
                  className="flex-1 bg-[#3bafba] hover:bg-[#34a0ab]"
                >
                  <Save size={18} className="mr-2" />
                  {isAdding ? 'Schedule Interview' : 'Save Changes'}
                </Button>
                <Button 
                  onClick={handleCancel} 
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}