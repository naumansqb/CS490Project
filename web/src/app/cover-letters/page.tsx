// @ts-nocheck
"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import CoverLetterAI from "./components/CoverLetterAI";
import SavedCoverLetters from "./components/SavedCoverLetters";
import TemplateLibrary from "./components/TemplateLibrary";
import { Sparkles, FileText } from "lucide-react";

export default function CoverLettersPage() {
  const { user } = useAuth();
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mode, setMode] = useState<"ai" | "templates">("ai");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  function handleSelectLetter(letter: any) {
    setSelectedLetter(letter);
    setMode("ai");
    // Scroll to the top to see the loaded letter
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSave() {
    // Refresh the saved letters list
    setRefreshKey(prev => prev + 1);
  }

  function handleNewLetter() {
    setSelectedLetter(null);
    setSelectedTemplate(null);
  }

  function handleSelectTemplate(template: any, variables: any) {
    console.log('Page received template:', template.title);
    console.log('Setting selectedTemplate state...');
    const templateData = { template, variables };
    setSelectedTemplate(templateData);
    setSelectedLetter(null); // Clear any selected letter
    setMode("ai");
    console.log('Switching to AI mode and scrolling...');
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">AI-Powered Cover Letters</h1>
        <div className="flex gap-2">
          {(selectedLetter || selectedTemplate) && (
            <button
              onClick={handleNewLetter}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors text-sm"
            >
              + New Cover Letter
            </button>
          )}
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setMode("ai")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
            mode === "ai"
              ? "border-[#3BAFBA] text-[#3BAFBA] font-medium"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          AI Generation
        </button>
        <button
          onClick={() => setMode("templates")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
            mode === "templates"
              ? "border-[#3BAFBA] text-[#3BAFBA] font-medium"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <FileText className="w-4 h-4" />
          Template Library
        </button>
      </div>

      {user?.uid && (
        <>
          {mode === "ai" ? (
            <>
              <CoverLetterAI
                userId={user.uid}
                selectedLetter={selectedLetter}
                selectedTemplate={selectedTemplate}
                onSave={handleSave}
              />
              <SavedCoverLetters
                key={refreshKey}
                userId={user.uid}
                onSelectLetter={handleSelectLetter}
              />
            </>
          ) : (
            <TemplateLibrary onSelectTemplate={handleSelectTemplate} />
          )}
        </>
      )}
    </div>
  );
}
