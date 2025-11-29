'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    Search,
    Calendar,
    MapPin,
    Users,
    Target,
    Edit2,
    Trash2,
    Eye,
    Filter,
    X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
    networkingEventsApi,
    type NetworkingEvent,
    type NetworkingEventType,
    type NetworkingEventStatus,
} from '@/lib/networkingEvents.api';
import { useSearchParams } from 'next/navigation';
import NetworkingEventForm from './NetworkingEventForm';
import NetworkingEventDetail from './NetworkingEventDetail';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const EVENT_TYPE_LABELS: Record<NetworkingEventType, string> = {
    conference: 'Conference',
    meetup: 'Meetup',
    workshop: 'Workshop',
    webinar: 'Webinar',
    career_fair: 'Career Fair',
    networking_mixer: 'Networking Mixer',
    industry_event: 'Industry Event',
    virtual_event: 'Virtual Event',
};

const STATUS_LABELS: Record<NetworkingEventStatus, string> = {
    planned: 'Planned',
    registered: 'Registered',
    attended: 'Attended',
    cancelled: 'Cancelled',
    completed: 'Completed',
};

const STATUS_COLORS: Record<NetworkingEventStatus, string> = {
    planned: 'bg-blue-100 text-blue-700',
    registered: 'bg-purple-100 text-purple-700',
    attended: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    completed: 'bg-gray-100 text-gray-700',
};

export default function NetworkingEventsList() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState<NetworkingEvent[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<NetworkingEvent | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'form' | 'detail'>('list');
    const [editingEvent, setEditingEvent] = useState<NetworkingEvent | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [showUpcoming, setShowUpcoming] = useState(false);

    useEffect(() => {
        if (user) {
            loadEvents();
        }
    }, [user, filterType, filterStatus, showUpcoming]);

    // Handle eventId from URL query parameter
    useEffect(() => {
        const eventId = searchParams?.get('eventId');
        if (eventId && events.length > 0) {
            const event = events.find(e => e.id === eventId);
            if (event) {
                setSelectedEvent(event);
                setViewMode('detail');
            }
        }
    }, [searchParams, events]);

    const loadEvents = async () => {
        if (!user?.uid) return;

        setLoading(true);
        try {
            const data = await networkingEventsApi.listEvents({
                eventType: filterType ? (filterType as NetworkingEventType) : undefined,
                status: filterStatus ? (filterStatus as NetworkingEventStatus) : undefined,
                upcoming: showUpcoming || undefined,
            });
            setEvents(data);
        } catch (error: any) {
            console.error('Failed to load events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        loadEvents();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this event?')) return;

        try {
            await networkingEventsApi.deleteEvent(id);
            await loadEvents();
            if (selectedEvent?.id === id) {
                setSelectedEvent(null);
                setViewMode('list');
            }
        } catch (error: any) {
            alert(error.message || 'Failed to delete event');
        }
    };

    const handleEventCreated = () => {
        setViewMode('list');
        setEditingEvent(null);
        loadEvents();
    };

    const handleEventUpdated = () => {
        setViewMode('list');
        setEditingEvent(null);
        setSelectedEvent(null);
        loadEvents();
    };

    const handleViewEvent = (event: NetworkingEvent) => {
        setSelectedEvent(event);
        setViewMode('detail');
    };

    const handleEditEvent = (event: NetworkingEvent) => {
        setEditingEvent(event);
        setViewMode('form');
    };

    const handleNewEvent = () => {
        setEditingEvent(null);
        setSelectedEvent(null);
        setViewMode('form');
    };

    const filteredEvents = events.filter((event) => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            event.eventName.toLowerCase().includes(search) ||
            event.organizer?.toLowerCase().includes(search) ||
            event.location?.toLowerCase().includes(search) ||
            event.industry?.toLowerCase().includes(search)
        );
    });

    if (viewMode === 'form') {
        return (
            <NetworkingEventForm
                event={editingEvent}
                onSuccess={editingEvent ? handleEventUpdated : handleEventCreated}
                onCancel={() => {
                    setViewMode('list');
                    setEditingEvent(null);
                }}
            />
        );
    }

    if (viewMode === 'detail' && selectedEvent) {
        return (
            <NetworkingEventDetail
                event={selectedEvent}
                onBack={() => {
                    setViewMode('list');
                    setSelectedEvent(null);
                }}
                onUpdate={handleEventUpdated}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Networking Events</h2>
                <Button onClick={handleNewEvent} className="bg-cyan-500 hover:bg-cyan-600 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Event
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search events..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                className="pl-10"
                            />
                        </div>
                        <Select value={filterType || 'all'} onValueChange={(value) => setFilterType(value === 'all' ? '' : value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Event Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={filterStatus || 'all'} onValueChange={(value) => setFilterStatus(value === 'all' ? '' : value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            variant={showUpcoming ? 'default' : 'outline'}
                            onClick={() => setShowUpcoming(!showUpcoming)}
                            className={showUpcoming ? 'bg-cyan-500 hover:bg-cyan-600 text-white' : ''}
                        >
                            <Calendar className="h-4 w-4 mr-2" />
                            {showUpcoming ? 'All Events' : 'Upcoming'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Events List */}
            {loading ? (
                <div className="text-center py-8">Loading events...</div>
            ) : filteredEvents.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                        No networking events found. Create your first event to get started!
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEvents.map((event) => {
                        const eventDate = new Date(event.eventDate);
                        const isUpcoming = eventDate >= new Date();
                        const isPast = eventDate < new Date();

                        return (
                            <Card
                                key={event.id}
                                className={`hover:shadow-md transition cursor-pointer ${isPast ? 'opacity-75' : ''
                                    }`}
                            >
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg">{event.eventName}</CardTitle>
                                        <Badge className={STATUS_COLORS[event.status]}>
                                            {STATUS_LABELS[event.status]}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Calendar className="h-4 w-4 mr-2" />
                                            {eventDate.toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                                hour: 'numeric',
                                                minute: '2-digit',
                                            })}
                                        </div>
                                        {event.location && (
                                            <div className="flex items-center text-sm text-gray-600">
                                                <MapPin className="h-4 w-4 mr-2" />
                                                {event.location}
                                            </div>
                                        )}
                                        {event.isVirtual && (
                                            <Badge variant="outline" className="text-xs">
                                                Virtual
                                            </Badge>
                                        )}
                                        {event.connectionsMade !== undefined && event.connectionsMade > 0 && (
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Users className="h-4 w-4 mr-2" />
                                                {event.connectionsMade} connection{event.connectionsMade !== 1 ? 's' : ''}
                                            </div>
                                        )}
                                        {event.preEventGoals && event.preEventGoals.length > 0 && (
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Target className="h-4 w-4 mr-2" />
                                                {event.preEventGoals.length} goal{event.preEventGoals.length !== 1 ? 's' : ''}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleViewEvent(event)}
                                        >
                                            <Eye className="h-4 w-4 mr-1" />
                                            View
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEditEvent(event)}
                                        >
                                            <Edit2 className="h-4 w-4 mr-1" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDelete(event.id)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            Delete
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

