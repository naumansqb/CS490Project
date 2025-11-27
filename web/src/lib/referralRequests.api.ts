import { apiClient } from './api';

export type ReferralStatus = 'draft' | 'pending' | 'sent' | 'accepted' | 'declined' | 'completed' | 'expired';

export interface ReferralRequest {
    id: string;
    userId: string;
    jobId: string;
    contactId: string;
    status: ReferralStatus;
    requestMessage?: string;
    templateUsed?: string;
    requestDate?: string;
    sentDate?: string;
    responseDate?: string;
    followUpDate?: string;
    nextFollowUpDate?: string;
    responseNotes?: string;
    outcome?: string;
    success?: boolean;
    relationshipImpact?: number;
    gratitudeExpressed?: boolean;
    gratitudeNotes?: string;
    optimalTimingScore?: number;
    timingReason?: string;
    createdAt?: string;
    updatedAt?: string;
    jobOpportunity?: {
        id: string;
        title: string;
        company: string;
        location?: string;
    };
    contact?: {
        id: string;
        fullName: string;
        firstName?: string;
        lastName?: string;
        email?: string;
        company?: string;
        jobTitle?: string;
        relationshipStrength?: number;
    };
}

export interface CreateReferralRequestData {
    jobId: string;
    contactId: string;
    status?: ReferralStatus;
    requestMessage?: string;
    templateUsed?: string;
    requestDate?: string;
    sentDate?: string;
    followUpDate?: string;
    nextFollowUpDate?: string;
    optimalTimingScore?: number;
    timingReason?: string;
}

export interface UpdateReferralRequestData {
    status?: ReferralStatus;
    requestMessage?: string;
    templateUsed?: string;
    sentDate?: string;
    responseDate?: string;
    followUpDate?: string;
    nextFollowUpDate?: string;
    responseNotes?: string;
    outcome?: string;
    success?: boolean;
    relationshipImpact?: number;
    gratitudeExpressed?: boolean;
    gratitudeNotes?: string;
}

export interface PotentialReferralSource {
    id: string;
    fullName: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    industry?: string;
    relationshipType?: string;
    relationshipStrength?: number;
    linkedinUrl?: string;
    lastContactDate?: string;
    mutualConnections?: string[];
    optimalTimingScore: number;
    timingReason: string;
    daysSinceLastContact: number;
    existingReferralRequests: number;
}

export interface PotentialSourcesResponse {
    job: {
        id: string;
        title: string;
        company: string;
        location?: string;
    };
    potentialSources: PotentialReferralSource[];
}

export interface ReferralAnalytics {
    total: number;
    byStatus: Record<string, number>;
    successRate: number;
    successful: number;
    responded: number;
    byContact: Record<string, { total: number; successful: number }>;
    avgRelationshipImpact: number;
}

const API_BASE = '/referral-requests';

export const createReferralRequest = async (
    data: CreateReferralRequestData
): Promise<ReferralRequest> => {
    return apiClient.fetch<ReferralRequest>(API_BASE, {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const getReferralRequest = async (id: string): Promise<ReferralRequest> => {
    return apiClient.fetch<ReferralRequest>(`${API_BASE}/${id}`);
};

export const getReferralRequests = async (params?: {
    jobId?: string;
    contactId?: string;
    status?: ReferralStatus;
}): Promise<ReferralRequest[]> => {
    try {
        const queryParams = new URLSearchParams();
        if (params?.jobId) queryParams.append('jobId', params.jobId);
        if (params?.contactId) queryParams.append('contactId', params.contactId);
        if (params?.status) queryParams.append('status', params.status);

        const query = queryParams.toString();
        const url = `${API_BASE}${query ? `?${query}` : ''}`;
        const result = await apiClient.fetch<ReferralRequest[]>(url);
        return Array.isArray(result) ? result : [];
    } catch (error: any) {
        // If table doesn't exist yet (404 or database error), return empty array
        if (error?.status === 404 || error?.code === 'NOT_FOUND' || error?.message?.includes('relation') || error?.message?.includes('table')) {
            console.warn('Referral requests table may not exist yet:', error?.message);
            return [];
        }
        throw error;
    }
};

export const updateReferralRequest = async (
    id: string,
    data: UpdateReferralRequestData
): Promise<ReferralRequest> => {
    return apiClient.fetch<ReferralRequest>(`${API_BASE}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
};

export const deleteReferralRequest = async (id: string): Promise<void> => {
    return apiClient.fetch<void>(`${API_BASE}/${id}`, {
        method: 'DELETE',
    });
};

export const getPotentialReferralSources = async (
    jobId: string
): Promise<PotentialSourcesResponse> => {
    return apiClient.fetch<PotentialSourcesResponse>(
        `${API_BASE}/job/${jobId}/potential-sources`
    );
};

export const generateReferralTemplate = async (data: {
    jobId: string;
    contactId: string;
}): Promise<{
    template: string;
    contact: PotentialReferralSource;
    job: {
        id: string;
        title: string;
        company: string;
        location?: string;
    };
}> => {
    return apiClient.fetch(`${API_BASE}/generate-template`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const getReferralAnalytics = async (): Promise<ReferralAnalytics> => {
    return apiClient.fetch<ReferralAnalytics>(`${API_BASE}/analytics`);
};

