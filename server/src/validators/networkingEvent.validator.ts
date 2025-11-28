export interface NetworkingEventInput {
  userId: string;
  eventName: string;
  eventType: string;
  status?: string;
  eventDate: string | Date;
  endDate?: string | Date | null;
  location?: string | null;
  locationCity?: string | null;
  locationState?: string | null;
  locationCountry?: string | null;
  isVirtual?: boolean;
  eventUrl?: string | null;
  organizer?: string | null;
  description?: string | null;
  industry?: string | null;
  preEventGoals?: string[];
  targetCompanies?: string[];
  targetRoles?: string[];
  preparationNotes?: string | null;
  attended?: boolean;
  attendanceDate?: string | Date | null;
  connectionsMade?: number;
  postEventNotes?: string | null;
  followUpActions?: string[];
  followUpCompleted?: boolean;
  roiNotes?: string | null;
  linkedJobIds?: string[];
}

export const validateNetworkingEvent = (data: NetworkingEventInput): string[] => {
  const errors: string[] = [];

  if (!data.userId || typeof data.userId !== 'string' || data.userId.trim() === '') {
    errors.push('userId is required');
  }

  if (!data.eventName || typeof data.eventName !== 'string' || data.eventName.trim() === '') {
    errors.push('eventName is required');
  }

  if (!data.eventType || typeof data.eventType !== 'string') {
    errors.push('eventType is required');
  } else if (!['conference', 'meetup', 'workshop', 'webinar', 'career_fair', 'networking_mixer', 'industry_event', 'virtual_event'].includes(data.eventType)) {
    errors.push('eventType must be one of: conference, meetup, workshop, webinar, career_fair, networking_mixer, industry_event, virtual_event');
  }

  if (!data.eventDate) {
    errors.push('eventDate is required');
  }

  if (data.status && !['planned', 'registered', 'attended', 'cancelled', 'completed'].includes(data.status)) {
    errors.push('status must be one of: planned, registered, attended, cancelled, completed');
  }

  if (data.connectionsMade !== undefined && (data.connectionsMade < 0 || !Number.isInteger(data.connectionsMade))) {
    errors.push('connectionsMade must be a non-negative integer');
  }

  return errors;
};

export const validateNetworkingEventUpdate = (data: Partial<NetworkingEventInput>): string[] => {
  const errors: string[] = [];

  if (data.eventType && !['conference', 'meetup', 'workshop', 'webinar', 'career_fair', 'networking_mixer', 'industry_event', 'virtual_event'].includes(data.eventType)) {
    errors.push('eventType must be one of: conference, meetup, workshop, webinar, career_fair, networking_mixer, industry_event, virtual_event');
  }

  if (data.status && !['planned', 'registered', 'attended', 'cancelled', 'completed'].includes(data.status)) {
    errors.push('status must be one of: planned, registered, attended, cancelled, completed');
  }

  if (data.connectionsMade !== undefined && (data.connectionsMade < 0 || !Number.isInteger(data.connectionsMade))) {
    errors.push('connectionsMade must be a non-negative integer');
  }

  return errors;
};

export interface NetworkingEventConnectionInput {
  eventId: string;
  contactId?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactCompany?: string | null;
  contactRole?: string | null;
  notes?: string | null;
  followUpDate?: string | Date | null;
  followUpCompleted?: boolean;
  relationshipImpact?: number;
}

export const validateNetworkingEventConnection = (data: NetworkingEventConnectionInput): string[] => {
  const errors: string[] = [];

  if (!data.eventId || typeof data.eventId !== 'string' || data.eventId.trim() === '') {
    errors.push('eventId is required');
  }

  if (!data.contactId && !data.contactName && !data.contactEmail) {
    errors.push('Either contactId or contactName/contactEmail must be provided');
  }

  if (data.relationshipImpact !== undefined && (data.relationshipImpact < -10 || data.relationshipImpact > 10)) {
    errors.push('relationshipImpact must be between -10 and 10');
  }

  return errors;
};


