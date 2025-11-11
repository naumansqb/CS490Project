/**
 * Combined example showing all three job analysis components together
 * 
 * This demonstrates how the components will appear in the job detail view
 * with tabs or sections for each analysis type.
 */

import JobMatchScore, { JobMatchScoreData } from './JobMatchScore';
import SkillsGapAnalysis, { SkillsGapData } from './SkillsGapAnalysis';
import InterviewPrepDashboard, { InterviewInsightsData } from './InterviewPrepDashboard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// Mock data (simplified for combined example)
const mockJobMatchData: JobMatchScoreData = {
  overallMatchScore: 75,
  categoryScores: {
    skills: 85,
    experience: 70,
    education: 90,
    requirements: 65,
  },
  strengths: [
    {
      category: "Skills",
      description: "Strong technical skills match with 8 out of 10 required skills present at advanced or expert level.",
      evidence: ["React, TypeScript, Node.js all at expert level", "5+ years of experience with modern JavaScript frameworks"]
    }
  ],
  gaps: [
    {
      category: "Requirements",
      description: "Missing certification in AWS Solutions Architect.",
      impact: "medium",
      suggestions: ["Consider obtaining AWS Solutions Architect certification"]
    }
  ],
  improvementSuggestions: [
    {
      type: "skill",
      title: "Learn Kubernetes",
      description: "Kubernetes is listed as a required skill.",
      priority: "high"
    }
  ],
  matchedSkills: [
    { skillName: "React", relevance: 95 },
    { skillName: "TypeScript", relevance: 90 }
  ],
  missingSkills: [
    { skillName: "Kubernetes", importance: 90 },
    { skillName: "GraphQL", importance: 60 }
  ]
};

const mockSkillsGapData: SkillsGapData = {
  matchedSkills: [
    {
      skillName: "React",
      userProficiency: "expert",
      jobRequirement: "required",
      matchStrength: "strong"
    }
  ],
  missingSkills: [
    {
      skillName: "Kubernetes",
      importance: "critical",
      impact: 85,
      estimatedLearningTime: "2-3 months"
    }
  ],
  weakSkills: [],
  learningResources: [
    {
      skillName: "Kubernetes",
      resources: [
        {
          title: "Kubernetes for Absolute Beginners",
          type: "course",
          provider: "Udemy",
          url: "https://www.udemy.com/course/kubernetes-for-beginners",
          estimatedTime: "10 hours",
          difficulty: "beginner",
          cost: "paid"
        }
      ]
    }
  ],
  prioritizedLearningPath: [
    {
      skillName: "Kubernetes",
      priority: 1,
      reason: "Critical skill with high impact on match score.",
      estimatedTime: "2-3 months"
    }
  ],
  overallGapScore: 65
};

const mockInterviewInsightsData: InterviewInsightsData = {
  companyName: "TechCorp Inc.",
  jobTitle: "Senior Full Stack Engineer",
  interviewProcess: {
    stages: [
      {
        stageName: "Phone Screen",
        stageNumber: 1,
        description: "Initial phone screening with HR recruiter.",
        typicalDuration: "30-45 minutes",
        format: "phone",
        focus: "Basic qualifications and cultural fit"
      }
    ],
    totalRounds: 4,
    estimatedTimeline: "2-4 weeks",
    typicalTimeBetweenRounds: "3-5 business days"
  },
  commonQuestions: [
    {
      question: "Tell me about yourself and why you're interested in this role.",
      category: "behavioral",
      difficulty: "easy",
      tips: "Focus on your relevant experience and key achievements.",
      frequency: "very-common"
    }
  ],
  interviewerInformation: [
    {
      role: "HR Recruiter",
      focus: "Basic qualifications and cultural fit",
      questionsToExpect: ["Tell me about yourself", "Why are you interested in this role?"]
    }
  ],
  companySpecificInsights: {
    interviewCulture: "TechCorp has a collaborative and technical-focused interview process.",
    valuedTraits: ["Problem-solving ability", "Collaboration and teamwork"],
    interviewFormats: ["Live coding sessions", "System design discussions"],
    redFlags: ["Being unprepared for technical questions"],
    successTips: ["Research the company's recent projects", "Practice coding problems"]
  },
  preparationRecommendations: {
    studyTopics: [
      {
        topic: "System Design and Architecture",
        importance: "critical",
        resources: ["Designing Data-Intensive Applications by Martin Kleppmann"]
      }
    ],
    keyAreasToReview: ["React hooks and modern patterns", "Node.js asynchronous programming"],
    preparationChecklist: [
      {
        item: "Research TechCorp's recent projects and technologies",
        category: "research"
      }
    ],
    estimatedPreparationTime: "15-20 hours"
  },
  researchDate: "2024-12-20",
  confidence: "high"
};

