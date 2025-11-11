/**
 * Example usage of JobMatchScore component
 * 
 * This file demonstrates how the JobMatchScore component will look
 * with realistic mock data for testing and development.
 */

import JobMatchScore, { JobMatchScoreData } from './JobMatchScore';

// Mock data matching the backend schema
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
      evidence: [
        "React, TypeScript, Node.js all at expert level",
        "5+ years of experience with modern JavaScript frameworks",
        "Proven experience with cloud technologies (AWS, Docker)"
      ]
    },
    {
      category: "Education",
      description: "Educational background perfectly aligns with job requirements.",
      evidence: [
        "Bachelor's degree in Computer Science from accredited university",
        "Relevant coursework in software engineering and algorithms"
      ]
    },
    {
      category: "Experience",
      description: "Extensive experience in similar roles and technologies.",
      evidence: [
        "3 years as Senior Software Engineer at TechCorp",
        "Led development of scalable web applications",
        "Experience with agile methodologies"
      ]
    }
  ],
  gaps: [
    {
      category: "Requirements",
      description: "Missing certification in AWS Solutions Architect.",
      impact: "medium",
      suggestions: [
        "Consider obtaining AWS Solutions Architect certification",
        "Highlight any AWS project experience you have",
        "Enroll in AWS certification course (2-3 months)"
      ]
    },
    {
      category: "Skills",
      description: "Limited experience with Kubernetes and container orchestration.",
      impact: "high",
      suggestions: [
        "Complete Kubernetes basics course",
        "Set up a personal project using Kubernetes",
        "Practice with minikube or cloud-based Kubernetes services"
      ]
    },
    {
      category: "Experience",
      description: "No direct experience with microservices architecture at scale.",
      impact: "medium",
      suggestions: [
        "Highlight any distributed systems experience",
        "Study microservices patterns and best practices",
        "Consider contributing to open-source microservices projects"
      ]
    }
  ],
  improvementSuggestions: [
    {
      type: "skill",
      title: "Learn Kubernetes",
      description: "Kubernetes is listed as a required skill. Complete a comprehensive Kubernetes course and build a project demonstrating container orchestration skills.",
      priority: "high"
    },
    {
      type: "skill",
      title: "Obtain AWS Certification",
      description: "AWS Solutions Architect certification is preferred. Study for and pass the certification exam to strengthen your profile.",
      priority: "medium"
    },
    {
      type: "experience",
      title: "Highlight Microservices Experience",
      description: "Review your work experience and emphasize any projects involving distributed systems or service-oriented architecture, even if not explicitly labeled as microservices.",
      priority: "medium"
    },
    {
      type: "education",
      title: "Consider Advanced Training",
      description: "While your education is strong, consider taking a specialized course in cloud architecture or distributed systems to strengthen your profile.",
      priority: "low"
    }
  ],
  matchedSkills: [
    { skillName: "React", relevance: 95 },
    { skillName: "TypeScript", relevance: 90 },
    { skillName: "Node.js", relevance: 85 },
    { skillName: "JavaScript", relevance: 95 },
    { skillName: "AWS", relevance: 75 },
    { skillName: "Docker", relevance: 80 },
    { skillName: "Git", relevance: 90 },
    { skillName: "REST APIs", relevance: 85 },
    { skillName: "PostgreSQL", relevance: 70 },
    { skillName: "MongoDB", relevance: 65 }
  ],
  missingSkills: [
    { skillName: "Kubernetes", importance: 90 },
    { skillName: "AWS Solutions Architect Certification", importance: 75 },
    { skillName: "GraphQL", importance: 60 },
    { skillName: "Redis", importance: 55 },
    { skillName: "Elasticsearch", importance: 50 },
    { skillName: "Terraform", importance: 45 },
    { skillName: "CI/CD Pipelines", importance: 70 },
    { skillName: "Microservices Architecture", importance: 80 }
  ]
};

