import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, MapPin, Building2, DollarSign, Calendar, ExternalLink, Briefcase, AlertTriangle } from 'lucide-react';

const INDUSTRIES = [
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "Manufacturing",
  "Retail",
  "Consulting",
  "Marketing",
  "Real Estate",
  "Other"
];

const JOB_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Temporary",
  "Internship",
  "Remote",
  "Hybrid"
];

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryMin: string;
  salaryMax: string;
  postingUrl: string;
  deadline: string;
  description: string;
  industry: string;
  jobType: string;
  createdAt: string;
}

export default function JobOpportunitiesManager() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    salaryMin: '',
    salaryMax: '',
    postingUrl: '',
    deadline: '',
    description: '',
    industry: 'Technology',
    jobType: 'Full-time'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'description' && value.length > 2000) {
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.company.trim()) {
      alert('Please fill in all required fields (Job Title and Company Name)');
      return;
    }

    const newJob: Job = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString()
    };

    setJobs(prev => [newJob, ...prev]);
    setSuccessMessage('Job opportunity saved successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
    handleCancel();
  };

  const handleCancel = () => {
    setFormData({
      title: '',
      company: '',
      location: '',
      salaryMin: '',
      salaryMax: '',
      postingUrl: '',
      deadline: '',
      description: '',
      industry: 'Technology',
      jobType: 'Full-time'
    });
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      setJobs(prev => prev.filter(job => job.id !== deleteConfirm));
      setDeleteConfirm(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const formatSalary = (min: string, max: string) => {
    if (!min && !max) return 'Not specified';
    if (min && max) return `$${min} - $${max}`;
    if (min) return `From $${min}`;
    return `Up to $${max}`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Opportunities</h1>
          <p className="text-gray-600 mt-1">Track positions you're interested in applying for</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 shadow-sm bg-[#3bafba] hover:bg-[#34a0ab] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Plus size={20} />
          Add Job
        </Button>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center justify-between">
          <span className="font-medium">{successMessage}</span>
          <button onClick={() => setSuccessMessage('')}>
            <X size={18} />
          </button>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full shadow-2xl">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="text-red-600" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Delete Job Opportunity?
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Are you sure you want to delete this job opportunity? This action cannot be undone.
                  </p>
                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      onClick={cancelDelete}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={confirmDelete}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showForm && (
        <Card className="border-2 border-[#3bafba] shadow-lg ">
          <CardHeader className="">
            <CardTitle className="flex items-center gap-2">
              <Briefcase size={24} />
              Add New Job Opportunity
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Senior Software Engineer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="e.g., Tech Corp Inc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g., New York, NY"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Posting URL
                  </label>
                  <div className="relative">
                    <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                      name="postingUrl"
                      type="url"
                      value={formData.postingUrl}
                      onChange={handleChange}
                      placeholder="https://..."
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Salary Range (Min)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                      name="salaryMin"
                      type="number"
                      value={formData.salaryMin}
                      onChange={handleChange}
                      placeholder="e.g., 80000"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Salary Range (Max)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                      name="salaryMax"
                      type="number"
                      value={formData.salaryMax}
                      onChange={handleChange}
                      placeholder="e.g., 120000"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Application Deadline
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                      name="deadline"
                      type="date"
                      value={formData.deadline}
                      onChange={handleChange}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry
                  </label>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {INDUSTRIES.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Type
                  </label>
                  <select
                    name="jobType"
                    value={formData.jobType}
                    onChange={handleChange}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {JOB_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description
                  <span className="text-gray-500 text-xs ml-2">
                    ({formData.description.length}/2000 characters)
                  </span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter job description, requirements, responsibilities..."
                  rows={6}
                  maxLength={2000}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSubmit} className="flex-1 md:flex-none shadow-sm bg-[#3bafba] hover:bg-[#34a0ab] disabled:opacity-60 disabled:cursor-not-allowed">
                  Save Job Opportunity
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1 md:flex-none "
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {jobs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Briefcase className="mx-auto mb-4 text-gray-400" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No job opportunities yet</h3>
              <p className="text-gray-600 mb-4">Start tracking positions you're interested in applying for</p>
              <Button onClick={() => setShowForm(true)} className="flex items-center gap-2 mx-auto shadow-sm bg-[#3bafba] hover:bg-[#34a0ab] disabled:opacity-60 disabled:cursor-not-allowed">
                <Plus size={20} />
                Add Your First Job
              </Button>
            </CardContent>
          </Card>
        ) : (
          jobs.map(job => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{job.title}</h3>
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <Building2 size={16} />
                      <span className="font-medium">{job.company}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(job.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X size={20} />
                  </Button>
                </div>

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
                      <span>Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                  {job.postingUrl && (
                    <div className="flex items-center gap-2 text-sm">
                      <ExternalLink size={16} className="text-gray-400" />
                      <a 
                        href={"https://" + job.postingUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View Posting
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mb-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    {job.industry}
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    {job.jobType}
                  </span>
                </div>

                {job.description && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{job.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}