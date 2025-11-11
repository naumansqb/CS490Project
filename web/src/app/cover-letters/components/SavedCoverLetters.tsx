"use client";

import { useState, useEffect } from "react";
import { getCoverLettersByUserId, deleteCoverLetter } from "@/lib/coverLetter.api";
import { FileText, Trash2, ExternalLink, Calendar } from "lucide-react";

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
  createdAt: string;
  jobOpportunity?: {
    id: string;
    title: string;
    company: string;
  };
}

interface SavedCoverLettersProps {
  userId: string;
  onSelectLetter: (letter: SavedCoverLetter) => void;
}

export default function SavedCoverLetters({ userId, onSelectLetter }: SavedCoverLettersProps) {
  const [letters, setLetters] = useState<SavedCoverLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCoverLetters();
  }, [userId]);

  async function fetchCoverLetters() {
    try {
      setLoading(true);
      const response: any = await getCoverLettersByUserId(userId);
      const lettersList = response.data || response || [];
      setLetters(lettersList);
    } catch (error) {
      console.error("Error fetching cover letters:", error);
      setError("Failed to load cover letters");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this cover letter?")) {
      return;
    }

    try {
      await deleteCoverLetter(id);
      setLetters(letters.filter(letter => letter.id !== id));
    } catch (error) {
      console.error("Error deleting cover letter:", error);
      alert("Failed to delete cover letter");
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="border rounded-lg p-6 bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-4">My Cover Letters</h2>
        <p className="text-gray-500">Loading your cover letters...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border rounded-lg p-6 bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-4">My Cover Letters</h2>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (letters.length === 0) {
    return (
      <div className="border rounded-lg p-6 bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-4">My Cover Letters</h2>
        <p className="text-gray-500">
          No saved cover letters yet. Generate your first one above!
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm">
      <h2 className="text-lg font-semibold mb-4">My Cover Letters ({letters.length})</h2>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {letters.map((letter) => (
          <div
            key={letter.id}
            onClick={() => onSelectLetter(letter)}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-gray-50 hover:bg-gray-100"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium text-sm line-clamp-1">{letter.title}</h3>
              </div>
              <button
                onClick={(e) => handleDelete(letter.id, e)}
                className="text-gray-400 hover:text-red-600 transition-colors p-1"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {letter.jobOpportunity && (
              <div className="mb-3 p-2 bg-white rounded text-xs">
                <p className="font-medium text-gray-900">{letter.jobOpportunity.title}</p>
                <p className="text-gray-600">{letter.jobOpportunity.company}</p>
              </div>
            )}

            <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
              {letter.tone && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                  {letter.tone}
                </span>
              )}
              {letter.culture && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  {letter.culture}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Calendar className="w-3 h-3" />
              {formatDate(letter.createdAt)}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600 line-clamp-2">
                {letter.content.opening}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
