'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Calendar,
    MapPin,
    Users,
    Target,
    Edit2,
    Plus,
    Trash2,
    Mail,
    Building2,
    Briefcase,
    CheckCircle2,
    Circle,
} from 'lucide-react';
import {
    networkingEventsApi,
    type NetworkingEvent,
    type NetworkingEventConnection,
    type CreateEventConnectionData,
} from '@/lib/networkingEvents.api';
import { getJobOpportunity } from '@/lib/jobs.api';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import EventConnectionForm from './EventConnectionForm';

const EVENT_TYPE_LABELS: Record<string, string> = {
    conference: 'Conference',
    meetup: 'Meetup',
    workshop: 'Workshop',
    webinar: 'Webinar',
    career_fair: 'Career Fair',
    networking_mixer: 'Networking Mixer',
    industry_event: 'Industry Event',
    virtual_event: 'Virtual Event',
};

const STATUS_LABELS: Record<string, string> = {
    planned: 'Planned',
    registered: 'Registered',
    attended: 'Attended',
    cancelled: 'Cancelled',
    completed: 'Completed',
};

const STATUS_COLORS: Record<string, string> = {
    planned: 'bg-blue-100 text-blue-700',
    registered: 'bg-purple-100 text-purple-700',
    attended: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    completed: 'bg-gray-100 text-gray-700',
};

interface NetworkingEventDetailProps {
    event: NetworkingEvent;
    onBack: () => void;
    onUpdate: () => void;
}

