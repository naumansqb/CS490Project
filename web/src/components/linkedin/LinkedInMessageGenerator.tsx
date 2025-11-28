'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Copy, Loader2, Sparkles } from 'lucide-react';
import { linkedinApi, type LinkedInMessageInput } from '@/lib/linkedin.api';

export default function LinkedInMessageGenerator() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ message: string; tips: string[]; subject?: string } | null>(null);
    
    const [formData, setFormData] = useState<LinkedInMessageInput>({
        contactName: '',
        contactCompany: '',
        contactJobTitle: '',
        relationshipStrength: undefined,
        relationshipType: '',
        messagePurpose: 'connection_request',
        context: '',
        tone: 'professional',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.contactName || !formData.messagePurpose) {
            alert("Please fill in contact name and message purpose");
            return;
        }

        setLoading(true);
        try {
            const response = await linkedinApi.generateMessage(formData);
            setResult(response);
        } catch (error: any) {
            console.error('Failed to generate message:', error);
            alert(error.message || "Failed to generate message");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Generate LinkedIn Message
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="contactName">Contact Name *</Label>
                                <Input
                                    id="contactName"
                                    value={formData.contactName}
                                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="contactCompany">Company</Label>
                                <Input
                                    id="contactCompany"
                                    value={formData.contactCompany}
                                    onChange={(e) => setFormData({ ...formData, contactCompany: e.target.value })}
                                    placeholder="Acme Corp"
                                />
                            </div>
                            <div>
                                <Label htmlFor="contactJobTitle">Job Title</Label>
                                <Input
                                    id="contactJobTitle"
                                    value={formData.contactJobTitle}
                                    onChange={(e) => setFormData({ ...formData, contactJobTitle: e.target.value })}
                                    placeholder="Software Engineer"
                                />
                            </div>
                            <div>
                                <Label htmlFor="messagePurpose">Message Purpose *</Label>
                                <Select
                                    value={formData.messagePurpose}
                                    onValueChange={(value: any) => setFormData({ ...formData, messagePurpose: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="connection_request">Connection Request</SelectItem>
                                        <SelectItem value="follow_up">Follow Up</SelectItem>
                                        <SelectItem value="informational_interview">Informational Interview</SelectItem>
                                        <SelectItem value="referral_request">Referral Request</SelectItem>
                                        <SelectItem value="thank_you">Thank You</SelectItem>
                                        <SelectItem value="check_in">Check In</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="relationshipStrength">Relationship Strength (1-10)</Label>
                                <Input
                                    id="relationshipStrength"
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={formData.relationshipStrength || ''}
                                    onChange={(e) => setFormData({ 
                                        ...formData, 
                                        relationshipStrength: e.target.value ? parseInt(e.target.value) : undefined 
                                    })}
                                    placeholder="5"
                                />
                            </div>
                            <div>
                                <Label htmlFor="tone">Tone</Label>
                                <Select
                                    value={formData.tone}
                                    onValueChange={(value: any) => setFormData({ ...formData, tone: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="professional">Professional</SelectItem>
                                        <SelectItem value="casual">Casual</SelectItem>
                                        <SelectItem value="warm">Warm</SelectItem>
                                        <SelectItem value="direct">Direct</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="context">Additional Context</Label>
                            <Textarea
                                id="context"
                                value={formData.context}
                                onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                                placeholder="Any additional context about the relationship or situation..."
                                rows={3}
                            />
                        </div>
                        <Button type="submit" disabled={loading} className="bg-cyan-500 hover:bg-cyan-600 text-white">
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Generate Message
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {result && (
                <Card>
                    <CardHeader>
                        <CardTitle>Generated Message</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {result.subject && (
                            <div>
                                <Label>Subject</Label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Input value={result.subject} readOnly />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            copyToClipboard(result.subject!);
                                        }}
                                    >
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                        <div>
                            <Label>Message</Label>
                            <div className="mt-1 p-4 bg-gray-50 rounded-lg border">
                                <p className="whitespace-pre-wrap text-sm">{result.message}</p>
                            </div>
                            <Button
                                variant="outline"
                                className="mt-2"
                                onClick={(e) => {
                                    e.preventDefault();
                                    copyToClipboard(result.message);
                                }}
                            >
                                <Copy className="w-4 h-4 mr-2" />
                                Copy Message
                            </Button>
                        </div>
                        {result.tips && result.tips.length > 0 && (
                            <div>
                                <Label>Tips</Label>
                                <ul className="mt-1 space-y-1">
                                    {result.tips.map((tip, index) => (
                                        <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                            <span className="text-cyan-500">•</span>
                                            <span>{tip}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

