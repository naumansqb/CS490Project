'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Edit2,
    Trash2,
    Mail,
    Phone,
    Linkedin,
    Globe,
    Building2,
    Briefcase,
    MapPin,
    Users,
    Calendar,
    Tag,
    Plus,
    Clock,
    TrendingUp,
    TrendingDown,
    BriefcaseIcon,
    Link as LinkIcon,
} from 'lucide-react';
import {
    getContactInteractions,
    addContactInteraction,
    updateContactInteraction,
    deleteContactInteraction,
    getProfessionalContact,
    linkContactToJob,
    updateProfessionalContact,
    type ProfessionalContact,
    type ContactInteraction,
    type CreateInteractionData,
} from '@/lib/contacts.api';
import { getJobOpportunitiesByUserId } from '@/lib/jobs.api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const INTERACTION_TYPES = [
    'email',
    'phone',
    'meeting',
    'coffee',
    'message',
    'event',
    'call',
    'other',
];

interface ContactDetailProps {
    contact: ProfessionalContact;
    onEdit: () => void;
    onDelete: () => void;
    onBack: () => void;
    onUpdate: () => void;
    onContactUpdate?: (contact: ProfessionalContact) => void;
}

export default function ContactDetail({
    contact: initialContact,
    onEdit,
    onDelete,
    onBack,
    onUpdate,
    onContactUpdate,
}: ContactDetailProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [contact, setContact] = useState<ProfessionalContact>(initialContact);
    const [interactions, setInteractions] = useState<ContactInteraction[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddInteraction, setShowAddInteraction] = useState(false);
    const [editingInteractionId, setEditingInteractionId] = useState<string | null>(null);
    const [showLinkJob, setShowLinkJob] = useState(false);
    const [jobs, setJobs] = useState<any[]>([]);
    const [loadingJobs, setLoadingJobs] = useState(false);
    const [newInteraction, setNewInteraction] = useState<CreateInteractionData>({
        interactionType: '',
        interactionDate: new Date().toISOString().split('T')[0],
        notes: '',
        outcome: '',
        relationshipChange: 0,
    });
    const [savingInteraction, setSavingInteraction] = useState(false);

    useEffect(() => {
        setContact(initialContact);
    }, [initialContact]);

    useEffect(() => {
        loadInteractions();
    }, [contact.id]);

    useEffect(() => {
        if (user?.uid) {
            loadJobs();
        }
    }, [user, contact.id]);

    const loadContactData = async () => {
        try {
            const updatedContact = await getProfessionalContact(contact.id);
            setContact(updatedContact);
            if (onContactUpdate) {
                onContactUpdate(updatedContact);
            }
        } catch (error) {
        }
    };

    const loadJobs = async () => {
        if (!user?.uid) return;
        setLoadingJobs(true);
        try {
            const jobsList = await getJobOpportunitiesByUserId(user.uid);
            setJobs(jobsList || []);
        } catch (error) {
        } finally {
            setLoadingJobs(false);
        }
    };

    const handleLinkJob = async (jobId: string) => {
        try {
            const currentLinkedJobIds = contact.linkedJobIds || [];
            if (currentLinkedJobIds.includes(jobId)) {
                return;
            }
            
            const updatedLinkedJobIds = [...currentLinkedJobIds, jobId];
            
            setContact({
                ...contact,
                linkedJobIds: updatedLinkedJobIds,
            });
            
            const updatedContact = await updateProfessionalContact(contact.id, { linkedJobIds: updatedLinkedJobIds });
            
            setContact(updatedContact);
            if (onContactUpdate) {
                onContactUpdate(updatedContact);
            }
            
            await loadContactData();
            setShowLinkJob(false);
            onUpdate();
        } catch (error: any) {
            await loadContactData();
            alert(error.message || 'Failed to link job');
        }
    };

    const handleUnlinkJob = async (jobId: string) => {
        try {
            const currentLinkedJobIds = contact.linkedJobIds || [];
            const updatedLinkedJobIds = currentLinkedJobIds.filter(id => id !== jobId);
            
            setContact({
                ...contact,
                linkedJobIds: updatedLinkedJobIds,
            });
            
            const updatedContact = await updateProfessionalContact(contact.id, { linkedJobIds: updatedLinkedJobIds });
            
            setContact(updatedContact);
            if (onContactUpdate) {
                onContactUpdate(updatedContact);
            }
            
            await loadContactData();
            onUpdate();
        } catch (error: any) {
            await loadContactData();
            alert(error.message || 'Failed to unlink job');
        }
    };

    const loadInteractions = async () => {
        try {
            setLoading(true);
            const data = await getContactInteractions(contact.id);
            setInteractions(data);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const handleAddInteraction = async () => {
        if (!newInteraction.interactionType || !newInteraction.interactionDate) {
            alert('Please fill in required fields');
            return;
        }

        setSavingInteraction(true);
        try {
            await addContactInteraction(contact.id, {
                ...newInteraction,
                interactionDate: new Date(newInteraction.interactionDate).toISOString(),
            });
            setNewInteraction({
                interactionType: '',
                interactionDate: new Date().toISOString().split('T')[0],
                notes: '',
                outcome: '',
                relationshipChange: 0,
            });
            setShowAddInteraction(false);
            await loadInteractions();
            await loadContactData();
            onUpdate();
        } catch (error: any) {
            alert(error.message || 'Failed to add interaction');
        } finally {
            setSavingInteraction(false);
        }
    };

    const handleEditInteraction = (interaction: ContactInteraction) => {
        setEditingInteractionId(interaction.id);
        setNewInteraction({
            interactionType: interaction.interactionType,
            interactionDate: new Date(interaction.interactionDate).toISOString().split('T')[0],
            notes: interaction.notes || '',
            outcome: interaction.outcome || '',
            relationshipChange: interaction.relationshipChange || 0,
        });
        setShowAddInteraction(true);
    };

    const handleUpdateInteraction = async () => {
        if (!editingInteractionId || !newInteraction.interactionType || !newInteraction.interactionDate) {
            alert('Please fill in required fields');
            return;
        }

        setSavingInteraction(true);
        try {
            await updateContactInteraction(contact.id, editingInteractionId, {
                ...newInteraction,
                interactionDate: new Date(newInteraction.interactionDate).toISOString(),
            });
            setEditingInteractionId(null);
            setNewInteraction({
                interactionType: '',
                interactionDate: new Date().toISOString().split('T')[0],
                notes: '',
                outcome: '',
                relationshipChange: 0,
            });
            setShowAddInteraction(false);
            await loadInteractions();
            await loadContactData();
            onUpdate();
        } catch (error: any) {
            alert(error.message || 'Failed to update interaction');
        } finally {
            setSavingInteraction(false);
        }
    };

    const handleDeleteInteraction = async (interactionId: string) => {
        if (!confirm('Are you sure you want to delete this interaction?')) {
            return;
        }

        try {
            await deleteContactInteraction(contact.id, interactionId);
            setInteractions(interactions.filter(i => i.id !== interactionId));
            await loadContactData();
            onUpdate();
        } catch (error: any) {
            alert(error.message || 'Failed to delete interaction');
        }
    };


    return (
        <div className="space-y-6 p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">{contact.fullName}</h1>
                        {(contact.jobTitle || contact.company) && (
                            <p className="text-muted-foreground mt-1">
                                {contact.jobTitle && <span>{contact.jobTitle}</span>}
                                {contact.jobTitle && contact.company && <span> at </span>}
                                {contact.company && <span>{contact.company}</span>}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onEdit}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                    </Button>
                    <Button variant="destructive" onClick={onDelete}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="md:col-span-2 space-y-6">
                    {/* Contact Card */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-start gap-4">
                                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    {contact.profilePhotoUrl ? (
                                        <img
                                            src={contact.profilePhotoUrl}
                                            alt={contact.fullName}
                                            className="h-20 w-20 rounded-full object-cover"
                                        />
                                    ) : (
                                        <Users className="h-10 w-10 text-primary" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-2xl">{contact.fullName}</CardTitle>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {contact.relationshipType && (
                                            <Badge variant="outline">{contact.relationshipType}</Badge>
                                        )}
                                        {contact.industry && (
                                            <Badge variant="secondary">{contact.industry}</Badge>
                                        )}
                                        {contact.category && (
                                            <Badge>{contact.category}</Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Contact Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {contact.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <a
                                            href={`mailto:${contact.email}`}
                                            className="text-primary hover:underline"
                                        >
                                            {contact.email}
                                        </a>
                                    </div>
                                )}
                                {contact.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <a
                                            href={`tel:${contact.phone}`}
                                            className="text-primary hover:underline"
                                        >
                                            {contact.phone}
                                        </a>
                                    </div>
                                )}
                                {contact.linkedinUrl && (
                                    <div className="flex items-center gap-2">
                                        <Linkedin className="h-4 w-4 text-muted-foreground" />
                                        <a
                                            href={contact.linkedinUrl.startsWith('http') ? contact.linkedinUrl : `https://${contact.linkedinUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline flex items-center gap-1"
                                        >
                                            LinkedIn
                                            <Globe className="h-3 w-3" />
                                        </a>
                                    </div>
                                )}
                                {contact.websiteUrl && (
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-muted-foreground" />
                                        <a
                                            href={contact.websiteUrl.startsWith('http') ? contact.websiteUrl : `https://${contact.websiteUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline"
                                        >
                                            Website
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* Professional Details */}
                            {(contact.company || contact.jobTitle || contact.industry) && (
                                <div className="border-t pt-4 space-y-2">
                                    {contact.company && (
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                            <span>{contact.company}</span>
                                        </div>
                                    )}
                                    {contact.jobTitle && (
                                        <div className="flex items-center gap-2">
                                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                                            <span>{contact.jobTitle}</span>
                                        </div>
                                    )}
                                    {contact.industry && (
                                        <div className="flex items-center gap-2">
                                            <Tag className="h-4 w-4 text-muted-foreground" />
                                            <span>{contact.industry}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Location */}
                            {(contact.locationCity || contact.locationState || contact.locationCountry) && (
                                <div className="flex items-center gap-2 border-t pt-4">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                        {[
                                            contact.locationCity,
                                            contact.locationState,
                                            contact.locationCountry,
                                        ]
                                            .filter(Boolean)
                                            .join(', ')}
                                    </span>
                                </div>
                            )}

                            {/* Notes */}
                            {(contact.personalNotes || contact.professionalNotes) && (
                                <div className="border-t pt-4 space-y-4">
                                    {contact.personalNotes && (
                                        <div>
                                            <h4 className="font-semibold mb-1">Personal Notes</h4>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                {contact.personalNotes}
                                            </p>
                                        </div>
                                    )}
                                    {contact.professionalNotes && (
                                        <div>
                                            <h4 className="font-semibold mb-1">Professional Notes</h4>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                {contact.professionalNotes}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tags */}
                            {contact.tags && contact.tags.length > 0 && (
                                <div className="border-t pt-4">
                                    <h4 className="font-semibold mb-2">Tags</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {contact.tags.map((tag) => (
                                            <Badge key={tag} variant="outline">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Interaction History */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Interaction History
                                </CardTitle>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowAddInteraction(!showAddInteraction)}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Interaction
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {showAddInteraction && (
                                <Card className="bg-muted/50">
                                    <CardContent className="pt-6 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Interaction Type *</Label>
                                                <Select
                                                    value={newInteraction.interactionType}
                                                    onValueChange={(value) =>
                                                        setNewInteraction({ ...newInteraction, interactionType: value })
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {INTERACTION_TYPES.map((type) => (
                                                            <SelectItem key={type} value={type}>
                                                                {type.charAt(0).toUpperCase() + type.slice(1)}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label>Date *</Label>
                                                <Input
                                                    type="date"
                                                    value={newInteraction.interactionDate}
                                                    onChange={(e) =>
                                                        setNewInteraction({
                                                            ...newInteraction,
                                                            interactionDate: e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label>Notes</Label>
                                            <Textarea
                                                value={newInteraction.notes}
                                                onChange={(e) =>
                                                    setNewInteraction({ ...newInteraction, notes: e.target.value })
                                                }
                                                rows={3}
                                            />
                                        </div>
                                        <div>
                                            <Label>Outcome</Label>
                                            <Input
                                                value={newInteraction.outcome}
                                                onChange={(e) =>
                                                    setNewInteraction({ ...newInteraction, outcome: e.target.value })
                                                }
                                            />
                                        </div>
                                        <div>
                                            <Label>
                                                Relationship Change: {newInteraction.relationshipChange || 0} (-10 to +10)
                                            </Label>
                                            <Input
                                                type="range"
                                                min="-10"
                                                max="10"
                                                value={newInteraction.relationshipChange || 0}
                                                onChange={(e) =>
                                                    setNewInteraction({
                                                        ...newInteraction,
                                                        relationshipChange: parseInt(e.target.value),
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={editingInteractionId ? handleUpdateInteraction : handleAddInteraction}
                                                disabled={savingInteraction}
                                                className="bg-cyan-500 hover:bg-cyan-600 text-white"
                                            >
                                                {savingInteraction ? 'Saving...' : editingInteractionId ? 'Update Interaction' : 'Save Interaction'}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setShowAddInteraction(false);
                                                    setEditingInteractionId(null);
                                                    setNewInteraction({
                                                        interactionType: '',
                                                        interactionDate: new Date().toISOString().split('T')[0],
                                                        notes: '',
                                                        outcome: '',
                                                        relationshipChange: 0,
                                                    });
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {loading ? (
                                <div className="text-center py-8">
                                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                                </div>
                            ) : interactions.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No interactions recorded yet
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {interactions.map((interaction) => (
                                        <div
                                            key={interaction.id}
                                            className="p-4 border rounded-lg space-y-2"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline">{interaction.interactionType}</Badge>
                                                    <span className="text-sm text-muted-foreground">
                                                        {new Date(interaction.interactionDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                {interaction.relationshipChange !== null &&
                                                    interaction.relationshipChange !== undefined &&
                                                    interaction.relationshipChange !== 0 && (
                                                        <div className="flex items-center gap-1">
                                                            {interaction.relationshipChange > 0 ? (
                                                                <TrendingUp className="h-4 w-4 text-cyan-500" />
                                                            ) : (
                                                                <TrendingDown className="h-4 w-4 text-cyan-500" />
                                                            )}
                                                            <span className="text-sm font-medium text-cyan-500">
                                                                {interaction.relationshipChange > 0 ? '+' : ''}
                                                                {interaction.relationshipChange}
                                                            </span>
                                                        </div>
                                                    )}
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditInteraction(interaction)}
                                                        className="h-8 px-2"
                                                    >
                                                        <Edit2 className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteInteraction(interaction.id)}
                                                        className="h-8 px-2 text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                            {interaction.notes && (
                                                <p className="text-sm text-muted-foreground">{interaction.notes}</p>
                                            )}
                                            {interaction.outcome && (
                                                <p className="text-sm font-medium">Outcome: {interaction.outcome}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Relationship Strength */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Relationship</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Strength</span>
                                    <span className="text-sm text-muted-foreground">
                                        {contact.relationshipStrength || 50}/100
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-4">
                                    <div
                                        className="h-4 rounded-full bg-cyan-500"
                                        style={{ width: `${contact.relationshipStrength || 50}%` }}
                                    ></div>
                                </div>
                            </div>
                            {contact.lastContactDate && (
                                <div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>Last contact:</span>
                                    </div>
                                    <p className="text-sm font-medium">
                                        {new Date(contact.lastContactDate).toLocaleDateString()}
                                    </p>
                                </div>
                            )}
                            {contact.nextFollowUpDate && (
                                <div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>Next follow-up:</span>
                                    </div>
                                    <p className="text-sm font-medium">
                                        {new Date(contact.nextFollowUpDate).toLocaleDateString()}
                                    </p>
                                </div>
                            )}
                            {contact.followUpFrequency && (
                                <div>
                                    <div className="text-sm text-muted-foreground">Frequency</div>
                                    <p className="text-sm font-medium capitalize">
                                        {contact.followUpFrequency.replace('_', ' ')}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Mutual Connections */}
                    {contact.mutualConnections && contact.mutualConnections.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Mutual Connections
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-1">
                                    {contact.mutualConnections.map((connection, index) => (
                                        <li key={index} className="text-sm">
                                            • {connection}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    {/* Linked Jobs */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <BriefcaseIcon className="h-5 w-5" />
                                    Linked Jobs
                                </CardTitle>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowLinkJob(!showLinkJob)}
                                    className="bg-cyan-500 hover:bg-cyan-600 text-white"
                                >
                                    <LinkIcon className="h-4 w-4 mr-1" />
                                    Link Job
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {showLinkJob && (
                                <Card className="bg-muted/50 mb-3">
                                    <CardContent className="pt-4 space-y-3">
                                        {loadingJobs ? (
                                            <div className="text-center py-4">
                                                <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                                            </div>
                                        ) : jobs.length === 0 ? (
                                            <p className="text-sm text-muted-foreground text-center py-2">
                                                No jobs available
                                            </p>
                                        ) : (
                                            <>
                                                <Label className="text-sm font-medium">Select a job to link:</Label>
                                                <Select onValueChange={(jobId) => handleLinkJob(jobId)}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Choose a job..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {jobs
                                                            .filter(job => !contact.linkedJobIds?.includes(job.id))
                                                            .map((job) => (
                                                                <SelectItem key={job.id} value={job.id}>
                                                                    {job.title} at {job.company}
                                                                </SelectItem>
                                                            ))}
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setShowLinkJob(false)}
                                                    className="w-full"
                                                >
                                                    Cancel
                                                </Button>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                            {contact.linkedJobIds && contact.linkedJobIds.length > 0 ? (
                                <div className="space-y-2">
                                    {contact.linkedJobIds.map((jobId) => {
                                        const job = jobs.find(j => j.id === jobId);
                                        return (
                                            <div
                                                key={jobId}
                                                className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50"
                                            >
                                                <div
                                                    className="flex-1 cursor-pointer"
                                                    onClick={() => router.push(`/dashboard/jobs/${jobId}`)}
                                                >
                                                    {job ? (
                                                        <>
                                                            <div className="font-medium text-sm">{job.title}</div>
                                                            <div className="text-xs text-muted-foreground">{job.company}</div>
                                                        </>
                                                    ) : (
                                                        <div className="text-sm text-muted-foreground">Loading job...</div>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleUnlinkJob(jobId)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    Unlink
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-2">
                                    No jobs linked yet
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

