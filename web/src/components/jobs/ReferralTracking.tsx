'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Send,
    Edit2,
    Trash2,
    TrendingUp,
    TrendingDown,
    Mail,
    Calendar,
    Eye,
    EyeOff,
} from 'lucide-react';
import {
    getReferralRequests,
    updateReferralRequest,
    deleteReferralRequest,
    type ReferralRequest,
    type ReferralStatus,
} from '@/lib/referralRequests.api';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface ReferralTrackingProps {
    jobId: string;
    onRequestReferral?: () => void;
    onUpdate?: () => void;
}

const STATUS_COLORS: Record<ReferralStatus, string> = {
    draft: 'bg-gray-100 text-gray-700',
    pending: 'bg-yellow-100 text-yellow-700',
    sent: 'bg-blue-100 text-blue-700',
    accepted: 'bg-green-100 text-green-700',
    declined: 'bg-red-100 text-red-700',
    completed: 'bg-purple-100 text-purple-700',
    expired: 'bg-gray-100 text-gray-500',
};

const STATUS_ICONS: Record<ReferralStatus, React.ReactNode> = {
    draft: <Edit2 className="h-4 w-4" />,
    pending: <Clock className="h-4 w-4" />,
    sent: <Send className="h-4 w-4" />,
    accepted: <CheckCircle2 className="h-4 w-4" />,
    declined: <XCircle className="h-4 w-4" />,
    completed: <CheckCircle2 className="h-4 w-4" />,
    expired: <AlertCircle className="h-4 w-4" />,
};

