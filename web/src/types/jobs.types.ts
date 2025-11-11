
export interface ContactInfo {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
}

export interface ApplicationHistoryEntry {
  id: string;
  timestamp: string;
  status: string;
}

export interface Job {
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
  // NEW ARCHIVE FIELDS
  archiveReason?: string;
  archivedAt?: string;
}