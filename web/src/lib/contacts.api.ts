import { apiClient } from './api';
import type {
    ProfessionalContact,
    CreateContactData,
    UpdateContactData,
    ContactsResponse,
    ContactInteraction,
    CreateInteractionData,
    GoogleContactImport,
} from '@/types/contacts.types';

export type {
    ProfessionalContact,
    CreateContactData,
    UpdateContactData,
    ContactsResponse,
    ContactInteraction,
    CreateInteractionData,
    GoogleContactImport,
};

const API_BASE = '/professional-contacts';

const normalizeUrl = (url: string | undefined | null): string | undefined => {
    if (!url || !url.trim()) return undefined;
    const trimmed = url.trim();
    if (trimmed.match(/^https?:\/\//i)) {
        return trimmed;
    }
    return 'https://' + trimmed;
};

export const getProfessionalContacts = async (params?: {
    industry?: string;
    relationshipType?: string;
    category?: string;
    company?: string;
    search?: string;
    hasFollowUp?: boolean;
    page?: number;
    limit?: number;
}): Promise<ContactsResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.industry) queryParams.append('industry', params.industry);
    if (params?.relationshipType) queryParams.append('relationshipType', params.relationshipType);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.company) queryParams.append('company', params.company);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    const url = `${API_BASE}${query ? `?${query}` : ''}`;

    return apiClient.fetch<ContactsResponse>(url);
};

export const getProfessionalContact = async (id: string): Promise<ProfessionalContact> => {
    return apiClient.fetch<ProfessionalContact>(`${API_BASE}/${id}`);
};

