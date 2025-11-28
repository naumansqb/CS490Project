'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import {
    networkingEventsApi,
    type NetworkingEventConnection,
    type CreateEventConnectionData,
    type UpdateEventConnectionData,
} from '@/lib/networkingEvents.api';
import { getProfessionalContacts, type ProfessionalContact } from '@/lib/contacts.api';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface EventConnectionFormProps {
    eventId: string;
    connection?: NetworkingEventConnection | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function EventConnectionForm({
    eventId,
    connection,
    onSuccess,
    onCancel,
}: EventConnectionFormProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [contacts, setContacts] = useState<ProfessionalContact[]>([]);
    const [formData, setFormData] = useState<CreateEventConnectionData>({
        eventId,
        contactId: connection?.contactId || null,
        contactName: connection?.contactName || '',
        contactEmail: connection?.contactEmail || '',
        contactCompany: connection?.contactCompany || '',
        contactRole: connection?.contactRole || '',
        notes: connection?.notes || '',
        followUpDate: connection?.followUpDate
            ? new Date(connection.followUpDate).toISOString().split('T')[0]
            : '',
        followUpCompleted: connection?.followUpCompleted || false,
    });

    useEffect(() => {
        if (user) {
            loadContacts();
        }
    }, [user]);

    const loadContacts = async () => {
        if (!user?.uid) return;
        try {
            const response = await getProfessionalContacts({});
            setContacts(response.contacts || []);
        } catch (error) {
            console.error('Failed to load contacts:', error);
        }
    };

    const handleContactSelect = (contactId: string) => {
        const contact = contacts.find((c) => c.id === contactId);
        if (contact) {
            setFormData({
                ...formData,
                contactId,
                contactName: contact.fullName,
                contactEmail: contact.email || '',
                contactCompany: contact.company || '',
                contactRole: contact.jobTitle || '',
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);
        try {
            const submitData: CreateEventConnectionData | UpdateEventConnectionData = {
                ...formData,
                followUpDate: formData.followUpDate || null,
            };

            if (connection) {
                await networkingEventsApi.updateConnection(connection.id, submitData);
            } else {
                await networkingEventsApi.addConnection(submitData);
            }
            onSuccess();
        } catch (error: any) {
            alert(error.message || 'Failed to save connection');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    {connection ? 'Edit Connection' : 'Add Connection'}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="contactId">Link to Existing Contact (Optional)</Label>
                        <Select
                            value={formData.contactId || 'none'}
                            onValueChange={(value) =>
                                value && value !== 'none' ? handleContactSelect(value) : setFormData({ ...formData, contactId: null })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a contact..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None (New Contact)</SelectItem>
                                {contacts.map((contact) => (
                                    <SelectItem key={contact.id} value={contact.id}>
                                        {contact.fullName}
                                        {contact.company && ` - ${contact.company}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 mt-1">
                            Or fill in the details below to create a new contact entry
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="contactName">Name</Label>
                            <Input
                                id="contactName"
                                value={formData.contactName}
                                onChange={(e) =>
                                    setFormData({ ...formData, contactName: e.target.value })
                                }
                            />
                        </div>
                        <div>
                            <Label htmlFor="contactEmail">Email</Label>
                            <Input
                                id="contactEmail"
                                type="email"
                                value={formData.contactEmail}
                                onChange={(e) =>
                                    setFormData({ ...formData, contactEmail: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="contactCompany">Company</Label>
                            <Input
                                id="contactCompany"
                                value={formData.contactCompany}
                                onChange={(e) =>
                                    setFormData({ ...formData, contactCompany: e.target.value })
                                }
                            />
                        </div>
                        <div>
                            <Label htmlFor="contactRole">Role</Label>
                            <Input
                                id="contactRole"
                                value={formData.contactRole}
                                onChange={(e) =>
                                    setFormData({ ...formData, contactRole: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) =>
                                setFormData({ ...formData, notes: e.target.value })
                            }
                            rows={3}
                        />
                    </div>

                    <div>
                        <Label htmlFor="followUpDate">Follow-up Date</Label>
                        <Input
                            id="followUpDate"
                            type="date"
                            value={formData.followUpDate}
                            onChange={(e) =>
                                setFormData({ ...formData, followUpDate: e.target.value })
                            }
                        />
                    </div>

                    <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-cyan-500 hover:bg-cyan-600 text-white">
                            {loading
                                ? 'Saving...'
                                : connection
                                ? 'Update Connection'
                                : 'Add Connection'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}


