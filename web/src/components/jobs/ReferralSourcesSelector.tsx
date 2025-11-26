'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    Building2,
    TrendingUp,
    Clock,
    CheckCircle2,
    AlertCircle,
    Sparkles,
} from 'lucide-react';
import {
    getPotentialReferralSources,
    type PotentialReferralSource,
    type PotentialSourcesResponse,
} from '@/lib/referralRequests.api';
import { getProfessionalContacts, type ProfessionalContact } from '@/lib/contacts.api';
import { useAuth } from '@/contexts/AuthContext';

interface ReferralSourcesSelectorProps {
    jobId: string;
    onSelectContact: (contact: PotentialReferralSource | ProfessionalContact) => void;
    onClose?: () => void;
}

export default function ReferralSourcesSelector({
    jobId,
    onSelectContact,
    onClose,
}: ReferralSourcesSelectorProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<PotentialSourcesResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showAllContacts, setShowAllContacts] = useState(false);
    const [allContacts, setAllContacts] = useState<ProfessionalContact[]>([]);
    const [loadingAllContacts, setLoadingAllContacts] = useState(false);

    useEffect(() => {
        if (jobId && user?.uid) {
            loadPotentialSources();
        }
    }, [jobId, user]);

    const loadPotentialSources = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await getPotentialReferralSources(jobId);
            setData(result);
        } catch (err: any) {
            setError(err.message || 'Failed to load potential referral sources');
        } finally {
            setLoading(false);
        }
    };

    const loadAllContacts = async () => {
        if (!user?.uid) return;
        try {
            setLoadingAllContacts(true);
            setError(null);
            const result = await getProfessionalContacts({ limit: 1000 }); // Get all contacts
            console.log('Loaded contacts result:', result);
            // Handle both ContactsResponse format and direct array
            const contacts = result?.contacts || (Array.isArray(result) ? result : []);
            console.log('Extracted contacts:', contacts);
            setAllContacts(Array.isArray(contacts) ? contacts : []);
            setShowAllContacts(true);
        } catch (err: any) {
            console.error('Error loading contacts:', err);
            setError(err.message || 'Failed to load contacts');
            setAllContacts([]);
        } finally {
            setLoadingAllContacts(false);
        }
    };

    const convertContactToSource = (contact: ProfessionalContact): PotentialReferralSource => {
        return {
            ...contact,
            optimalTimingScore: contact.relationshipStrength || 50,
            timingReason: 'Manual selection',
            daysSinceLastContact: contact.lastContactDate
                ? Math.floor(
                      (Date.now() - new Date(contact.lastContactDate).getTime()) /
                          (1000 * 60 * 60 * 24)
                  )
                : 365,
            existingReferralRequests: 0,
        };
    };

    const getTimingScoreColor = (score: number) => {
        if (score >= 70) return 'text-green-600 bg-green-50';
        if (score >= 50) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    const getTimingScoreLabel = (score: number) => {
        if (score >= 70) return 'Optimal';
        if (score >= 50) return 'Good';
        return 'Consider Timing';
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-center py-8">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                        <span className="ml-2">Finding potential referral sources...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="text-center py-8 text-red-600">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                        <p>{error}</p>
                        <Button onClick={loadPotentialSources} className="mt-4" variant="outline">
                            Try Again
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!data || data.potentialSources.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Potential Referral Sources
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No automatic matches found for this job.</p>
                        <p className="text-sm mt-2 mb-4">
                            You can still request a referral from any of your contacts.
                        </p>
                        <Button
                            onClick={loadAllContacts}
                            disabled={loadingAllContacts}
                            className="bg-cyan-500 hover:bg-cyan-600 text-white"
                        >
                            {loadingAllContacts ? (
                                <>
                                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Loading...
                                </>
                            ) : (
                                <>
                                    <Users className="h-4 w-4 mr-2" />
                                    Browse All Contacts
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!data && !showAllContacts) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-center py-8">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                        <span className="ml-2">Loading...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {showAllContacts ? 'All Contacts' : 'Linked Contacts'}
                    </CardTitle>
                    <div className="flex gap-2">
                        {!showAllContacts && data && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={loadAllContacts}
                                disabled={loadingAllContacts}
                            >
                                {loadingAllContacts ? (
                                    <>
                                        <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-gray-900 mr-2"></div>
                                        Loading...
                                    </>
                                ) : (
                                    <>
                                        <Users className="h-3 w-3 mr-1" />
                                        Browse All
                                    </>
                                )}
                            </Button>
                        )}
                        {showAllContacts && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setShowAllContacts(false);
                                    setAllContacts([]);
                                }}
                            >
                                Back to Linked
                            </Button>
                        )}
                        {onClose && (
                            <Button variant="ghost" size="sm" onClick={onClose}>
                                Close
                            </Button>
                        )}
                    </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                    {showAllContacts ? (
                        <>
                            Showing all {allContacts.length} contact{allContacts.length !== 1 ? 's' : ''} from your network
                            {data?.job && (
                                <> for <strong>{data.job.title}</strong> at <strong>{data.job.company}</strong></>
                            )}
                        </>
                    ) : data ? (
                        <>
                            Found {data.potentialSources.length} contact{data.potentialSources.length !== 1 ? 's' : ''} linked to{' '}
                            <strong>{data.job.title}</strong> at <strong>{data.job.company}</strong>
                        </>
                    ) : null}
                </p>
            </CardHeader>
            <CardContent>
                {showAllContacts && allContacts.length === 0 && !loadingAllContacts && (
                    <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No contacts found.</p>
                        <p className="text-sm mt-2">Try adding contacts first.</p>
                    </div>
                )}
                {showAllContacts && loadingAllContacts && (
                    <div className="flex items-center justify-center py-8">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                        <span className="ml-2">Loading contacts...</span>
                    </div>
                )}
                {((showAllContacts && allContacts.length > 0) || (!showAllContacts && data && data.potentialSources.length > 0)) && (
                <div className="space-y-4">
                    {(showAllContacts ? allContacts : (data?.potentialSources || [])).map((contact) => {
                        // Convert ProfessionalContact to PotentialReferralSource if needed
                        const sourceContact: PotentialReferralSource = showAllContacts
                            ? convertContactToSource(contact as ProfessionalContact)
                            : (contact as PotentialReferralSource);
                        
                        return (
                        <div
                            key={sourceContact.id}
                            className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h4 className="font-semibold">{sourceContact.fullName}</h4>
                                        {!showAllContacts && data && sourceContact.company === data.job.company && (
                                            <Badge variant="default" className="bg-cyan-500">
                                                <Building2 className="h-3 w-3 mr-1" />
                                                Same Company
                                            </Badge>
                                        )}
                                        {!showAllContacts && data && sourceContact.industry === data.job.industry && (
                                            <Badge variant="secondary">
                                                Same Industry
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
                                        {sourceContact.jobTitle && (
                                            <div className="flex items-center gap-1">
                                                <span>{sourceContact.jobTitle}</span>
                                            </div>
                                        )}
                                        {sourceContact.company && (
                                            <div className="flex items-center gap-1">
                                                <Building2 className="h-3 w-3" />
                                                <span>{sourceContact.company}</span>
                                            </div>
                                        )}
                                        {sourceContact.relationshipType && (
                                            <div className="flex items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                <span>{sourceContact.relationshipType}</span>
                                            </div>
                                        )}
                                        {sourceContact.relationshipStrength !== undefined && (
                                            <div className="flex items-center gap-1">
                                                <TrendingUp className="h-3 w-3" />
                                                <span>
                                                    Relationship: {sourceContact.relationshipStrength}/100
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-3">
                                        <Badge
                                            className={getTimingScoreColor(
                                                sourceContact.optimalTimingScore
                                            )}
                                        >
                                            <Sparkles className="h-3 w-3 mr-1" />
                                            {getTimingScoreLabel(sourceContact.optimalTimingScore)}:{' '}
                                            {sourceContact.optimalTimingScore}/100
                                        </Badge>
                                        {sourceContact.daysSinceLastContact !== undefined && (
                                            <Badge variant="outline">
                                                <Clock className="h-3 w-3 mr-1" />
                                                {sourceContact.daysSinceLastContact === 0
                                                    ? 'Contacted today'
                                                    : sourceContact.daysSinceLastContact < 30
                                                      ? `Contacted ${sourceContact.daysSinceLastContact} days ago`
                                                      : `Last contact: ${sourceContact.daysSinceLastContact} days ago`}
                                            </Badge>
                                        )}
                                        {sourceContact.existingReferralRequests > 0 && (
                                            <Badge variant="outline" className="text-orange-600">
                                                <AlertCircle className="h-3 w-3 mr-1" />
                                                {sourceContact.existingReferralRequests} pending
                                                {sourceContact.existingReferralRequests !== 1
                                                    ? ' requests'
                                                    : ' request'}
                                            </Badge>
                                        )}
                                    </div>

                                    {sourceContact.timingReason && (
                                        <p className="text-xs text-muted-foreground mb-2">
                                            💡 {sourceContact.timingReason}
                                        </p>
                                    )}

                                    {sourceContact.mutualConnections &&
                                        sourceContact.mutualConnections.length > 0 && (
                                            <p className="text-xs text-muted-foreground">
                                                Mutual connections:{' '}
                                                {sourceContact.mutualConnections.slice(0, 3).join(', ')}
                                                {sourceContact.mutualConnections.length > 3 &&
                                                    ` +${sourceContact.mutualConnections.length - 3} more`}
                                            </p>
                                        )}
                                </div>

                                <div className="ml-4">
                                    <Button
                                        onClick={() => onSelectContact(sourceContact)}
                                        className="bg-cyan-500 hover:bg-cyan-600 text-white"
                                    >
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Request Referral
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
    );
}

