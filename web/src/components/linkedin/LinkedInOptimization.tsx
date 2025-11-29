'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { linkedinApi, type LinkedInProfileOptimizationInput } from '@/lib/linkedin.api';
import { Badge } from '@/components/ui/badge';

export default function LinkedInOptimization() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [formData, setFormData] = useState<LinkedInProfileOptimizationInput>({
        targetRole: '',
        targetIndustry: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await linkedinApi.getOptimization(formData);
            setResult(response);
        } catch (error: any) {
            console.error('Failed to get optimization:', error);
            alert(error.message || "Failed to get optimization suggestions");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Profile Optimization
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="targetRole">Target Role (Optional)</Label>
                                <Input
                                    id="targetRole"
                                    value={formData.targetRole}
                                    onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                                    placeholder="Software Engineer"
                                />
                            </div>
                            <div>
                                <Label htmlFor="targetIndustry">Target Industry (Optional)</Label>
                                <Input
                                    id="targetIndustry"
                                    value={formData.targetIndustry}
                                    onChange={(e) => setFormData({ ...formData, targetIndustry: e.target.value })}
                                    placeholder="Technology"
                                />
                            </div>
                        </div>
                        <Button type="submit" disabled={loading} className="bg-cyan-500 hover:bg-cyan-600 text-white">
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <TrendingUp className="w-4 h-4 mr-2" />
                                    Get Optimization Suggestions
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {result && (
                <div className="space-y-6">
                    {/* Profile Completeness */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Completeness</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="text-4xl font-bold text-cyan-500">
                                    {result.profileCompleteness.score}%
                                </div>
                                <div className="flex-1">
                                    <div className="w-full bg-gray-200 rounded-full h-4">
                                        <div
                                            className="bg-cyan-500 h-4 rounded-full transition-all"
                                            style={{ width: `${result.profileCompleteness.score}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            {result.profileCompleteness.missingSections.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Missing Sections:</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {result.profileCompleteness.missingSections.map((section: string, index: number) => (
                                            <Badge key={index} variant="outline">{section}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {result.profileCompleteness.recommendations.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    <Label>Recommendations:</Label>
                                    <ul className="space-y-1">
                                        {result.profileCompleteness.recommendations.map((rec: string, index: number) => (
                                            <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                                                <span>{rec}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Headline Suggestions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Headline Suggestions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {result.headlineSuggestions.map((headline: string, index: number) => (
                                    <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                                        <p className="text-sm">{headline}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Summary Suggestions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Summary Suggestions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {result.summarySuggestions.map((summary: string, index: number) => (
                                    <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                                        <p className="text-sm whitespace-pre-wrap">{summary}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Keyword Optimization */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Keyword Optimization</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Suggested Keywords</Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {result.keywordOptimization.suggestedKeywords.map((keyword: string, index: number) => (
                                        <Badge key={index} className="bg-cyan-500 text-white">{keyword}</Badge>
                                    ))}
                                </div>
                            </div>
                            {result.keywordOptimization.missingKeywords.length > 0 && (
                                <div>
                                    <Label className="text-amber-600">Missing Keywords</Label>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {result.keywordOptimization.missingKeywords.map((keyword: string, index: number) => (
                                            <Badge key={index} variant="outline" className="border-amber-500 text-amber-700">
                                                {keyword}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Best Practices */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Best Practices</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {result.bestPractices.map((practice: string, index: number) => (
                                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        <span>{practice}</span>
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


