'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Save, X, Plus } from 'lucide-react';
import {
    createProfessionalContact,
    updateProfessionalContact,
    type ProfessionalContact,
    type CreateContactData,
} from '@/lib/contacts.api';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { RELATIONSHIP_TYPES, INDUSTRIES } from '@/lib/constants/contacts';

const FOLLOW_UP_FREQUENCIES = [
    'weekly',
    'monthly',
    'quarterly',
    'yearly',
    'as_needed',
];

interface ContactFormProps {
    contact?: ProfessionalContact;
    onSave: () => void;
    onCancel: () => void;
}

type ContactFormState = CreateContactData & { fullName?: string };

export default function ContactForm({ contact, onSave, onCancel }: ContactFormProps) {
    const isEditing = !!contact;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState<ContactFormState>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        linkedinUrl: '',
        websiteUrl: '',
        profilePhotoUrl: '',
        company: '',
        jobTitle: '',
        industry: '',
        locationCity: '',
        locationState: '',
        locationCountry: '',
        relationshipType: '',
        relationshipStrength: 50,
        category: '',
        tags: [],
        personalNotes: '',
        professionalNotes: '',
        mutualConnections: [],
        linkedJobIds: [],
        lastContactDate: '',
        nextFollowUpDate: '',
        followUpFrequency: '',
        source: 'manual',
        fullName: '',
    });

    const [customIndustry, setCustomIndustry] = useState('');
    const [customRelationshipType, setCustomRelationshipType] = useState('');
    const [showCustomIndustry, setShowCustomIndustry] = useState(false);
    const [showCustomRelationshipType, setShowCustomRelationshipType] = useState(false);

    useEffect(() => {
        if (contact) {
            const industry = contact.industry || '';
            const relationshipType = contact.relationshipType || '';

            const isCustomIndustry = !!industry && !INDUSTRIES.includes(industry as string);
            const isCustomRelationshipType =
                !!relationshipType && !RELATIONSHIP_TYPES.includes(relationshipType as string);

            setFormData({
                firstName: contact.firstName || '',
                lastName: contact.lastName || '',
                email: contact.email || '',
                phone: contact.phone || '',
                linkedinUrl: contact.linkedinUrl || '',
                websiteUrl: contact.websiteUrl || '',
                profilePhotoUrl: contact.profilePhotoUrl || '',
                company: contact.company || '',
                jobTitle: contact.jobTitle || '',
                industry,
                locationCity: contact.locationCity || '',
                locationState: contact.locationState || '',
                locationCountry: contact.locationCountry || '',
                relationshipType,
                relationshipStrength: contact.relationshipStrength ?? 50,
                category: contact.category || '',
                tags: contact.tags || [],
                personalNotes: contact.personalNotes || '',
                professionalNotes: contact.professionalNotes || '',
                mutualConnections: contact.mutualConnections || [],
                linkedJobIds: contact.linkedJobIds || [],
                lastContactDate: contact.lastContactDate || '',
                nextFollowUpDate: contact.nextFollowUpDate || '',
                followUpFrequency: contact.followUpFrequency || '',
                source: contact.source || 'manual',
                fullName:
                    contact.fullName ||
                    `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
            });

            setShowCustomIndustry(isCustomIndustry);
            setCustomIndustry(isCustomIndustry ? industry : '');

            setShowCustomRelationshipType(isCustomRelationshipType);
            setCustomRelationshipType(isCustomRelationshipType ? relationshipType : '');
        } else {
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                linkedinUrl: '',
                websiteUrl: '',
                profilePhotoUrl: '',
                company: '',
                jobTitle: '',
                industry: '',
                locationCity: '',
                locationState: '',
                locationCountry: '',
                relationshipType: '',
                relationshipStrength: 50,
                category: '',
                tags: [],
                personalNotes: '',
                professionalNotes: '',
                mutualConnections: [],
                linkedJobIds: [],
                lastContactDate: '',
                nextFollowUpDate: '',
                followUpFrequency: '',
                source: 'manual',
                fullName: '',
            });
            setCustomIndustry('');
            setCustomRelationshipType('');
            setShowCustomIndustry(false);
            setShowCustomRelationshipType(false);
        }
    }, [contact]);

    const handleChange = (field: keyof ContactFormState, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const finalIndustry =
                showCustomIndustry && customIndustry ? customIndustry : formData.industry || '';

            const finalRelationshipType =
                showCustomRelationshipType && customRelationshipType
                    ? customRelationshipType
                    : formData.relationshipType || '';

            const finalFullName =
                formData.fullName && formData.fullName.trim().length > 0
                    ? formData.fullName.trim()
                    : `${formData.firstName || ''} ${formData.lastName || ''}`.trim();

            const submitData: ContactFormState = {
                ...formData,
                industry: finalIndustry || undefined,
                relationshipType: finalRelationshipType || undefined,
                fullName: finalFullName || undefined,
            };

            if (isEditing && contact) {
                await updateProfessionalContact(contact.id, submitData);
            } else {
                await createProfessionalContact(submitData);
            }

            onSave();
        } catch (error: any) {
            setError(error.message || 'Failed to save contact');
        } finally {
            setLoading(false);
        }
    };

    const handleTagAdd = () => {
        const tagInput = document.getElementById('tag-input') as HTMLInputElement | null;
        const tag = tagInput?.value.trim();
        if (tag && !formData.tags?.includes(tag)) {
            handleChange('tags', [...(formData.tags || []), tag]);
            if (tagInput) tagInput.value = '';
        }
    };

    const handleTagRemove = (tagToRemove: string) => {
        handleChange(
            'tags',
            formData.tags?.filter((t) => t !== tagToRemove) || [],
        );
    };

    const handleMutualConnectionAdd = () => {
        const input = document.getElementById(
            'mutual-connection-input',
        ) as HTMLInputElement | null;
        const value = input?.value.trim();
        if (value && !formData.mutualConnections?.includes(value)) {
            handleChange('mutualConnections', [...(formData.mutualConnections || []), value]);
            if (input) input.value = '';
        }
    };

    const handleMutualConnectionRemove = (connectionToRemove: string) => {
        handleChange(
            'mutualConnections',
            formData.mutualConnections?.filter((c) => c !== connectionToRemove) || [],
        );
    };

    return (
        <div className="space-y-6 p-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">
                        {isEditing ? 'Edit Contact' : 'Add New Contact'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {isEditing
                            ? 'Update contact information'
                            : 'Create a new professional contact'}
                    </p>
                </div>
                <Button variant="outline" onClick={onCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                </Button>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Contact Info */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold border-b pb-2">
                                Contact Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="firstName">
                                        First Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="firstName"
                                        value={formData.firstName || ''}
                                        onChange={(e) => handleChange('firstName', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="lastName">
                                        Last Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="lastName"
                                        value={formData.lastName || ''}
                                        onChange={(e) => handleChange('lastName', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email || ''}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        placeholder="contact@example.com"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={formData.phone || ''}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                        placeholder="+1 (555) 123-4567"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                                    <Input
                                        id="linkedinUrl"
                                        type="text"
                                        value={formData.linkedinUrl || ''}
                                        onChange={(e) => {
                                            let value = e.target.value.trim();
                                            if (value && !value.match(/^https?:\/\//i)) {
                                                value = 'https://' + value;
                                            }
                                            handleChange('linkedinUrl', value);
                                        }}
                                        placeholder="linkedin.com/in/username"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="websiteUrl">Website URL</Label>
                                    <Input
                                        id="websiteUrl"
                                        type="text"
                                        value={formData.websiteUrl || ''}
                                        onChange={(e) => {
                                            let value = e.target.value.trim();
                                            if (value && !value.match(/^https?:\/\//i)) {
                                                value = 'https://' + value;
                                            }
                                            handleChange('websiteUrl', value);
                                        }}
                                        placeholder="example.com"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Professional Info */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold border-b pb-2">
                                Professional Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="company">Company</Label>
                                    <Input
                                        id="company"
                                        value={formData.company || ''}
                                        onChange={(e) => handleChange('company', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="jobTitle">Job Title</Label>
                                    <Input
                                        id="jobTitle"
                                        value={formData.jobTitle || ''}
                                        onChange={(e) => handleChange('jobTitle', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="industry">Industry</Label>
                                    <Select
                                        value={
                                            formData.industry &&
                                                !INDUSTRIES.includes(formData.industry as string)
                                                ? 'Other'
                                                : formData.industry || undefined
                                        }
                                        onValueChange={(value) => {
                                            if (value === 'Other') {
                                                setShowCustomIndustry(true);
                                                if (
                                                    formData.industry &&
                                                    !INDUSTRIES.includes(formData.industry as string)
                                                ) {
                                                    setCustomIndustry(formData.industry);
                                                } else {
                                                    setCustomIndustry('');
                                                    handleChange('industry', '');
                                                }
                                            } else {
                                                handleChange('industry', value || '');
                                                setCustomIndustry('');
                                                setShowCustomIndustry(false);
                                            }
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select industry" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {INDUSTRIES.map((ind) => (
                                                <SelectItem key={ind} value={ind}>
                                                    {ind}
                                                </SelectItem>
                                            ))}
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {showCustomIndustry && (
                                        <Input
                                            id="customIndustry"
                                            placeholder="Enter custom industry"
                                            value={customIndustry}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setCustomIndustry(value);
                                                handleChange('industry', value);
                                            }}
                                            className="mt-2"
                                        />
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="locationCity">City</Label>
                                    <Input
                                        id="locationCity"
                                        value={formData.locationCity || ''}
                                        onChange={(e) =>
                                            handleChange('locationCity', e.target.value)
                                        }
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="locationState">State</Label>
                                    <Input
                                        id="locationState"
                                        value={formData.locationState || ''}
                                        onChange={(e) =>
                                            handleChange('locationState', e.target.value)
                                        }
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="locationCountry">Country</Label>
                                    <Input
                                        id="locationCountry"
                                        value={formData.locationCountry || ''}
                                        onChange={(e) =>
                                            handleChange('locationCountry', e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Relationship Info */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold border-b pb-2">
                                Relationship
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="relationshipType">Relationship Type</Label>
                                    <Select
                                        value={
                                            formData.relationshipType &&
                                                !RELATIONSHIP_TYPES.includes(
                                                    formData.relationshipType as string,
                                                )
                                                ? 'other'
                                                : formData.relationshipType || undefined
                                        }
                                        onValueChange={(value) => {
                                            if (value === 'other') {
                                                setShowCustomRelationshipType(true);
                                                if (
                                                    formData.relationshipType &&
                                                    !RELATIONSHIP_TYPES.includes(
                                                        formData.relationshipType as string,
                                                    )
                                                ) {
                                                    setCustomRelationshipType(
                                                        formData.relationshipType,
                                                    );
                                                } else {
                                                    setCustomRelationshipType('');
                                                    handleChange('relationshipType', '');
                                                }
                                            } else {
                                                handleChange('relationshipType', value || '');
                                                setCustomRelationshipType('');
                                                setShowCustomRelationshipType(false);
                                            }
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {RELATIONSHIP_TYPES.map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {type.charAt(0).toUpperCase() +
                                                        type.slice(1)}
                                                </SelectItem>
                                            ))}
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {showCustomRelationshipType && (
                                        <Input
                                            id="customRelationshipType"
                                            placeholder="Enter custom relationship type"
                                            value={customRelationshipType}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setCustomRelationshipType(value);
                                                handleChange('relationshipType', value);
                                            }}
                                            className="mt-2"
                                        />
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="category">Category</Label>
                                    <Input
                                        id="category"
                                        value={formData.category || ''}
                                        onChange={(e) =>
                                            handleChange('category', e.target.value)
                                        }
                                        placeholder="e.g. Tech Industry, Alumni Network"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="relationshipStrength">
                                        Relationship Strength:{' '}
                                        {formData.relationshipStrength ?? 50}/100
                                    </Label>
                                    <Input
                                        id="relationshipStrength"
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={formData.relationshipStrength ?? 50}
                                        onChange={(e) =>
                                            handleChange(
                                                'relationshipStrength',
                                                parseInt(e.target.value, 10),
                                            )
                                        }
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Follow-up & Reminders */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold border-b pb-2">
                                Follow-up & Reminders
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="lastContactDate">
                                        Last Contact Date
                                    </Label>
                                    <Input
                                        id="lastContactDate"
                                        type="date"
                                        value={
                                            (formData.lastContactDate || '').split('T')[0]
                                        }
                                        onChange={(e) =>
                                            handleChange(
                                                'lastContactDate',
                                                e.target.value || '',
                                            )
                                        }
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="nextFollowUpDate">
                                        Next Follow-up Date
                                    </Label>
                                    <Input
                                        id="nextFollowUpDate"
                                        type="date"
                                        value={
                                            (formData.nextFollowUpDate || '').split('T')[0]
                                        }
                                        onChange={(e) =>
                                            handleChange(
                                                'nextFollowUpDate',
                                                e.target.value || '',
                                            )
                                        }
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="followUpFrequency">
                                        Follow-up Frequency
                                    </Label>
                                    <Select
                                        value={formData.followUpFrequency || undefined}
                                        onValueChange={(value) =>
                                            handleChange(
                                                'followUpFrequency',
                                                value || '',
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select frequency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {FOLLOW_UP_FREQUENCIES.map((freq) => (
                                                <SelectItem key={freq} value={freq}>
                                                    {freq
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                        freq
                                                            .slice(1)
                                                            .replace('_', ' ')}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold border-b pb-2">Tags</h2>
                            <div className="flex gap-2">
                                <Input
                                    id="tag-input"
                                    placeholder="Add a tag and press Enter"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleTagAdd();
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    onClick={handleTagAdd}
                                    className="bg-cyan-500 hover:bg-cyan-600 text-white"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            {formData.tags && formData.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {formData.tags.map((tag) => (
                                        <div
                                            key={tag}
                                            className="flex items-center gap-1 bg-secondary rounded-full px-3 py-1 text-sm"
                                        >
                                            <span>{tag}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleTagRemove(tag)}
                                                className="ml-1 hover:text-destructive"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Mutual Connections */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold border-b pb-2">
                                Mutual Connections
                            </h2>
                            <div className="flex gap-2">
                                <Input
                                    id="mutual-connection-input"
                                    placeholder="Add a mutual connection and press Enter"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleMutualConnectionAdd();
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    onClick={handleMutualConnectionAdd}
                                    className="bg-cyan-500 hover:bg-cyan-600 text-white"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            {formData.mutualConnections &&
                                formData.mutualConnections.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {formData.mutualConnections.map((connection) => (
                                            <div
                                                key={connection}
                                                className="flex items-center gap-1 bg-secondary rounded-full px-3 py-1 text-sm"
                                            >
                                                <span>{connection}</span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleMutualConnectionRemove(
                                                            connection,
                                                        )
                                                    }
                                                    className="ml-1 hover:text-destructive"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                        </div>

                        {/* Notes */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold border-b pb-2">Notes</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="personalNotes">Personal Notes</Label>
                                    <Textarea
                                        id="personalNotes"
                                        value={formData.personalNotes || ''}
                                        onChange={(e) =>
                                            handleChange('personalNotes', e.target.value)
                                        }
                                        placeholder="Personal interests, hobbies, etc."
                                        rows={4}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="professionalNotes">
                                        Professional Notes
                                    </Label>
                                    <Textarea
                                        id="professionalNotes"
                                        value={formData.professionalNotes || ''}
                                        onChange={(e) =>
                                            handleChange(
                                                'professionalNotes',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Professional context, past collaborations, etc."
                                        rows={4}
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-4 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="bg-cyan-500 hover:bg-cyan-600 text-white"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        {isEditing ? 'Update Contact' : 'Create Contact'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
