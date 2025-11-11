import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, X, MapPin, Building2, DollarSign, Calendar, ExternalLink, Briefcase, AlertTriangle, Edit2, Save, ArrowLeft, ArrowUp, ArrowDown, User, Phone, Mail, Clock, FileText, Loader2, AlertCircle, SlidersHorizontal, RefreshCw, Download, BarChart2, Bell, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import JobNotesCard from './jobNotesCard';
import SearchBox, {JobFilters} from './SearchBox';
import JobCard from './jobCard';
import CompanyProfile, { CompanyData } from './CompanyProfile';
import CompanyNewsFeed from './CompanyNewsFeed';
import JobMatchScore, { JobMatchScoreData } from './JobMatchScore';
import SkillsGapAnalysis, { SkillsGapData } from './SkillsGapAnalysis';
import InterviewPrepDashboard, { InterviewInsightsData } from './InterviewPrepDashboard';
import SkillsGapTrends from './SkillsGapTrends';
import { Job, ApplicationHistoryEntry } from '@/types/jobs.types';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { apiClient } from '@/lib/api';
import InterviewManagement from './interviewManagement';
import {
  researchCompany,
  researchAndSaveCompany,
  getCompanyNews,
  refreshCompanyNews,
  analyzeJobMatch,
  analyzeSkillsGap,
  analyzeInterviewInsights,
  AnalyzeJobMatchInput,
  getJobMatchPreferences,
  updateJobMatchPreferences,
  getJobMatchHistory,
  getJobMatchComparison,
  exportJobMatchAnalysis,
  JobMatchWeights,
  JobMatchComparisonEntry,
  JobMatchHistoryResponse,
  getNewsAlerts,
  NewsAlertsResponse,
} from '@/lib/company.api';
import { CompanyNewsArticle } from './CompanyNewsFeed';


const INDUSTRIES = [
  "Technology", "Finance", "Healthcare", "Education", "Manufacturing",
  "Retail", "Consulting", "Marketing", "Real Estate", "Other"
];

const JOB_TYPES = [
  "Full-time", "Part-time", "Contract", "Temporary", "Internship", "Remote", "Hybrid"
];

type JobMatchHistoryEntry = JobMatchHistoryResponse["data"]["entries"][number];

const DEFAULT_MATCH_WEIGHTS: JobMatchWeights = {
  skills: 1,
  experience: 1,
  education: 1,
  requirements: 1,
};

const BASE_WEIGHT_FIELDS: Array<"skills" | "experience" | "education" | "requirements"> = [
  "skills",
  "experience",
  "education",
  "requirements",
];

