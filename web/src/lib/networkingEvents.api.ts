import { apiClient } from './api';

export type NetworkingEventType = 'conference' | 'meetup' | 'workshop' | 'webinar' | 'career_fair' | 'networking_mixer' | 'industry_event' | 'virtual_event';
export type NetworkingEventStatus = 'planned' | 'registered' | 'attended' | 'cancelled' | 'completed';

export interface NetworkingEvent {
    id: string;
    userId: string;
    eventName: string;
    eventType: NetworkingEventType;
    status: NetworkingEventStatus;
    eventDate: string;
    endDate?: string | null;
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
    attendanceDate?: string | null;
    connectionsMade?: number;
    postEventNotes?: string | null;
    followUpActions?: string[];
    followUpCompleted?: boolean;
    roiNotes?: string | null;
    linkedJobIds?: string[];
    createdAt?: string;
    updatedAt?: string;
    eventConnections?: NetworkingEventConnection[];
}

export interface NetworkingEventConnection {
    id: string;
    eventId: string;
    contactId?: string | null;
    contactName?: string | null;
    contactEmail?: string | null;
    contactCompany?: string | null;
    contactRole?: string | null;
    notes?: string | null;
    followUpDate?: string | null;
    followUpCompleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
    contact?: {
        id: string;
        fullName: string;
        email?: string;
        company?: string;
        jobTitle?: string;
    } | null;
    event?: NetworkingEvent | null;
}

export interface CreateNetworkingEventData {
    eventName: string;
    eventType: NetworkingEventType;
    status?: NetworkingEventStatus;
    eventDate: string;
    endDate?: string | null;
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
    linkedJobIds?: string[];
}

export interface UpdateNetworkingEventData {
    eventName?: string;
    eventType?: NetworkingEventType;
    status?: NetworkingEventStatus;
    eventDate?: string;
    endDate?: string | null;
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
    attendanceDate?: string | null;
    connectionsMade?: number;
    postEventNotes?: string | null;
    followUpActions?: string[];
    followUpCompleted?: boolean;
    roiNotes?: string | null;
    linkedJobIds?: string[];
}

export interface CreateEventConnectionData {
    eventId: string;
    contactId?: string | null;
    contactName?: string | null;
    contactEmail?: string | null;
    contactCompany?: string | null;
    contactRole?: string | null;
    notes?: string | null;
    followUpDate?: string | null;
    followUpCompleted?: boolean;
}

export interface UpdateEventConnectionData {
    contactId?: string | null;
    contactName?: string | null;
    contactEmail?: string | null;
    contactCompany?: string | null;
    contactRole?: string | null;
    notes?: string | null;
    followUpDate?: string | null;
    followUpCompleted?: boolean;
}

export interface ListNetworkingEventsParams {
    status?: NetworkingEventStatus;
    eventType?: NetworkingEventType;
    industry?: string;
    upcoming?: boolean;
}

export const networkingEventsApi = {
    async createEvent(data: CreateNetworkingEventData): Promise<NetworkingEvent> {
        try {
            const result = await apiClient.fetch('/networking-events', {
                method: 'POST',
                body: JSON.stringify(data),
            });
            return result as NetworkingEvent;
        } catch (error) {
            console.error('API Error - Create Networking Event:', error);
            throw error;
        }
    },

    async getEvent(id: string): Promise<NetworkingEvent> {
        try {
            const result = await apiClient.fetch(`/networking-events/${id}`);
            return result as NetworkingEvent;
        } catch (error) {
            console.error('API Error - Get Networking Event:', error);
            throw error;
        }
    },

    async listEvents(params?: ListNetworkingEventsParams): Promise<NetworkingEvent[]> {
        try {
            const queryParams = new URLSearchParams();
            if (params?.status) queryParams.append('status', params.status);
            if (params?.eventType) queryParams.append('eventType', params.eventType);
            if (params?.industry) queryParams.append('industry', params.industry);
            if (params?.upcoming) queryParams.append('upcoming', 'true');

            const url = `/networking-events${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const result = await apiClient.fetch(url);
            return result as NetworkingEvent[];
        } catch (error: any) {
            console.error('API Error - List Networking Events:', error);
            const errorMessage = error?.message || error?.error || JSON.stringify(error) || 'Unknown error';
            throw new Error(`Failed to load networking events: ${errorMessage}`);
        }
    },

    async updateEvent(id: string, data: UpdateNetworkingEventData): Promise<NetworkingEvent> {
        try {
            const result = await apiClient.fetch(`/networking-events/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            });
            return result as NetworkingEvent;
        } catch (error) {
            console.error('API Error - Update Networking Event:', error);
            throw error;
        }
    },

    async deleteEvent(id: string): Promise<void> {
        try {
            await apiClient.fetch(`/networking-events/${id}`, {
                method: 'DELETE',
            });
        } catch (error) {
            console.error('API Error - Delete Networking Event:', error);
            throw error;
        }
    },

    async addConnection(data: CreateEventConnectionData): Promise<NetworkingEventConnection> {
        try {
            const result = await apiClient.fetch(`/networking-events/${data.eventId}/connections`, {
                method: 'POST',
                body: JSON.stringify(data),
            });
            return result as NetworkingEventConnection;
        } catch (error) {
            console.error('API Error - Add Event Connection:', error);
            throw error;
        }
    },

    async updateConnection(connectionId: string, data: UpdateEventConnectionData): Promise<NetworkingEventConnection> {
        try {
            const result = await apiClient.fetch(`/networking-events/connections/${connectionId}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            });
            return result as NetworkingEventConnection;
        } catch (error) {
            console.error('API Error - Update Event Connection:', error);
            throw error;
        }
    },

    async deleteConnection(connectionId: string): Promise<void> {
        try {
            await apiClient.fetch(`/networking-events/connections/${connectionId}`, {
                method: 'DELETE',
            });
        } catch (error) {
            console.error('API Error - Delete Event Connection:', error);
            throw error;
        }
    },
};