export default function NetworkingEventDetail({
    event,
    onBack,
    onUpdate,
}: NetworkingEventDetailProps) {
    const router = useRouter();
    const { user } = useAuth();
    const [showConnectionForm, setShowConnectionForm] = useState(false);
    const [editingConnection, setEditingConnection] =
        useState<NetworkingEventConnection | null>(null);
    const [eventData, setEventData] = useState<NetworkingEvent>(event);
    const [linkedJobs, setLinkedJobs] = useState<Array<{ id: string; title: string; company: string }>>([]);

    useEffect(() => {
        if (eventData.linkedJobIds && eventData.linkedJobIds.length > 0) {
            loadLinkedJobs();
        } else {
            setLinkedJobs([]);
        }
    }, [eventData.linkedJobIds]);

    const loadLinkedJobs = async () => {
        if (!eventData.linkedJobIds || eventData.linkedJobIds.length === 0) {
            setLinkedJobs([]);
            return;
        }
        try {
            const jobPromises = eventData.linkedJobIds.map((jobId) => getJobOpportunity(jobId));
            const jobs = await Promise.all(jobPromises);
            setLinkedJobs(jobs.map((job: any) => ({ id: job.id, title: job.title, company: job.company })));
        } catch (error) {
            console.error('Failed to load linked jobs:', error);
            setLinkedJobs([]);
        }
    };

    const handleConnectionAdded = async () => {
        setShowConnectionForm(false);
        const updated = await networkingEventsApi.getEvent(event.id);
        setEventData(updated);
    };

    const handleConnectionUpdated = async () => {
        setEditingConnection(null);
        const updated = await networkingEventsApi.getEvent(event.id);
        setEventData(updated);
    };

    const handleDeleteConnection = async (connectionId: string) => {
        if (!confirm('Are you sure you want to delete this connection?')) return;

        try {
            await networkingEventsApi.deleteConnection(connectionId);
            const updated = await networkingEventsApi.getEvent(event.id);
            setEventData(updated);
        } catch (error: any) {
            alert(error.message || 'Failed to delete connection');
        }
    };

    const handleToggleFollowUp = async (connection: NetworkingEventConnection) => {
        try {
            await networkingEventsApi.updateConnection(connection.id, {
                followUpCompleted: !connection.followUpCompleted,
            });
            const updated = await networkingEventsApi.getEvent(event.id);
            setEventData(updated);
        } catch (error: any) {
            alert(error.message || 'Failed to update connection');
        }
    };

    const eventDate = new Date(eventData.eventDate);
    const endDate = eventData.endDate ? new Date(eventData.endDate) : null;

    if (showConnectionForm || editingConnection) {
        return (
            <EventConnectionForm
                eventId={eventData.id}
                connection={editingConnection}
                onSuccess={
                    editingConnection ? handleConnectionUpdated : handleConnectionAdded
                }
                onCancel={() => {
                    setShowConnectionForm(false);
                    setEditingConnection(null);
                }}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <h2 className="text-2xl font-bold">{eventData.eventName}</h2>
                <Badge className={STATUS_COLORS[eventData.status]}>
                    {STATUS_LABELS[eventData.status]}
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Event Info */}
                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Event Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center text-sm">
                                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                                <span className="font-medium">Date & Time:</span>
                                <span className="ml-2">
                                    {eventDate.toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}{' '}
                                    at{' '}
                                    {eventDate.toLocaleTimeString('en-US', {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                    })}
                                </span>
                            </div>
                            {endDate && (
                                <div className="flex items-center text-sm">
                                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                                    <span className="font-medium">Ends:</span>
                                    <span className="ml-2">
                                        {endDate.toLocaleDateString('en-US', {
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}{' '}
                                        at{' '}
                                        {endDate.toLocaleTimeString('en-US', {
                                            hour: 'numeric',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                </div>
                            )}
                            {eventData.location && (
                                <div className="flex items-center text-sm">
                                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                                    <span>{eventData.location}</span>
                                </div>
                            )}
                            {eventData.isVirtual && (
                                <Badge variant="outline">Virtual Event</Badge>
                            )}
                            {eventData.eventUrl && (
                                <div>
                                    <a
                                        href={eventData.eventUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                    >
                                        {eventData.eventUrl}
                                    </a>
                                </div>
                            )}
                            {eventData.organizer && (
                                <div className="text-sm">
                                    <span className="font-medium">Organizer:</span>{' '}
                                    {eventData.organizer}
                                </div>
                            )}
                            {eventData.industry && (
                                <div className="text-sm">
                                    <span className="font-medium">Industry:</span>{' '}
                                    {eventData.industry}
                                </div>
                            )}
                            {eventData.description && (
                                <div>
                                    <span className="font-medium text-sm">Description:</span>
                                    <p className="text-sm text-gray-700 mt-1">
                                        {eventData.description}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {eventData.preEventGoals && eventData.preEventGoals.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Target className="h-5 w-5 mr-2" />
                                    Pre-Event Goals
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="list-disc list-inside space-y-1">
                                    {eventData.preEventGoals.map((goal, index) => (
                                        <li key={index} className="text-sm">
                                            {goal}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    {((eventData.targetCompanies && eventData.targetCompanies.length > 0) ||
                        (eventData.targetRoles && eventData.targetRoles.length > 0)) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Targets</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {eventData.targetCompanies &&
                                        eventData.targetCompanies.length > 0 && (
                                            <div>
                                                <div className="font-medium text-sm mb-2">
                                                    Target Companies:
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {eventData.targetCompanies.map((company, index) => (
                                                        <Badge key={index} variant="secondary">
                                                            {company}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    {eventData.targetRoles && eventData.targetRoles.length > 0 && (
                                        <div>
                                            <div className="font-medium text-sm mb-2">
                                                Target Roles:
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {eventData.targetRoles.map((role, index) => (
                                                    <Badge key={index} variant="secondary">
                                                        {role}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                    {eventData.preparationNotes && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Preparation Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm whitespace-pre-line">
                                    {eventData.preparationNotes}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {eventData.postEventNotes && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Post-Event Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm whitespace-pre-line">
                                    {eventData.postEventNotes}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {eventData.roiNotes && (
                        <Card>
                            <CardHeader>
                                <CardTitle>ROI Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm whitespace-pre-line">{eventData.roiNotes}</p>
                            </CardContent>
                        </Card>
                    )}

                    {linkedJobs.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Briefcase className="h-5 w-5 mr-2" />
                                    Linked Job Opportunities
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {linkedJobs.map((job) => (
                                        <div
                                            key={job.id}
                                            className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 cursor-pointer transition-colors"
                                            onClick={() => router.push(`/jobs/${user?.uid}?jobId=${job.id}`)}
                                        >
                                            <div>
                                                <div className="font-medium text-sm">{job.title}</div>
                                                <div className="text-xs text-gray-600">{job.company}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    These jobs are linked to track networking outcomes
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Connections Sidebar */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="flex items-center">
                                    <Users className="h-5 w-5 mr-2" />
                                    Connections
                                </CardTitle>
                                <Button
                                    size="sm"
                                    onClick={() => setShowConnectionForm(true)}
                                    className="bg-cyan-500 hover:bg-cyan-600 text-white"
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {eventData.eventConnections &&
                                eventData.eventConnections.length > 0 ? (
                                <div className="space-y-3">
                                    {eventData.eventConnections.map((connection) => (
                                        <div
                                            key={connection.id}
                                            className="border rounded p-3 space-y-2"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm">
                                                        {connection.contact?.fullName ||
                                                            connection.contactName ||
                                                            'Unknown'}
                                                    </div>
                                                    {connection.contactEmail && (
                                                        <div className="text-xs text-gray-600 flex items-center mt-1">
                                                            <Mail className="h-3 w-3 mr-1" />
                                                            {connection.contactEmail}
                                                        </div>
                                                    )}
                                                    {connection.contactCompany && (
                                                        <div className="text-xs text-gray-600 flex items-center mt-1">
                                                            <Building2 className="h-3 w-3 mr-1" />
                                                            {connection.contactCompany}
                                                        </div>
                                                    )}
                                                    {connection.contactRole && (
                                                        <div className="text-xs text-gray-600 flex items-center mt-1">
                                                            <Briefcase className="h-3 w-3 mr-1" />
                                                            {connection.contactRole}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleToggleFollowUp(connection)
                                                        }
                                                    >
                                                        {connection.followUpCompleted ? (
                                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                        ) : (
                                                            <Circle className="h-4 w-4 text-gray-400" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            setEditingConnection(connection)
                                                        }
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleDeleteConnection(connection.id)
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            {connection.notes && (
                                                <p className="text-xs text-gray-600 mt-2">
                                                    {connection.notes}
                                                </p>
                                            )}
                                            {connection.followUpDate && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Follow-up:{' '}
                                                    {new Date(
                                                        connection.followUpDate
                                                    ).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500 text-center py-4">
                                    No connections yet. Add your first connection!
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}


