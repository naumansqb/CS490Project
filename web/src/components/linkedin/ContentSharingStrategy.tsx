'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Share2 } from 'lucide-react';
import { linkedinApi, type ContentSharingStrategyInput } from '@/lib/linkedin.api';
import { Badge } from '@/components/ui/badge';

export default function ContentSharingStrategy() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [formData, setFormData] = useState<ContentSharingStrategyInput>({
        goals: [],
        targetAudience: '',
    });
    const [goalInput, setGoalInput] = useState('');

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.goals.length === 0 || !formData.targetAudience) {
            alert("Please fill in goals and target audience");
            return;
        }

        setLoading(true);
        try {
            const response = await linkedinApi.getContentStrategy(formData);
            setResult(response);
        } catch (error: any) {
            console.error('Failed to get content strategy:', error);
            alert(error.message || "Failed to get content sharing strategy");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Share2 className="w-5 h-5" />
                        Content Sharing Strategy
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label>Content Goals *</Label>
                            <div className="flex gap-2 mt-2">
                                <Input
                                    value={goalInput}
                                    onChange={(e) => setGoalInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
                                    placeholder="e.g., Establish thought leadership"
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
                            <Label htmlFor="targetAudience">Target Audience *</Label>
                            <Input
                                id="targetAudience"
                                value={formData.targetAudience}
                                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                                placeholder="e.g., Software engineers and tech recruiters"
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
                                    <Share2 className="w-4 h-4 mr-2" />
                                    Get Strategy
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {result && (
                <div className="space-y-6">
                    {/* Content Types */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recommended Content Types</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {result.contentTypes.map((contentType: any, index: number) => (
                                <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                                    <h4 className="font-semibold mb-2">{contentType.type}</h4>
                                    <p className="text-sm text-gray-600 mb-3">{contentType.description}</p>
                                    {contentType.examples && contentType.examples.length > 0 && (
                                        <div className="mb-3">
                                            <Label className="text-xs text-gray-500">Examples:</Label>
                                            <ul className="mt-1 space-y-1">
                                                {contentType.examples.map((example: string, i: number) => (
                                                    <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                                                        <span className="text-cyan-500">•</span>
                                                        <span>{example}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {contentType.bestPractices && contentType.bestPractices.length > 0 && (
                                        <div>
                                            <Label className="text-xs text-gray-500">Best Practices:</Label>
                                            <ul className="mt-1 space-y-1">
                                                {contentType.bestPractices.map((practice: string, i: number) => (
                                                    <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                                                        <span className="text-green-500">✓</span>
                                                        <span>{practice}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Posting Schedule */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Posting Schedule</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Recommended Frequency</Label>
                                <p className="text-sm text-gray-600 mt-1">{result.postingSchedule.frequency}</p>
                            </div>
                            {result.postingSchedule.bestTimes && result.postingSchedule.bestTimes.length > 0 && (
                                <div>
                                    <Label>Best Times to Post</Label>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {result.postingSchedule.bestTimes.map((time: string, index: number) => (
                                            <Badge key={index} variant="outline">{time}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {result.postingSchedule.recommendations && result.postingSchedule.recommendations.length > 0 && (
                                <div>
                                    <Label>Recommendations</Label>
                                    <ul className="mt-2 space-y-1">
                                        {result.postingSchedule.recommendations.map((rec: string, index: number) => (
                                            <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                                <span className="text-cyan-500">•</span>
                                                <span>{rec}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Engagement Strategies */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Engagement Strategies</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {result.engagementStrategies.map((strategy: string, index: number) => (
                                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                        <span className="text-cyan-500">•</span>
                                        <span>{strategy}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Visibility Tips */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Visibility Tips</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {result.visibilityTips.map((tip: string, index: number) => (
                                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                        <span className="text-cyan-500">•</span>
                                        <span>{tip}</span>
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


