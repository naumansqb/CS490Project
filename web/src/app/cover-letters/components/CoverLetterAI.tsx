"use client";

import { useState, useEffect, useMemo } from "react";
import { generateAICoverLetter } from "@/lib/api/ai";
import { getJobOpportunitiesByUserId } from "@/lib/jobs.api";
import { saveCoverLetter, updateCoverLetter } from "@/lib/coverLetter.api";
import { Download, Edit3, Link2, Save, RefreshCw, Copy, FileText, Mail, Printer, Clock, Lightbulb, BookOpen } from "lucide-react";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
import RichTextEditor from "./RichTextEditor";
import ExperienceHighlighting from "./ExperienceHighlighting";

interface Job {
  id: string;
  title: string;
  company: string;
  description?: string;
  location?: string;
  industry?: string;
  companyBackground?: string;
  recentNews?: string;
  companyMission?: string;
  companyInitiatives?: string;
  companySize?: string;
  fundingInfo?: string;
  competitiveLandscape?: string;
}

interface GeneratedCoverLetter {
  greeting: string;
  opening: string;
  body: string[];
  closing: string;
  signature: string;
}

type Tone = "formal" | "casual" | "enthusiastic" | "analytical";
type Culture = "startup" | "corporate";
type Length = "brief" | "standard" | "detailed";
type WritingStyle = "direct" | "narrative" | "bullet-points";
type PersonalityLevel = "minimal" | "moderate" | "strong";

interface SavedCoverLetter {
  id: string;
  title: string;
  content: {
    greeting: string;
    opening: string;
    body: string[];
    closing: string;
    signature: string;
  };
  tone?: string;
  culture?: string;
  jobId?: string;
  jobOpportunity?: {
    id: string;
    title: string;
    company: string;
  };
}

interface CoverLetterAIProps {
  userId: string;
  selectedLetter?: SavedCoverLetter | null;
  selectedTemplate?: {
    template: any;
    variables: Record<string, string>;
  } | null;
  onSave?: () => void;
  onReset?: () => void;
}