// Example 1: Component with good match score (75%)
export function GoodMatchExample() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <JobMatchScore
        jobId="job-123"
        jobTitle="Senior Full Stack Engineer"
        companyName="TechCorp Inc."
        matchData={mockJobMatchData}
        loading={false}
        error={null}
      />
    </div>
  );
}

// Example 2: Component with high match score (90%+)
export function HighMatchExample() {
  const highMatchData: JobMatchScoreData = {
    ...mockJobMatchData,
    overallMatchScore: 92,
    categoryScores: {
      skills: 95,
      experience: 90,
      education: 95,
      requirements: 90,
    },
    gaps: [],
    missingSkills: [
      { skillName: "GraphQL", importance: 40 },
      { skillName: "Redis", importance: 35 }
    ]
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <JobMatchScore
        jobId="job-456"
        jobTitle="Senior Full Stack Engineer"
        companyName="TechCorp Inc."
        matchData={highMatchData}
        loading={false}
        error={null}
      />
    </div>
  );
}

// Example 3: Component with low match score (40%)
export function LowMatchExample() {
  const lowMatchData: JobMatchScoreData = {
    ...mockJobMatchData,
    overallMatchScore: 42,
    categoryScores: {
      skills: 50,
      experience: 40,
      education: 60,
      requirements: 35,
    },
    strengths: [
      {
        category: "Education",
        description: "Educational background is relevant.",
        evidence: ["Bachelor's degree in Computer Science"]
      }
    ],
    gaps: [
      {
        category: "Skills",
        description: "Missing most required technical skills.",
        impact: "high",
        suggestions: [
          "Focus on learning the core required technologies",
          "Consider applying to more junior positions first",
          "Build projects demonstrating required skills"
        ]
      },
      {
        category: "Experience",
        description: "Insufficient years of experience for this senior role.",
        impact: "high",
        suggestions: [
          "Gain more experience in mid-level positions",
          "Highlight any relevant projects or achievements",
          "Consider applying for mid-level positions"
        ]
      }
    ],
    missingSkills: [
      { skillName: "React", importance: 95 },
      { skillName: "Node.js", importance: 90 },
      { skillName: "TypeScript", importance: 85 },
      { skillName: "AWS", importance: 80 },
      { skillName: "Docker", importance: 75 }
    ]
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <JobMatchScore
        jobId="job-789"
        jobTitle="Senior Full Stack Engineer"
        companyName="TechCorp Inc."
        matchData={lowMatchData}
        loading={false}
        error={null}
      />
    </div>
  );
}

// Example 4: Loading state
export function LoadingExample() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <JobMatchScore
        jobId="job-123"
        jobTitle="Senior Full Stack Engineer"
        companyName="TechCorp Inc."
        matchData={null}
        loading={true}
        error={null}
      />
    </div>
  );
}

// Example 5: Error state
export function ErrorExample() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <JobMatchScore
        jobId="job-123"
        jobTitle="Senior Full Stack Engineer"
        companyName="TechCorp Inc."
        matchData={null}
        loading={false}
        error="Failed to analyze job match. Please try again."
      />
    </div>
  );
}

// Example 6: Empty state
export function EmptyExample() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <JobMatchScore
        jobId="job-123"
        jobTitle="Senior Full Stack Engineer"
        companyName="TechCorp Inc."
        matchData={null}
        loading={false}
        error={null}
      />
    </div>
  );
}

// Default export with all examples
export default function JobMatchScoreExamples() {
  return (
    <div className="space-y-12 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Good Match Example (75%)</h2>
        <GoodMatchExample />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-4">High Match Example (92%)</h2>
        <HighMatchExample />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-4">Low Match Example (42%)</h2>
        <LowMatchExample />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-4">Loading State</h2>
        <LoadingExample />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-4">Error State</h2>
        <ErrorExample />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-4">Empty State</h2>
        <EmptyExample />
      </div>
    </div>
  );
}

