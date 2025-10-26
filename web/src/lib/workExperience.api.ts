import { apiClient } from './api';


export interface WorkExperience {
    id: string;
    userId: string;
    companyName: string;
    positionTitle: string;
    employmentType?: string | null;
    locationCity?: string | null;
    locationState?: string | null;
    locationCountry?: string | null;
    isRemote?: boolean;
    startDate: string;
    endDate?: string | null;
    isCurrent?: boolean;
    description?: string | null;
    displayOrder?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateWorkExperienceInput {
    companyName: string;
    positionTitle: string;
    employmentType?: string;
    locationCity?: string;
    locationState?: string;
    locationCountry?: string;
    isRemote?: boolean;
    startDate: string;
    endDate?: string | null;
    isCurrent?: boolean;
    description?: string;
}

export const createWorkExperience = async (data: CreateWorkExperienceInput): Promise<WorkExperience> => {
    try {
        return await apiClient.fetch('/work-experiences', {
            method: 'POST',
            body: JSON.stringify(data),
        }) as WorkExperience;
    } catch (error) {
        console.error('API Error - Create Work Experience:', error);
        throw error;
    }
};

export const getWorkExperiencesByUserId = async (userId: string): Promise<WorkExperience[]> => {
    try {
        console.log('Fetching work experiences for userId:', userId);
        const result = await apiClient.fetch(`/work-experiences/user/${userId}`) as WorkExperience[];
        console.log('Work experiences fetched successfully:', result);
        return result;
    } catch (error) {
        console.error('API Error - Get Work Experiences:', error);
        throw error;
    }
};

export const getWorkExperience = async (id: string): Promise<WorkExperience> => {
    try {
        return await apiClient.fetch(`/work-experiences/${id}`) as WorkExperience;
    } catch (error) {
        console.error('API Error - Get Work Experience:', error);
        throw error;
    }
};

export const updateWorkExperience = async (id: string, data: Partial<CreateWorkExperienceInput>): Promise<WorkExperience> => {
    try {
        return await apiClient.fetch(`/work-experiences/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }) as WorkExperience;
    } catch (error) {
        console.error('API Error - Update Work Experience:', error);
        throw error;
    }
};

export const deleteWorkExperience = async (id: string): Promise<void> => {
    try {
        await apiClient.fetch(`/work-experiences/${id}`, {
            method: 'DELETE',
        });
    } catch (error) {
        console.error('API Error - Delete Work Experience:', error);
        throw error;
    }
};