export default function JobOpportunitiesManager() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);

    useEffect(() => {
    if (user?.uid) {
      loadJobs();
      loadNewsAlerts();
    }
  }, [user]);

  // Refresh news alerts periodically (every 5 minutes)
  useEffect(() => {
    if (!user?.uid) return;
    
    const interval = setInterval(() => {
      loadNewsAlerts();
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid) {
      loadMatchPreferences();
    } else {
      setMatchPreferences(null);
      setDefaultMatchPreferences(null);
      setHasCustomMatchPreferences(false);
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
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'edit' | 'interview'>('list');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [jobTitleError, setJobTtitleError] = useState<string>("")
  const [companyNameError, setCompanyNameError] = useState<string>("")
  const [rangeError, setRangeError] = useState<string>("")
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [selectedJobForInterview, setSelectedJobForInterview] = useState<Job | null>(null);
  const openInterviewModal = (job: Job) => {
    setSelectedJobForInterview(job);
    setShowInterviewModal(true);
  };

  const closeInterviewModal = () => {
    setShowInterviewModal(false);
    setSelectedJobForInterview(null);
  };
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
  const [jobUrl, setJobUrl] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');
  
  // Company research state
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);
  
  // Company news state
  const [companyNews, setCompanyNews] = useState<CompanyNewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  
  // Job match analysis state
  const [matchData, setMatchData] = useState<JobMatchScoreData | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
const [matchAnalysisDate, setMatchAnalysisDate] = useState<string | null>(null);
const [matchWeightsUsed, setMatchWeightsUsed] = useState<JobMatchWeights | null>(null);
const [matchCached, setMatchCached] = useState(false);

// Job match preferences & history
const [matchPreferences, setMatchPreferences] = useState<JobMatchWeights | null>(null);
const [defaultMatchPreferences, setDefaultMatchPreferences] = useState<JobMatchWeights | null>(null);
const [preferencesLoading, setPreferencesLoading] = useState(false);
const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);
const [preferencesForm, setPreferencesForm] = useState<JobMatchWeights | null>(null);
const [hasCustomMatchPreferences, setHasCustomMatchPreferences] = useState(false);
const [historyEntries, setHistoryEntries] = useState<JobMatchHistoryEntry[]>([]);
const [historyLoading, setHistoryLoading] = useState(false);

// Comparison & export
const [comparisonData, setComparisonData] = useState<JobMatchComparisonEntry[]>([]);
const [comparisonLoading, setComparisonLoading] = useState(false);
const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
const [comparisonError, setComparisonError] = useState<string | null>(null);
const [comparisonStatusFilter, setComparisonStatusFilter] = useState<string>('all');
const [comparisonMinScore, setComparisonMinScore] = useState<number>(0);
const [exportingComparison, setExportingComparison] = useState(false);
  
  // Skills gap analysis state
  const [gapData, setGapData] = useState<SkillsGapData | null>(null);
  const [gapLoading, setGapLoading] = useState(false);
  const [gapError, setGapError] = useState<string | null>(null);
  
  // Interview insights state
  const [insightsData, setInsightsData] = useState<InterviewInsightsData | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  
  // News alerts state
  const [newsAlerts, setNewsAlerts] = useState<NewsAlertsResponse['data'] | null>(null);
  const [alertsLoading, setAlertsLoading] = useState(false);

  // Accordion state
  const [jobsAccordionOpen, setJobsAccordionOpen] = useState(true);
  const [skillsGapAccordionOpen, setSkillsGapAccordionOpen] = useState(false);
  const [navigatingToCoverLetter, setNavigatingToCoverLetter] = useState(false);

  const handleExtractFromUrl = async () => {
  if (!jobUrl.trim()) {
    setExtractError('Please enter a URL');
    return;
  }

  setExtracting(true);
  setExtractError('');

  try {
    console.log('[Extract Job] Extracting from URL:', jobUrl);

    const result = await apiClient.fetch<{ success: boolean; data: any }>('/ai/job/extract-from-url', {
      method: 'POST',
      body: JSON.stringify({ url: jobUrl }),
    });

    if (!result.success) {
      throw new Error('Failed to extract job data');
    }

    const extracted = result.data;

    // Pre-fill the form with extracted data
    setFormData({
      title: extracted.title || '',
      company: extracted.company || '',
      location: extracted.location || '',
      salaryMin: extracted.salaryMin || '',
      salaryMax: extracted.salaryMax || '',
      postingUrl: jobUrl, // Use the original URL
      deadline: extracted.deadline || '',
      description: extracted.description || '',
      industry: extracted.industry || 'Technology',
      jobType: extracted.jobType || 'Full-time',
      personalNotes: '',
      salaryNegotiationNotes: '',
      interviewNotes: ''
    });

    setSuccessMessage('Job data extracted successfully! Review and save.');
    setTimeout(() => setSuccessMessage(''), 5000);
    setJobUrl(''); // Clear URL field

  } catch (error: any) {
    console.error('[Extract Job] Error:', error);
    
    let errorMessage = 'Failed to extract job data. ';
    
    if (error?.message) {
      errorMessage += error.message;
    } else if (error?.error) {
      errorMessage += error.error;
    } else {
      errorMessage += 'Please try again or enter the job details manually.';
    }
    
    setExtractError(errorMessage);
  } finally {
    setExtracting(false);
  }
};

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

    if(formData.salaryMin && formData.salaryMax){
      const min = Number(formData.salaryMin);
      const max = Number(formData.salaryMax);
      if(!isNaN(min) && !isNaN(max) && min > max){
        setRangeError("Min range can't be greater than max range")
        errorFound = true
      }
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

      // UC-063: Auto-trigger company research in the background
      if (formData.company.trim()) {
        // Trigger company research asynchronously (don't wait for it)
        researchAndSaveCompany({
          companyName: formData.company.trim(),
          jobId: newJob.id,
          forceRefresh: false, // Use cached data if available
        }).catch((error) => {
          // Log error but don't show to user (background process)
          console.error('[Auto Company Research] Failed to research company:', error);
        });
      }

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
    if (min && max) return `$${parseInt(min).toLocaleString()} - $${parseInt(max).toLocaleString()}`;
    if (min) return `From $${parseInt(min).toLocaleString()}`;
    return `Up to $${parseInt(max).toLocaleString()}`;
  };

  const getColorClass = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const viewJobDetails = (jobId: string) => {
    setSelectedJobId(jobId);
    setViewMode('detail');
    // Trigger company research and news when viewing job details
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      setHistoryEntries([]);
      loadCompanyResearch(job.company, jobId);
      loadCompanyNews(job.company, jobId);
      loadJobMatch(jobId);
      loadSkillsGap(jobId);
      loadInterviewInsights(jobId);
    }
  };

  // Load company research data
  const loadCompanyResearch = async (companyName: string, jobId?: string, forceRefresh: boolean = false) => {
    if (!companyName) return;
    
    setCompanyLoading(true);
    setCompanyError(null);
    
    try {
      // Use research-and-save to ensure data is persisted
      const response = await researchAndSaveCompany({
        companyName,
        jobId,
        forceRefresh,
      });
      
      if (response.success && response.data) {
        // Log what we're receiving from the API
        console.log('[Frontend] Company research data received:', {
          companyName: response.data.companyName,
          hasDescription: !!response.data.description,
          hasMission: !!response.data.mission,
          hasProductsAndServices: !!response.data.productsAndServices,
          productsAndServicesCount: response.data.productsAndServices?.length || 0,
          productsAndServicesValue: response.data.productsAndServices,
          hasLeadership: !!response.data.leadership,
          leadershipCount: response.data.leadership?.length || 0,
          leadershipValue: response.data.leadership,
          hasCompetitiveLandscape: !!response.data.competitiveLandscape,
          competitiveLandscapeValue: response.data.competitiveLandscape,
          fullData: response.data,
        });
        setCompanyData(response.data);
      } else {
        throw new Error('Failed to load company research');
      }
    } catch (error: any) {
      console.error('[Company Research Error]', error);
      setCompanyError(
        error?.message || 'Failed to load company information. Please try again.'
      );
      setCompanyData(null);
    } finally {
      setCompanyLoading(false);
    }
  };

  // Load company news data
  const loadCompanyNews = async (companyName: string, jobId?: string) => {
    if (!companyName) return;
    
    setNewsLoading(true);
    setNewsError(null);
    
    try {
      const response = await getCompanyNews({
        companyName,
        jobId,
      });
      
      if (response.success && response.data) {
        setCompanyNews(response.data);
      } else {
        throw new Error('Failed to load company news');
      }
    } catch (error: any) {
      console.error('[Company News Error]', error);
      setNewsError(
        error?.message || 'Failed to load company news. Please try again.'
      );
      setCompanyNews([]);
    } finally {
      setNewsLoading(false);
    }
  };

  const loadMatchPreferences = async (options?: { skipRefresh?: boolean }) => {
    setPreferencesLoading(true);
    try {
      const response = await getJobMatchPreferences();
      if (response.success) {
        setMatchPreferences(response.data.weights);
        setDefaultMatchPreferences(response.data.defaultWeights);
        setHasCustomMatchPreferences(response.data.isCustom);
        setPreferencesForm(response.data.weights);
        if (
          response.data.isCustom &&
          selectedJob &&
          !options?.skipRefresh
        ) {
          await loadJobMatch(selectedJob.id, false, response.data.weights);
        }
      }
    } catch (error) {
      console.error("[Job Match Preferences Error]", error);
    } finally {
      setPreferencesLoading(false);
    }
  };

  const loadJobMatchHistoryEntries = async (
    jobId: string,
    limit: number = 20
  ) => {
    if (!jobId) return;
    setHistoryLoading(true);
    try {
      const response = await getJobMatchHistory(jobId, limit);
      if (response.success) {
        setHistoryEntries(response.data.entries);
      }
    } catch (error) {
      console.error("[Job Match History Error]", error);
      setHistoryEntries([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Load job match analysis data
  const loadJobMatch = async (
    jobId: string,
    forceRefresh: boolean = false,
    overrideWeights?: Partial<JobMatchWeights>
  ) => {
    if (!jobId) return;
    
    setMatchLoading(true);
    setMatchError(null);
    setMatchCached(false);
    setMatchAnalysisDate(null);
    setMatchWeightsUsed(null);
    
    try {
      const payload: AnalyzeJobMatchInput = {
        jobId,
        forceRefresh,
      };
      // Apply default preferences if available (temporary overrides handled elsewhere)
      if (overrideWeights) {
        payload.weights = overrideWeights;
      } else if (matchPreferences) {
        payload.weights = matchPreferences;
      }

      const response = await analyzeJobMatch(payload);
      
      if (response.success && response.data) {
        setMatchData(response.data);
        setMatchCached(Boolean(response.cached));
        setMatchAnalysisDate(response.analysisDate ?? null);
        setMatchWeightsUsed(response.weightsUsed ?? null);
        loadJobMatchHistoryEntries(jobId, 20);
      } else {
        throw new Error('Failed to load job match analysis');
      }
    } catch (error: any) {
      console.error('[Job Match Error]', error);
      setMatchError(
        error?.message || 'Failed to load job match analysis. Please try again.'
      );
      setMatchData(null);
      setMatchWeightsUsed(null);
      setMatchAnalysisDate(null);
    } finally {
      setMatchLoading(false);
    }
  };

  // Load skills gap analysis data
  const loadSkillsGap = async (jobId: string, forceRefresh: boolean = false) => {
    if (!jobId) return;
    
    setGapLoading(true);
    setGapError(null);
    
    try {
      const response = await analyzeSkillsGap({ jobId, forceRefresh });
      
      if (response.success && response.data) {
        setGapData(response.data);
      } else {
        throw new Error('Failed to load skills gap analysis');
      }
    } catch (error: any) {
      console.error('[Skills Gap Error]', error);
      setGapError(
        error?.message || 'Failed to load skills gap analysis. Please try again.'
      );
      setGapData(null);
    } finally {
      setGapLoading(false);
    }
  };

  // Load interview insights data
  const loadNewsAlerts = async () => {
    if (!user?.uid) return;
    
    try {
      setAlertsLoading(true);
      const response = await getNewsAlerts();
      if (response.success) {
        setNewsAlerts(response.data);
      }
    } catch (error) {
      console.error('[News Alerts] Failed to load alerts:', error);
      setNewsAlerts(null);
    } finally {
      setAlertsLoading(false);
    }
  };

  const loadInterviewInsights = async (jobId: string, forceRefresh: boolean = false) => {
    if (!jobId) return;
    
    setInsightsLoading(true);
    setInsightsError(null);
    
    try {
      const response = await analyzeInterviewInsights({ jobId, forceRefresh });
      
      if (response.success && response.data) {
        setInsightsData(response.data);
      } else {
        throw new Error('Failed to load interview insights');
      }
    } catch (error: any) {
      console.error('[Interview Insights Error]', error);
      setInsightsError(
        error?.message || 'Failed to load interview insights. Please try again.'
      );
      setInsightsData(null);
    } finally {
      setInsightsLoading(false);
    }
  };

  const openPreferencesModal = () => {
    const base =
      matchPreferences ||
      defaultMatchPreferences ||
      DEFAULT_MATCH_WEIGHTS;
    setPreferencesForm({
      skills: base.skills,
      experience: base.experience,
      education: base.education,
      requirements: base.requirements,
      customCriteria: base.customCriteria ? { ...base.customCriteria } : undefined,
    });
    setPreferencesModalOpen(true);
  };

  const handlePreferenceInputChange = (
    field: keyof JobMatchWeights,
    value: number
  ) => {
    setPreferencesForm((prev) => {
      const current = prev || DEFAULT_MATCH_WEIGHTS;
      return {
        ...current,
        [field]: Number.isFinite(value) ? Math.max(0.1, Math.min(3, value)) : current[field],
      };
    });
  };

  const handleResetPreferences = () => {
    setPreferencesForm({
      ...DEFAULT_MATCH_WEIGHTS,
    });
  };

  const handleSavePreferences = async () => {
    if (!preferencesForm) return;
    setPreferencesLoading(true);
    try {
      await updateJobMatchPreferences(preferencesForm);
      await loadMatchPreferences({ skipRefresh: true });
      if (selectedJob) {
        await loadJobMatch(selectedJob.id, true, preferencesForm);
      }
      setPreferencesModalOpen(false);
    } catch (error) {
      console.error("[Update Preferences Error]", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to update preferences. Please try again."
      );
    } finally {
      setPreferencesLoading(false);
    }
  };

  const handleApplyPreferencesOnce = async () => {
    if (!preferencesForm || !selectedJob) return;
    await loadJobMatch(selectedJob.id, true, preferencesForm);
    setPreferencesModalOpen(false);
  };

  const loadComparison = async (
    status: string = comparisonStatusFilter,
    minScore: number = comparisonMinScore
  ) => {
    setComparisonLoading(true);
    setComparisonError(null);
    try {
      const response = await getJobMatchComparison({
        status,
        minScore,
        limit: 20,
      });
      if (response.success) {
        setComparisonData(response.data);
      }
    } catch (error: any) {
      console.error("[Job Match Comparison Error]", error);
      setComparisonError(
        error?.message || "Failed to load comparison data. Please try again."
      );
      setComparisonData([]);
    } finally {
      setComparisonLoading(false);
    }
  };

  const openComparisonModal = () => {
    setComparisonModalOpen(true);
    loadComparison();
  };

  const handleExportComparison = async () => {
    if (!comparisonData.length) {
      alert("No job match analyses available to export.");
      return;
    }
    setExportingComparison(true);
    try {
      const blob = await exportJobMatchAnalysis(
        comparisonData.map((item) => item.jobId)
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "job-match-analysis.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("[Export Job Match Analysis Error]", error);
      alert(
        error?.message || "Failed to export job match analysis. Please try again."
      );
    } finally {
      setExportingComparison(false);
    }
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

    if(formData.salaryMin && formData.salaryMax){
      const min = Number(formData.salaryMin);
      const max = Number(formData.salaryMax);
      if(!isNaN(min) && !isNaN(max) && min > max){
        setRangeError("Min range can't be greater than max range")
        errorFound = true
      }
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
    // Clear company data when going back to list
    setCompanyData(null);
    setCompanyError(null);
    setCompanyNews([]);
    setNewsError(null);
    setMatchData(null);
    setMatchError(null);
    setMatchWeightsUsed(null);
    setMatchAnalysisDate(null);
    setMatchCached(false);
    setHistoryEntries([]);
    setGapData(null);
    setGapError(null);
    setInsightsData(null);
    setInsightsError(null);
    setComparisonData([]);
    setComparisonModalOpen(false);
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

  if (showInterviewModal && selectedJobForInterview) {
    return (
      <InterviewManagement
        jobId={selectedJobForInterview.id}
        jobTitle={selectedJobForInterview.title}
        companyName={selectedJobForInterview.company}
        onClose={closeInterviewModal}
        onInterviewChange={loadJobs}
      />
    );
  }

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
        <Button onClick={() => openInterviewModal(selectedJob)} className="flex items-center gap-2 bg-black">
          <Calendar size={18} /> Manage Interview
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

        {/* Company Information & News - Tabbed Interface */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Company Information</TabsTrigger>
            <TabsTrigger value="news">Company News</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            {selectedJob && (
              <CompanyProfile 
                company={companyData}
                companyName={selectedJob.company}
                loading={companyLoading}
                error={companyError}
                companyId={companyData?.id}
                onFollowChange={loadNewsAlerts}
                onRefresh={() => loadCompanyResearch(selectedJob.company, selectedJob.id, true)}
              />
            )}
          </TabsContent>

          <TabsContent value="news" className="mt-6">
            <CompanyNewsFeed
              companyName={selectedJob.company}
              companyId={companyData?.id}
              loading={newsLoading}
              error={newsError}
              news={companyNews}
              onNewsSelect={async (article) => {
                // Store selected news article for cover letter integration
                if (selectedJob) {
                  // Show loading overlay immediately
                  setNavigatingToCoverLetter(true);
                  
                  // Format the news article for cover letter
                  const newsText = `${article.title}. ${article.summary}${article.keyPoints && article.keyPoints.length > 0 ? ` Key points: ${article.keyPoints.join('; ')}.` : ''}`;
                  
                  // Store in localStorage to pass to cover letter page
                  localStorage.setItem('selectedNewsForCoverLetter', JSON.stringify({
                    jobId: selectedJob.id,
                    companyName: selectedJob.company,
                    newsText: newsText,
                    articleTitle: article.title,
                    articleUrl: article.url
                  }));
                  
                  // Small delay to show loading state, then navigate
                  setTimeout(() => {
                    // Navigate to cover letters page
                    router.push('/cover-letters');
                    // Keep loading state until navigation completes (will be cleared on unmount)
                  }, 500);
                }
              }}
              onRefresh={async () => {
                // Reload news when refresh is clicked
                if (selectedJob) {
                  try {
                    const response = await refreshCompanyNews(
                      companyData?.id || selectedJob.company,
                      undefined,
                      !companyData?.id // useName = true if no companyId
                    );
                    if (response.success && response.data) {
                      setCompanyNews(response.data);
                    }
                  } catch (error: any) {
                    console.error('[Company News Refresh Error]', error);
                    // Fallback to regular load
                    loadCompanyNews(selectedJob.company, selectedJob.id);
                  }
                }
              }}
            />
          </TabsContent>
        </Tabs>

        {/* Job Analysis Section - Tabbed Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText size={20} />
              Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs 
              defaultValue="match" 
              className="w-full"
              onValueChange={(value) => {
                // Auto-load data when switching to tabs if not loaded
                if (value === 'skills' && !gapData && !gapLoading && selectedJob) {
                  loadSkillsGap(selectedJob.id);
                }
                if (value === 'interview' && !insightsData && !insightsLoading && selectedJob) {
                  loadInterviewInsights(selectedJob.id);
                }
              }}
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="match">Job Match</TabsTrigger>
                <TabsTrigger value="skills">Skills Gap</TabsTrigger>
                <TabsTrigger value="interview">Interview Prep</TabsTrigger>
              </TabsList>

          <TabsContent value="match" className="mt-6 space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Match Overview
                </h3>
                <p className="text-sm text-gray-500">
                  Fine-tune the scoring to emphasize the criteria that matter most.
                </p>
                {hasCustomMatchPreferences && (
                  <p className="text-xs text-blue-600 mt-1">
                    Custom weighting active
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={openComparisonModal}
                  className="flex items-center gap-2"
                >
                  <BarChart2 size={16} />
                  Compare Jobs
                </Button>
                <Button
                  variant="outline"
                  onClick={() => loadJobMatchHistoryEntries(selectedJob.id, 20)}
                  className="flex items-center gap-2"
                  disabled={historyLoading}
                >
                  {historyLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <RefreshCw size={16} />
                  )}
                  Refresh History
                </Button>
                <Button
                  onClick={openPreferencesModal}
                  className="flex items-center gap-2 bg-[#3bafba] hover:bg-[#34a0ab]"
                >
                  <SlidersHorizontal size={16} />
                  Customize Scoring
                </Button>
              </div>
            </div>

            <JobMatchScore
              jobId={selectedJob.id}
              jobTitle={selectedJob.title}
              companyName={selectedJob.company}
              matchData={matchData}
              loading={matchLoading}
              error={matchError}
              onRefresh={() => loadJobMatch(selectedJob.id, true)}
              analysisDate={matchAnalysisDate}
              weightsUsed={matchWeightsUsed}
              isCached={matchCached}
            />

            <Card>
              <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Clock size={18} />
                  Match History
                </CardTitle>
                {historyEntries.length > 1 && (
                  <span className="text-xs text-gray-500">
                    Showing {Math.min(historyEntries.length, 20)} most recent analyses
                  </span>
                )}
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="flex items-center justify-center py-6 text-gray-500">
                    <Loader2 size={18} className="animate-spin mr-2" />
                    Loading history...
                  </div>
                ) : historyEntries.length ? (
                  <div className="space-y-3">
                    {historyEntries.map((entry, idx) => {
                      const nextEntry = historyEntries[idx + 1];
                      const delta = nextEntry
                        ? entry.overallMatchScore - nextEntry.overallMatchScore
                        : 0;
                      return (
                        <div
                          key={entry.id}
                          className="border rounded-lg p-4 bg-gray-50 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                        >
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {entry.analysisDate
                                ? new Date(entry.analysisDate).toLocaleString()
                                : "Unknown date"}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Skills {entry.categoryScores.skills}% · Experience{" "}
                              {entry.categoryScores.experience}% · Education{" "}
                              {entry.categoryScores.education}% · Requirements{" "}
                              {entry.categoryScores.requirements}%
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`text-lg font-semibold ${getColorClass(entry.overallMatchScore)}`}>
                              {entry.overallMatchScore}%
                            </div>
                            {idx < historyEntries.length - 1 && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                {delta > 0 && (
                                  <>
                                    <ArrowUp size={14} className="text-green-600" />
                                    <span className="text-green-600">
                                      +{delta.toFixed(0)}
                                    </span>
                                  </>
                                )}
                                {delta < 0 && (
                                  <>
                                    <ArrowDown size={14} className="text-red-600" />
                                    <span className="text-red-600">
                                      {delta.toFixed(0)}
                                    </span>
                                  </>
                                )}
                                {delta === 0 && <span>No change</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 text-center py-6">
                    No match analyses yet. Run an analysis to build your history.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skills" className="mt-6">
            <SkillsGapAnalysis
              jobId={selectedJob.id}
              jobTitle={selectedJob.title}
              companyName={selectedJob.company}
              gapData={gapData}
              loading={gapLoading}
              error={gapError}
              onRefresh={() => loadSkillsGap(selectedJob.id, true)}
            />
          </TabsContent>

          <TabsContent value="interview" className="mt-6">
            <InterviewPrepDashboard
              companyName={selectedJob.company}
              jobTitle={selectedJob.title}
              insightsData={insightsData}
              loading={insightsLoading}
              error={insightsError}
              onRefresh={() => loadInterviewInsights(selectedJob.id, true)}
            />
          </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        <Dialog open={preferencesModalOpen} onOpenChange={setPreferencesModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Customize job match weighting</DialogTitle>
              <DialogDescription>
                Adjust each factor between 0.1 and 3 to emphasize what matters most. Values are relative and will be normalized automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {BASE_WEIGHT_FIELDS.map((field) => (
                <div key={field} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 capitalize">
                      {field}
                    </label>
                    <span className="text-xs text-gray-500">
                      Default:{" "}
                      {defaultMatchPreferences
                        ? defaultMatchPreferences[field].toFixed(2)
                        : "1.00"}
                    </span>
                  </div>
                  <Input
                    type="number"
                    min={0.1}
                    max={3}
                    step={0.1}
                    value={
                      (preferencesForm?.[field] ??
                        matchPreferences?.[field] ??
                        DEFAULT_MATCH_WEIGHTS[field]).toString()
                    }
                    onChange={(event) =>
                      handlePreferenceInputChange(
                        field,
                        parseFloat(event.target.value)
                      )
                    }
                  />
                </div>
              ))}
            </div>
            <DialogFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={handleResetPreferences}
                  disabled={preferencesLoading}
                >
                  Reset to default
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleApplyPreferencesOnce}
                  disabled={preferencesLoading || !selectedJob}
                >
                  Apply to this job
                </Button>
                <Button
                  onClick={handleSavePreferences}
                  className="bg-[#3bafba] hover:bg-[#34a0ab]"
                  disabled={preferencesLoading}
                >
                  {preferencesLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "Save as default"
                  )}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={comparisonModalOpen} onOpenChange={setComparisonModalOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Compare job matches</DialogTitle>
              <DialogDescription>
                Review the most recent match score for each job and identify where to focus next.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold uppercase text-gray-500 tracking-wide">
                      Status
                    </label>
                    <select
                      className="border rounded-md px-3 py-2 text-sm"
                      value={comparisonStatusFilter}
                      onChange={(event) => setComparisonStatusFilter(event.target.value)}
                    >
                      <option value="all">All statuses</option>
                      <option value="interested">Interested</option>
                      <option value="applied">Applied</option>
                      <option value="phone_screen">Phone Screen</option>
                      <option value="interview">Interview</option>
                      <option value="offer">Offer</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold uppercase text-gray-500 tracking-wide">
                      Minimum score
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={comparisonMinScore}
                      onChange={(event) =>
                        setComparisonMinScore(
                          Math.min(
                            100,
                            Math.max(0, parseInt(event.target.value || "0", 10))
                          )
                        )
                      }
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => loadComparison()}
                    disabled={comparisonLoading}
                    className="flex items-center gap-2"
                  >
                    {comparisonLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <RefreshCw size={16} />
                    )}
                    Apply filters
                  </Button>
                </div>
                <Button
                  onClick={handleExportComparison}
                  disabled={exportingComparison || !comparisonData.length}
                  className="flex items-center gap-2"
                >
                  {exportingComparison ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Download size={16} />
                  )}
                  Export CSV
                </Button>
              </div>

              {comparisonError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {comparisonError}
                </div>
              )}

              {comparisonLoading ? (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Loading comparison data...
                </div>
              ) : comparisonData.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold text-gray-600">Job</th>
                        <th className="text-left px-3 py-2 font-semibold text-gray-600">Company</th>
                        <th className="text-left px-3 py-2 font-semibold text-gray-600">Status</th>
                        <th className="text-left px-3 py-2 font-semibold text-gray-600">Score</th>
                        <th className="text-left px-3 py-2 font-semibold text-gray-600">Analyzed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {comparisonData.map((entry) => (
                        <tr key={entry.jobId} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium text-gray-900">{entry.title}</td>
                          <td className="px-3 py-2 text-gray-600">{entry.company}</td>
                          <td className="px-3 py-2 text-gray-500 capitalize">
                            {entry.status ? entry.status.replace("_", " ") : "—"}
                          </td>
                          <td className={`px-3 py-2 font-semibold ${getColorClass(entry.latestScore)}`}>
                            {entry.latestScore}%
                          </td>
                          <td className="px-3 py-2 text-gray-500 text-xs">
                            {entry.analysisDate
                              ? new Date(entry.analysisDate).toLocaleString()
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-gray-500 py-6 text-center">
                  No job match analyses found. Run analyses to compare scores.
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

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
      {/* Loading Overlay for Navigation */}
      {navigatingToCoverLetter && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 shadow-2xl max-w-md mx-4 flex flex-col items-center gap-4">
            <Loader2 size={48} className="animate-spin text-[#3bafba]" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Preparing Cover Letter
              </h3>
              <p className="text-sm text-gray-600">
                Adding news article and navigating to cover letter page...
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Opportunities</h1>
          <p className="text-gray-600 mt-1">Track positions you're interested in applying for</p>
        </div>
        <div className="flex items-center gap-3">
          {/* News Alerts Indicator */}
          {newsAlerts && newsAlerts.totalAlerts > 0 && (
            <Button
              variant="outline"
              className="flex items-center gap-2 relative"
              onClick={() => {
                // Scroll to news section or show alerts
                const newsTab = document.querySelector('[value="news"]');
                if (newsTab && selectedJobId) {
                  (newsTab as HTMLElement).click();
                }
              }}
              title={`${newsAlerts.totalAlerts} new news alert${newsAlerts.totalAlerts !== 1 ? 's' : ''} from followed companies`}
            >
              <Bell size={18} className="text-[#3bafba]" />
              <span className="font-medium">News Alerts</span>
              <Badge className="ml-1 bg-red-500 text-white">
                {newsAlerts.totalAlerts}
              </Badge>
            </Button>
          )}
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-[#3bafba] hover:bg-[#34a0ab]">
          <Plus size={20} /> Add Job
        </Button>
        </div>
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
              {/* AI Job Extraction Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-blue-600" />
                  <label className="block text-sm font-semibold text-gray-700">
                    Extract Job Information from URL (AI-Powered)
                  </label>
                </div>
                <p className="text-xs text-gray-600">
                  Paste a job posting URL below and let AI automatically extract and fill in the job details.
                </p>
                <div className="flex gap-2">
                  <Input
                    type="url"
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    placeholder="https://www.linkedin.com/jobs/view/..."
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !extracting) {
                        handleExtractFromUrl();
                      }
                    }}
                  />
                  <Button
                    onClick={handleExtractFromUrl}
                    disabled={extracting || !jobUrl.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                  >
                    {extracting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Extracting...
                      </>
                    ) : (
                      <>
                        <FileText size={16} />
                        Extract
                      </>
                    )}
                  </Button>
                </div>
                {extractError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 flex items-center gap-2">
                    <AlertCircle size={16} />
                    {extractError}
                  </div>
                )}
                {successMessage && successMessage.includes('extracted successfully') && (
                  <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded px-3 py-2 flex items-center gap-2">
                    <AlertCircle size={16} />
                    {successMessage}
                  </div>
                )}
              </div>

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

      {/* Tracked Jobs Accordion */}
      <Card>
        <CardHeader 
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setJobsAccordionOpen(!jobsAccordionOpen)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Briefcase size={20} />
              Tracked Jobs
              {filteredJobs.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filteredJobs.length}
                </Badge>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                setJobsAccordionOpen(!jobsAccordionOpen);
              }}
            >
              {jobsAccordionOpen ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </Button>
          </div>
        </CardHeader>
        {jobsAccordionOpen && (
          <CardContent>
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3bafba] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading job opportunities...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="p-12 text-center">
                <Briefcase className="mx-auto mb-4 text-gray-400" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No job opportunities yet</h3>
                <p className="text-gray-600 mb-4">Start tracking positions you're interested in applying for</p>
                <Button onClick={() => setShowForm(true)} className="flex items-center gap-2 mx-auto bg-[#3bafba] hover:bg-[#34a0ab]">
                  <Plus size={20} /> Add Your First Job
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map(job => (
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    onDelete={handleDelete}
                    onViewDetails={viewJobDetails}
                    searchTerm={filters.searchTerm}
                  />
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Skills Gap Trends Accordion */}
      {jobs.length > 0 && (
        <Card>
          <CardHeader 
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setSkillsGapAccordionOpen(!skillsGapAccordionOpen)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp size={20} />
                Skills Gap Analysis
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setSkillsGapAccordionOpen(!skillsGapAccordionOpen);
                }}
              >
                {skillsGapAccordionOpen ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </Button>
            </div>
          </CardHeader>
          {skillsGapAccordionOpen && (
            <CardContent>
              <SkillsGapTrends
                onJobSelect={(jobId) => {
                  const job = jobs.find(j => j.id === jobId);
                  if (job) {
                    viewJobDetails(job.id);
                  }
                }}
              />
            </CardContent>
          )}
        </Card>
      )}
    </div>
  )

}

