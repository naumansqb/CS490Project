'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Target, BarChart3, Brain, CheckCircle, ArrowRight, Users, Zap } from 'lucide-react'

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
            {/* Navigation */}
            <nav className="border-b border-slate-700 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                            <Image
                                src="/Logo/favicon-16x16.png"
                                alt="JobBuddy Logo"
                                width={40}
                                height={40}
                                className="h-10 w-auto"
                            />
                            <span className="text-2xl font-bold text-white">JobBuddy</span>
                        </Link>
                        <div className="flex items-center gap-4">
                            <Link href="/signin">
                                <Button
                                    variant="outline"
                                    className="text-white hover:text-cyan-400 border-2 border-slate-600 hover:border-cyan-500 bg-transparent font-medium"
                                >
                                    Sign In
                                </Button>
                            </Link>
                            <Link href="/signup">
                                <Button className="bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/20">
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="container mx-auto px-6 py-20 md:py-32">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-block mb-4 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-full text-sm font-medium">
                        The ATS Built for Job Seekers
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                        Take Control of Your
                        <span className="text-cyan-400"> Job Search</span>
                    </h1>
                    <p className="text-xl text-slate-400 mb-8 leading-relaxed">
                        Stop losing track of applications. Start landing interviews.
                        The first Applicant Tracking System designed specifically for candidates.
                    </p>
                    <div className="flex gap-4 justify-center flex-wrap">
                        <Link href="/signup">
                            <Button size="lg" className="bg-cyan-500 hover:bg-cyan-600 text-white text-lg px-8 py-6 shadow-lg shadow-cyan-500/20">
                                Start Tracking Free
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <Link href="/signin">
                            <Button
                                variant="outline"
                                className="text-white hover:text-cyan-400 border-2 border-slate-600 hover:border-cyan-500 bg-transparent font-medium text-base px-6 py-4 h-[52px] flex items-center justify-center"
                            >
                                Sign In
                            </Button>
                        </Link>

                    </div>
                    <p className="text-sm text-slate-500 mt-4">No credit card required • Free forever</p>
                </div>
            </section >

            {/* Features Section */}
            < section className="bg-slate-800/50 py-20 border-y border-slate-700" >
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-white mb-4">
                            Everything You Need to Land Your Dream Job
                        </h2>
                        <p className="text-xl text-slate-400">
                            Professional-grade tools that put you in control
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {/* Feature 1 */}
                        <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl hover:border-cyan-500/50 transition-all">
                            <div className="h-12 w-12 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center mb-4">
                                <Target className="h-6 w-6 text-cyan-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Track Every Application</h3>
                            <p className="text-slate-400">
                                Kanban-style pipeline from "Interested" to "Offer". Never lose track of where you stand.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl hover:border-cyan-500/50 transition-all">
                            <div className="h-12 w-12 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                                <Brain className="h-6 w-6 text-purple-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">AI-Powered Content</h3>
                            <p className="text-slate-400">
                                Generate tailored resumes and cover letters for each job. Optimized for ATS systems.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl hover:border-cyan-500/50 transition-all">
                            <div className="h-12 w-12 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-center mb-4">
                                <BarChart3 className="h-6 w-6 text-green-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Analytics & Insights</h3>
                            <p className="text-slate-400">
                                Track response rates, identify patterns, and optimize your job search strategy.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl hover:border-cyan-500/50 transition-all">
                            <div className="h-12 w-12 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center justify-center mb-4">
                                <Zap className="h-6 w-6 text-orange-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Interview Prep Suite</h3>
                            <p className="text-slate-400">
                                Company research, question banks, and mock interviews to ace every conversation.
                            </p>
                        </div>

                        {/* Feature 5 */}
                        <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl hover:border-cyan-500/50 transition-all">
                            <div className="h-12 w-12 bg-pink-500/10 border border-pink-500/20 rounded-lg flex items-center justify-center mb-4">
                                <Users className="h-6 w-6 text-pink-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Network Management</h3>
                            <p className="text-slate-400">
                                Track referrals, warm introductions, and professional connections effectively.
                            </p>
                        </div>

                        {/* Feature 6 */}
                        <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl hover:border-cyan-500/50 transition-all">
                            <div className="h-12 w-12 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center justify-center mb-4">
                                <CheckCircle className="h-6 w-6 text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Never Miss a Deadline</h3>
                            <p className="text-slate-400">
                                Automatic reminders for follow-ups, interviews, and application deadlines.
                            </p>
                        </div>
                    </div>
                </div>
            </section >

            {/* How It Works */}
            < section className="py-20" >
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-white mb-4">
                            Your Job Search, Simplified
                        </h2>
                        <p className="text-xl text-slate-400">
                            From chaos to clarity in three simple steps
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
                        <div className="text-center">
                            <div className="h-16 w-16 bg-cyan-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg shadow-cyan-500/20">
                                1
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Add Your Profile</h3>
                            <p className="text-slate-400">
                                Import from LinkedIn or build from scratch. One profile, unlimited applications.
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="h-16 w-16 bg-cyan-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg shadow-cyan-500/20">
                                2
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Track Applications</h3>
                            <p className="text-slate-400">
                                Add jobs, generate tailored materials, and track progress through your pipeline.
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="h-16 w-16 bg-cyan-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg shadow-cyan-500/20">
                                3
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Land Offers</h3>
                            <p className="text-slate-400">
                                Use analytics to optimize, nail interviews, and celebrate your new role.
                            </p>
                        </div>
                    </div>
                </div>
            </section >

            {/* CTA Section */}
            < section className="bg-gradient-to-r from-cyan-600 to-cyan-500 py-20" >
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Ready to Take Control?
                    </h2>
                    <p className="text-xl text-cyan-100 mb-8 max-w-2xl mx-auto">
                        Join thousands of job seekers who've organized their search and accelerated their careers.
                    </p>
                    <Link href="/signup">
                        <Button size="lg" className="bg-white text-cyan-600 hover:bg-slate-50 text-lg px-8 py-6 shadow-lg">
                            Get Started for Free
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
                </div>
            </section >

            {/* Footer */}
            < footer className="bg-slate-950 border-t border-slate-800 text-slate-400 py-12" >
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <Link href="/" className="flex items-center gap-3 mb-4 md:mb-0 hover:opacity-80 transition-opacity">
                            <Image
                                src="/Logo/favicon-16x16.png"
                                alt="JobBuddy Logo"
                                width={32}
                                height={32}
                                className="h-8 w-auto"
                            />
                            <span className="text-lg font-bold text-white">JobBuddy</span>
                        </Link>
                        <div className="text-sm">
                            © 2025 JobBuddy. Built with ❤️ for job seekers.
                        </div>
                    </div>
                </div>
            </footer >
        </div >
    )
}