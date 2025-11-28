'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
    networkingEventsApi,
    type NetworkingEvent,
    type CreateNetworkingEventData,
    type UpdateNetworkingEventData,
} from '@/lib/networkingEvents.api';
import { getJobOpportunitiesByUserId } from '@/lib/jobs.api';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const EVENT_TYPES = [
    { value: 'conference', label: 'Conference' },
    { value: 'meetup', label: 'Meetup' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'webinar', label: 'Webinar' },
    { value: 'career_fair', label: 'Career Fair' },
    { value: 'networking_mixer', label: 'Networking Mixer' },
    { value: 'industry_event', label: 'Industry Event' },
    { value: 'virtual_event', label: 'Virtual Event' },
];

const STATUSES = [
    { value: 'planned', label: 'Planned' },
    { value: 'registered', label: 'Registered' },
    { value: 'attended', label: 'Attended' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'completed', label: 'Completed' },
];

interface NetworkingEventFormProps {
    event?: NetworkingEvent | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function NetworkingEventForm({
    event,
    onSuccess,
    onCancel,
}: NetworkingEventFormProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<CreateNetworkingEventData>({
        eventName: event?.eventName || '',
        eventType: event?.eventType || 'conference',
        status: event?.status || 'planned',
        eventDate: event?.eventDate
            ? new Date(event.eventDate).toISOString().slice(0, 16)
            : new Date().toISOString().slice(0, 16),
        endDate: event?.endDate
            ? new Date(event.endDate).toISOString().slice(0, 16)
            : null,
        location: event?.location || '',
        locationCity: event?.locationCity || '',
        locationState: event?.locationState || '',
        locationCountry: event?.locationCountry || '',
        isVirtual: event?.isVirtual || false,
        eventUrl: event?.eventUrl || '',
        organizer: event?.organizer || '',
        description: event?.description || '',
        industry: event?.industry || '',
        preEventGoals: event?.preEventGoals || [],
        targetCompanies: event?.targetCompanies || [],
        targetRoles: event?.targetRoles || [],
        preparationNotes: event?.preparationNotes || '',
        linkedJobIds: event?.linkedJobIds || [],
    });

    const [newGoal, setNewGoal] = useState('');
    const [newCompany, setNewCompany] = useState('');
    const [newRole, setNewRole] = useState('');
    const [jobs, setJobs] = useState<Array<{ id: string; title: string; company: string }>>([]);

    useEffect(() => {
        if (user?.uid) {
            loadJobs();
        }
    }, [user]);

    const loadJobs = async () => {
        if (!user?.uid) return;
        try {
            const jobList = await getJobOpportunitiesByUserId(user.uid);
            setJobs(jobList.map((job: any) => ({ id: job.id, title: job.title, company: job.company })));
        } catch (error) {
            console.error('Failed to load jobs:', error);
        }
    };

    const toggleJobLink = (jobId: string) => {
        const currentLinked = formData.linkedJobIds || [];
        if (currentLinked.includes(jobId)) {
            setFormData({
                ...formData,
                linkedJobIds: currentLinked.filter((id) => id !== jobId),
            });
        } else {
            setFormData({
                ...formData,
                linkedJobIds: [...currentLinked, jobId],
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.uid) return;

        setLoading(true);
        try {
            const submitData: CreateNetworkingEventData | UpdateNetworkingEventData = {
                ...formData,
                eventDate: new Date(formData.eventDate).toISOString(),
                endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
            };

            if (event) {
                await networkingEventsApi.updateEvent(event.id, submitData);
            } else {
                await networkingEventsApi.createEvent(submitData);
            }
            onSuccess();
        } catch (error: any) {
            alert(error.message || 'Failed to save event');
        } finally {
            setLoading(false);
        }
    };

    const addGoal = () => {
        if (newGoal.trim()) {
            setFormData({
                ...formData,
                preEventGoals: [...(formData.preEventGoals || []), newGoal.trim()],
            });
            setNewGoal('');
        }
    };

    const removeGoal = (index: number) => {
        setFormData({
            ...formData,
            preEventGoals: formData.preEventGoals?.filter((_, i) => i !== index) || [],
        });
    };

    const addCompany = () => {
        if (newCompany.trim()) {
            setFormData({
                ...formData,
                targetCompanies: [...(formData.targetCompanies || []), newCompany.trim()],
            });
            setNewCompany('');
        }
    };

    const removeCompany = (index: number) => {
        setFormData({
            ...formData,
            targetCompanies: formData.targetCompanies?.filter((_, i) => i !== index) || [],
        });
    };

    const addRole = () => {
        if (newRole.trim()) {
            setFormData({
                ...formData,
                targetRoles: [...(formData.targetRoles || []), newRole.trim()],
            });
            setNewRole('');
        }
    };

    const removeRole = (index: number) => {
        setFormData({
            ...formData,
            targetRoles: formData.targetRoles?.filter((_, i) => i !== index) || [],
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{event ? 'Edit Event' : 'Create Networking Event'}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="eventName">Event Name *</Label>
                            <Input
                                id="eventName"
                                value={formData.eventName}
                                onChange={(e) =>
                                    setFormData({ ...formData, eventName: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="eventType">Event Type *</Label>
                            <Select
                                value={formData.eventType}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, eventType: value as any })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {EVENT_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, status: value as any })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUSES.map((status) => (
                                        <SelectItem key={status.value} value={status.value}>
                                            {status.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="eventDate">Event Date & Time *</Label>
                            <Input
                                id="eventDate"
                                type="datetime-local"
                                value={formData.eventDate}
                                onChange={(e) =>
                                    setFormData({ ...formData, eventDate: e.target.value })
                                }
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="endDate">End Date & Time (Optional)</Label>
                        <Input
                            id="endDate"
                            type="datetime-local"
                            value={formData.endDate || ''}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    endDate: e.target.value || null,
                                })
                            }
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="isVirtual"
                            checked={formData.isVirtual}
                            onCheckedChange={(checked) =>
                                setFormData({ ...formData, isVirtual: checked as boolean })
                            }
                        />
                        <Label htmlFor="isVirtual">Virtual Event</Label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                value={formData.location || ''}
                                onChange={(e) =>
                                    setFormData({ ...formData, location: e.target.value })
                                }
                            />
                        </div>
                        <div>
                            <Label htmlFor="eventUrl">Event URL</Label>
                            <Input
                                id="eventUrl"
                                type="url"
                                value={formData.eventUrl || ''}
                                onChange={(e) =>
                                    setFormData({ ...formData, eventUrl: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="locationCity">City</Label>
                            <Input
                                id="locationCity"
                                value={formData.locationCity || ''}
                                onChange={(e) =>
                                    setFormData({ ...formData, locationCity: e.target.value })
                                }
                            />
                        </div>
                        <div>
                            <Label htmlFor="locationState">State</Label>
                            <Input
                                id="locationState"
                                value={formData.locationState || ''}
                                onChange={(e) =>
                                    setFormData({ ...formData, locationState: e.target.value })
                                }
                            />
                        </div>
                        <div>
                            <Label htmlFor="locationCountry">Country</Label>
                            <Input
                                id="locationCountry"
                                value={formData.locationCountry || ''}
                                onChange={(e) =>
                                    setFormData({ ...formData, locationCountry: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="organizer">Organizer</Label>
                            <Input
                                id="organizer"
                                value={formData.organizer || ''}
                                onChange={(e) =>
                                    setFormData({ ...formData, organizer: e.target.value })
                                }
                            />
                        </div>
                        <div>
                            <Label htmlFor="industry">Industry</Label>
                            <Input
                                id="industry"
                                value={formData.industry || ''}
                                onChange={(e) =>
                                    setFormData({ ...formData, industry: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description || ''}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            rows={3}
                        />
                    </div>

                    <div>
                        <Label>Pre-Event Goals</Label>
                        <div className="flex gap-2 mb-2">
                            <Input
                                value={newGoal}
                                onChange={(e) => setNewGoal(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
                                placeholder="Add a goal..."
                            />
                            <Button type="button" onClick={addGoal} className="bg-cyan-500 hover:bg-cyan-600 text-white">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.preEventGoals?.map((goal, index) => (
                                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                    {goal}
                                    <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() => removeGoal(index)}
                                    />
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div>
                        <Label>Target Companies</Label>
                        <div className="flex gap-2 mb-2">
                            <Input
                                value={newCompany}
                                onChange={(e) => setNewCompany(e.target.value)}
                                onKeyPress={(e) =>
                                    e.key === 'Enter' && (e.preventDefault(), addCompany())
                                }
                                placeholder="Add a company..."
                            />
                            <Button type="button" onClick={addCompany} className="bg-cyan-500 hover:bg-cyan-600 text-white">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.targetCompanies?.map((company, index) => (
                                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                    {company}
                                    <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() => removeCompany(index)}
                                    />
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div>
                        <Label>Target Roles</Label>
                        <div className="flex gap-2 mb-2">
                            <Input
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value)}
                                onKeyPress={(e) =>
                                    e.key === 'Enter' && (e.preventDefault(), addRole())
                                }
                                placeholder="Add a role..."
                            />
                            <Button type="button" onClick={addRole} className="bg-cyan-500 hover:bg-cyan-600 text-white">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.targetRoles?.map((role, index) => (
                                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                    {role}
                                    <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() => removeRole(index)}
                                    />
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="preparationNotes">Preparation Notes</Label>
                        <Textarea
                            id="preparationNotes"
                            value={formData.preparationNotes || ''}
                            onChange={(e) =>
                                setFormData({ ...formData, preparationNotes: e.target.value })
                            }
                            rows={3}
                        />
                    </div>

                    <div>
                        <Label>Link to Job Opportunities (Optional)</Label>
                        <p className="text-xs text-gray-500 mb-2">
                            Track which jobs this networking event relates to
                        </p>
                        {jobs.length === 0 ? (
                            <p className="text-sm text-gray-500 py-2">
                                No job opportunities found. Add jobs in the Jobs section first.
                            </p>
                        ) : (
                            <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                                {jobs.map((job) => {
                                    const isLinked = formData.linkedJobIds?.includes(job.id);
                                    return (
                                        <div
                                            key={job.id}
                                            className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                                            onClick={() => toggleJobLink(job.id)}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isLinked}
                                                onChange={() => toggleJobLink(job.id)}
                                                className="h-4 w-4 text-cyan-500"
                                            />
                                            <span className="text-sm">
                                                {job.title} at {job.company}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {formData.linkedJobIds && formData.linkedJobIds.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {formData.linkedJobIds.map((jobId) => {
                                    const job = jobs.find((j) => j.id === jobId);
                                    return job ? (
                                        <Badge key={jobId} variant="secondary" className="flex items-center gap-1">
                                            {job.title} - {job.company}
                                            <X
                                                className="h-3 w-3 cursor-pointer"
                                                onClick={() => toggleJobLink(jobId)}
                                            />
                                        </Badge>
                                    ) : null;
                                })}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-cyan-500 hover:bg-cyan-600 text-white">
                            {loading ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}