// Combined example showing all three components in tabs
export function CombinedExample() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Senior Full Stack Engineer</h1>
        <p className="text-gray-600">TechCorp Inc. • San Francisco, CA</p>
      </div>

      <Tabs defaultValue="match" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="match">Job Match</TabsTrigger>
          <TabsTrigger value="skills">Skills Gap</TabsTrigger>
          <TabsTrigger value="interview">Interview Prep</TabsTrigger>
        </TabsList>

        <TabsContent value="match" className="mt-6">
          <JobMatchScore
            jobId="job-123"
            jobTitle="Senior Full Stack Engineer"
            companyName="TechCorp Inc."
            matchData={mockJobMatchData}
            loading={false}
            error={null}
          />
        </TabsContent>

        <TabsContent value="skills" className="mt-6">
          <SkillsGapAnalysis
            jobId="job-123"
            jobTitle="Senior Full Stack Engineer"
            companyName="TechCorp Inc."
            gapData={mockSkillsGapData}
            loading={false}
            error={null}
          />
        </TabsContent>

        <TabsContent value="interview" className="mt-6">
          <InterviewPrepDashboard
            companyName="TechCorp Inc."
            jobTitle="Senior Full Stack Engineer"
            insightsData={mockInterviewInsightsData}
            loading={false}
            error={null}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Example showing all three components stacked vertically
export function StackedExample() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Senior Full Stack Engineer</h1>
        <p className="text-gray-600">TechCorp Inc. • San Francisco, CA</p>
      </div>

      <JobMatchScore
        jobId="job-123"
        jobTitle="Senior Full Stack Engineer"
        companyName="TechCorp Inc."
        matchData={mockJobMatchData}
        loading={false}
        error={null}
      />

      <SkillsGapAnalysis
        jobId="job-123"
        jobTitle="Senior Full Stack Engineer"
        companyName="TechCorp Inc."
        gapData={mockSkillsGapData}
        loading={false}
        error={null}
      />

      <InterviewPrepDashboard
        companyName="TechCorp Inc."
        jobTitle="Senior Full Stack Engineer"
        insightsData={mockInterviewInsightsData}
        loading={false}
        error={null}
      />
    </div>
  );
}

// Example with loading states
export function LoadingStatesExample() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Senior Full Stack Engineer</h1>
        <p className="text-gray-600">TechCorp Inc. • San Francisco, CA</p>
      </div>

      <Tabs defaultValue="match" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="match">Job Match</TabsTrigger>
          <TabsTrigger value="skills">Skills Gap</TabsTrigger>
          <TabsTrigger value="interview">Interview Prep</TabsTrigger>
        </TabsList>

        <TabsContent value="match" className="mt-6">
          <JobMatchScore
            jobId="job-123"
            jobTitle="Senior Full Stack Engineer"
            companyName="TechCorp Inc."
            matchData={null}
            loading={true}
            error={null}
          />
        </TabsContent>

        <TabsContent value="skills" className="mt-6">
          <SkillsGapAnalysis
            jobId="job-123"
            jobTitle="Senior Full Stack Engineer"
            companyName="TechCorp Inc."
            gapData={null}
            loading={true}
            error={null}
          />
        </TabsContent>

        <TabsContent value="interview" className="mt-6">
          <InterviewPrepDashboard
            companyName="TechCorp Inc."
            jobTitle="Senior Full Stack Engineer"
            insightsData={null}
            loading={true}
            error={null}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function JobAnalysisExamples() {
  return (
    <div className="space-y-12 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Combined Example (Tabbed View)</h2>
        <p className="text-gray-600 mb-4">This is how the components will appear in the job detail view with tabs.</p>
        <CombinedExample />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-4">Stacked Example (Vertical Layout)</h2>
        <p className="text-gray-600 mb-4">Alternative layout with all components stacked vertically.</p>
        <StackedExample />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-4">Loading States Example</h2>
        <p className="text-gray-600 mb-4">All components showing loading states simultaneously.</p>
        <LoadingStatesExample />
      </div>
    </div>
  );
}

