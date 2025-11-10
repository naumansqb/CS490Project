import { apiClient } from './api';

export interface ResumeTemplate {
    id: string;
    name: string;
    description?: string;
    type: string;
    isDefault: boolean;
    preview?: string;
}

export interface ResumeSummary {
    id: string;
    name: string;
    isDefault: boolean;
    lastModified: string;
    template: {
        name: string;
        type: string;
    };
}

export interface ResumeDetail extends ResumeSummary {
    content: any;
    templateId: string;
    userId: string;
}

export const resumeApi = {
    // ===== Templates =====
    async getTemplates(): Promise<ResumeTemplate[]> {
        try {
            const result = await apiClient.fetch('/resume-templates');
            return result as ResumeTemplate[];
        } catch (error) {
            console.error('API Error - Get Resume Templates:', error);
            throw error;
        }
    },

    async getTemplate(id: string): Promise<ResumeTemplate> {
        try {
            const result = await apiClient.fetch(`/resume-templates/${id}`);
            return result as ResumeTemplate;
        } catch (error) {
            console.error('API Error - Get Resume Template:', error);
            throw error;
        }
    },

    // ===== Resumes =====
    async getResumes(): Promise<ResumeSummary[]> {
        try {
            const result = await apiClient.fetch('/resumes');
            return result as ResumeSummary[];
        } catch (error) {
            console.error('API Error - Get Resumes:', error);
            throw error;
        }
    },

    async getResume(id: string): Promise<ResumeDetail> {
        try {
            const result = await apiClient.fetch(`/resumes/${id}`);
            return result as ResumeDetail;
        } catch (error) {
            console.error('API Error - Get Resume:', error);
            throw error;
        }
    },

    async createResume(name: string, templateId: string): Promise<ResumeDetail> {
        try {
            const result = await apiClient.fetch('/resumes', {
                method: 'POST',
                body: JSON.stringify({ name, templateId }),
            });
            return result as ResumeDetail;
        } catch (error: any) {
            console.error('API Error - Create Resume:', error);
            throw error;
        }
    },

    async updateResume(
        id: string,
        updates: { name?: string; content?: any }
    ): Promise<ResumeDetail> {
        try {
            const result = await apiClient.fetch(`/resumes/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(updates),
            });
            return result as ResumeDetail;
        } catch (error) {
            console.error('API Error - Update Resume:', error);
            throw error;
        }
    },

    async deleteResume(id: string): Promise<void> {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/resumes/${id}`,
                {
                    method: 'DELETE',
                    credentials: 'include',
                }
            );

            if (!response.ok) {
                throw new Error('Failed to delete resume');
            }

            // no return .json() because 204 has no body
            return;
        } catch (error) {
            console.error('API Error - Delete Resume:', error);
            throw error;
        }
    },

    async setDefaultResume(id: string): Promise<void> {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/resumes/${id}/set-default`,
                {
                    method: 'PATCH',
                    credentials: 'include',
                }
            );

            if (!response.ok) {
                throw new Error('Failed to set default resume');
            }

            return;
        } catch (error) {
            console.error('API Error - Set Default Resume:', error);
            throw error;
        }
    },
};