// skills.api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Skill {
    id: string;
    userId: string;
    skillName: string;
    proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    skillCategory: 'technical' | 'soft-skills' | 'languages' | 'industry-specific';
    displayOrder?: number;
    createdAt?: string;
    updatedAt?: string;
}

// what the client sends when creating/updating from the UI
export type CreateSkillInput = Omit<Skill, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

export async function getUserSkills(userId: string): Promise<Skill[]> {
    const response = await fetch(`${API_URL}/skills/user/${userId}`, {
        credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch skills');
    return response.json();
}

export async function createSkill(skill: CreateSkillInput): Promise<Skill> {
    const response = await fetch(`${API_URL}/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(skill),
    });

    if (!response.ok) {
        // If your API returns 409 for duplicates, surface a friendly message.
        if (response.status === 409) throw new Error('Skill already exists');
        // Try to read server error message if available
        try {
            const data = await response.json();
            throw new Error(data?.message || 'Failed to create skill');
        } catch {
            throw new Error('Failed to create skill');
        }
    }

    return response.json();
}

export async function updateSkill(id: string, updates: Partial<CreateSkillInput>): Promise<Skill> {
    const response = await fetch(`${API_URL}/skills/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update skill');
    return response.json();
}

export async function deleteSkill(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/skills/${id}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to delete skill');
}
