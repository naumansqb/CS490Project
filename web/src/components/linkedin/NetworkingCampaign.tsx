'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Target, Copy } from 'lucide-react';
import { linkedinApi, type NetworkingCampaignInput } from '@/lib/linkedin.api';
import { Badge } from '@/components/ui/badge';

export default function NetworkingCampaign() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [formData, setFormData] = useState<NetworkingCampaignInput>({
        campaignName: '',
        targetCompanies: [],
        targetRoles: [],
        targetIndustries: [],
        goals: [],
        timeline: '',
    });
    const [goalInput, setGoalInput] = useState('');
    const [companyInput, setCompanyInput] = useState('');
    const [roleInput, setRoleInput] = useState('');
    const [industryInput, setIndustryInput] = useState('');

    const addGoal = () => {
        if (goalInput.trim()) {
            setFormData({
                ...formData,
                goals: [...formData.goals, goalInput.trim()],
            });
            setGoalInput('');
        }
    };

    const removeGoal = (index: number) => {
        setFormData({
            ...formData,
            goals: formData.goals.filter((_, i) => i !== index),
        });
    };

    const addCompany = () => {
        if (companyInput.trim()) {
            setFormData({
                ...formData,
                targetCompanies: [...formData.targetCompanies, companyInput.trim()],
            });
            setCompanyInput('');
        }
    };

    const removeCompany = (index: number) => {
        setFormData({
            ...formData,
            targetCompanies: formData.targetCompanies.filter((_, i) => i !== index),
        });
    };

    const addRole = () => {
        if (roleInput.trim()) {
            setFormData({
                ...formData,
                targetRoles: [...formData.targetRoles, roleInput.trim()],
            });
            setRoleInput('');
        }
    };

    const removeRole = (index: number) => {
        setFormData({
            ...formData,
            targetRoles: formData.targetRoles.filter((_, i) => i !== index),
        });
    };

    const addIndustry = () => {
        if (industryInput.trim()) {
            setFormData({
                ...formData,
                targetIndustries: [...(formData.targetIndustries || []), industryInput.trim()],
            });
            setIndustryInput('');
        }
    };

    const removeIndustry = (index: number) => {
        setFormData({
            ...formData,
            targetIndustries: formData.targetIndustries?.filter((_, i) => i !== index) || [],
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.campaignName || formData.targetCompanies.length === 0 || 
            formData.targetRoles.length === 0 || formData.goals.length === 0 || !formData.timeline) {
            alert("Please fill in all required fields");
            return;
        }

        setLoading(true);
        try {
            const response = await linkedinApi.generateCampaign(formData);
            setResult(response);
        } catch (error: any) {
            console.error('Failed to generate campaign:', error);
            alert(error.message || "Failed to generate networking campaign");
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
                        <Target className="w-5 h-5" />
                        Networking Campaign
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="campaignName">Campaign Name *</Label>
                            <Input
                                id="campaignName"
                                value={formData.campaignName}
                                onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
                                placeholder="e.g., Q1 Tech Industry Outreach"
                                required
                            />
                        </div>
                        <div>
                            <Label>Target Companies *</Label>
                            <div className="flex gap-2 mt-2">
                                <Input
                                    value={companyInput}
                                    onChange={(e) => setCompanyInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCompany())}
                                    placeholder="e.g., Google"
                                />
                                <Button type="button" onClick={addCompany} variant="outline">Add</Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {formData.targetCompanies.map((company, index) => (
                                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                        {company}
                                        <button
                                            type="button"
                                            onClick={() => removeCompany(index)}
                                            className="ml-1 hover:text-red-500"
                                        >
                                            ×
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <div>
                            <Label>Target Roles *</Label>
                            <div className="flex gap-2 mt-2">
                                <Input
                                    value={roleInput}
                                    onChange={(e) => setRoleInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRole())}
                                    placeholder="e.g., Software Engineer"
                                />
                                <Button type="button" onClick={addRole} variant="outline">Add</Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {formData.targetRoles.map((role, index) => (
                                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                        {role}
                                        <button
                                            type="button"
                                            onClick={() => removeRole(index)}
                                            className="ml-1 hover:text-red-500"
                                        >
                                            ×
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <div>
                            <Label>Target Industries (Optional)</Label>
                            <div className="flex gap-2 mt-2">
                                <Input
                                    value={industryInput}
                                    onChange={(e) => setIndustryInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIndustry())}
                                    placeholder="e.g., Technology"
                                />
                                <Button type="button" onClick={addIndustry} variant="outline">Add</Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {formData.targetIndustries?.map((industry, index) => (
                                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                                        {industry}
                                        <button
                                            type="button"
                                            onClick={() => removeIndustry(index)}
                                            className="ml-1 hover:text-red-500"
                                        >
                                            ×
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <div>
                            <Label>Campaign Goals *</Label>
                            <div className="flex gap-2 mt-2">
                                <Input
                                    value={goalInput}
                                    onChange={(e) => setGoalInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
                                    placeholder="e.g., Connect with 20 hiring managers"
                                />
                                <Button type="button" onClick={addGoal} variant="outline">Add</Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {formData.goals.map((goal, index) => (
                                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                        {goal}
                                        <button
                                            type="button"
                                            onClick={() => removeGoal(index)}
                                            className="ml-1 hover:text-red-500"
                                        >
                                            ×
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="timeline">Timeline *</Label>
                            <Input
                                id="timeline"
                                value={formData.timeline}
                                onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                                placeholder="e.g., 3 months"
                                required
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
                                    <Target className="w-4 h-4 mr-2" />
                                    Generate Campaign
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {result && (
                <div className="space-y-6">
                    {/* Campaign Overview */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{result.campaign.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 mb-4">{result.campaign.strategy}</p>
                            <div className="space-y-4">
                                {result.campaign.phases.map((phase: any, index: number) => (
                                    <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-semibold">{phase.phase}</h4>
                                            <Badge variant="outline">{phase.duration}</Badge>
                                        </div>
                                        <div className="mb-3">
                                            <Label className="text-xs text-gray-500">Activities:</Label>
                                            <ul className="mt-1 space-y-1">
                                                {phase.activities.map((activity: string, i: number) => (
                                                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                                        <span className="text-cyan-500">•</span>
                                                        <span>{activity}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-gray-500">Goals:</Label>
                                            <ul className="mt-1 space-y-1">
                                                {phase.goals.map((goal: string, i: number) => (
                                                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                                        <span className="text-green-500">✓</span>
                                                        <span>{goal}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Outreach Templates */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Outreach Templates</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {result.outreachTemplates.map((template: any, index: number) => (
                                <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="font-semibold">{template.scenario}</Label>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => copyToClipboard(template.template)}
                                        >
                                            <Copy className="w-4 h-4 mr-1" />
                                            Copy
                                        </Button>
                                    </div>
                                    {template.subject && (
                                        <div className="mb-2">
                                            <Label className="text-xs text-gray-500">Subject:</Label>
                                            <p className="text-sm font-medium">{template.subject}</p>
                                        </div>
                                    )}
                                    <p className="text-sm whitespace-pre-wrap">{template.template}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Tracking Metrics */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Tracking Metrics</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {result.trackingMetrics.map((metric: any, index: number) => (
                                    <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-semibold text-sm">{metric.metric}</h4>
                                                <p className="text-xs text-gray-600 mt-1">{metric.description}</p>
                                            </div>
                                            <Badge variant="outline">{metric.target}</Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Success Criteria */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Success Criteria</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {result.successCriteria.map((criterion: string, index: number) => (
                                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                        <span className="text-green-500">✓</span>
                                        <span>{criterion}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}