export default function CoverLetterAI({ userId, selectedLetter, selectedTemplate, onSave, onReset }: CoverLetterAIProps) {
  const [loading, setLoading] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [coverLetter, setCoverLetter] = useState<GeneratedCoverLetter | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Tone and style customization
  const [tone, setTone] = useState<Tone>("formal");
  const [culture, setCulture] = useState<Culture>("corporate");
  const [length, setLength] = useState<Length>("standard");
  const [writingStyle, setWritingStyle] = useState<WritingStyle>("direct");
  const [personalityLevel, setPersonalityLevel] = useState<PersonalityLevel>("moderate");
  const [customInstructions, setCustomInstructions] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState("");
  const [savedCoverLetterId, setSavedCoverLetterId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [templateMode, setTemplateMode] = useState(false);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [templateContent, setTemplateContent] = useState("");
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);

  // Experience highlighting
  const [showExperienceHighlighting, setShowExperienceHighlighting] = useState(false);
  const [selectedExperiences, setSelectedExperiences] = useState<number[]>([]);
  const [experienceAnalysis, setExperienceAnalysis] = useState<any>(null);

  // Export options
  const [showExportModal, setShowExportModal] = useState(false);
  const [letterheadName, setLetterheadName] = useState("");
  const [letterheadAddress, setLetterheadAddress] = useState("");
  const [letterheadPhone, setLetterheadPhone] = useState("");
  const [letterheadEmail, setLetterheadEmail] = useState("");
  const [formattingStyle, setFormattingStyle] = useState<"classic" | "modern" | "minimal">("classic");

  // Company research
  const [showCompanyResearch, setShowCompanyResearch] = useState(false);
  const [companyResearch, setCompanyResearch] = useState({
    companyBackground: "",
    recentNews: "",
    companyMission: "",
    companyInitiatives: "",
    companySize: "",
    fundingInfo: "",
    competitiveLandscape: "",
  });
  const [researchingCompany, setResearchingCompany] = useState(false);

  // Editing tools state
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [readabilityScore, setReadabilityScore] = useState(0);
  const [versionHistory, setVersionHistory] = useState<Array<{ content: string; timestamp: number }>>([]);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingSuggestions, setEditingSuggestions] = useState<any>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Fetch user's jobs on mount
  useEffect(() => {
    async function fetchJobs() {
      try {
        setLoadingJobs(true);
        const response: any = await getJobOpportunitiesByUserId(userId);
        const jobsList = response.data || response || [];
        setJobs(jobsList);

        // Auto-select first job if available
        if (jobsList.length > 0 && !selectedLetter) {
          setSelectedJobId(jobsList[0].id);
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoadingJobs(false);
      }
    }

    if (userId) {
      fetchJobs();
    }
  }, [userId]);

  // Load company research when job changes
  useEffect(() => {
    const currentJob = jobs.find(job => job.id === selectedJobId);
    if (currentJob) {
      setCompanyResearch({
        companyBackground: currentJob.companyBackground || "",
        recentNews: currentJob.recentNews || "",
        companyMission: currentJob.companyMission || "",
        companyInitiatives: currentJob.companyInitiatives || "",
        companySize: currentJob.companySize || "",
        fundingInfo: currentJob.fundingInfo || "",
        competitiveLandscape: currentJob.competitiveLandscape || "",
      });
    }
  }, [selectedJobId, jobs]);

  // Load selected letter when passed in or reset when null
  useEffect(() => {
    if (selectedLetter) {
      setCoverLetter(selectedLetter.content);
      setTone((selectedLetter.tone as Tone) || "formal");
      setCulture((selectedLetter.culture as Culture) || "corporate");
      setSavedCoverLetterId(selectedLetter.id);
      setTemplateMode(false);

      // Set the job if available
      if (selectedLetter.jobId) {
        setSelectedJobId(selectedLetter.jobId);
      } else if (selectedLetter.jobOpportunity?.id) {
        setSelectedJobId(selectedLetter.jobOpportunity.id);
      }
    } else {
      // Reset to initial state when selectedLetter is null
      setCoverLetter(null);
      setTone("formal");
      setCulture("corporate");
      setLength("standard");
      setWritingStyle("direct");
      setPersonalityLevel("moderate");
      setCustomInstructions("");
      setSavedCoverLetterId(null);
      setError("");
      setIsEditing(false);
      setEditableContent("");
      setTemplateMode(false);

      // Set to first job if available
      if (jobs.length > 0) {
        setSelectedJobId(jobs[0].id);
      }
    }
  }, [selectedLetter, jobs]);

  // Load selected template when passed in
  useEffect(() => {
    console.log('CoverLetterAI: selectedTemplate changed:', selectedTemplate);
    if (selectedTemplate) {
      console.log('Loading template:', selectedTemplate.template.title);
      console.log('Template content:', selectedTemplate.template.content);
      console.log('Template variables:', selectedTemplate.variables);

      setTemplateMode(true);
      setTemplateContent(selectedTemplate.template.content);
      setTemplateVariables(selectedTemplate.variables);
      setCoverLetter(null);
      setSavedCoverLetterId(null);

      console.log('Template mode activated');
    }
  }, [selectedTemplate]);

  async function handleGenerate() {
    if (!selectedJobId) {
      setError("⚠️ Please select a job first.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      // If in template mode, include template content for AI enhancement
      const requestBody: any = {
        userId,
        jobId: selectedJobId,
        tone,
        culture,
        length,
        writingStyle,
        personalityLevel,
        customInstructions: customInstructions || undefined,
        // Company research
        ...Object.fromEntries(
          Object.entries(companyResearch).filter(([_, value]) => value !== "")
        ),
      };

      // Add template content if in template mode
      if (templateMode && templateContent) {
        const renderedTemplate = renderTemplate(templateContent, templateVariables);
        requestBody.customInstructions = requestBody.customInstructions
          ? `${requestBody.customInstructions}\n\nUse this template as a base:\n${renderedTemplate}`
          : `Use this template as a base and enhance it:\n${renderedTemplate}`;
      }

      // Add experience highlighting instructions
      if (selectedExperiences.length > 0 && experienceAnalysis) {
        const highlightedExperiences = experienceAnalysis.experiences.filter(
          (exp: any) => selectedExperiences.includes(exp.index)
        );

        let experienceInstructions = "\n\n⭐ IMPORTANT - HIGHLIGHT THESE EXPERIENCES:\n";
        experienceInstructions += "The following experiences have been identified as most relevant for this role. Emphasize them prominently in the cover letter:\n\n";

        highlightedExperiences.forEach((exp: any, idx: number) => {
          experienceInstructions += `${idx + 1}. Experience #${exp.index} (Relevance: ${exp.relevanceScore}%):\n`;
          experienceInstructions += `   - Connection to role: ${exp.connectionToJob}\n`;
          experienceInstructions += `   - Presentation suggestion: ${exp.presentationSuggestion}\n`;
          if (exp.keyStrengths && exp.keyStrengths.length > 0) {
            experienceInstructions += `   - Key strengths: ${exp.keyStrengths.join(", ")}\n`;
          }
          if (exp.quantifiableAchievements && exp.quantifiableAchievements.length > 0) {
            experienceInstructions += `   - Suggested metrics: ${exp.quantifiableAchievements.join("; ")}\n`;
          }
          experienceInstructions += "\n";
        });

        if (experienceAnalysis.overallRecommendation) {
          experienceInstructions += `Overall strategy: ${experienceAnalysis.overallRecommendation}`;
        }

        requestBody.customInstructions = requestBody.customInstructions
          ? `${requestBody.customInstructions}${experienceInstructions}`
          : experienceInstructions;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/ai/cover-letter/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Request failed (${response.status}): ${err}`);
      }

      const result = await response.json();
      console.log("✅ AI Cover Letter API result:", result);

      // Extract the cover letter data
      const letterData = result.data || result;
      setCoverLetter(letterData);
      setIsEditing(false);
      setSavedCoverLetterId(null); // Reset saved state on new generation
      setTemplateMode(false); // Exit template mode after generation
    } catch (error) {
      console.error("Error generating cover letter:", error);
      setError("⚠️ Something went wrong while generating your cover letter. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegenerate() {
    if (!selectedJobId || !coverLetter) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      // Build request body with all customizations
      const requestBody: any = {
        userId,
        jobId: selectedJobId,
        tone,
        culture,
        length,
        writingStyle,
        personalityLevel,
        customInstructions: customInstructions || undefined,
        // Company research
        ...Object.fromEntries(
          Object.entries(companyResearch).filter(([_, value]) => value !== "")
        ),
      };

      // Add experience highlighting instructions
      if (selectedExperiences.length > 0 && experienceAnalysis) {
        const highlightedExperiences = experienceAnalysis.experiences.filter(
          (exp: any) => selectedExperiences.includes(exp.index)
        );

        let experienceInstructions = "\n\n⭐ IMPORTANT - HIGHLIGHT THESE EXPERIENCES:\n";
        experienceInstructions += "The following experiences have been identified as most relevant for this role. Emphasize them prominently in the cover letter:\n\n";

        highlightedExperiences.forEach((exp: any, idx: number) => {
          experienceInstructions += `${idx + 1}. Experience #${exp.index} (Relevance: ${exp.relevanceScore}%):\n`;
          experienceInstructions += `   - Connection to role: ${exp.connectionToJob}\n`;
          experienceInstructions += `   - Presentation suggestion: ${exp.presentationSuggestion}\n`;
          if (exp.keyStrengths && exp.keyStrengths.length > 0) {
            experienceInstructions += `   - Key strengths: ${exp.keyStrengths.join(", ")}\n`;
          }
          if (exp.quantifiableAchievements && exp.quantifiableAchievements.length > 0) {
            experienceInstructions += `   - Suggested metrics: ${exp.quantifiableAchievements.join("; ")}\n`;
          }
          experienceInstructions += "\n";
        });

        if (experienceAnalysis.overallRecommendation) {
          experienceInstructions += `Overall strategy: ${experienceAnalysis.overallRecommendation}`;
        }

        requestBody.customInstructions = requestBody.customInstructions
          ? `${requestBody.customInstructions}${experienceInstructions}`
          : experienceInstructions;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/ai/cover-letter/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Request failed (${response.status}): ${err}`);
      }

      const result = await response.json();
      console.log("✅ AI Cover Letter Regenerated:", result);

      // Extract the cover letter data
      const letterData = result.data || result;
      setCoverLetter(letterData);
      setIsEditing(false);
      setSavedCoverLetterId(null); // Reset saved state on regeneration
    } catch (error) {
      console.error("Error regenerating cover letter:", error);
      setError("⚠️ Something went wrong while regenerating your cover letter. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAutoResearch() {
    if (!selectedJob) {
      alert("Please select a job first");
      return;
    }

    setResearchingCompany(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/ai/company-research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: selectedJob.company,
          industry: selectedJob.industry || undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Request failed (${response.status}): ${err}`);
      }

      const result = await response.json();
      console.log("✅ Company Research:", result);

      const research = result.data;
      setCompanyResearch({
        companyBackground: research.companyBackground || "",
        recentNews: research.recentNews || "",
        companyMission: research.companyMission || "",
        companyInitiatives: research.companyInitiatives || "",
        companySize: research.companySize || "",
        fundingInfo: research.fundingInfo || "",
        competitiveLandscape: research.competitiveLandscape || "",
      });

      // Show a note about verifying information
      if (research.researchNote) {
        alert(`✅ Research complete!\n\n⚠️ ${research.researchNote}`);
      } else {
        alert("✅ Company research completed! Please review and verify the information before using.");
      }
    } catch (error) {
      console.error("Error researching company:", error);
      alert("⚠️ Failed to research company. Please try again or fill in manually.");
    } finally {
      setResearchingCompany(false);
    }
  }

  // Calculate Flesch-Kincaid readability score
  function calculateReadabilityScore(text: string): number {
    // Remove HTML tags
    const cleanText = text.replace(/<[^>]*>/g, '');

    const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const words = cleanText.trim().split(/\s+/).filter(Boolean).length;
    const syllables = cleanText.split(/\s+/).reduce((count, word) => {
      return count + countSyllables(word);
    }, 0);

    if (sentences === 0 || words === 0) return 0;

    // Flesch Reading Ease formula
    const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  function countSyllables(word: string): number {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length <= 3) return 1;

    const vowels = word.match(/[aeiouy]+/g);
    let count = vowels ? vowels.length : 1;

    if (word.endsWith('e')) count--;
    if (word.endsWith('le') && word.length > 2) count++;

    return Math.max(1, count);
  }

  // Auto-save functionality
  useEffect(() => {
    if (!editableContent || !savedCoverLetterId || !coverLetter) return;

    const autoSaveTimer = setTimeout(async () => {
      try {
        await updateCoverLetter(savedCoverLetterId, {
          userId,
          jobId: selectedJobId,
          title: `Cover Letter for ${selectedJob?.company} - ${selectedJob?.title}`,
          content: coverLetter,
          tone,
          culture,
        });
        setLastAutoSave(new Date());
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearTimeout(autoSaveTimer);
  }, [editableContent, savedCoverLetterId, coverLetter]);

  // Update version history when content changes
  useEffect(() => {
    if (editableContent && isEditing) {
      setVersionHistory(prev => {
        const newVersion = { content: editableContent, timestamp: Date.now() };
        const updated = [...prev, newVersion];
        // Keep only last 10 versions
        return updated.slice(-10);
      });
    }
  }, [editableContent]);

  // Update readability score when word count changes
  useEffect(() => {
    if (editableContent) {
      const score = calculateReadabilityScore(editableContent);
      setReadabilityScore(score);
    }
  }, [editableContent, wordCount]);

  // Get AI editing suggestions
  async function getEditingSuggestions() {
    if (!editableContent) return;

    setLoadingSuggestions(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/ai/editing-suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editableContent,
          type: "cover-letter"
        }),
      });

      if (!response.ok) throw new Error("Failed to get suggestions");

      const result = await response.json();
      setEditingSuggestions(result.data);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error getting suggestions:", error);
      alert("⚠️ Failed to get editing suggestions. Please try again.");
    } finally {
      setLoadingSuggestions(false);
    }
  }

  // Restore version from history
  function restoreVersion(version: { content: string; timestamp: number }) {
    setEditableContent(version.content);
    alert("✅ Version restored!");
  }

  // Render template with variables
  function renderTemplate(template: string, variables: Record<string, string>) {
    return template.replace(/{{\s*([a-zA-Z0-9_\.]+)\s*}}/g, (_, key) => {
      const v = variables[key as keyof typeof variables];
      return (v ?? "").toString();
    });
  }

  // Format cover letter (AI now handles tone, this just formats)
  const formattedLetter = useMemo(() => {
    if (templateMode && templateContent) {
      // Render template with variables
      return renderTemplate(templateContent, templateVariables);
    }

    if (!coverLetter) return "";

    const parts = [
      coverLetter.greeting,
      "",
      coverLetter.opening,
      "",
      ...coverLetter.body.map(paragraph => paragraph + "\n"),
      coverLetter.closing,
      "",
      coverLetter.signature,
    ];

    return parts.join("\n");
  }, [coverLetter, templateMode, templateContent, templateVariables]);

  // Update editable content when formatted letter changes
  useEffect(() => {
    if (formattedLetter && !isEditing) {
      setEditableContent(formattedLetter);
    }
  }, [formattedLetter]);

  // Save cover letter to database (update if exists, create new if not)
  async function handleSaveCoverLetter() {
    if (!coverLetter || !selectedJobId) return;

    setSaving(true);
    try {
      if (savedCoverLetterId) {
        // Update existing cover letter
        const response: any = await updateCoverLetter(savedCoverLetterId, {
          userId,
          jobId: selectedJobId,
          title: `Cover Letter for ${selectedJob?.company} - ${selectedJob?.title}`,
          content: coverLetter,
          tone,
          culture,
        });

        alert("Cover letter updated successfully!");
      } else {
        // Create new cover letter
        const response: any = await saveCoverLetter({
          userId,
          jobId: selectedJobId,
          title: `Cover Letter for ${selectedJob?.company} - ${selectedJob?.title}`,
          content: coverLetter,
          tone,
          culture,
        });

        const savedLetter = response.data || response;
        setSavedCoverLetterId(savedLetter.id);
        alert("Cover letter saved successfully!");
      }

      // Call onSave callback to refresh the list
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error("Error saving cover letter:", error);
      alert("Failed to save cover letter. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // Save as new cover letter (always creates a new one)
  async function handleSaveAsNew() {
    if (!coverLetter || !selectedJobId) return;

    setSaving(true);
    try {
      const response: any = await saveCoverLetter({
        userId,
        jobId: selectedJobId,
        title: `Cover Letter for ${selectedJob?.company} - ${selectedJob?.title}`,
        content: coverLetter,
        tone,
        culture,
      });

      const savedLetter = response.data || response;
      setSavedCoverLetterId(savedLetter.id);
      alert("New cover letter saved successfully!");

      // Call onSave callback to refresh the list
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error("Error saving new cover letter:", error);
      alert("Failed to save new cover letter. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // Generate filename with job details
  function generateFilename(extension: string): string {
    const company = selectedJob?.company?.replace(/[^a-z0-9]/gi, '_') || "company";
    const title = selectedJob?.title?.replace(/[^a-z0-9]/gi, '_').substring(0, 30) || "position";
    const date = new Date().toISOString().split('T')[0];
    return `CoverLetter_${company}_${title}_${date}.${extension}`;
  }

  // Get formatted content with letterhead
  function getFormattedContent(): string {
    const content = isEditing ? editableContent : formattedLetter;

    if (!letterheadName && !letterheadAddress && !letterheadPhone && !letterheadEmail) {
      return content;
    }

    const letterhead = [
      letterheadName,
      letterheadAddress,
      letterheadPhone,
      letterheadEmail
    ].filter(Boolean).join("\n");

    return `${letterhead}\n\n${content}`;
  }

  // Export functions
  function handleExportTxt() {
    const content = getFormattedContent();
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = generateFilename("txt");
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportHtml() {
    const content = getFormattedContent();
    const styleClass = {
      classic: "font-family: 'Times New Roman', serif; line-height: 1.8; font-size: 12pt;",
      modern: "font-family: 'Arial', sans-serif; line-height: 1.6; font-size: 11pt;",
      minimal: "font-family: 'Helvetica', sans-serif; line-height: 1.5; font-size: 10pt;"
    };

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cover Letter - ${selectedJob?.company || "Position"}</title>
  <style>
    @media print {
      body { margin: 0; padding: 20mm; }
      .no-print { display: none; }
    }
    body {
      ${styleClass[formattingStyle]}
      max-width: 8.5in;
      margin: 40px auto;
      padding: 20px;
      background: white;
    }
    .letterhead {
      text-align: ${formattingStyle === "minimal" ? "left" : "center"};
      margin-bottom: 2em;
      ${formattingStyle === "modern" ? "border-bottom: 2px solid #333; padding-bottom: 1em;" : ""}
    }
    .content {
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  ${letterheadName || letterheadAddress || letterheadPhone || letterheadEmail ? `
  <div class="letterhead">
    ${letterheadName ? `<div style="font-weight: bold; font-size: 1.2em;">${letterheadName}</div>` : ""}
    ${letterheadAddress ? `<div>${letterheadAddress}</div>` : ""}
    ${letterheadPhone ? `<div>${letterheadPhone}</div>` : ""}
    ${letterheadEmail ? `<div>${letterheadEmail}</div>` : ""}
  </div>
  ` : ""}
  <div class="content">${content}</div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = generateFilename("html");
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleExportPDF() {
    const content = getFormattedContent();
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "in",
      format: "letter"
    });

    const margins = { top: 1, left: 1, right: 1, bottom: 1 };
    const pageWidth = 8.5;
    const pageHeight = 11;
    const contentWidth = pageWidth - margins.left - margins.right;

    let yPosition = margins.top;

    // Add letterhead if configured
    if (letterheadName || letterheadAddress || letterheadPhone || letterheadEmail) {
      const letterheadSize = formattingStyle === "classic" ? 11 : formattingStyle === "modern" ? 10 : 9;
      pdf.setFontSize(letterheadSize + 2);
      pdf.setFont("helvetica", "bold");

      if (letterheadName) {
        pdf.text(letterheadName, pageWidth / 2, yPosition, { align: "center" });
        yPosition += 0.25;
      }

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(letterheadSize);

      if (letterheadAddress) {
        pdf.text(letterheadAddress, pageWidth / 2, yPosition, { align: "center" });
        yPosition += 0.2;
      }
      if (letterheadPhone) {
        pdf.text(letterheadPhone, pageWidth / 2, yPosition, { align: "center" });
        yPosition += 0.2;
      }
      if (letterheadEmail) {
        pdf.text(letterheadEmail, pageWidth / 2, yPosition, { align: "center" });
        yPosition += 0.2;
      }

      yPosition += 0.3; // Extra space after letterhead
    }

    // Add content
    const fontSize = formattingStyle === "classic" ? 12 : formattingStyle === "modern" ? 11 : 10;
    pdf.setFontSize(fontSize);
    pdf.setFont("times", "normal");

    const lines = pdf.splitTextToSize(content, contentWidth);
    const lineHeight = fontSize / 72 * 1.5; // Convert pt to inches with 1.5 line spacing

    for (const line of lines) {
      if (yPosition + lineHeight > pageHeight - margins.bottom) {
        pdf.addPage();
        yPosition = margins.top;
      }
      pdf.text(line, margins.left, yPosition);
      yPosition += lineHeight;
    }

    pdf.save(generateFilename("pdf"));
  }

  async function handleExportDOCX() {
    const content = getFormattedContent();
    const paragraphs: Paragraph[] = [];

    // Add letterhead if configured
    if (letterheadName || letterheadAddress || letterheadPhone || letterheadEmail) {
      if (letterheadName) {
        paragraphs.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: letterheadName,
                bold: true,
              }),
            ],
          })
        );
      }
      if (letterheadAddress) {
        paragraphs.push(
          new Paragraph({
            text: letterheadAddress,
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          })
        );
      }
      if (letterheadPhone) {
        paragraphs.push(
          new Paragraph({
            text: letterheadPhone,
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          })
        );
      }
      if (letterheadEmail) {
        paragraphs.push(
          new Paragraph({
            text: letterheadEmail,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          })
        );
      }

      paragraphs.push(new Paragraph({ text: "", spacing: { after: 200 } }));
    }

    // Add content paragraphs
    const contentLines = content.split('\n');
    contentLines.forEach((line) => {
      paragraphs.push(
        new Paragraph({
          text: line,
          spacing: { after: line.trim() === "" ? 100 : 200 },
        })
      );
    });

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch = 1440 twips
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: paragraphs,
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, generateFilename("docx"));
  }

  function handleCopyForEmail() {
    const content = getFormattedContent();
    const emailBody = `Dear Hiring Manager,

Please find my cover letter below for the ${selectedJob?.title || "position"} role at ${selectedJob?.company || "your company"}.

---

${content}

---

I look forward to discussing this opportunity with you.

Best regards,
${letterheadName || "Your Name"}`;

    navigator.clipboard.writeText(emailBody);
    alert("Email template copied to clipboard! You can now paste it into your email client.");
  }

  function handlePrint() {
    const content = getFormattedContent();
    const printWindow = window.open('', '', 'width=800,height=600');

    if (!printWindow) {
      alert("Please allow popups to use the print feature");
      return;
    }

    const styleClass = {
      classic: "font-family: 'Times New Roman', serif; line-height: 1.8; font-size: 12pt;",
      modern: "font-family: 'Arial', sans-serif; line-height: 1.6; font-size: 11pt;",
      minimal: "font-family: 'Helvetica', sans-serif; line-height: 1.5; font-size: 10pt;"
    };

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cover Letter - ${selectedJob?.company || "Position"}</title>
        <style>
          @page {
            margin: 1in;
            size: letter portrait;
          }
          body {
            ${styleClass[formattingStyle]}
            margin: 0;
            padding: 0;
          }
          .letterhead {
            text-align: center;
            margin-bottom: 2em;
          }
          .content {
            white-space: pre-wrap;
          }
        </style>
      </head>
      <body>
        ${letterheadName || letterheadAddress || letterheadPhone || letterheadEmail ? `
        <div class="letterhead">
          ${letterheadName ? `<div style="font-weight: bold; font-size: 1.2em;">${letterheadName}</div>` : ""}
          ${letterheadAddress ? `<div>${letterheadAddress}</div>` : ""}
          ${letterheadPhone ? `<div>${letterheadPhone}</div>` : ""}
          ${letterheadEmail ? `<div>${letterheadEmail}</div>` : ""}
        </div>
        ` : ""}
        <div class="content">${content}</div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }

  if (loadingJobs) {
    return (
      <div className="border rounded-lg p-4 mt-4 bg-white shadow-sm">
        <p className="text-gray-500">Loading your jobs...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="border rounded-lg p-4 mt-4 bg-white shadow-sm">
        <p className="text-gray-500">
          No jobs found. Please add a job opportunity first to generate a cover letter.
        </p>
      </div>
    );
  }

  const selectedJob = jobs.find(job => job.id === selectedJobId);

  return (
    <div className="space-y-6">
      {/* Template Variable Customization - Show First When Template Selected */}
      {templateMode && templateContent && (
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          {/* Template Header */}
          <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-purple-900">
                  📄 {selectedTemplate?.template.title}
                </p>
                <p className="text-xs text-purple-700 mt-1">
                  Customize the variables below to personalize your cover letter
                </p>
              </div>
              <span className="px-3 py-1 bg-purple-200 text-purple-900 rounded-full text-xs font-medium">
                Template Mode
              </span>
            </div>
          </div>

          <h3 className="text-lg font-semibold mb-4">Customize Variables</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {Object.keys(templateVariables).map((key) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {key}
                </label>
                <input
                  type="text"
                  value={templateVariables[key]}
                  onChange={(e) =>
                    setTemplateVariables((prev) => ({
                      ...prev,
                      [key]: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3BAFBA]"
                />
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-md p-6 border border-gray-200 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">Template Preview</h4>
              <button
                onClick={() => setIsEditingTemplate(!isEditingTemplate)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                {isEditingTemplate ? "Preview" : "Edit"}
              </button>
            </div>

            {isEditingTemplate ? (
              <textarea
                value={templateContent}
                onChange={(e) => setTemplateContent(e.target.value)}
                className="w-full h-96 p-4 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#3BAFBA]"
              />
            ) : (
              <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed">
                {formattedLetter}
              </pre>
            )}
          </div>

          {/* Action Buttons for Template */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => {
                // Use the template content directly
                const lines = formattedLetter.split('\n\n');
                setCoverLetter({
                  greeting: lines[0] || "",
                  opening: lines[1] || "",
                  body: lines.slice(2, -2).length > 0 ? lines.slice(2, -2) : [lines[2] || ""],
                  closing: lines[lines.length - 2] || "",
                  signature: lines[lines.length - 1] || "",
                });
                setEditableContent(formattedLetter);
                setIsEditing(true); // Start in edit mode so user can modify
                setTemplateMode(false);
                // Scroll to the editing section
                setTimeout(() => {
                  document.querySelector('#editing-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#3BAFBA] hover:bg-[#2d9ba5] text-white rounded transition-colors text-sm font-medium"
            >
              <Edit3 className="w-4 h-4" />
              Edit Template
            </button>
            <button
              onClick={() => {
                // Scroll to AI enhancement section below
                document.querySelector('#ai-enhance-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded transition-colors text-sm font-medium shadow-md"
            >
              <Lightbulb className="w-4 h-4" />
              Enhance with AI
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={handleCopyForEmail}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors text-sm"
            >
              <Mail className="w-4 h-4" />
              Copy for Email
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors text-sm"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>
        </div>
      )}

      {/* Generation Section */}
      <div id="ai-enhance-section" className="border rounded-lg p-6 bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-4">
          {templateMode ? "AI Enhancement (Optional)" : "AI Cover Letter Generator"}
        </h2>

        {templateMode && (
          <p className="text-sm text-gray-600 mb-4">
            Want AI to enhance your template? Select a job below and click generate:
          </p>
        )}

        {/* Job Selector */}
        <div className="mb-4">
          <label htmlFor="job-select" className="block text-sm font-medium text-gray-700 mb-2">
            Select Job
          </label>
          <select
            id="job-select"
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
          >
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title} at {job.company}
              </option>
            ))}
          </select>
        </div>

        {/* Job Details Preview */}
        {selectedJob && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md text-sm">
            <p className="font-medium">{selectedJob.title}</p>
            <p className="text-gray-600">{selectedJob.company}</p>
            {selectedJob.location && (
              <p className="text-gray-500 text-xs mt-1">{selectedJob.location}</p>
            )}
            {(selectedJob as any).industry && (
              <div className="mt-2">
                <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                  Industry: {(selectedJob as any).industry}
                </span>
                <p className="text-gray-500 text-xs mt-1">
                  Industry-specific language will be used
                </p>
              </div>
            )}
          </div>
        )}

        {/* Company Research Section */}
        <div className="mb-4">
          <button
            onClick={() => setShowCompanyResearch(!showCompanyResearch)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg hover:from-blue-100 hover:to-purple-100 transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔍</span>
              <div className="text-left">
                <p className="font-semibold text-blue-900">Company Research (Optional but Recommended)</p>
                <p className="text-xs text-blue-700">Add company details to demonstrate genuine interest and research</p>
              </div>
            </div>
            <span className="text-blue-600 text-xl">{showCompanyResearch ? "−" : "+"}</span>
          </button>

          {showCompanyResearch && (
            <div className="mt-3 p-4 border-2 border-blue-100 rounded-lg bg-white space-y-3">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-600">
                  Adding company research dramatically improves your cover letter by showing genuine interest and preparation.
                </p>
                <button
                  onClick={handleAutoResearch}
                  disabled={researchingCompany || !selectedJob}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm font-medium shadow-md"
                >
                  <span className="text-lg">✨</span>
                  {researchingCompany ? "Researching..." : "Auto-Research with AI"}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Background
                </label>
                <textarea
                  value={companyResearch.companyBackground}
                  onChange={(e) => setCompanyResearch({ ...companyResearch, companyBackground: e.target.value })}
                  placeholder="e.g., Founded in 2015, leading SaaS platform for..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3BAFBA] text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recent News/Achievements
                </label>
                <textarea
                  value={companyResearch.recentNews}
                  onChange={(e) => setCompanyResearch({ ...companyResearch, recentNews: e.target.value })}
                  placeholder="e.g., Recently launched new AI feature, won Best Tech Startup 2024..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3BAFBA] text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Mission/Values
                </label>
                <textarea
                  value={companyResearch.companyMission}
                  onChange={(e) => setCompanyResearch({ ...companyResearch, companyMission: e.target.value })}
                  placeholder="e.g., Empowering small businesses through accessible technology..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3BAFBA] text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specific Initiatives/Projects
                </label>
                <textarea
                  value={companyResearch.companyInitiatives}
                  onChange={(e) => setCompanyResearch({ ...companyResearch, companyInitiatives: e.target.value })}
                  placeholder="e.g., Project Atlas - new global expansion initiative..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3BAFBA] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Size
                  </label>
                  <input
                    type="text"
                    value={companyResearch.companySize}
                    onChange={(e) => setCompanyResearch({ ...companyResearch, companySize: e.target.value })}
                    placeholder="e.g., 500-1000 employees"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3BAFBA] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Funding/Expansion
                  </label>
                  <input
                    type="text"
                    value={companyResearch.fundingInfo}
                    onChange={(e) => setCompanyResearch({ ...companyResearch, fundingInfo: e.target.value })}
                    placeholder="e.g., Series B $50M"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3BAFBA] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Competitive Positioning
                </label>
                <textarea
                  value={companyResearch.competitiveLandscape}
                  onChange={(e) => setCompanyResearch({ ...companyResearch, competitiveLandscape: e.target.value })}
                  placeholder="e.g., Main competitor to Salesforce, differentiated by ease of use..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3BAFBA] text-sm"
                />
              </div>

              <div className="mt-3 p-3 bg-blue-50 rounded text-xs text-blue-800">
                <p className="font-medium mb-1">💡 Pro Tip:</p>
                <p>Check the company's website, LinkedIn, recent press releases, and Crunchbase for this information.</p>
              </div>
            </div>
          )}
        </div>

        {/* Experience Highlighting Section */}
        {selectedJobId && (
          <div className="mb-4">
            <button
              onClick={() => setShowExperienceHighlighting(!showExperienceHighlighting)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-green-50 to-teal-50 border-2 border-green-200 rounded-lg hover:from-green-100 hover:to-teal-100 transition-all"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                <div className="text-left">
                  <p className="font-semibold text-green-900">Experience Highlighting (AI-Powered)</p>
                  <p className="text-xs text-green-700">Analyze and select your most relevant experiences for this role</p>
                </div>
              </div>
              <span className="text-green-600 text-xl">{showExperienceHighlighting ? "−" : "+"}</span>
            </button>

            {showExperienceHighlighting && (
              <div className="mt-3">
                <ExperienceHighlighting
                  userId={userId}
                  jobId={selectedJobId}
                  onExperiencesSelected={(indices, analysis) => {
                    setSelectedExperiences(indices);
                    setExperienceAnalysis(analysis);
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={loading || !selectedJobId}
          className="w-full bg-[#3BAFBA] text-white px-4 py-2 rounded hover:bg-[#2d9ba5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Enhancing with AI..." : templateMode ? "Enhance Template with AI" : "Generate AI Cover Letter"}
        </button>

        {error && (
          <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
      </div>


      {/* Tone Customization & Preview */}
      {coverLetter && (
        <div id="editing-section" className="border rounded-lg p-6 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Customize & Preview</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                {isEditing ? "Preview" : "Edit"}
              </button>
            </div>
          </div>

          {/* Tone and Style Controls */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="tone" className="block text-sm font-medium text-gray-700 mb-2">
                Tone
              </label>
              <select
                id="tone"
                value={tone}
                onChange={(e) => setTone(e.target.value as Tone)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3BAFBA]"
              >
                <option value="formal">Formal</option>
                <option value="casual">Casual</option>
                <option value="enthusiastic">Enthusiastic</option>
                <option value="analytical">Analytical</option>
              </select>
            </div>
            <div>
              <label htmlFor="culture" className="block text-sm font-medium text-gray-700 mb-2">
                Company Culture
              </label>
              <select
                id="culture"
                value={culture}
                onChange={(e) => setCulture(e.target.value as Culture)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3BAFBA]"
              >
                <option value="startup">Startup</option>
                <option value="corporate">Corporate</option>
              </select>
            </div>
          </div>

          {/* Advanced Style Controls */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label htmlFor="length" className="block text-sm font-medium text-gray-700 mb-2">
                Length
              </label>
              <select
                id="length"
                value={length}
                onChange={(e) => setLength(e.target.value as Length)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3BAFBA]"
              >
                <option value="brief">Brief (150-200 words)</option>
                <option value="standard">Standard (250-350 words)</option>
                <option value="detailed">Detailed (400-500 words)</option>
              </select>
            </div>
            <div>
              <label htmlFor="writingStyle" className="block text-sm font-medium text-gray-700 mb-2">
                Writing Style
              </label>
              <select
                id="writingStyle"
                value={writingStyle}
                onChange={(e) => setWritingStyle(e.target.value as WritingStyle)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3BAFBA]"
              >
                <option value="direct">Direct</option>
                <option value="narrative">Narrative</option>
                <option value="bullet-points">Bullet Points</option>
              </select>
            </div>
            <div>
              <label htmlFor="personalityLevel" className="block text-sm font-medium text-gray-700 mb-2">
                Personality
              </label>
              <select
                id="personalityLevel"
                value={personalityLevel}
                onChange={(e) => setPersonalityLevel(e.target.value as PersonalityLevel)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3BAFBA]"
              >
                <option value="minimal">Minimal</option>
                <option value="moderate">Moderate</option>
                <option value="strong">Strong</option>
              </select>
            </div>
          </div>

          {/* Custom Instructions */}
          <div className="mb-4">
            <label htmlFor="customInstructions" className="block text-sm font-medium text-gray-700 mb-2">
              Custom Instructions (Optional)
            </label>
            <textarea
              id="customInstructions"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="Add any specific requirements or preferences (e.g., 'Mention my volunteer work', 'Focus on leadership skills', 'Include a quote from the CEO')"
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3BAFBA] text-sm"
            />
          </div>

          {/* Regenerate Button */}
          <div className="mb-4">
            <button
              onClick={handleRegenerate}
              disabled={loading || !coverLetter}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#1a6a71] hover:bg-[#155861] text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? "Regenerating with AI..." : "Regenerate with AI"}
            </button>
            <p className="text-xs text-gray-500 mt-1">
              Click to regenerate the cover letter with current style settings (tone, culture, length, writing style, personality, and custom instructions)
            </p>
          </div>

          {/* Style Settings Applied Badge */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm font-medium text-blue-900 mb-2">Style Settings Applied:</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                Tone: {tone}
              </span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                Culture: {culture}
              </span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                Length: {length}
              </span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                Style: {writingStyle}
              </span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                Personality: {personalityLevel}
              </span>
              {selectedJob?.industry && (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                  Industry: {selectedJob.industry}
                </span>
              )}
              {customInstructions && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                  Custom instructions applied
                </span>
              )}
            </div>
            <p className="text-xs text-blue-700 mt-2">
              ✓ The cover letter above was generated according to these preferences
            </p>
          </div>

          {/* Content Display/Edit */}
          {isEditing ? (
            <div className="space-y-4">
              {/* Editing Stats Bar */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-900">Words</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{wordCount}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-medium text-purple-900">Characters</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">{charCount}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-medium text-green-900">Readability</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <p className="text-2xl font-bold text-green-900">{readabilityScore}</p>
                    <span className="text-xs text-green-700">/100</span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    {readabilityScore >= 60 ? "Easy" : readabilityScore >= 30 ? "Medium" : "Complex"}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <span className="text-xs font-medium text-gray-900">Auto-Save</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    {lastAutoSave ? (
                      <>Saved {new Date(lastAutoSave).toLocaleTimeString()}</>
                    ) : (
                      "Not saved yet"
                    )}
                  </p>
                </div>
              </div>

              {/* Rich Text Editor */}
              <RichTextEditor
                content={editableContent}
                onChange={setEditableContent}
                onWordCount={setWordCount}
                onCharCount={setCharCount}
              />

              {/* Editing Tools */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={getEditingSuggestions}
                  disabled={loadingSuggestions || !editableContent}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  <Lightbulb className={`w-4 h-4 ${loadingSuggestions ? 'animate-pulse' : ''}`} />
                  {loadingSuggestions ? "Getting Suggestions..." : "Get AI Suggestions"}
                </button>

                {versionHistory.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Version History:</span>
                    <select
                      onChange={(e) => {
                        const version = versionHistory[parseInt(e.target.value)];
                        if (version) restoreVersion(version);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#3BAFBA]"
                    >
                      <option value="">Select version to restore...</option>
                      {versionHistory.map((v, idx) => (
                        <option key={idx} value={idx}>
                          {new Date(v.timestamp).toLocaleTimeString()} - Version {idx + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* AI Suggestions Panel */}
              {showSuggestions && editingSuggestions && (
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-purple-600" />
                      <h4 className="text-lg font-semibold text-purple-900">AI Editing Suggestions</h4>
                    </div>
                    <button
                      onClick={() => setShowSuggestions(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Grammar Suggestions */}
                    {editingSuggestions.grammar && editingSuggestions.grammar.length > 0 && (
                      <div className="bg-white rounded-lg p-4 border border-purple-200">
                        <h5 className="font-semibold text-sm text-purple-900 mb-2">
                          ✏️ Grammar & Style
                        </h5>
                        <ul className="space-y-2">
                          {editingSuggestions.grammar.map((suggestion: any, idx: number) => (
                            <li key={idx} className="text-sm text-gray-700">
                              <span className="font-medium text-red-600">{suggestion.original}</span>
                              {" → "}
                              <span className="font-medium text-green-600">{suggestion.suggestion}</span>
                              <p className="text-xs text-gray-500 mt-1">{suggestion.reason}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Word Choice Suggestions */}
                    {editingSuggestions.wordChoice && editingSuggestions.wordChoice.length > 0 && (
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <h5 className="font-semibold text-sm text-blue-900 mb-2">
                          📖 Word Variety & Synonyms
                        </h5>
                        <ul className="space-y-2">
                          {editingSuggestions.wordChoice.map((suggestion: any, idx: number) => (
                            <li key={idx} className="text-sm text-gray-700">
                              <span className="font-medium text-orange-600">{suggestion.word}</span>
                              {" → "}
                              <span className="font-medium text-blue-600">
                                {suggestion.alternatives.join(", ")}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Structure Suggestions */}
                    {editingSuggestions.structure && editingSuggestions.structure.length > 0 && (
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <h5 className="font-semibold text-sm text-green-900 mb-2">
                          🔄 Structure Improvements
                        </h5>
                        <ul className="space-y-2">
                          {editingSuggestions.structure.map((suggestion: any, idx: number) => (
                            <li key={idx} className="text-sm text-gray-700">
                              <p className="font-medium text-green-700">{suggestion.title}</p>
                              <p className="text-xs text-gray-600 mt-1">{suggestion.suggestion}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Overall Feedback */}
                    {editingSuggestions.overall && (
                      <div className="bg-white rounded-lg p-4 border border-purple-200">
                        <h5 className="font-semibold text-sm text-purple-900 mb-2">
                          💡 Overall Feedback
                        </h5>
                        <p className="text-sm text-gray-700">{editingSuggestions.overall}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-md p-6 border border-gray-200">
              <div
                className="whitespace-pre-wrap font-serif text-sm leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: editableContent || formattedLetter }}
              />
            </div>
          )}

          {/* Export Actions */}
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#3BAFBA] hover:bg-[#2d9ba5] text-white rounded transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Export Options
            </button>
            <button
              onClick={handleCopyForEmail}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors text-sm"
            >
              <Mail className="w-4 h-4" />
              Copy for Email
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors text-sm"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>

            {savedCoverLetterId ? (
              // Show both Save (update) and Save As New buttons for existing letters
              <>
                <button
                  onClick={handleSaveCoverLetter}
                  disabled={saving || !coverLetter}
                  className="flex items-center gap-2 px-4 py-2 bg-[#3BAFBA] hover:bg-[#2d9ba5] text-white rounded transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={handleSaveAsNew}
                  disabled={saving || !coverLetter}
                  className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Copy className="w-4 h-4" />
                  {saving ? "Saving..." : "Save As New"}
                </button>
              </>
            ) : (
              // Show only Save & Link for new letters
              <button
                onClick={handleSaveCoverLetter}
                disabled={saving || !coverLetter}
                className="flex items-center gap-2 px-4 py-2 bg-[#3BAFBA] hover:bg-[#2d9ba5] text-white rounded transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save & Link"}
              </button>
            )}
          </div>

          {savedCoverLetterId && (
            <div className="mt-3 p-3 bg-cyan-50 text-cyan-700 rounded-md text-sm">
              ✓ Linked to {selectedJob?.company} - {selectedJob?.title}
            </div>
          )}
        </div>
      )}

      {/* Export Options Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Export Options</h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ✕
                </button>
              </div>

              {/* Letterhead Section */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Custom Letterhead (Optional)</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Add your contact information to appear at the top of exported documents
                </p>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={letterheadName}
                    onChange={(e) => setLetterheadName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3BAFBA] text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Address"
                    value={letterheadAddress}
                    onChange={(e) => setLetterheadAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3BAFBA] text-sm"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Phone Number"
                      value={letterheadPhone}
                      onChange={(e) => setLetterheadPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3BAFBA] text-sm"
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={letterheadEmail}
                      onChange={(e) => setLetterheadEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3BAFBA] text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Formatting Style */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Formatting Style</h4>
                <div className="grid grid-cols-3 gap-3">
                  {(["classic", "modern", "minimal"] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => setFormattingStyle(style)}
                      className={`px-4 py-3 rounded border-2 transition-all text-sm ${
                        formattingStyle === style
                          ? "border-[#3BAFBA] bg-[#3BAFBA] bg-opacity-10 text-[#3BAFBA] font-medium"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="font-medium capitalize">{style}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {style === "classic" && "Times New Roman, 12pt"}
                        {style === "modern" && "Arial, 11pt"}
                        {style === "minimal" && "Helvetica, 10pt"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Export Format Buttons */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Select Export Format</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      handleExportPDF();
                      setShowExportModal(false);
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                  >
                    <FileText className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">PDF</div>
                      <div className="text-xs opacity-90">Professional formatting</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      handleExportDOCX();
                      setShowExportModal(false);
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                  >
                    <FileText className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">Word (.docx)</div>
                      <div className="text-xs opacity-90">Editable document</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      handleExportHtml();
                      setShowExportModal(false);
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors"
                  >
                    <FileText className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">HTML</div>
                      <div className="text-xs opacity-90">Web format</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      handleExportTxt();
                      setShowExportModal(false);
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                  >
                    <FileText className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">Plain Text</div>
                      <div className="text-xs opacity-90">For email apps</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Filename Preview */}
              <div className="p-3 bg-gray-50 rounded text-sm">
                <p className="text-gray-600 mb-1">Filename preview:</p>
                <p className="font-mono text-gray-900">{generateFilename("pdf")}</p>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

