import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, MapPin, Building2, DollarSign, Calendar, ExternalLink, Briefcase, AlertTriangle, Edit2, Eye, Save, ArrowLeft, User, Phone, Mail, Clock, FileText, DollarSign as NegotiationIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import JobNotesCard from './jobNotesCard';

const INDUSTRIES = [
  "Technology", "Finance", "Healthcare", "Education", "Manufacturing",
  "Retail", "Consulting", "Marketing", "Real Estate", "Other"
];

const JOB_TYPES = [
  "Full-time", "Part-time", "Contract", "Temporary", "Internship", "Remote", "Hybrid"
];

interface ApplicationHistoryEntry {
  id: string;
  timestamp: string;
  status: string;
  notes: string;
}

interface ContactInfo {
  name: string;
  role: string;
  email: string;
  phone: string;
}

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
  personalNotes: string;
  contacts: ContactInfo[];
  applicationHistory: ApplicationHistoryEntry[];
  salaryNegotiationNotes: string;
  interviewNotes: string;
}

export default function JobOpportunitiesManager() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'edit'>('list');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '', company: '', location: '', salaryMin: '', salaryMax: '',
    postingUrl: '', deadline: '', description: '', industry: 'Technology',
    jobType: 'Full-time', personalNotes: '', salaryNegotiationNotes: '', interviewNotes: ''
  });

  const [newContact, setNewContact] = useState({ name: '', role: '', email: '', phone: '' });
  const [newHistoryEntry, setNewHistoryEntry] = useState({ status: '', notes: '' });

  const selectedJob = selectedJobId ? jobs.find(j => j.id === selectedJobId) : null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'description' && value.length > 2000) return;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.company.trim()) {
      alert('Please fill in all required fields (Job Title and Company Name)');
      return;
    }

    const newJob: Job = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString(),
      contacts: [],
      applicationHistory: []
    };

    setJobs(prev => [newJob, ...prev]);
    setSuccessMessage('Job opportunity saved successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
    handleCancel();
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
      deadline: job.deadline, description: job.description, industry: job.industry,
      jobType: job.jobType, personalNotes: job.personalNotes || '',
      salaryNegotiationNotes: job.salaryNegotiationNotes || '',
      interviewNotes: job.interviewNotes || ''
    });
    setViewMode('edit');
  };

  const saveJobEdit = () => {
    if (!selectedJobId) return;
    setJobs(prev => prev.map(job => job.id === selectedJobId ? { ...job, ...formData } : job));
    setSuccessMessage('Job updated successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
    setViewMode('detail');
  };

  const cancelEdit = () => {
    setViewMode('detail');
    setFormData({
      title: '', company: '', location: '', salaryMin: '', salaryMax: '',
      postingUrl: '', deadline: '', description: '', industry: 'Technology',
      jobType: 'Full-time', personalNotes: '', salaryNegotiationNotes: '', interviewNotes: ''
    });
  };

  const addContact = () => {
    if (!selectedJobId || !newContact.name.trim()) return;
    setJobs(prev => prev.map(job =>
      job.id === selectedJobId ? { ...job, contacts: [...job.contacts, { ...newContact }] } : job
    ));
    setNewContact({ name: '', role: '', email: '', phone: '' });
    setSuccessMessage('Contact added successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const removeContact = (contactIndex: number) => {
    if (!selectedJobId) return;
    setJobs(prev => prev.map(job =>
      job.id === selectedJobId ? { ...job, contacts: job.contacts.filter((_, i) => i !== contactIndex) } : job
    ));
  };

  const addHistoryEntry = () => {
    if (!selectedJobId || !newHistoryEntry.status.trim()) return;
    const entry: ApplicationHistoryEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      status: newHistoryEntry.status,
      notes: newHistoryEntry.notes
    };
    setJobs(prev => prev.map(job =>
      job.id === selectedJobId ? { ...job, applicationHistory: [entry, ...job.applicationHistory] } : job
    ));
    setNewHistoryEntry({ status: '', notes: '' });
    setSuccessMessage('Application history updated!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const backToList = () => {
    setViewMode('list');
    setSelectedJobId(null);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      setJobs(prev => prev.filter(job => job.id !== deleteConfirm));
      setDeleteConfirm(null);
      if (selectedJobId === deleteConfirm) {
        setViewMode('list');
        setSelectedJobId(null);
      }
    }
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

            {selectedJob.personalNotes && (
              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <FileText size={20} /> Personal Notes
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap bg-blue-100 p-4 rounded-lg border border-blue-200">
                  {selectedJob.personalNotes}
                </p>
              </div>
            )}

            {selectedJob.interviewNotes && (
              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <FileText size={20} /> Interview Notes & Feedback
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap bg-blue-100 p-4 rounded-lg border border-blue-200">
                  {selectedJob.interviewNotes}
                </p>
              </div>
            )}

            {selectedJob.salaryNegotiationNotes && (
              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <FileText size={20} /> Salary Negotiation Notes
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap bg-blue-100 p-4 rounded-lg border border-blue-200">
                  {selectedJob.salaryNegotiationNotes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <JobNotesCard />

        {/* Contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User size={20} /> Contacts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input placeholder="Contact Name" value={newContact.name}
                onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))} />
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

            {selectedJob.contacts.length > 0 && (
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
                      <Button variant="ghost" size="sm" onClick={() => removeContact(index)}
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
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Input placeholder="Status (e.g., Applied, Phone Screen)" value={newHistoryEntry.status}
                onChange={(e) => setNewHistoryEntry(prev => ({ ...prev, status: e.target.value }))} />
              <textarea placeholder="Notes about this stage..." value={newHistoryEntry.notes}
                onChange={(e) => setNewHistoryEntry(prev => ({ ...prev, notes: e.target.value }))} rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3bafba] resize-none placeholder:text-gray-500" />
              <Button onClick={addHistoryEntry} className="bg-[#3bafba] hover:bg-[#34a0ab]">
                <Plus size={18} className="mr-2" /> Add Entry
              </Button>
            </div>

            {selectedJob.applicationHistory.length > 0 && (
              <div className="space-y-3 mt-4">
                {selectedJob.applicationHistory.map((entry) => (
                  <div key={entry.id} className="border-l-4 border-[#3bafba] pl-4 py-2">
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-semibold text-gray-900">{entry.status}</div>
                      <div className="text-xs text-gray-500">{new Date(entry.timestamp).toLocaleString()}</div>
                    </div>
                    {entry.notes && <p className="text-sm text-gray-700">{entry.notes}</p>}
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
                  <Input name="title" value={formData.title} onChange={handleChange} placeholder="e.g., Senior Software Engineer" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name <span className="text-red-500">*</span></label>
                  <Input name="company" value={formData.company} onChange={handleChange} placeholder="e.g., Tech Corp Inc." />
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
                  <Input name="salaryMin" type="number" value={formData.salaryMin} onChange={handleChange} placeholder="80000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range (Max)</label>
                  <Input name="salaryMax" type="number" value={formData.salaryMax} onChange={handleChange} placeholder="120000" />
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

      {deleteConfirm && (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full shadow-2xl">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
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
                  <Input name="title" value={formData.title} onChange={handleChange} placeholder="e.g., Senior Software Engineer" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name <span className="text-red-500">*</span></label>
                  <Input name="company" value={formData.company} onChange={handleChange} placeholder="e.g., Tech Corp Inc." />
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
                  <Input name="salaryMin" type="number" value={formData.salaryMin} onChange={handleChange} placeholder="80000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range (Max)</label>
                  <Input name="salaryMax" type="number" value={formData.salaryMax} onChange={handleChange} placeholder="120000" />
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
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

      <div className="space-y-4">
        {jobs.length === 0 ? (
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
          jobs.map(job => (
            <Card key={job.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => viewJobDetails(job.id)}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{job.title}</h3>
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <Building2 size={16} />
                      <span className="font-medium">{job.company}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm"
                      onClick={(e) => { e.stopPropagation(); viewJobDetails(job.id); }}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                      <Eye size={18} />
                    </Button>
                    <Button variant="ghost" size="sm"
                      onClick={(e) => { e.stopPropagation(); handleDelete(job.id); }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      <X size={20} />
                    </Button>
                  </div>
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
                  {job.applicationHistory.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock size={16} className="text-gray-400" />
                      <span>{job.applicationHistory.length} update(s)</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mb-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">{job.industry}</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">{job.jobType}</span>
                  {job.contacts.length > 0 && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                      {job.contacts.length} contact{job.contacts.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {job.description && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-700 line-clamp-2">{job.description}</p>
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