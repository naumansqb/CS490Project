"use client";

import { useState, useMemo } from "react";
import { FileText, Eye, Edit3, Upload, Filter, Plus, Download } from "lucide-react";

type TemplateCategory = "Formal" | "Creative" | "Technical" | "General";

interface LibraryTemplate {
  id: string;
  title: string;
  category: TemplateCategory;
  industries: string[];
  content: string;
  usageCount?: number;
  isUser?: boolean;
}

// Seed templates
const SEED_TEMPLATES: LibraryTemplate[] = [
  {
    id: "t-formal-1",
    title: "Formal — General Professional",
    category: "Formal",
    industries: ["All"],
    content: `{{date}}

{{companyName}}
{{companyAddress}}

Dear {{hiringManagerName}},

I am excited to apply for the {{roleTitle}} position at {{companyName}}. Your recent work on {{recentNewsOne}} aligns with my background in {{skillOne}} and {{skillTwo}}. I especially admire {{companyMission}} and how it shows in initiatives like {{initiativeOne}}.

In my previous role at {{previousCompany}}, I {{impactOne}}. I also {{impactTwo}}, which led to {{metricOne}} improvement.

I would welcome the opportunity to contribute to {{companyName}} as it continues {{industryContext}}. Thank you for your time and consideration.

Sincerely,
{{fullName}}
{{city}}, {{state}}
{{email}} | {{phone}}`,
    usageCount: 0,
  },
  {
    id: "t-creative-1",
    title: "Creative — Story Hook",
    category: "Creative",
    industries: ["Marketing", "Media", "Design"],
    content: `Hi {{hiringManagerName}},

Here's a quick story: when {{previousCompany}} needed a bold campaign, I combined {{skillOne}} + {{skillTwo}} to {{impactOne}} — which sparked {{metricOne}}. That's the same energy I see at {{companyName}} (your {{recentNewsOne}} is impressive).

I'm applying for {{roleTitle}} because {{companyMission}} resonates with my values. If you're open to it, I'd love to share 2–3 ideas tailored to {{initiativeOne}} this week.

Cheers,
{{fullName}}`,
    usageCount: 0,
  },
  {
    id: "t-technical-1",
    title: "Technical — Engineering",
    category: "Technical",
    industries: ["Software", "Tech", "Engineering"],
    content: `Dear {{hiringManagerName}},

I'm a {{stack}} engineer who ships clean, reliable software. At {{previousCompany}}, I {{impactOne}} and drove {{metricOne}}. I'm drawn to {{companyName}} for its work on {{initiativeOne}} and the recent milestone: {{recentNewsOne}}.

Tech snapshot: {{stack}} | {{skillOne}} | {{skillTwo}} | {{skillThree}}

I'd be excited to contribute to {{roleTitle}} and support {{companyMission}}.

Regards,
{{fullName}}`,
    usageCount: 0,
  },
];

// Sample variables for preview
const SAMPLE_VARS: Record<string, string> = {
  date: new Date().toLocaleDateString(),
  companyName: "Acme Corp",
  companyAddress: "123 Market St, San Francisco, CA",
  hiringManagerName: "Hiring Manager",
  roleTitle: "Software Engineer",
  recentNewsOne: "launching a new AI workflow",
  companyMission: "empowering creators with simple, powerful tools",
  initiativeOne: "Developer Experience Platform",
  industryContext: "to scale in a competitive SaaS market",
  previousCompany: "PriorTech",
  impactOne: "led a cross-functional refactor that cut build times by 35%",
  impactTwo: "introduced CI checks to reduce regressions",
  metricOne: "a 28% uptick in release frequency",
  fullName: "Alex Rivera",
  city: "Newark",
  state: "NJ",
  email: "alex.rivera@example.com",
  phone: "(555) 555-5555",
  stack: "TypeScript/Node/Next.js",
  skillOne: "TypeScript",
  skillTwo: "React",
  skillThree: "PostgreSQL",
};

// Render template with variables
function renderTemplate(template: string, variables: Record<string, string>) {
  return template.replace(/{{\s*([a-zA-Z0-9_\.]+)\s*}}/g, (_, key) => {
    const v = variables[key as keyof typeof variables];
    return (v ?? "").toString();
  });
}

interface TemplateLibraryProps {
  onSelectTemplate: (template: LibraryTemplate, variables: Record<string, string>) => void;
}