export const createProfessionalContact = async (data: CreateContactData): Promise<ProfessionalContact> => {
    const payload: any = { ...data };

    if (!payload.firstName && !payload.lastName && !payload.email) {
        throw new Error('At least first name, last name, or email is required');
    }

    if (!payload.fullName) {
        payload.fullName = `${payload.firstName || ''} ${payload.lastName || ''}`.trim() || payload.email || 'Unknown';
    }

    if (payload.linkedinUrl !== undefined) payload.linkedinUrl = normalizeUrl(payload.linkedinUrl);
    if (payload.websiteUrl !== undefined) payload.websiteUrl = normalizeUrl(payload.websiteUrl);
    if (payload.profilePhotoUrl !== undefined) payload.profilePhotoUrl = normalizeUrl(payload.profilePhotoUrl);

    if (payload.lastContactDate && typeof payload.lastContactDate === 'string' && !payload.lastContactDate.includes('T')) {
        payload.lastContactDate = new Date(payload.lastContactDate).toISOString().split('T')[0];
    }
    if (payload.nextFollowUpDate && typeof payload.nextFollowUpDate === 'string' && !payload.nextFollowUpDate.includes('T')) {
        payload.nextFollowUpDate = new Date(payload.nextFollowUpDate).toISOString().split('T')[0];
    }

    if ('relationshipStrength' in data) {
        if (data.relationshipStrength === null || data.relationshipStrength === undefined || data.relationshipStrength === '') {
            payload.relationshipStrength = null;
        } else {
            const numValue = typeof data.relationshipStrength === 'number' 
                ? data.relationshipStrength 
                : parseInt(String(data.relationshipStrength));
            if (!isNaN(numValue)) {
                payload.relationshipStrength = Math.max(0, Math.min(100, numValue));
            } else {
                payload.relationshipStrength = null;
            }
        }
    }

    Object.keys(payload).forEach(key => {
        if (key === 'relationshipStrength') return;
        if (payload[key] === '' || payload[key] === null) {
            delete payload[key];
        }
    });

    return apiClient.fetch<ProfessionalContact>(API_BASE, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
};

export const updateProfessionalContact = async (
    id: string,
    data: UpdateContactData
): Promise<ProfessionalContact> => {
    const payload: any = { ...data };

    if (payload.firstName !== undefined || payload.lastName !== undefined) {
        const contact = await getProfessionalContact(id);
        const firstName = payload.firstName !== undefined ? payload.firstName : contact.firstName;
        const lastName = payload.lastName !== undefined ? payload.lastName : contact.lastName;
        payload.fullName = `${firstName || ''} ${lastName || ''}`.trim() || contact.email || 'Unknown';
    }

    if (payload.linkedinUrl !== undefined) payload.linkedinUrl = normalizeUrl(payload.linkedinUrl);
    if (payload.websiteUrl !== undefined) payload.websiteUrl = normalizeUrl(payload.websiteUrl);
    if (payload.profilePhotoUrl !== undefined) payload.profilePhotoUrl = normalizeUrl(payload.profilePhotoUrl);

    const linkedJobIdsValue = data.linkedJobIds;
    if (linkedJobIdsValue !== undefined) {
        payload.linkedJobIds = Array.isArray(linkedJobIdsValue) ? linkedJobIdsValue : [];
    }

    if (payload.lastContactDate && typeof payload.lastContactDate === 'string' && !payload.lastContactDate.includes('T')) {
        payload.lastContactDate = new Date(payload.lastContactDate).toISOString().split('T')[0];
    }
    if (payload.nextFollowUpDate && typeof payload.nextFollowUpDate === 'string' && !payload.nextFollowUpDate.includes('T')) {
        payload.nextFollowUpDate = new Date(payload.nextFollowUpDate).toISOString().split('T')[0];
    }

    if ('relationshipStrength' in data) {
        if (data.relationshipStrength === null || data.relationshipStrength === undefined || data.relationshipStrength === '') {
            payload.relationshipStrength = null;
        } else {
            const numValue = typeof data.relationshipStrength === 'number' 
                ? data.relationshipStrength 
                : parseInt(String(data.relationshipStrength));
            if (!isNaN(numValue)) {
                payload.relationshipStrength = Math.max(0, Math.min(100, numValue));
            } else {
                payload.relationshipStrength = null;
            }
        }
    }

    Object.keys(payload).forEach(key => {
        if (key === 'relationshipStrength' || key === 'linkedJobIds') return;
        if (payload[key] === '' || payload[key] === null) {
            delete payload[key];
        }
    });

    return apiClient.fetch<ProfessionalContact>(`${API_BASE}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
};

export const deleteProfessionalContact = async (id: string): Promise<void> => {
    return apiClient.fetch<void>(`${API_BASE}/${id}`, {
        method: 'DELETE',
    });
};

export const getContactInteractions = async (id: string): Promise<ContactInteraction[]> => {
    const contact = await getProfessionalContact(id);
    return contact.interactions || [];
};

export const addContactInteraction = async (
    id: string,
    data: CreateInteractionData
): Promise<ContactInteraction> => {
    const payload: any = { ...data };

    if (payload.interactionDate && typeof payload.interactionDate === 'string' && !payload.interactionDate.includes('T')) {
        payload.interactionDate = new Date(payload.interactionDate).toISOString();
    }

    return apiClient.fetch<ContactInteraction>(`${API_BASE}/${id}/interactions`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
};

export const updateContactInteraction = async (
    contactId: string,
    interactionId: string,
    data: Partial<CreateInteractionData>
): Promise<ContactInteraction> => {
    const payload: any = { ...data };

    if (payload.interactionDate && typeof payload.interactionDate === 'string' && !payload.interactionDate.includes('T')) {
        payload.interactionDate = new Date(payload.interactionDate).toISOString();
    }

    return apiClient.fetch<ContactInteraction>(`${API_BASE}/${contactId}/interactions/${interactionId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
};

export const deleteContactInteraction = async (contactId: string, interactionId: string): Promise<void> => {
    return apiClient.fetch<void>(`${API_BASE}/${contactId}/interactions/${interactionId}`, {
        method: 'DELETE',
    });
};

export const linkContactToJob = async (id: string, jobId: string): Promise<ProfessionalContact> => {
    const contact = await getProfessionalContact(id);
    const linkedJobIds = contact.linkedJobIds || [];
    if (!linkedJobIds.includes(jobId)) {
        linkedJobIds.push(jobId);
    }
    return updateProfessionalContact(id, { linkedJobIds });
};

export const linkContactToCompany = async (id: string, companyId: string): Promise<ProfessionalContact> => {
    return updateProfessionalContact(id, { linkedCompanyId: companyId });
};

export const getFollowUpReminders = async (days?: number): Promise<ProfessionalContact[]> => {
    const query = days ? `?days=${days}` : '';
    return apiClient.fetch<ProfessionalContact[]>(`${API_BASE}/reminders${query}`);
};

export const importGoogleContacts = async (contacts: GoogleContactImport[]): Promise<{
    imported: number;
    errors: number;
    contacts: ProfessionalContact[];
    errorsList: Array<{ contact: GoogleContactImport; error: string }>;
}> => {
    const results = {
        imported: 0,
        errors: 0,
        contacts: [] as ProfessionalContact[],
        errorsList: [] as Array<{ contact: GoogleContactImport; error: string }>,
    };

    for (const contactData of contacts) {
        try {
            if (!contactData.email && !contactData.firstName && !contactData.lastName && !contactData.fullName) {
                results.errors++;
                results.errorsList.push({
                    contact: contactData,
                    error: 'Contact missing required fields (email, name, or first/last name)',
                });
                continue;
            }

            const contact = await createProfessionalContact({
                firstName: contactData.firstName || '',
                lastName: contactData.lastName || '',
                email: contactData.email || '',
                phone: contactData.phone || '',
                company: contactData.company || '',
                jobTitle: contactData.jobTitle || '',
                linkedinUrl: normalizeUrl(contactData.linkedinUrl),
                source: 'google_import',
            });

            results.contacts.push(contact);
            results.imported++;
        } catch (error: any) {
            results.errors++;
            const errorMessage = error?.message || error?.code || 'Failed to import contact';
            results.errorsList.push({
                contact: contactData,
                error: errorMessage,
            });
        }
    }

    return results;
};
