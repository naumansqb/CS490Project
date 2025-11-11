// validators/interview.validator.ts

interface ValidationError {
  field: string;
  message: string;
}

// Interview type enum values
const INTERVIEW_TYPES = ['phone', 'video', 'in-person'] as const;
type InterviewType = typeof INTERVIEW_TYPES[number];

// Interview status enum values
const INTERVIEW_STATUSES = ['scheduled', 'completed', 'cancelled', 'rescheduled'] as const;
type InterviewStatus = typeof INTERVIEW_STATUSES[number];

// Helper function to validate URL format
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Helper function to validate phone number format
const isValidPhoneNumber = (phone: string): boolean => {
  // Basic phone number validation - digits, spaces, dashes, parentheses, and optional + prefix
  return /^\+?[\d\s\-\(\)]+$/.test(phone);
};

// Helper function to validate ISO 8601 datetime format
const isValidDateTime = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString === date.toISOString();
};

// Validate Create Interview
export const validateCreateInterview = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Required: jobId
  if (!data.jobId) {
    errors.push({ field: 'jobId', message: 'Job ID is required' });
  } else if (typeof data.jobId !== 'string' || data.jobId.trim().length === 0) {
    errors.push({ field: 'jobId', message: 'Job ID must be a non-empty string' });
  }

  // Required: scheduledDate
  if (!data.scheduledDate) {
    errors.push({ field: 'scheduledDate', message: 'Scheduled date is required' });
  } else if (typeof data.scheduledDate !== 'string') {
    errors.push({ field: 'scheduledDate', message: 'Scheduled date must be a string' });
  } else if (!isValidDateTime(data.scheduledDate)) {
    errors.push({ field: 'scheduledDate', message: 'Scheduled date must be in ISO 8601 format' });
  } else {
    // Check if date is in the past
    const scheduledDate = new Date(data.scheduledDate);
    const now = new Date();
    if (scheduledDate < now) {
      errors.push({ field: 'scheduledDate', message: 'Scheduled date cannot be in the past' });
    }
  }

  // Required: interviewType
  if (!data.interviewType) {
    errors.push({ field: 'interviewType', message: 'Interview type is required' });
  } else if (!INTERVIEW_TYPES.includes(data.interviewType)) {
    errors.push({ 
      field: 'interviewType', 
      message: `Interview type must be one of: ${INTERVIEW_TYPES.join(', ')}` 
    });
  }

  // Optional: durationMinutes
  if (data.durationMinutes !== undefined) {
    if (typeof data.durationMinutes !== 'number') {
      errors.push({ field: 'durationMinutes', message: 'Duration must be a number' });
    } else if (!Number.isInteger(data.durationMinutes)) {
      errors.push({ field: 'durationMinutes', message: 'Duration must be an integer' });
    } else if (data.durationMinutes < 15 || data.durationMinutes > 480) {
      errors.push({ field: 'durationMinutes', message: 'Duration must be between 15 and 480 minutes' });
    }
  }

  // Optional: status
  if (data.status !== undefined && !INTERVIEW_STATUSES.includes(data.status)) {
    errors.push({ 
      field: 'status', 
      message: `Status must be one of: ${INTERVIEW_STATUSES.join(', ')}` 
    });
  }

  // Conditional validation based on interview type
  if (data.interviewType === 'in-person') {
    if (!data.location || typeof data.location !== 'string' || data.location.trim().length === 0) {
      errors.push({ field: 'location', message: 'Location is required for in-person interviews' });
    } else if (data.location.length > 500) {
      errors.push({ field: 'location', message: 'Location must be 500 characters or less' });
    }
  }

  if (data.interviewType === 'video') {
    if (!data.meetingLink || typeof data.meetingLink !== 'string' || data.meetingLink.trim().length === 0) {
      errors.push({ field: 'meetingLink', message: 'Meeting link is required for video interviews' });
    } else if (!isValidUrl(data.meetingLink)) {
      errors.push({ field: 'meetingLink', message: 'Meeting link must be a valid URL' });
    }
  }

  if (data.interviewType === 'phone') {
    if (!data.phoneNumber || typeof data.phoneNumber !== 'string' || data.phoneNumber.trim().length === 0) {
      errors.push({ field: 'phoneNumber', message: 'Phone number is required for phone interviews' });
    } else if (!isValidPhoneNumber(data.phoneNumber)) {
      errors.push({ field: 'phoneNumber', message: 'Phone number format is invalid' });
    }
  }

  // Optional: location (if provided)
  if (data.location !== undefined && data.location !== null) {
    if (typeof data.location !== 'string') {
      errors.push({ field: 'location', message: 'Location must be a string' });
    } else if (data.location.length > 500) {
      errors.push({ field: 'location', message: 'Location must be 500 characters or less' });
    }
  }

  // Optional: meetingLink (if provided)
  if (data.meetingLink !== undefined && data.meetingLink !== null && data.meetingLink !== '') {
    if (typeof data.meetingLink !== 'string') {
      errors.push({ field: 'meetingLink', message: 'Meeting link must be a string' });
    } else if (!isValidUrl(data.meetingLink)) {
      errors.push({ field: 'meetingLink', message: 'Meeting link must be a valid URL' });
    }
  }

  // Optional: phoneNumber (if provided)
  if (data.phoneNumber !== undefined && data.phoneNumber !== null && data.phoneNumber !== '') {
    if (typeof data.phoneNumber !== 'string') {
      errors.push({ field: 'phoneNumber', message: 'Phone number must be a string' });
    } else if (!isValidPhoneNumber(data.phoneNumber)) {
      errors.push({ field: 'phoneNumber', message: 'Phone number format is invalid' });
    }
  }

  // Optional: interviewerName
  if (data.interviewerName !== undefined && data.interviewerName !== null) {
    if (typeof data.interviewerName !== 'string') {
      errors.push({ field: 'interviewerName', message: 'Interviewer name must be a string' });
    } else if (data.interviewerName.length > 255) {
      errors.push({ field: 'interviewerName', message: 'Interviewer name must be 255 characters or less' });
    }
  }

  return errors;
};