export default function TemplateLibrary({ onSelectTemplate }: TemplateLibraryProps) {
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("All");
  const [activeTab, setActiveTab] = useState<TemplateCategory | "All">("All");
  const [templates, setTemplates] = useState<LibraryTemplate[]>(SEED_TEMPLATES);
  const [myTemplates, setMyTemplates] = useState<LibraryTemplate[]>([]);
  const [previewTemplate, setPreviewTemplate] = useState<LibraryTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Import state
  const [showImport, setShowImport] = useState(false);
  const [importTitle, setImportTitle] = useState("");
  const [importText, setImportText] = useState("");

  // Unique industries list
  const industries = useMemo(() => {
    const set = new Set<string>(["All"]);
    templates.forEach((t) => t.industries.forEach((i) => set.add(i)));
    myTemplates.forEach((t) => t.industries.forEach((i) => set.add(i)));
    return Array.from(set);
  }, [templates, myTemplates]);

  // Filtered library
  const filtered = useMemo(() => {
    const allTemplates = [...templates, ...myTemplates];
    return allTemplates.filter((t) => {
      const okTab = activeTab === "All" ? true : t.category === activeTab;
      const okIndustry = industry === "All" ? true : t.industries.includes(industry);
      const okQuery = query
        ? (t.title + " " + t.content).toLowerCase().includes(query.toLowerCase())
        : true;
      return okTab && okIndustry && okQuery;
    });
  }, [templates, myTemplates, activeTab, industry, query]);

  // Handle template selection
  function handleSelectTemplate(t: LibraryTemplate) {
    // Track usage
    if (!t.isUser) {
      setTemplates((prev) =>
        prev.map((p) => (p.id === t.id ? { ...p, usageCount: (p.usageCount || 0) + 1 } : p))
      );
    } else {
      setMyTemplates((prev) =>
        prev.map((p) => (p.id === t.id ? { ...p, usageCount: (p.usageCount || 0) + 1 } : p))
      );
    }

    // Pass to parent
    onSelectTemplate(t, SAMPLE_VARS);
  }

  // Handle preview
  function handlePreview(t: LibraryTemplate) {
    setPreviewTemplate(t);
    setShowPreview(true);
  }

  // Import custom template
  function handleImport() {
    if (!importTitle || !importText) {
      alert("Please provide a title and content.");
      return;
    }

    const newT: LibraryTemplate = {
      id: `user-${Date.now()}`,
      title: importTitle,
      category: "General",
      industries: ["All"],
      content: importText,
      isUser: true,
      usageCount: 0,
    };

    setMyTemplates((prev) => [newT, ...prev]);
    setShowImport(false);
    setImportTitle("");
    setImportText("");
    alert("Template imported successfully!");
  }

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Cover Letter Templates</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(!showImport)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <div className="relative">
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors appearance-none pr-8"
            >
              {industries.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
            <Filter className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
          </div>
        </div>
      </div>

      {/* Import Section */}
      {showImport && (
        <div className="mb-4 p-4 border rounded-lg bg-gray-50">
          <h3 className="font-medium mb-3">Import Custom Template</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={importTitle}
                onChange={(e) => setImportTitle(e.target.value)}
                placeholder="My Template"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3BAFBA]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content (use {"{{variable}}"} for placeholders)
              </label>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Dear {{hiringManagerName}}, ..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3BAFBA]"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleImport}
                className="px-4 py-2 bg-[#3BAFBA] hover:bg-[#2d9ba5] text-white rounded transition-colors text-sm"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                Add Template
              </button>
              <button
                onClick={() => {
                  setShowImport(false);
                  setImportTitle("");
                  setImportText("");
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search templates..."
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3BAFBA]"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {["All", "Formal", "Creative", "Technical", "General"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded text-sm whitespace-nowrap transition-colors ${
              activeTab === tab
                ? "bg-[#3BAFBA] text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => (
          <div
            key={t.id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#3BAFBA]" />
                <h3 className="font-medium text-sm">{t.title}</h3>
              </div>
              {t.isUser && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                  Custom
                </span>
              )}
            </div>

            <div className="mb-3 text-xs text-gray-600">
              <p>Industries: {t.industries.join(", ")}</p>
              <p>Used: {t.usageCount || 0} times</p>
            </div>

            <div className="text-xs text-gray-500 line-clamp-3 mb-3">
              {renderTemplate(t.content, SAMPLE_VARS)}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handlePreview(t)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded transition-colors text-sm"
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
              <button
                onClick={() => handleSelectTemplate(t)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-[#3BAFBA] hover:bg-[#2d9ba5] text-white rounded transition-colors text-sm"
              >
                <Edit3 className="w-4 h-4" />
                Use
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No templates found. Try adjusting your filters.
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{previewTemplate.title}</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="mb-4 p-4 bg-gray-50 rounded">
                <pre className="whitespace-pre-wrap font-serif text-sm">
                  {renderTemplate(previewTemplate.content, SAMPLE_VARS)}
                </pre>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleSelectTemplate(previewTemplate);
                    setShowPreview(false);
                  }}
                  className="flex-1 px-4 py-2 bg-[#3BAFBA] hover:bg-[#2d9ba5] text-white rounded transition-colors"
                >
                  Use This Template
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