export default function ReferralTracking({ jobId, onRequestReferral, onUpdate }: ReferralTrackingProps) {
    const [referrals, setReferrals] = useState<ReferralRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingReferral, setEditingReferral] = useState<ReferralRequest | null>(null);
    const [updateData, setUpdateData] = useState<Partial<ReferralRequest>>({});
    const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (jobId) {
            loadReferrals();
        }
    }, [jobId]);

    const loadReferrals = async () => {
        try {
            setLoading(true);
            const data = await getReferralRequests({ jobId });
            setReferrals(data || []);
        } catch (error: any) {
            console.error('Failed to load referrals:', error);
            // If it's a 404 or empty response, just set empty array
            if (error?.status === 404 || error?.code === 'NOT_FOUND') {
                setReferrals([]);
            } else if (error?.message?.includes('relation') || error?.message?.includes('table') || error?.message?.includes('does not exist')) {
                // Database table doesn't exist yet - need migration
                console.warn('Referral requests table may not exist. Please run database migration.');
                setReferrals([]);
            } else {
                // Show user-friendly error
                const errorDetails = {
                    message: error?.message || String(error),
                    status: error?.status,
                    code: error?.code,
                    error: error,
                };
                console.error('Error details:', errorDetails);
                setReferrals([]); // Set empty array to prevent UI errors
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (referral: ReferralRequest, newStatus: ReferralStatus) => {
        // Optimistically update the UI immediately
        const updatedReferral = {
            ...referral,
            status: newStatus,
            sentDate: newStatus === 'sent' && !referral.sentDate ? new Date().toISOString() : referral.sentDate,
            responseDate: (newStatus === 'accepted' || newStatus === 'declined') && !referral.responseDate 
                ? new Date().toISOString() 
                : referral.responseDate,
            success: newStatus === 'accepted' || newStatus === 'completed' ? true : 
                    newStatus === 'declined' ? false : referral.success,
            relationshipImpact: referral.relationshipImpact !== undefined && referral.relationshipImpact !== null
                ? referral.relationshipImpact
                : newStatus === 'accepted' || newStatus === 'completed' ? 2 :
                  newStatus === 'declined' ? -1 : 0,
        };

        // Update local state immediately
        setReferrals(prev => prev.map(r => r.id === referral.id ? updatedReferral : r));

        try {
            const updatePayload: any = { status: newStatus };
            
            if (newStatus === 'sent' && referral.status !== 'sent') {
                updatePayload.sentDate = new Date().toISOString();
            }
            
            if (newStatus === 'accepted' || newStatus === 'declined') {
                updatePayload.responseDate = new Date().toISOString();
            }

            // Auto-set success and relationship impact
            if (newStatus === 'accepted' || newStatus === 'completed') {
                updatePayload.success = true;
                if (referral.relationshipImpact === undefined || referral.relationshipImpact === null) {
                    updatePayload.relationshipImpact = 2;
                }
            } else if (newStatus === 'declined') {
                updatePayload.success = false;
                if (referral.relationshipImpact === undefined || referral.relationshipImpact === null) {
                    updatePayload.relationshipImpact = -1;
                }
            }

            const updated = await updateReferralRequest(referral.id, updatePayload);
            // Update with server response (in case server made additional changes)
            setReferrals(prev => prev.map(r => r.id === referral.id ? updated : r));
            // Notify parent to refresh analytics
            if (onUpdate) onUpdate();
        } catch (error: any) {
            // Revert on error
            setReferrals(prev => prev.map(r => r.id === referral.id ? referral : r));
            alert(error.message || 'Failed to update referral status');
        }
    };

    const handleDelete = async (referral: ReferralRequest) => {
        if (!confirm('Are you sure you want to delete this referral request?')) {
            return;
        }
        
        // Optimistically remove from UI
        const originalReferrals = [...referrals];
        setReferrals(prev => prev.filter(r => r.id !== referral.id));
        
        try {
            await deleteReferralRequest(referral.id);
            // Notify parent to refresh analytics
            if (onUpdate) onUpdate();
        } catch (error: any) {
            // Revert on error
            setReferrals(originalReferrals);
            alert(error.message || 'Failed to delete referral request');
        }
    };

    const handleSaveUpdate = async () => {
        if (!editingReferral) return;
        
        // Optimistically update the UI
        const updatedReferral = {
            ...editingReferral,
            ...updateData,
        };
        setReferrals(prev => prev.map(r => r.id === editingReferral.id ? updatedReferral : r));
        
        const originalReferral = editingReferral;
        setEditingReferral(null);
        setUpdateData({});
        
        try {
            const updated = await updateReferralRequest(editingReferral.id, updateData);
            // Update with server response
            setReferrals(prev => prev.map(r => r.id === editingReferral.id ? updated : r));
            // Notify parent to refresh analytics
            if (onUpdate) onUpdate();
        } catch (error: any) {
            // Revert on error
            setReferrals(prev => prev.map(r => r.id === editingReferral.id ? originalReferral : r));
            alert(error.message || 'Failed to update referral request');
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-center py-8">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Referral Requests ({referrals.length})
                        </CardTitle>
                        {onRequestReferral && (
                            <Button
                                onClick={onRequestReferral}
                                className="bg-cyan-500 hover:bg-cyan-600 text-white"
                                size="sm"
                            >
                                <Users className="h-4 w-4 mr-2" />
                                Request Referral
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {referrals.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No referral requests yet.</p>
                            {onRequestReferral && (
                                <Button
                                    onClick={onRequestReferral}
                                    className="mt-4 bg-cyan-500 hover:bg-cyan-600 text-white"
                                    variant="outline"
                                >
                                    Request Your First Referral
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {referrals.map((referral) => {
                                const isExpanded = expandedMessages[referral.id] ?? false;
                                const canToggleMessage = Boolean(referral.requestMessage);

                                return (
                                <div
                                    key={referral.id}
                                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h4 className="font-semibold">
                                                    {referral.contact?.fullName || 'Unknown Contact'}
                                                </h4>
                                                <Badge
                                                    className={STATUS_COLORS[referral.status]}
                                                >
                                                    <span className="flex items-center gap-1">
                                                        {STATUS_ICONS[referral.status]}
                                                        {referral.status.charAt(0).toUpperCase() +
                                                            referral.status.slice(1)}
                                                    </span>
                                                </Badge>
                                            </div>

                                            {canToggleMessage && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="ml-2 h-7 w-7 text-muted-foreground"
                                                    onClick={() =>
                                                        setExpandedMessages((prev) => ({
                                                            ...prev,
                                                            [referral.id]: !isExpanded,
                                                        }))
                                                    }
                                                    aria-label={isExpanded ? 'Hide message' : 'Show full message'}
                                                >
                                                    {isExpanded ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            )}

                                            {referral.contact?.company && (
                                                <p className="text-sm text-muted-foreground mb-2">
                                                    {referral.contact.company}
                                                </p>
                                            )}

                                            {referral.requestMessage && (
                                                <p
                                                    className={`text-sm text-muted-foreground mb-3 whitespace-pre-line ${
                                                        isExpanded ? '' : 'line-clamp-2'
                                                    }`}
                                                >
                                                    {referral.requestMessage}
                                                </p>
                                            )}

                                            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                                {referral.sentDate && (
                                                    <div className="flex items-center gap-1">
                                                        <Send className="h-3 w-3" />
                                                        Sent:{' '}
                                                        {new Date(referral.sentDate).toLocaleDateString()}
                                                    </div>
                                                )}
                                                {referral.responseDate && (
                                                    <div className="flex items-center gap-1">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        Response:{' '}
                                                        {new Date(
                                                            referral.responseDate
                                                        ).toLocaleDateString()}
                                                    </div>
                                                )}
                                                {referral.followUpDate && (
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        Follow-up:{' '}
                                                        {new Date(
                                                            referral.followUpDate
                                                        ).toLocaleDateString()}
                                                    </div>
                                                )}
                                                {referral.relationshipImpact !== undefined &&
                                                    referral.relationshipImpact !== null && (
                                                        <div
                                                            className={`flex items-center gap-1 ${
                                                                referral.relationshipImpact > 0
                                                                    ? 'text-green-600'
                                                                    : referral.relationshipImpact < 0
                                                                      ? 'text-red-600'
                                                                      : ''
                                                            }`}
                                                        >
                                                            {referral.relationshipImpact > 0 ? (
                                                                <TrendingUp className="h-3 w-3" />
                                                            ) : referral.relationshipImpact < 0 ? (
                                                                <TrendingDown className="h-3 w-3" />
                                                            ) : null}
                                                            Impact: {referral.relationshipImpact > 0 ? '+' : ''}
                                                            {referral.relationshipImpact}
                                                        </div>
                                                    )}
                                            </div>

                                            {referral.outcome && (
                                                <p className="text-sm mt-2">
                                                    <strong>Outcome:</strong> {referral.outcome}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-2 ml-4">
                                            {referral.status === 'draft' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleUpdateStatus(referral, 'sent')}
                                                >
                                                    <Send className="h-3 w-3 mr-1" />
                                                    Send
                                                </Button>
                                            )}
                                            {referral.status === 'sent' && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={async () => {
                                                            await handleUpdateStatus(referral, 'accepted');
                                                            // Auto-set relationship impact if not set
                                                            if (referral.relationshipImpact === undefined || referral.relationshipImpact === null) {
                                                                await updateReferralRequest(referral.id, {
                                                                    relationshipImpact: 2, // Positive impact for acceptance
                                                                });
                                                                await loadReferrals();
                                                            }
                                                        }}
                                                    >
                                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                                        Accepted
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={async () => {
                                                            await handleUpdateStatus(referral, 'declined');
                                                            // Auto-set relationship impact if not set
                                                            if (referral.relationshipImpact === undefined || referral.relationshipImpact === null) {
                                                                await updateReferralRequest(referral.id, {
                                                                    relationshipImpact: -1, // Slight negative impact for decline
                                                                });
                                                                await loadReferrals();
                                                            }
                                                        }}
                                                    >
                                                        <XCircle className="h-3 w-3 mr-1" />
                                                        Declined
                                                    </Button>
                                                </>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    setEditingReferral(referral);
                                                    setUpdateData({
                                                        responseNotes: referral.responseNotes || '',
                                                        outcome: referral.outcome || '',
                                                        success: referral.success || false,
                                                        relationshipImpact:
                                                            referral.relationshipImpact || 0,
                                                        gratitudeExpressed:
                                                            referral.gratitudeExpressed || false,
                                                    });
                                                }}
                                            >
                                                <Edit2 className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDelete(referral)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            {editingReferral && (
                <Dialog open={!!editingReferral} onOpenChange={() => setEditingReferral(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Update Referral Request</DialogTitle>
                            <DialogDescription>
                                Update the outcome and relationship impact for this referral request.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>Outcome</Label>
                                <Input
                                    value={updateData.outcome || ''}
                                    onChange={(e) =>
                                        setUpdateData({ ...updateData, outcome: e.target.value })
                                    }
                                    placeholder="e.g., Got interview, Referred to hiring manager"
                                />
                            </div>
                            <div>
                                <Label>Response Notes</Label>
                                <Textarea
                                    value={updateData.responseNotes || ''}
                                    onChange={(e) =>
                                        setUpdateData({
                                            ...updateData,
                                            responseNotes: e.target.value,
                                        })
                                    }
                                    rows={3}
                                    placeholder="Any additional notes about the response..."
                                />
                            </div>
                            <div>
                                <Label>
                                    Relationship Impact: {updateData.relationshipImpact || 0} (-10 to
                                    +10)
                                </Label>
                                <Input
                                    type="range"
                                    min="-10"
                                    max="10"
                                    value={updateData.relationshipImpact || 0}
                                    onChange={(e) =>
                                        setUpdateData({
                                            ...updateData,
                                            relationshipImpact: parseInt(e.target.value),
                                        })
                                    }
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    How did this referral request affect your relationship?
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="success"
                                    checked={updateData.success || false}
                                    onChange={(e) =>
                                        setUpdateData({
                                            ...updateData,
                                            success: e.target.checked,
                                        })
                                    }
                                />
                                <Label htmlFor="success">Mark as successful</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="gratitude"
                                    checked={updateData.gratitudeExpressed || false}
                                    onChange={(e) =>
                                        setUpdateData({
                                            ...updateData,
                                            gratitudeExpressed: e.target.checked,
                                        })
                                    }
                                />
                                <Label htmlFor="gratitude">Gratitude expressed</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingReferral(null)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveUpdate}
                                className="bg-cyan-500 hover:bg-cyan-600 text-white"
                            >
                                Save
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}

