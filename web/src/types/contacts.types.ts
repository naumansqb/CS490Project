export interface ProfessionalContact {
    id: string;
    userId: string;

    firstName?: string | null;
    lastName?: string | null;
    fullName: string;
    email?: string | null;
    phone?: string | null;
    linkedinUrl?: string | null;
    websiteUrl?: string | null;
    profilePhotoUrl?: string | null;

    company?: string | null;
    jobTitle?: string | null;
    industry?: string | null;
    locationCity?: string | null;
    locationState?: string | null;
    locationCountry?: string | null;

    relationshipType?: string | null;
    relationshipStrength?: number | null;
    category?: string | null;
    tags: string[];

    personalNotes?: string | null;
    professionalNotes?: string | null;

    mutualConnections: string[];
    linkedCompanyId?: string | null;
    linkedJobIds: string[];

    lastContactDate?: string | null;
    nextFollowUpDate?: string | null;
    followUpFrequency?: string | null;

    source?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;

    companyRef?: {
        id: string;
        name: string;
        logoUrl?: string | null;
    } | null;
    interactions?: ContactInteraction[];
}

export interface ContactInteraction {
    id: string;
    contactId: string;
    interactionType: string;
    interactionDate: string;
    notes?: string | null;
    outcome?: string | null;
    relationshipChange?: number | null;
    createdAt?: string | null;
    updatedAt?: string | null;
}

export interface CreateContactData {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    linkedinUrl?: string;
    websiteUrl?: string;
    profilePhotoUrl?: string;
    company?: string;
    jobTitle?: string;
    industry?: string;
    locationCity?: string;
    locationState?: string;
    locationCountry?: string;
    relationshipType?: string;
    relationshipStrength?: number;
    category?: string;
    tags?: string[];
    personalNotes?: string;
    professionalNotes?: string;
    mutualConnections?: string[];
    linkedCompanyId?: string;
    linkedJobIds?: string[];
    lastContactDate?: string;
    nextFollowUpDate?: string;
    followUpFrequency?: string;
    source?: string;
}

export interface UpdateContactData extends Partial<CreateContactData> { }

export interface CreateInteractionData {
    interactionType: string;
    interactionDate: string;
    notes?: string;
    outcome?: string;
    relationshipChange?: number;
}

export interface ContactsResponse {
    contacts: ProfessionalContact[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface GoogleContactImport {
    fullName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    linkedinUrl?: string;
}
