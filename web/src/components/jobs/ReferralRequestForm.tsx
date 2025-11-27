'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Sparkles,
    Send,
    Clock,
    Edit2,
    CheckCircle2,
    AlertCircle,
    Loader2,
} from 'lucide-react';
import {
    createReferralRequest,
    type PotentialReferralSource,
    type ReferralRequest,
} from '@/lib/referralRequests.api';
import { type ProfessionalContact } from '@/lib/contacts.api';
import { getJobOpportunity } from '@/lib/jobs.api';
import { generateReferralTemplate as generateAITemplate } from '@/lib/ai.api';

interface ReferralRequestFormProps {
    contact: PotentialReferralSource | ProfessionalContact;
    jobId: string;
    onSuccess: () => void;
    onCancel: () => void;
    existingRequest?: ReferralRequest;
}

export default function ReferralRequestForm({
    contact,
    jobId,
    onSuccess,
    onCancel,
    existingRequest,
    onUpdate,
}: ReferralRequestFormProps) {
    const [loading, setLoading] = useState(false);
    const [generatingTemplate, setGeneratingTemplate] = useState(false);
    const [job, setJob] = useState<any>(null);
    const [requestMessage, setRequestMessage] = useState('');
    const [templateUsed, setTemplateUsed] = useState('');
    const [followUpDate, setFollowUpDate] = useState('');
    const [templateStyle, setTemplateStyle] = useState<'professional' | 'casual' | 'warm' | 'direct'>('professional');

    useEffect(() => {
        loadJob();
            if (existingRequest) {
                setRequestMessage(existingRequest.requestMessage || '');
                setTemplateUsed(existingRequest.templateUsed || '');
                if (existingRequest.followUpDate) {
                    setFollowUpDate(new Date(existingRequest.followUpDate).toISOString().split('T')[0]);
                }
            }
    }, [jobId, existingRequest]);

    const loadJob = async () => {
        try {
            const jobData = await getJobOpportunity(jobId);
            setJob(jobData);
        } catch (error) {
            console.error('Failed to load job:', error);
        }
    };

    const handleGenerateTemplate = async (regenerate: boolean = false) => {
        if (!job) {
            alert('Please wait for job details to load');
            return;
        }

        try {
            setGeneratingTemplate(true);
            const result = await generateAITemplate({
                contactName: contact.fullName || (contact as ProfessionalContact).fullName || 'Contact',
                contactCompany: contact.company || (contact as ProfessionalContact).company,
                contactJobTitle: contact.jobTitle || (contact as ProfessionalContact).jobTitle,
                relationshipStrength: contact.relationshipStrength || (contact as ProfessionalContact).relationshipStrength,
                relationshipType: contact.relationshipType || (contact as ProfessionalContact).relationshipType,
                jobTitle: job.title,
                companyName: job.company,
                jobDescription: job.description || job.jobDescription,
                templateStyle: regenerate ? templateStyle : 'professional',
            });
            setRequestMessage(result.message);
            setTemplateUsed('ai_generated');
        } catch (error: any) {
            alert(error.message || 'Failed to generate template');
        } finally {
            setGeneratingTemplate(false);
        }
    };

    // Get contact info, handling both PotentialReferralSource and ProfessionalContact
    const getContactInfo = () => {
        const contactInfo = contact as any;
        return {
            fullName: contactInfo.fullName || `${contactInfo.firstName || ''} ${contactInfo.lastName || ''}`.trim(),
            firstName: contactInfo.firstName,
            company: contactInfo.company,
            optimalTimingScore: contactInfo.optimalTimingScore || contactInfo.relationshipStrength || 50,
            timingReason: contactInfo.timingReason || 'Manual selection',
        };
    };

    const contactInfo = getContactInfo();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!requestMessage.trim()) {
            alert('Please enter a referral request message');
            return;
        }

        setLoading(true);
        try {
            if (existingRequest) {
                // Update existing request
                const { updateReferralRequest } = await import('@/lib/referralRequests.api');
                await updateReferralRequest(existingRequest.id, {
                    requestMessage,
                    templateUsed: templateUsed || 'custom',
                    followUpDate: followUpDate || undefined,
                    status: 'draft',
                });
            } else {
                // Create new request
                await createReferralRequest({
                    jobId,
                    contactId: contact.id,
                    requestMessage,
                    templateUsed: templateUsed || 'custom',
                    status: 'draft',
                    followUpDate: followUpDate || undefined,
                    optimalTimingScore: contactInfo.optimalTimingScore,
                    timingReason: contactInfo.timingReason,
                });
            }
            if (onUpdate) onUpdate();
            onSuccess();
        } catch (error: any) {
            alert(error.message || 'Failed to save referral request');
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!requestMessage.trim()) {
            alert('Please enter a referral request message');
            return;
        }

        setLoading(true);
        try {
            if (existingRequest) {
                const { updateReferralRequest } = await import('@/lib/referralRequests.api');
                await updateReferralRequest(existingRequest.id, {
                    requestMessage,
                    templateUsed: templateUsed || 'custom',
                    status: 'sent',
                    sentDate: new Date().toISOString(),
                    followUpDate: followUpDate || undefined,
                });
            } else {
                await createReferralRequest({
                    jobId,
                    contactId: contact.id,
                    requestMessage,
                    templateUsed: templateUsed || 'custom',
                    status: 'sent',
                    followUpDate: followUpDate || undefined,
                    optimalTimingScore: contactInfo.optimalTimingScore,
                    timingReason: contactInfo.timingReason,
                });
            }
            if (onUpdate) onUpdate();
            onSuccess();
        } catch (error: any) {
            alert(error.message || 'Failed to send referral request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={onCancel}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        {existingRequest ? 'Edit Referral Request' : 'Request Referral'}
                    </DialogTitle>
                    <DialogDescription>
                        Request a referral from <strong>{contactInfo.fullName}</strong> for{' '}
                        <strong>{job?.title}</strong> at <strong>{job?.company}</strong>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Contact & Timing Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div>
                            <Label className="text-sm font-semibold">Contact</Label>
                            <p className="text-sm">{contactInfo.fullName}</p>
                            {contactInfo.company && (
                                <p className="text-xs text-muted-foreground">{contactInfo.company}</p>
                            )}
                        </div>
                        <div>
                            <Label className="text-sm font-semibold">Optimal Timing Score</Label>
                            <div className="flex items-center gap-2">
                                <div
                                    className={`text-sm font-semibold ${
                                        contactInfo.optimalTimingScore >= 70
                                            ? 'text-green-600'
                                            : contactInfo.optimalTimingScore >= 50
                                              ? 'text-yellow-600'
                                              : 'text-red-600'
                                    }`}
                                >
                                    {contactInfo.optimalTimingScore}/100
                                </div>
                                {contactInfo.timingReason && (
                                    <p className="text-xs text-muted-foreground">
                                        {contactInfo.timingReason}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Template Generation */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Label>Referral Request Message</Label>
                            <div className="flex items-center gap-2">
                                {requestMessage && (
                                    <>
                                        <Select
                                            value={templateStyle}
                                            onValueChange={(value: 'professional' | 'casual' | 'warm' | 'direct') => {
                                                setTemplateStyle(value);
                                            }}
                                        >
                                            <SelectTrigger className="w-32">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="professional">Professional</SelectItem>
                                                <SelectItem value="casual">Casual</SelectItem>
                                                <SelectItem value="warm">Warm</SelectItem>
                                                <SelectItem value="direct">Direct</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleGenerateTemplate(true)}
                                            disabled={generatingTemplate}
                                        >
                                            {generatingTemplate ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Regenerating...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="h-4 w-4 mr-2" />
                                                    Regenerate
                                                </>
                                            )}
                                        </Button>
                                    </>
                                )}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleGenerateTemplate(false)}
                                    disabled={generatingTemplate}
                                >
                                    {generatingTemplate ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-4 w-4 mr-2" />
                                            {requestMessage ? 'Generate New' : 'Generate Template'}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                        <Textarea
                            value={requestMessage}
                            onChange={(e) => setRequestMessage(e.target.value)}
                            placeholder="Enter your referral request message or generate a personalized template..."
                            rows={12}
                            className="font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Use the AI template generator for personalized messages based on your profile and relationship with this contact.
                        </p>
                    </div>

                    {/* Follow-up Date */}
                    <div>
                        <Label htmlFor="followUpDate">Follow-up Date</Label>
                        <Input
                            id="followUpDate"
                            type="date"
                            value={followUpDate}
                            onChange={(e) => setFollowUpDate(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            When to follow up if no response
                        </p>
                    </div>

                    {/* Etiquette Tips */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Referral Etiquette Tips
                        </h4>
                        <ul className="text-xs space-y-1 text-muted-foreground">
                            <li>
                                • Be specific about the role and why you're interested in it
                            </li>
                            <li>
                                • Make it easy for them - provide your resume and key talking points
                            </li>
                            <li>
                                • Respect their time - keep the message concise and professional
                            </li>
                            <li>
                                • Always follow up with gratitude, regardless of the outcome
                            </li>
                            <li>
                                • Don't ask for multiple referrals at once - space them out
                            </li>
                        </ul>
                    </div>

                    <DialogFooter className="flex gap-2">
                        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="outline"
                            disabled={loading}
                            className="bg-gray-500 hover:bg-gray-600 text-white"
                        >
                            <Edit2 className="h-4 w-4 mr-2" />
                            {loading ? 'Saving...' : 'Save as Draft'}
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSend}
                            disabled={loading}
                            className="bg-cyan-500 hover:bg-cyan-600 text-white"
                        >
                            <Send className="h-4 w-4 mr-2" />
                            {loading ? 'Sending...' : 'Send Request'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

