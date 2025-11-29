'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Linkedin, MessageSquare, TrendingUp, Users, Share2, Target } from 'lucide-react';
import LinkedInMessageGenerator from './LinkedInMessageGenerator';
import LinkedInOptimization from './LinkedInOptimization';
import NetworkingStrategy from './NetworkingStrategy';
import ContentSharingStrategy from './ContentSharingStrategy';
import NetworkingCampaign from './NetworkingCampaign';

export default function LinkedInIntegration() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Linkedin className="w-8 h-8 text-[#0077b5]" />
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">LinkedIn Tools</h1>
                    <p className="text-gray-600 mt-1">
                        Optimize your LinkedIn profile, generate messages, and build your network
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="messages" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="messages" className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        <span className="hidden sm:inline">Messages</span>
                    </TabsTrigger>
                    <TabsTrigger value="optimization" className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        <span className="hidden sm:inline">Optimization</span>
                    </TabsTrigger>
                    <TabsTrigger value="networking" className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span className="hidden sm:inline">Networking</span>
                    </TabsTrigger>
                    <TabsTrigger value="content" className="flex items-center gap-2">
                        <Share2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Content</span>
                    </TabsTrigger>
                    <TabsTrigger value="campaigns" className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        <span className="hidden sm:inline">Campaigns</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="messages">
                    <LinkedInMessageGenerator />
                </TabsContent>

                <TabsContent value="optimization">
                    <LinkedInOptimization />
                </TabsContent>

                <TabsContent value="networking">
                    <NetworkingStrategy />
                </TabsContent>

                <TabsContent value="content">
                    <ContentSharingStrategy />
                </TabsContent>

                <TabsContent value="campaigns">
                    <NetworkingCampaign />
                </TabsContent>
            </Tabs>
        </div>
    );
}


