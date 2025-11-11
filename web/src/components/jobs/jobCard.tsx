"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  X,
  MapPin,
  Building2,
  DollarSign,
  Calendar,
  ExternalLink,
  Clock,
  AlertCircle,
  Eye,
} from "lucide-react";
import { Job } from "@/types/jobs.types";
import AttachMaterialsModal from "@/components/jobs/attachMaterialsModal";
import { getMaterials } from "@/lib/materials.api";

// If you have types exported from the API file, import them:
type ResumePayload = {
  resumeId: string;
  versionLabel?: string;
  snapshot?: any;
  pdfUrl?: string;
};
type CoverLetterUrl = { source: "url"; url: string; title?: string };
type CoverLetterInline = { source: "inline"; inline: string; title?: string };
type CoverLetterPayload = CoverLetterUrl | CoverLetterInline;
type MaterialsCurrent = {
  resume: ResumePayload | null;
  coverLetter: CoverLetterPayload | null;
  attachedAt: string;
};
type MaterialsHistoryEntry = {
  at: string;
  by: string;
  resume?: ResumePayload;
  coverLetter?: CoverLetterPayload;
  note?: string;
};
type MaterialsResponse = {
  current: MaterialsCurrent | null;
  history: MaterialsHistoryEntry[];
  defaults?: { resumeId?: string; coverLetterUrl?: string };
};

interface JobCardProps {
  job: Job;
  onDelete: (id: string) => void;
  onViewDetails: (jobId: string) => void;
  searchTerm?: string;
}

export default function JobCard({
  job,
  onDelete,
  onViewDetails,
  searchTerm = "",
}: JobCardProps) {
  const [attachOpen, setAttachOpen] = useState(false);
  const [materials, setMaterials] = useState<MaterialsResponse | null>(null);

  useEffect(() => {
    getMaterials(job.id)
      .then((data) => setMaterials(data))
      .catch(() => setMaterials(null));
  }, [job.id]);

  // Helpers
  const formatSalary = (min: string, max: string) => {
    if (!min && !max) return "Not specified";
    if (min && max)
      return `$${parseInt(min).toLocaleString()} - $${parseInt(max).toLocaleString()}`;
    if (min) return `From $${parseInt(min).toLocaleString()}`;
    return `Up to $${parseInt(max).toLocaleString()}`;
  };

  const highlightText = (text: string, term: string) => {
    if (!term || !text) return text;
    const parts = text.split(new RegExp(`(${term})`, "gi"));
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === term.toLowerCase() ? (
            <mark key={index} className="bg-yellow-200 px-1 rounded">
              {part}
            </mark>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </>
    );
  };

  const isDeadlineApproaching = () => {
    if (!job.deadline) return false;
    const deadline = new Date(job.deadline);
    const today = new Date();
    const daysUntil = Math.ceil(
      (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntil <= 7 && daysUntil >= 0;
  };

  const isDeadlinePassed = () => {
    if (!job.deadline) return false;
    return new Date(job.deadline) < new Date();
  };

  const formatUrl = (url: string) => {
    if (!url) return "#";
    return url.startsWith("http://") || url.startsWith("https://")
      ? url
      : `https://${url}`;
  };

  // Render a cover letter whether it's URL or inline
  const renderCoverLetter = (cl: CoverLetterPayload | null | undefined) => {
    if (!cl) return null;
    if (cl.source === "url") {
      const label = cl.title || cl.url;
      return (
        <p>
          <strong>Cover Letter:</strong>{" "}
          <a
            href={cl.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {label}
          </a>
        </p>
      );
    }
    // inline case
    const label = cl.title || cl.inline;
    return (
      <p>
        <strong>Cover Letter:</strong> <span>{label}</span>
      </p>
    );
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {highlightText(job.title, searchTerm)}
            </h3>
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Building2 size={16} />
              <span className="font-medium">
                {highlightText(job.company, searchTerm)}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(job.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Delete job"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Job Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {job.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin size={16} className="text-gray-400 shrink-0" />
              <span>{job.location}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <DollarSign size={16} className="text-gray-400 shrink-0" />
            <span>{formatSalary(job.salaryMin, job.salaryMax)}</span>
          </div>

          {job.deadline && (
            <div
              className={`flex items-center gap-2 text-sm ${
                isDeadlinePassed()
                  ? "text-red-600"
                  : isDeadlineApproaching()
                  ? "text-yellow-600 font-medium"
                  : "text-green-600"
              }`}
            >
              {isDeadlinePassed() ? (
                <AlertCircle size={16} className="shrink-0" />
              ) : isDeadlineApproaching() ? (
                <Clock size={16} className="shrink-0" />
              ) : (
                <Calendar size={16} className="text-gray-400 shrink-0" />
              )}
              <span>
                {isDeadlinePassed() ? "Deadline passed: " : "Deadline: "}
                {new Date(job.deadline).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          )}

          {job.postingUrl && (
            <div className="flex items-center gap-2 text-sm">
              <ExternalLink size={16} className="text-gray-400 shrink-0" />
              <a
                href={formatUrl(job.postingUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline truncate"
              >
                View Posting
              </a>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
            {job.industry}
          </span>
          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            {job.jobType}
          </span>

          {isDeadlineApproaching() && !isDeadlinePassed() && (
            <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full flex items-center gap-1">
              <Clock size={12} />
              Deadline Soon
            </span>
          )}

          {isDeadlinePassed() && (
            <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full flex items-center gap-1">
              <AlertCircle size={12} />
              Expired
            </span>
          )}
        </div>

        {/* Description */}
        {job.description && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">
              {highlightText(job.description, searchTerm)}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(job.id);
            }}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Eye size={16} className="mr-2" />
            View Details
          </Button>

          <Button
            onClick={(e) => {
              e.stopPropagation();
              setAttachOpen(true);
            }}
            size="sm"
            className="flex-1"
          >
            Attach Materials
          </Button>
        </div>

        {/* Current linked materials */}
        {materials?.current && (
          <div className="mt-4 border-t border-gray-100 pt-3 text-sm text-gray-700">
            <p className="font-semibold mb-1">Current Materials</p>

            {/* Resume */}
            {materials.current.resume && (
              <p>
                <strong>Resume:</strong> {materials.current.resume.resumeId}
                {materials.current.resume.versionLabel && (
                  <> ({materials.current.resume.versionLabel})</>
                )}
              </p>
            )}

            {/* Cover letter (supports url and inline) */}
            {renderCoverLetter(materials.current.coverLetter)}

            <p className="text-xs text-gray-500 mt-1">
              Attached on{" "}
              {new Date(materials.current.attachedAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        )}

        {/* Date Added */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Added{" "}
            {new Date(job.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </CardContent>

      {/* Attach Materials Modal */}
      <AttachMaterialsModal
        jobId={job.id}
        isOpen={attachOpen}
        onClose={() => {
          setAttachOpen(false);
          // Refresh materials when modal closes
          getMaterials(job.id)
            .then((data) => setMaterials(data))
            .catch(() => setMaterials(null));
        }}
      />
    </Card>
  );
}
