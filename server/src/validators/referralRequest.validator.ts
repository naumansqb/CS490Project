export interface ReferralRequestInput {
  userId: string;
  jobId: string;
  contactId: string;
  status?: string;
  requestMessage?: string;
  templateUsed?: string;
  requestDate?: string | Date;
  sentDate?: string | Date;
  responseDate?: string | Date;
  followUpDate?: string | Date;
  nextFollowUpDate?: string | Date;
  responseNotes?: string;
  outcome?: string;
  success?: boolean;
  relationshipImpact?: number;
  gratitudeExpressed?: boolean;
  gratitudeNotes?: string;
  optimalTimingScore?: number;
  timingReason?: string;
}

export const validateReferralRequest = (data: ReferralRequestInput): string[] => {
  const errors: string[] = [];

  if (!data.userId || typeof data.userId !== 'string' || data.userId.trim() === '') {
    errors.push('userId is required');
  }

  if (!data.jobId || typeof data.jobId !== 'string' || data.jobId.trim() === '') {
    errors.push('jobId is required');
  }

  if (!data.contactId || typeof data.contactId !== 'string' || data.contactId.trim() === '') {
    errors.push('contactId is required');
  }

  if (data.status && !['draft', 'pending', 'sent', 'accepted', 'declined', 'completed', 'expired'].includes(data.status)) {
    errors.push('status must be one of: draft, pending, sent, accepted, declined, completed, expired');
  }

  if (data.relationshipImpact !== undefined && (data.relationshipImpact < -10 || data.relationshipImpact > 10)) {
    errors.push('relationshipImpact must be between -10 and 10');
  }

  if (data.optimalTimingScore !== undefined && (data.optimalTimingScore < 0 || data.optimalTimingScore > 100)) {
    errors.push('optimalTimingScore must be between 0 and 100');
  }

  return errors;
};

export const validateReferralRequestUpdate = (data: Partial<ReferralRequestInput>): string[] => {
  const errors: string[] = [];

  if (data.status && !['draft', 'pending', 'sent', 'accepted', 'declined', 'completed', 'expired'].includes(data.status)) {
    errors.push('status must be one of: draft, pending, sent, accepted, declined, completed, expired');
  }

  if (data.relationshipImpact !== undefined && (data.relationshipImpact < -10 || data.relationshipImpact > 10)) {
    errors.push('relationshipImpact must be between -10 and 10');
  }

  if (data.optimalTimingScore !== undefined && (data.optimalTimingScore < 0 || data.optimalTimingScore > 100)) {
    errors.push('optimalTimingScore must be between 0 and 100');
  }

  return errors;
};

