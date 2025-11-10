import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, MapPin, Building2, DollarSign, Calendar, ExternalLink, Briefcase, AlertTriangle, Edit2, Save, ArrowLeft, User, Phone, Mail, Clock, FileText } from 'lucide-react';
import JobNotesCard from './jobNotesCard';
import SearchBox, {JobFilters} from './SearchBox';
import JobCard from './jobCard';
import { Job, ApplicationHistoryEntry } from '@/types/jobs.types';
import { useAuth } from '@/contexts/AuthContext';
import {
  createJobOpportunity,
  getJobOpportunitiesByUserId,
  updateJobOpportunity,
  deleteJobOpportunity,
  createJobContact,
  getJobContactsByJobId,
  deleteJobContact,
  createApplicationHistory,
  getApplicationHistoryByJobId,
  ApplicationStatus,
  updateApplicationHistory,
} from '@/lib/jobs.api';
import { FieldDescription } from '../ui/field';


const INDUSTRIES = [
  "Technology", "Finance", "Healthcare", "Education", "Manufacturing",
  "Retail", "Consulting", "Marketing", "Real Estate", "Other"
];

const JOB_TYPES = [
  "Full-time", "Part-time", "Contract", "Temporary", "Internship", "Remote", "Hybrid"
];

export default function JobOpportunitiesManager() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);

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
      const jobsWithExtras = await Promise.all(
        jobsData.map(async (job: Job) => {
          const contacts = await getJobContactsByJobId(job.id);
          const history = await getApplicationHistoryByJobId(job.id);
          return { ...job, contacts, applicationHistory: history };
        })
      );
      setJobs(jobsWithExtras as Job[]);
    } catch (error) {
      console.error("Failed to load jobs:", error);
      setErrorMessage("Failed to load job opportunities. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'edit'>('list');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [jobTitleError, setJobTtitleError] = useState<string>("")
  const [companyNameError, setCompanyNameError] = useState<string>("")
  const [rangeError, setRangeError] = useState<string>("")
  const [formData, setFormData] = useState({
    title: '', company: '', location: '', salaryMin: '', salaryMax: '',
    postingUrl: '', deadline: '', description: '', industry: 'Technology',
    jobType: 'Full-time', personalNotes: '', salaryNegotiationNotes: '', interviewNotes: ''
  });
  const [filters, setFilters] = useState<JobFilters>({
    searchTerm: '',
    industry: 'all',
    jobType: 'all',
    location: '',
    salaryMin: '',
    salaryMax: '',
    deadlineFrom: '',
    deadlineTo: '',
    sortBy: 'dateAdded'
  });
  

  const filteredJobs = useMemo(() => {
    let result = [...jobs];
    
    // Search
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(job => 
        job.title?.toLowerCase().includes(term) ||
        job.company?.toLowerCase().includes(term) ||
        job.description?.toLowerCase().includes(term)
      );
    }
    
    // Industry
    if (filters.industry !== 'all') {
      result = result.filter(job => job.industry === filters.industry);
    }
    
    // Job Type
    if (filters.jobType !== 'all') {
      result = result.filter(job => job.jobType === filters.jobType);
    }
    
    // Location
    if (filters.location) {
      result = result.filter(job => 
        job.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    
    // Salary Min
    if (filters.salaryMin) {
      result = result.filter(job => {
        const jobSalary = parseInt(job.salaryMax || job.salaryMin || '0');
        return jobSalary >= parseInt(filters.salaryMin);
      });
    }
    
    // Salary Max
    if (filters.salaryMax) {
      result = result.filter(job => {
        const jobSalary = parseInt(job.salaryMin || job.salaryMax || '999999999');
        return jobSalary <= parseInt(filters.salaryMax);
      });
    }
    
    // Deadline From
    if (filters.deadlineFrom && result.length > 0) {
      result = result.filter(job => 
        job.deadline && new Date(job.deadline) >= new Date(filters.deadlineFrom)
      );
    }
    
    // Deadline To
    if (filters.deadlineTo && result.length > 0) {
      result = result.filter(job => 
        job.deadline && new Date(job.deadline) <= new Date(filters.deadlineTo)
      );
    }
    
    // Sorting
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'deadline':
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case 'salary':
          const aSalary = parseInt(a.salaryMax || a.salaryMin || '0');
          const bSalary = parseInt(b.salaryMax || b.salaryMin || '0');
          return bSalary - aSalary;
        case 'company':
          return a.company.localeCompare(b.company);
        default: // dateAdded
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    
    return result;
  }, [jobs, filters]);

  const handleClearFilters = () => {
    setFilters({
      searchTerm: '',
      industry: 'all',
      jobType: 'all',
      location: '',
      salaryMin: '',
      salaryMax: '',
      deadlineFrom: '',
      deadlineTo: '',
      sortBy: 'dateAdded'
    });
  };

  const [newContact, setNewContact] = useState({ name: '', role: '', email: '', phone: '' });
  const [newHistoryEntry, setNewHistoryEntry] = useState({ status: '', notes: '' });

  const selectedJob = selectedJobId ? jobs.find(j => j.id === selectedJobId) : null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'description' && value.length > 2000) return;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!user?.uid) {
      alert("You must be logged in to save jobs.");
      return;
    }

    setCompanyNameError("")
    setJobTtitleError("")
    setRangeError("")
    var errorFound = false

    if (!formData.title.trim()) {
      setJobTtitleError("Enter a job title")
      errorFound = true
    }

    if (!formData.company.trim()){
      setCompanyNameError("Enter a company name")
      errorFound = true
    }

    if(formData.salaryMax < formData.salaryMin){
      setRangeError("Min range can't be greater than max range")
      errorFound = true
    }

    if (errorFound){
      return
    }

    try {
      const jobData = {
        userId: user.uid,
        title: formData.title,
        company: formData.company,
        location: formData.location || undefined,
        salaryMin: formData.salaryMin || undefined,
        salaryMax: formData.salaryMax || undefined,
        postingUrl: formData.postingUrl || undefined,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
        description: formData.description || undefined,
        industry: formData.industry,
        jobType: formData.jobType,
        personalNotes: formData.personalNotes || undefined,
        salaryNegotiationNotes: formData.salaryNegotiationNotes || undefined,
        interviewNotes: formData.interviewNotes || undefined,
      };

      // Create the job and get the response with the new job ID
      const newJob = await createJobOpportunity(jobData) as Job;
      
      // Now create the initial application history entry
      await createApplicationHistory({
        jobId: newJob.id, // Use the ID from the newly created job
        status: 'interested'
      });

      setSuccessMessage('Job opportunity saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      handleCancel();
      await loadJobs(); // Reload the list
    } catch (error) {
      console.error("Failed to save job:", error);
      setErrorMessage("Failed to save job opportunity. Please try again.");
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleCancel = () => {
    setFormData({
      title: '', company: '', location: '', salaryMin: '', salaryMax: '',
      postingUrl: '', deadline: '', description: '', industry: 'Technology',
      jobType: 'Full-time', personalNotes: '', salaryNegotiationNotes: '', interviewNotes: ''
    });
    setShowForm(false);
  };

  const formatSalary = (min: string, max: string) => {
    if (!min && !max) return 'Not specified';
    if (min && max) return `$${min} - $${max}`;
    if (min) return `From $${min}`;
    return `Up to $${max}`;
  };

  const viewJobDetails = (jobId: string) => {
    setSelectedJobId(jobId);
    setViewMode('detail');
  };

  const editJob = (job: Job) => {
    setSelectedJobId(job.id);
    setFormData({
      title: job.title, company: job.company, location: job.location,
      salaryMin: job.salaryMin, salaryMax: job.salaryMax, postingUrl: job.postingUrl,
      deadline: job.deadline ? job.deadline.split('T')[0] : '', description: job.description, industry: job.industry,
      jobType: job.jobType, personalNotes: job.personalNotes || '',
      salaryNegotiationNotes: job.salaryNegotiationNotes || '',
      interviewNotes: job.interviewNotes || ''
    });
    setViewMode('edit');
  };

  const saveJobEdit = async () => {
    if (!selectedJobId) return;

    setCompanyNameError("")
    setJobTtitleError("")
    setRangeError("")
    var errorFound = false

    if (!formData.title.trim()) {
      setJobTtitleError("Enter a job title")
      errorFound = true
    }

    if (!formData.company.trim()){
      setCompanyNameError("Enter a company name")
      errorFound = true
    }

    if(formData.salaryMax < formData.salaryMin){
      setRangeError("Min range can't be greater than max range")
      errorFound = true
    }

    if (errorFound){
      return
    }

    try {
      const updateData = {
        title: formData.title,
        company: formData.company,
        location: formData.location,
        salaryMin: formData.salaryMin,
        salaryMax: formData.salaryMax,
        postingUrl: formData.postingUrl,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
        description: formData.description,
        industry: formData.industry,
        jobType: formData.jobType,
        personalNotes: formData.personalNotes,
        salaryNegotiationNotes: formData.salaryNegotiationNotes,
        interviewNotes: formData.interviewNotes,
      };

      await updateJobOpportunity(selectedJobId, updateData);
      setSuccessMessage('Job updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setViewMode('detail');
      await loadJobs(); // Reload the list
    } catch (error) {
      console.error("Failed to update job:", error);
      setErrorMessage("Failed to update job. Please try again.");
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const cancelEdit = () => {
    setViewMode('detail');
    setFormData({
      title: '', company: '', location: '', salaryMin: '', salaryMax: '',
      postingUrl: '', deadline: '', description: '', industry: 'Technology',
      jobType: 'Full-time', personalNotes: '', salaryNegotiationNotes: '', interviewNotes: ''
    });
  };

  const addContact = async () => {
    if (!selectedJobId) return;
    
    const {name, email, phone } = newContact;

    if (!name.trim()) {
      setErrorMessage("Contact name is required.");
      return;
    }

    // Optional but validate if filled
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (phone && !/^\+?\d{7,15}$/.test(phone.replace(/[\s()-]/g, ""))) {
      setErrorMessage("Please enter a valid phone number (digits only).");
      return;
    }

    setErrorMessage("")

    try {
      await createJobContact({
        jobId: selectedJobId,
        name: newContact.name,
        role: newContact.role || undefined,
        email: newContact.email || undefined,
        phone: newContact.phone || undefined,
      });

      setNewContact({ name: '', role: '', email: '', phone: '' });
      setSuccessMessage('Contact added successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Reload the job to get updated contacts
      await loadJobs();
    } catch (error) {
      console.error("Failed to add contact:", error);
      setErrorMessage("Failed to add contact. Please try again.");
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const removeContact = async (contactId: string) => {
    try {
      await deleteJobContact(contactId);
      setSuccessMessage('Contact removed successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Reload the job to get updated contacts
      await loadJobs();
    } catch (error) {
      console.error("Failed to remove contact:", error);
      setErrorMessage("Failed to remove contact. Please try again.");
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const backToList = () => {
    setViewMode('list');
    setSelectedJobId(null);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await deleteJobOpportunity(deleteConfirm);
      setDeleteConfirm(null);
      
      if (selectedJobId === deleteConfirm) {
        setViewMode('list');
        setSelectedJobId(null);
      }
      
      await loadJobs(); // Reload the list
      setSuccessMessage('Job deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error("Failed to delete job:", error);
      setErrorMessage("Failed to delete job. Please try again.");
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const formatStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      'interested': 'Interested',
      'applied': 'Applied',
      'phone_screen': 'Phone Screen',
      'interview': 'Interview',
      'offer': 'Offer Received',
      'rejected': 'Rejected'
    };
  
    return statusMap[status] || status;
  };

  // DETAIL VIEW
  if (viewMode === 'detail' && selectedJob) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={backToList} className="flex items-center gap-2">
            <ArrowLeft size={18} /> Back to List
          </Button>
          <Button onClick={() => editJob(selectedJob)} className="flex items-center gap-2 bg-[#3bafba] hover:bg-[#34a0ab]">
            <Edit2 size={18} /> Edit Job
          </Button>
        </div>

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center justify-between">
            <span className="font-medium">{successMessage}</span>
            <button onClick={() => setSuccessMessage('')}><X size={18} /></button>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{selectedJob.title}</CardTitle>
            <div className="flex items-center gap-2 text-gray-600">
              <Building2 size={18} />
              <span className="text-lg">{selectedJob.company}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedJob.location && (
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-gray-400" />
                  <span>{selectedJob.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <DollarSign size={18} className="text-gray-400" />
                <span>{formatSalary(selectedJob.salaryMin, selectedJob.salaryMax)}</span>
              </div>
              {selectedJob.deadline && (
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-gray-400" />
                  <span>Deadline: {new Date(selectedJob.deadline).toLocaleDateString()}</span>
                </div>
              )}
              {selectedJob.postingUrl && (
                <div className="flex items-center gap-2">
                  <ExternalLink size={18} className="text-gray-400" />
                  <a href={selectedJob.postingUrl.startsWith('http') ? selectedJob.postingUrl : 'https://' + selectedJob.postingUrl} 
                     target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    View Posting
                  </a>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">{selectedJob.industry}</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">{selectedJob.jobType}</span>
            </div>

            {selectedJob.description && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Job Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedJob.description}</p>
              </div>
            )}

            
          </CardContent>
        </Card>

        <JobNotesCard 
          job={selectedJob}
          onNotesUpdate={(jobId, field, value) => {
            // Update local state immediately for optimistic UI
            setJobs(prev => prev.map(job => 
              job.id === jobId 
                ? { ...job, [field]: value }
                : job
            ));
          }}
        />

        {/* Contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User size={20} /> Contacts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMessage && (
              <FieldDescription className="text-destructive">
                {errorMessage}
              </FieldDescription>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input 
                placeholder="Contact Name" 
                value={newContact.name}
                onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))} 
              />
              <Input placeholder="Role (e.g., Recruiter)" value={newContact.role}
                onChange={(e) => setNewContact(prev => ({ ...prev, role: e.target.value }))} />
              <Input placeholder="Email" type="email" value={newContact.email}
                onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))} />
              <Input placeholder="Phone" value={newContact.phone}
                onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))} />
            </div>
            <Button onClick={addContact} className="bg-[#3bafba] hover:bg-[#34a0ab]">
              <Plus size={18} className="mr-2" /> Add Contact
            </Button>

            {selectedJob?.contacts?.length > 0 && (
              <div className="space-y-3 mt-4">
                {selectedJob.contacts.map((contact, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="font-semibold">{contact.name}</div>
                        {contact.role && <div className="text-sm text-gray-600">{contact.role}</div>}
                        {contact.email && (
                          <div className="text-sm flex items-center gap-2">
                            <Mail size={14} />
                            <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">{contact.email}</a>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="text-sm flex items-center gap-2">
                            <Phone size={14} /> <span>{contact.phone}</span>
                          </div>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeContact(contact.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <X size={18} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Application History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock size={20} /> Application History</CardTitle>
          </CardHeader>
          <CardContent className="">
            {selectedJob.applicationHistory.length > 0 && (
              <div className="space-y-3 mt-4">
                {selectedJob.applicationHistory.map((entry) => (
                  <div key={entry.id} className="border-l-4 border-[#3bafba] pl-4 py-2">
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-semibold text-gray-900">{formatStatus(entry.status)}</div>
                      <div className="text-xs text-gray-500">{new Date(entry.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // EDIT VIEW
  if (viewMode === 'edit' && selectedJob) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={cancelEdit} className="flex items-center gap-2">
            <ArrowLeft size={18} /> Cancel
          </Button>
          <h1 className="text-2xl font-bold">Edit Job Opportunity</h1>
        </div>

        <Card className="border-2 border-[#3bafba]">
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Title <span className="text-red-500">*</span></label>
                  <Input name="title" value={formData.title} onChange={handleChange} placeholder="e.g., Senior Software Engineer" className={jobTitleError ? "border-destructive" : ""}/>
                  {jobTitleError && (
                    <FieldDescription className="text-destructive">
                      {jobTitleError}
                    </FieldDescription>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name <span className="text-red-500">*</span></label>
                  <Input name="company" value={formData.company} onChange={handleChange} placeholder="e.g., Tech Corp Inc." className={companyNameError ? "border-destructive" : ""} />
                  {companyNameError && (
                    <FieldDescription className="text-destructive">
                      {companyNameError}
                    </FieldDescription>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <Input name="location" value={formData.location} onChange={handleChange} placeholder="e.g., New York, NY" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Posting URL</label>
                  <Input name="postingUrl" type="url" value={formData.postingUrl} onChange={handleChange} placeholder="https://..."/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range (Min)</label>
                  <Input name="salaryMin" type="number" value={formData.salaryMin} onChange={handleChange} placeholder="80000" className={rangeError ? "border-destructive" : ""} />
                  {rangeError && (
                    <FieldDescription className="text-destructive">
                      {rangeError}
                    </FieldDescription>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range (Max)</label>
                  <Input name="salaryMax" type="number" value={formData.salaryMax} onChange={handleChange} placeholder="120000" className={rangeError ? "border-destructive" : ""} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Application Deadline</label>
                  <Input name="deadline" type="date" value={formData.deadline} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                  <select name="industry" value={formData.industry} onChange={handleChange}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {INDUSTRIES.map(industry => <option key={industry} value={industry}>{industry}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                  <select name="jobType" value={formData.jobType} onChange={handleChange}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {JOB_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange}
                  placeholder="Enter job description..." rows={6} maxLength={2000}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-4">
                <Button onClick={saveJobEdit} className="flex items-center gap-2 bg-[#3bafba] hover:bg-[#34a0ab]">
                  <Save size={18} /> Save Changes
                </Button>
                <Button variant="outline" onClick={cancelEdit}>Cancel</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Opportunities</h1>
          <p className="text-gray-600 mt-1">Track positions you're interested in applying for</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-[#3bafba] hover:bg-[#34a0ab]">
          <Plus size={20} /> Add Job
        </Button>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center justify-between">
          <span className="font-medium">{successMessage}</span>
          <button onClick={() => setSuccessMessage('')}><X size={18} /></button>
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center justify-between">
          <span className="font-medium">{errorMessage}</span>
          <button onClick={() => setErrorMessage('')}><X size={18} /></button>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full shadow-2xl">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="text-red-600" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Job Opportunity?</h3>
                  <p className="text-sm text-gray-600 mb-6">Are you sure? This action cannot be undone.</p>
                  <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                    <Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Delete</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <SearchBox 
          filters={filters}
          onFilterChange={setFilters}
          onClearFilters={handleClearFilters}
          industries={INDUSTRIES}
          jobTypes={JOB_TYPES}
          resultCount={filteredJobs.length}
        />

      {showForm && (
        <Card className="border-2 border-[#3bafba] shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Briefcase size={24} /> Add New Job Opportunity</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Title <span className="text-red-500">*</span></label>
                  <Input name="title" value={formData.title} onChange={handleChange} placeholder="e.g., Senior Software Engineer" className={jobTitleError ? "border-destructive" : ""}/>
                  {jobTitleError && (
                    <FieldDescription className="text-destructive">
                      {jobTitleError}
                    </FieldDescription>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name <span className="text-red-500">*</span></label>
                  <Input name="company" value={formData.company} onChange={handleChange} placeholder="e.g., Tech Corp Inc." className={companyNameError ? "border-destructive" : ""}/>
                  {companyNameError && (
                    <FieldDescription className="text-destructive">
                      {companyNameError}
                    </FieldDescription>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <Input name="location" value={formData.location} onChange={handleChange} placeholder="e.g., New York, NY" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Posting URL</label>
                  <Input name="postingUrl" type="url" value={formData.postingUrl} onChange={handleChange} placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range (Min)</label>
                  <Input name="salaryMin" type="number" value={formData.salaryMin} onChange={handleChange} placeholder="80000" className={rangeError ? "border-destructive" : ""}/>
                  {rangeError && (
                    <FieldDescription className="text-destructive">
                      {rangeError}
                    </FieldDescription>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range (Max)</label>
                  <Input name="salaryMax" type="number" value={formData.salaryMax} onChange={handleChange} placeholder="120000" className={rangeError ? "border-destructive" : ""}/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Application Deadline</label>
                  <Input name="deadline" type="date" value={formData.deadline} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                  <select name="industry" value={formData.industry} onChange={handleChange}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {INDUSTRIES.map(industry => <option key={industry} value={industry}>{industry}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                  <select name="jobType" value={formData.jobType} onChange={handleChange}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {JOB_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description <span className="text-gray-500 text-xs ml-2">({formData.description.length}/2000)</span>
                </label>
                <textarea name="description" value={formData.description} onChange={handleChange}
                  placeholder="Enter job description..." rows={6} maxLength={2000}
                  className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSubmit} className="flex-1 md:flex-none bg-[#3bafba] hover:bg-[#34a0ab]">
                  Save Job Opportunity
                </Button>
                <Button variant="outline" onClick={handleCancel} className="flex-1 md:flex-none">Cancel</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3bafba] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading job opportunities...</p>
          </CardContent>
        </Card>
       ) : jobs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Briefcase className="mx-auto mb-4 text-gray-400" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No job opportunities yet</h3>
              <p className="text-gray-600 mb-4">Start tracking positions you're interested in applying for</p>
              <Button onClick={() => setShowForm(true)} className="flex items-center gap-2 mx-auto bg-[#3bafba] hover:bg-[#34a0ab]">
                <Plus size={20} /> Add Your First Job
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredJobs.map(job => (
            <JobCard 
            key={job.id} 
            job={job} 
            onDelete={handleDelete}
            onViewDetails={viewJobDetails}
            searchTerm={filters.searchTerm}
            />
          ))
        )}
    </div>
  )
}