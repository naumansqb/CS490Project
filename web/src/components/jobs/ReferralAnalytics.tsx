'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    TrendingUp,
    Users,
    CheckCircle2,
    BarChart3,
    Target,
    Heart,
} from 'lucide-react';
import { getReferralAnalytics, type ReferralAnalytics } from '@/lib/referralRequests.api';

interface ReferralAnalyticsProps {
    refreshTrigger?: number;
}

export default function ReferralAnalytics({ refreshTrigger }: ReferralAnalyticsProps) {
    const [analytics, setAnalytics] = useState<ReferralAnalytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, [refreshTrigger]);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const data = await getReferralAnalytics();
            setAnalytics(data);
        } catch (error) {
            console.error('Failed to load referral analytics:', error);
        } finally {
            setLoading(false);
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

    if (!analytics) {
        return null;
    }

    const statusOrder = ['sent', 'accepted', 'declined', 'completed', 'pending', 'draft', 'expired'];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Referral Success Analytics
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="h-5 w-5 text-blue-600" />
                            <span className="text-sm font-medium text-muted-foreground">
                                Total Requests
                            </span>
                        </div>
                        <p className="text-3xl font-bold text-blue-600">{analytics.total}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <span className="text-sm font-medium text-muted-foreground">
                                Success Rate
                            </span>
                        </div>
                        <p className="text-3xl font-bold text-green-600">
                            {analytics.successRate.toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {analytics.successful}/{analytics.responded || analytics.total} successful
                            {analytics.responded && analytics.responded !== analytics.total && (
                                <span className="block">({analytics.responded} responded)</span>
                            )}
                        </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Heart className="h-5 w-5 text-purple-600" />
                            <span className="text-sm font-medium text-muted-foreground">
                                Avg. Relationship Impact
                            </span>
                        </div>
                        <p className="text-3xl font-bold text-purple-600">
                            {analytics.avgRelationshipImpact > 0 ? '+' : ''}
                            {analytics.avgRelationshipImpact.toFixed(1)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Based on {analytics.responded || analytics.total} response{analytics.responded !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                {/* Status Breakdown */}
                <div className="mb-6">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Status Breakdown
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {statusOrder.map((status) => {
                            const count = analytics.byStatus[status] || 0;
                            if (count === 0) return null;
                            return (
                                <Badge key={status} variant="outline" className="text-sm">
                                    {status.charAt(0).toUpperCase() + status.slice(1)}: {count}
                                </Badge>
                            );
                        })}
                    </div>
                </div>

                {/* Top Contacts */}
                {Object.keys(analytics.byContact).length > 0 && (
                    <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Top Referral Sources
                        </h4>
                        <div className="space-y-2">
                            {Object.entries(analytics.byContact)
                                .sort((a, b) => b[1].total - a[1].total)
                                .slice(0, 5)
                                .map(([contactName, stats]) => {
                                    const successRate =
                                        stats.total > 0
                                            ? ((stats.successful / stats.total) * 100).toFixed(0)
                                            : '0';
                                    return (
                                        <div
                                            key={contactName}
                                            className="flex items-center justify-between p-2 border rounded-lg"
                                        >
                                            <span className="text-sm font-medium">{contactName}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-muted-foreground">
                                                    {stats.successful}/{stats.total} successful
                                                </span>
                                                <Badge
                                                    variant={
                                                        parseFloat(successRate) >= 50
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                    className={
                                                        parseFloat(successRate) >= 50
                                                            ? 'bg-green-500'
                                                            : ''
                                                    }
                                                >
                                                    {successRate}%
                                                </Badge>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

