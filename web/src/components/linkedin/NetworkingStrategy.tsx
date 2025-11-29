'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Users, Copy } from 'lucide-react';
import { linkedinApi, type NetworkingStrategyInput } from '@/lib/linkedin.api';
import { Badge } from '@/components/ui/badge';

export default function NetworkingStrategy() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [formData, setFormData] = useState<NetworkingStrategyInput>({
        targetCompanies: [],
        targetRoles: [],
        networkingGoals: [],
    });
    const [goalInput, setGoalInput] = useState('');
    const [companyInput, setCompanyInput] = useState('');
    const [roleInput, setRoleInput] = useState('');

    const addGoal = () => {
        if (goalInput.trim()) {
            setFormData({
                ...formData,
                networkingGoals: [...formData.networkingGoals, goalInput.trim()],
            });
            setGoalInput('');
        }
    };

    const removeGoal = (index: number) => {
        setFormData({
            ...formData,
            networkingGoals: formData.networkingGoals.filter((_, i) => i !== index),
        });
    };

    const addCompany = () => {
        if (companyInput.trim()) {
            setFormData({
                ...formData,
                targetCompanies: [...(formData.targetCompanies || []), companyInput.trim()],
            });
            setCompanyInput('');
        }
    };

    const removeCompany = (index: number) => {
        setFormData({
            ...formData,
            targetCompanies: formData.targetCompanies?.filter((_, i) => i !== index) || [],
        });
    };

    const addRole = () => {
        if (roleInput.trim()) {
            setFormData({
                ...formData,
                targetRoles: [...(formData.targetRoles || []), roleInput.trim()],
            });
            setRoleInput('');
        }
    };

    const removeRole = (index: number) => {
        setFormData({
            ...formData,
            targetRoles: formData.targetRoles?.filter((_, i) => i !== index) || [],
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.networkingGoals.length === 0) {
            alert("Please add at least one networking goal");
            return;
        }

        setLoading(true);
        try {
            const response = await linkedinApi.generateNetworkingStrategy(formData);
            setResult(response);
        } catch (error: any) {
            console.error('Failed to generate strategy:', error);
            alert(error.message || "Failed to generate networking strategy");
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
                        <Users className="w-5 h-5" />
                        Networking Strategy
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label>Networking Goals *</Label>
                            <div className="flex gap-2 mt-2">
                                <Input
                                    value={goalInput}
                                    onChange={(e) => setGoalInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
                                    placeholder="e.g., Connect with 10 software engineers"
                                />
                                <Button type="button" onClick={addGoal} variant="outline">Add</Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {formData.networkingGoals.map((goal, index) => (
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
                            <Label>Target Companies (Optional)</Label>
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
                                {formData.targetCompanies?.map((company, index) => (
                                    <Badge key={index} variant="outline" className="flex items-center gap-1">
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
                            <Label>Target Roles (Optional)</Label>
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
                                {formData.targetRoles?.map((role, index) => (
                                    <Badge key={index} variant="outline" className="flex items-center gap-1">
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
                        <Button type="submit" disabled={loading} className="bg-cyan-500 hover:bg-cyan-600 text-white">
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Users className="w-4 h-4 mr-2" />
                                    Generate Strategy
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {result && (
                <div className="space-y-6">
                    {/* Strategies */}
                    {result.strategies.map((strategy: any, index: number) => (
                        <Card key={index}>
                            <CardHeader>
                                <CardTitle>{strategy.strategy}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-gray-600">{strategy.description}</p>
                                <div>
                                    <Label>Action Items</Label>
                                    <ul className="mt-2 space-y-1">
                                        {strategy.actionItems.map((item: string, i: number) => (
                                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                                <span className="text-cyan-500">•</span>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <Badge variant="outline">Timeline: {strategy.timeline}</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Connection Request Templates */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Connection Request Templates</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {result.connectionRequestTemplates.map((template: any, index: number) => (
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
                                    <p className="text-sm whitespace-pre-wrap mb-3">{template.template}</p>
                                    {template.tips && template.tips.length > 0 && (
                                        <div>
                                            <Label className="text-xs text-gray-500">Tips:</Label>
                                            <ul className="mt-1 space-y-1">
                                                {template.tips.map((tip: string, i: number) => (
                                                    <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                                                        <span className="text-cyan-500">•</span>
                                                        <span>{tip}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Target Connections */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Target Connections</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {result.targetConnections.map((connection: any, index: number) => (
                                    <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                                        <h4 className="font-semibold mb-1">{connection.type}</h4>
                                        <p className="text-sm text-gray-600 mb-2">{connection.description}</p>
                                        <p className="text-sm text-cyan-600">Approach: {connection.approach}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}


