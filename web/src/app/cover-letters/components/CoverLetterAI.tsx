"use client";

import { useState } from "react";
import { generateAICoverLetter } from "@/lib/api/ai";

export default function CoverLetterAI({ userId, jobId }: { userId: string; jobId: string }) {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");

  async function handleGenerate() {
    setLoading(true);
    try {
      // TEMP TEST: direct API call
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/cover-letter/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId || "firebase-uid-123",
          jobId: jobId || "test-job-uuid",
        }),
      });
  
      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Request failed (${response.status}): ${err}`);
      }
  
      const result = await response.json();
      console.log("✅ AI Cover Letter API result:", result);
  
      // Display whatever the backend returns
      setContent(result.content?.html || result.html || JSON.stringify(result, null, 2));
    } catch (error) {
      console.error("Error generating cover letter:", error);
      setContent("⚠️ Something went wrong while generating your cover letter.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border rounded-lg p-4 mt-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">AI Cover Letter Generator</h2>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Cover Letter"}
        </button>
      </div>

      {content && (
        <div
          className="mt-4 prose border-t pt-4"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}
    </div>
  );
}