// Validate Update Interview
export const validateUpdateInterview = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];

  // All fields are optional for updates, but must be valid if provided

  // Optional: scheduledDate
  if (data.scheduledDate !== undefined) {
    if (typeof data.scheduledDate !== 'string') {
      errors.push({ field: 'scheduledDate', message: 'Scheduled date must be a string' });
    } else if (!isValidDateTime(data.scheduledDate)) {
      errors.push({ field: 'scheduledDate', message: 'Scheduled date must be in ISO 8601 format' });
    }
  }

  // Optional: interviewType
  if (data.interviewType !== undefined && !INTERVIEW_TYPES.includes(data.interviewType)) {
    errors.push({ 
      field: 'interviewType', 
      message: `Interview type must be one of: ${INTERVIEW_TYPES.join(', ')}` 
    });
  }

  // Optional: durationMinutes
  if (data.durationMinutes !== undefined) {
    if (typeof data.durationMinutes !== 'number') {
      errors.push({ field: 'durationMinutes', message: 'Duration must be a number' });
    } else if (!Number.isInteger(data.durationMinutes)) {
      errors.push({ field: 'durationMinutes', message: 'Duration must be an integer' });
    } else if (data.durationMinutes < 15 || data.durationMinutes > 480) {
      errors.push({ field: 'durationMinutes', message: 'Duration must be between 15 and 480 minutes' });
    }
  }

  // Optional: status
  if (data.status !== undefined && !INTERVIEW_STATUSES.includes(data.status)) {
    errors.push({ 
      field: 'status', 
      message: `Status must be one of: ${INTERVIEW_STATUSES.join(', ')}` 
    });
  }

  // Optional: location
  if (data.location !== undefined && data.location !== null) {
    if (typeof data.location !== 'string') {
      errors.push({ field: 'location', message: 'Location must be a string' });
    } else if (data.location.length > 500) {
      errors.push({ field: 'location', message: 'Location must be 500 characters or less' });
    }
  }

  // Optional: meetingLink
  if (data.meetingLink !== undefined && data.meetingLink !== null && data.meetingLink !== '') {
    if (typeof data.meetingLink !== 'string') {
      errors.push({ field: 'meetingLink', message: 'Meeting link must be a string' });
    } else if (!isValidUrl(data.meetingLink)) {
      errors.push({ field: 'meetingLink', message: 'Meeting link must be a valid URL' });
    }
  }

  // Optional: phoneNumber
  if (data.phoneNumber !== undefined && data.phoneNumber !== null && data.phoneNumber !== '') {
    if (typeof data.phoneNumber !== 'string') {
      errors.push({ field: 'phoneNumber', message: 'Phone number must be a string' });
    } else if (!isValidPhoneNumber(data.phoneNumber)) {
      errors.push({ field: 'phoneNumber', message: 'Phone number format is invalid' });
    }
  }

  // Optional: interviewerName
  if (data.interviewerName !== undefined && data.interviewerName !== null) {
    if (typeof data.interviewerName !== 'string') {
      errors.push({ field: 'interviewerName', message: 'Interviewer name must be a string' });
    } else if (data.interviewerName.length > 255) {
      errors.push({ field: 'interviewerName', message: 'Interviewer name must be 255 characters or less' });
    }
  }

  return errors;
};

// Type exports
export type { ValidationError, InterviewType, InterviewStatus };