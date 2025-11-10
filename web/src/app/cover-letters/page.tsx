// @ts-nocheck
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "next/navigation";
import CoverLetterAI from "./components/CoverLetterAI";

export default function CoverLettersPage() {
  const { user } = useAuth();
  const search = useSearchParams();

  const userId = user?.uid;                 // from Firebase Auth
  const jobId = search.get("jobId") || "";     // from /jobs/[jobId]/... route

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">AI-Powered Cover Letter</h1>

      {userId && jobId ? (
        <CoverLetterAI userId={userId} jobId={jobId} />
      ) : (
        <p className="text-gray-500">
          { !userId ? "Please sign in." : "Open a job detail route that has a jobId." }
        </p>
      )}
    </div>
  );
}
import React, { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Eye,
  Download,
  Share2,
  Edit3,
  Filter,
  Plus,
  Upload,
  Save,
  LineChart,
  Building2,
  Briefcase,
  FileText,
} from "lucide-react";

// -------------------------------------------
// Tiny mustache-like renderer for {{tokens}}
// -------------------------------------------
function renderTemplate(template: string, variables: Record<string, string>) {
  return template.replace(/{{\s*([a-zA-Z0-9_\.]+)\s*}}/g, (_, key) => {
    const v = variables[key as keyof typeof variables];
    return (v ?? "").toString();
  });
}

// -------------------------------------------
// Types
// -------------------------------------------
type TemplateCategory = "Formal" | "Creative" | "Technical" | "General";

type LibraryTemplate = {
  id: string;
  title: string;
  category: TemplateCategory;
  industries: string[];
  content: string;
  usageCount?: number;
  isUser?: boolean;
};

// -------------------------------------------
// Seed templates (can be replaced by API later)
// -------------------------------------------
const SEED_TEMPLATES: LibraryTemplate[] = [
  {
    id: "t-formal-1",
    title: "Formal — General Professional",
    category: "Formal",
    industries: ["All"],
    content: `
{{date}}

{{companyName}}
{{companyAddress}}

Dear {{hiringManagerName}},

I am excited to apply for the {{roleTitle}} position at {{companyName}}. Your recent work on {{recentNewsOne}} aligns with my background in {{skillOne}} and {{skillTwo}}. I especially admire {{companyMission}} and how it shows in initiatives like {{initiativeOne}}.

In my previous role at {{previousCompany}}, I {{impactOne}}. I also {{impactTwo}}, which led to {{metricOne}} improvement.

I would welcome the opportunity to contribute to {{companyName}} as it continues {{industryContext}}. Thank you for your time and consideration.

Sincerely,
{{fullName}}
{{city}}, {{state}}
{{email}} | {{phone}}
    `.trim(),
  },
  {
    id: "t-creative-1",
    title: "Creative — Story Hook",
    category: "Creative",
    industries: ["Marketing", "Media", "Design"],
    content: `
Hi {{hiringManagerName}},

Here’s a quick story: when {{previousCompany}} needed a bold campaign, I combined {{skillOne}} + {{skillTwo}} to {{impactOne}} — which sparked {{metricOne}}. That's the same energy I see at {{companyName}} (your {{recentNewsOne}} is 🔥).

I’m applying for {{roleTitle}} because {{companyMission}} resonates with my values. If you’re open to it, I’d love to share 2–3 ideas tailored to {{initiativeOne}} this week.

Cheers,
{{fullName}}
    `.trim(),
  },
  {
    id: "t-technical-1",
    title: "Technical — Engineering",
    category: "Technical",
    industries: ["Software", "Tech"],
    content: `
Dear {{hiringManagerName}},

I’m a {{stack}} engineer who ships clean, reliable software. At {{previousCompany}}, I {{impactOne}} and drove {{metricOne}}. I’m drawn to {{companyName}} for its work on {{initiativeOne}} and the recent milestone: {{recentNewsOne}}.

Tech snapshot: {{stack}} | {{skillOne}} | {{skillTwo}} | {{skillThree}}

I’d be excited to contribute to {{roleTitle}} and support {{companyMission}}.

Regards,
{{fullName}}
    `.trim(),
  },
];

// -------------------------------------------
// Demo sample variables (front-end only)
// -------------------------------------------
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

// -------------------------------------------
// Page Component
// -------------------------------------------
function CoverLettersLibrarySection() {
  // Library state (UC-055)
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("All");
  const [activeTab, setActiveTab] = useState<TemplateCategory | "All">("All");
  const [templates, setTemplates] = useState<LibraryTemplate[]>(SEED_TEMPLATES);
  const [myTemplates, setMyTemplates] = useState<LibraryTemplate[]>([]);
  const [vars, setVars] = useState<Record<string, string>>(SAMPLE_VARS);
  const [selected, setSelected] = useState<LibraryTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editorContent, setEditorContent] = useState<string>("");
  const [shareOpen, setShareOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [importTitle, setImportTitle] = useState("");
  const [importText, setImportText] = useState("");

  // Tone & Style (UC-058)
  const [tone, setTone] = useState<"formal" | "casual" | "enthusiastic" | "analytical">("formal");
  const [culture, setCulture] = useState<"startup" | "corporate">("startup");
  const [lengthPref, setLengthPref] = useState<"brief" | "standard" | "detailed">("standard");
  const [stylePref, setStylePref] = useState<"direct" | "narrative" | "bullet_points">("direct");
  const [industryPack, setIndustryPack] = useState<string>("Software");
  const [personality, setPersonality] = useState<boolean>(true);
  const [customTone, setCustomTone] = useState<string>("");

  // Unique industries list
  const industries = useMemo(() => {
    const set = new Set<string>(["All"]);
    templates.forEach((t) => t.industries.forEach((i) => set.add(i)));
    return Array.from(set);
  }, [templates]);

  // Filtered library
  const filtered = useMemo(() => {
    return templates.filter((t) => {
      const okTab = activeTab === "All" ? true : t.category === activeTab;
      const okIndustry = industry === "All" ? true : t.industries.includes(industry);
      const okQuery = query
        ? (t.title + " " + t.content).toLowerCase().includes(query.toLowerCase())
        : true;
      return okTab && okIndustry && okQuery;
    });
  }, [templates, activeTab, industry, query]);

  // Select & preview
  const onSelectTemplate = (t: LibraryTemplate) => {
    setSelected(t);
    setEditorContent(t.content);
    setPreviewOpen(true);
    // in-memory analytics
    setTemplates((prev) =>
      prev.map((p) => (p.id === t.id ? { ...p, usageCount: (p.usageCount || 0) + 1 } : p))
    );
  };

  // Save as custom (front-end only)
  const onSaveCustom = () => {
    const base = selected;
    const title = base ? `${base.title} (Custom)` : "Custom Template";
    const newT: LibraryTemplate = {
      id: `user-${Date.now()}`,
      title,
      category: (base?.category ?? "General") as TemplateCategory,
      industries: base?.industries ?? ["All"],
      content: editorContent,
      isUser: true,
    };
    setMyTemplates((prev) => [newT, ...prev]);
    toast.success("Saved to My Templates");
  };

  // Import (front-end only)
  const onImportTemplate = () => {
    if (!importTitle || !importText) {
      toast.error("Please provide a title and content.");
      return;
    }
    const newT: LibraryTemplate = {
      id: `user-${Date.now()}`,
      title: importTitle,
      category: "General",
      industries: ["All"],
      content: importText,
      isUser: true,
    };
    setMyTemplates((prev) => [newT, ...prev]);
    setImportOpen(false);
    setImportTitle("");
    setImportText("");
    toast.success("Imported as a custom template.");
  };

  // Share (front-end stub)
  const onShare = () => {
    if (!shareEmail) return toast.error("Enter an email to share");
    setShareOpen(false);
    setShareEmail("");
    toast.success("Template share sent (stub)");
  };

  // -----------------------------
  // UC-058: Tone & Style helpers
  // -----------------------------
  const INDUSTRY_TERMS: Record<string, string[]> = {
    Software: ["scalable systems", "developer experience", "CI/CD", "APIs", "observability"],
    Finance: ["risk management", "compliance", "portfolio optimization", "due diligence", "audit-ready"],
    Marketing: ["brand positioning", "multi-channel campaigns", "conversion rate", "A/B testing", "engagement"],
    Healthcare: ["patient outcomes", "HIPAA-compliant", "clinical workflows", "EHR integration", "safety"],
    Education: ["learning outcomes", "curriculum alignment", "accessibility", "student success", "assessment"],
  };

  function injectIndustryTerms(text: string): string {
    const list = INDUSTRY_TERMS[industryPack] || [];
    if (!list.length) return text;
    const snippet = `I understand the industry's focus on ${list.slice(0, 2).join(" and ")}.`;
    return text.includes(snippet) ? text : text + "\n\n" + snippet;
  }

  function applyTone(text: string): string {
    let out = text;

    // Company culture matching
    if (culture === "startup") {
      out = out.replace(/^Dear /gm, "Hi ");
    } else {
      out = out.replace(/^Hi /gm, "Dear ");
    }

    // Tone options
    if (tone === "casual") {
      out = out
        .replace(/I am excited to apply/gi, "I'm excited to apply")
        .replace(/I would welcome the opportunity/gi, "I'd love the opportunity")
        .replace(/Regards,?/gi, "Thanks,");
    }
    if (tone === "enthusiastic") {
      out = out.replace(/\./g, "!");
    }
    if (tone === "analytical") {
      out = out
        .replace(/excited/gi, "interested")
        .replace(/love/gi, "focus on")
        .concat("\n\nKey results: • Delivered on-time • Reduced variance • Improved reliability");
    }
    if (tone === "formal") {
      out = out.replace(/I'm/gi, "I am").replace(/Hi /g, "Dear ").replace(/!/g, ".");
    }

    // Personality injection
    if (personality && tone !== "analytical") {
      out = out + "\n\nP.S. Happy to share a quick walkthrough of my work if helpful.";
    }

    // Writing style
    if (stylePref === "bullet_points") {
      const lines = out.split(/\n+/).filter(Boolean);
      out = lines.map((l) => (l.length > 6 ? `• ${l}` : l)).join("\n");
    } else if (stylePref === "direct") {
      out = out.replace(/\b(I would|I could|I might)\b/gi, "I will");
    } // narrative leaves as-is

    // Length optimization
    if (lengthPref === "brief") {
      out = out.split(/\n+/).slice(0, 6).join("\n");
    }
    if (lengthPref === "detailed") {
      out = out + "\n\nAdditional context: I have attached links to code samples and references.";
    }

    // Industry terms
    out = injectIndustryTerms(out);

    // Custom tone instructions
    if (customTone.trim()) {
      out = out + "\n\n[Note: " + customTone.trim() + "]";
    }

    return out;
  }

  function validateTone(text: string) {
    if (tone === "formal") {
      const casualFlags = /(hey|gonna|wanna|awesome|cool)/i.test(text);
      const manyExclaims = /!{2,}/.test(text);
      if (casualFlags || manyExclaims) {
        toast.info("Tone check: Content looks casual for a formal tone.");
      }
    }
  }

  // Rendered preview with variables + tone
  const renderedPreview = useMemo(() => {
    const base = renderTemplate(editorContent || selected?.content || "", vars);
    const styled = applyTone(base);
    validateTone(styled);
    return styled;
  }, [editorContent, selected, vars, tone, culture, lengthPref, stylePref, industryPack, personality, customTone]);

  // Set variable helper
  const setVar = (k: string, v: string) => setVars((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6" />
          <h1 className="text-2xl font-semibold tracking-tight">Cover Letter Templates</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Import */}
          <Dialog open={importOpen} onOpenChange={setImportOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary"><Upload className="mr-2 h-4 w-4" />Import</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Custom Template</DialogTitle>
                <DialogDescription>Paste plain text with {"{{tokens}}"} to create a reusable template.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <Label htmlFor="imp-title">Title</Label>
                <Input id="imp-title" value={importTitle} onChange={(e) => setImportTitle(e.target.value)} placeholder="My Template" />
                <Label htmlFor="imp-text">Content</Label>
                <Textarea id="imp-text" rows={10} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Dear {{hiringManagerName}}, ..." />
              </div>
              <DialogFooter>
                <Button onClick={onImportTemplate}><Plus className="mr-2 h-4 w-4" />Add</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Filters */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline"><Filter className="mr-2 h-4 w-4" />Filter</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Industry</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {industries.map((i) => (
                <DropdownMenuItem key={i} onClick={() => setIndustry(i)}>
                  {i}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates (title or content)"
          />
        </div>
        <div className="text-sm text-muted-foreground">Industry: <span className="font-medium">{industry}</span></div>
      </div>

      {/* Tabs & Library Grid */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid grid-cols-5 w-full md:w-auto">
          <TabsTrigger value="All">All</TabsTrigger>
          <TabsTrigger value="Formal">Formal</TabsTrigger>
          <TabsTrigger value="Creative">Creative</TabsTrigger>
          <TabsTrigger value="Technical">Technical</TabsTrigger>
          <TabsTrigger value="General">General</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[...filtered, ...myTemplates].map((t) => (
              <Card key={t.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    <span className="truncate">{t.title}</span>
                    <div className="flex items-center gap-2">
                      {t.isUser ? (
                        <Badge variant="secondary">My Template</Badge>
                      ) : (
                        <Badge>{t.category}</Badge>
                      )}
                    </div>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 flex-wrap">
                    <Building2 className="w-4 h-4" />
                    {t.industries.map((i) => (
                      <Badge key={i} variant="outline">{i}</Badge>
                    ))}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm line-clamp-3 text-muted-foreground">
                    {renderTemplate(t.content, SAMPLE_VARS)}
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <LineChart className="w-4 h-4" />
                      Used {t.usageCount ?? 0}x
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => onSelectTemplate(t)}>
                        <Eye className="mr-2 h-4 w-4" />Preview
                      </Button>
                      <Button size="sm" onClick={() => { setSelected(t); setEditorContent(t.content); }}>
                        <Edit3 className="mr-2 h-4 w-4" />Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Editor + Tone/Style + Live Preview */}
      <Card className="mt-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Customize & Preview
          </CardTitle>
          <CardDescription>Adjust variables on the right; content supports {"{{token}}"} syntax.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Editor */}
            <div className="flex flex-col gap-3">
              <Label>Template Content</Label>
              <Textarea rows={18} value={editorContent} onChange={(e) => setEditorContent(e.target.value)} placeholder="Start with a template above, or paste your own..." />
              <div className="flex items-center gap-2">
                <Button onClick={onSaveCustom}><Save className="mr-2 h-4 w-4" />Save as Custom</Button>
                <Button variant="outline" onClick={() => setPreviewOpen(true)}><Eye className="mr-2 h-4 w-4" />Open Preview</Button>
                <Button variant="outline" onClick={() => setShareOpen(true)}><Share2 className="mr-2 h-4 w-4" />Share</Button>
              </div>
            </div>

            {/* Right: Variables, Tone & Style */}
            <div className="flex flex-col gap-4">
              <Label>Variables</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.keys(SAMPLE_VARS).map((k) => (
                  <div key={k} className="space-y-1">
                    <Label htmlFor={`v-${k}`}>{k}</Label>
                    <Input id={`v-${k}`} value={vars[k] ?? ""} onChange={(e) => setVar(k, e.target.value)} />
                  </div>
                ))}
              </div>

              <Separator />

              {/* UC-058 controls */}
              <Label> Tone & Style </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="tone">Tone</Label>
                  <select id="tone" className="w-full border rounded-md h-9 px-2" value={tone} onChange={(e) => setTone(e.target.value as any)}>
                    <option value="formal">Formal</option>
                    <option value="casual">Casual</option>
                    <option value="enthusiastic">Enthusiastic</option>
                    <option value="analytical">Analytical</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="culture">Company Culture</Label>
                  <select id="culture" className="w-full border rounded-md h-9 px-2" value={culture} onChange={(e) => setCulture(e.target.value as any)}>
                    <option value="startup">Startup</option>
                    <option value="corporate">Corporate</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="length">Length</Label>
                  <select id="length" className="w-full border rounded-md h-9 px-2" value={lengthPref} onChange={(e) => setLengthPref(e.target.value as any)}>
                    <option value="brief">Brief</option>
                    <option value="standard">Standard</option>
                    <option value="detailed">Detailed</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="style">Writing Style</Label>
                  <select id="style" className="w-full border rounded-md h-9 px-2" value={stylePref} onChange={(e) => setStylePref(e.target.value as any)}>
                    <option value="direct">Direct</option>
                    <option value="narrative">Narrative</option>
                    <option value="bullet_points">Bullet points</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="industry">Industry Language</Label>
                  <select id="industry" className="w-full border rounded-md h-9 px-2" value={industryPack} onChange={(e) => setIndustryPack(e.target.value)}>
                    <option>Software</option>
                    <option>Finance</option>
                    <option>Marketing</option>
                    <option>Healthcare</option>
                    <option>Education</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="personality">Personality</Label>
                  <div className="flex items-center gap-2">
                    <input id="personality" type="checkbox" className="h-4 w-4" checked={personality} onChange={(e) => setPersonality(e.target.checked)} />
                    <span className="text-sm text-muted-foreground">Inject a light personal touch</span>
                  </div>
                </div>
                <div className="md:col-span-2 space-y-1">
                  <Label htmlFor="custom">Custom Tone Instructions</Label>
                  <Input id="custom" placeholder="e.g., Keep sentences short, avoid buzzwords" value={customTone} onChange={(e) => setCustomTone(e.target.value)} />
                </div>
              </div>

              <Separator />
              <Label>Live Preview</Label>
              <pre className="rounded-xl bg-muted p-4 whitespace-pre-wrap text-sm min-h-[280px]">
                {renderedPreview || "Preview will appear here..."}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog (replaces Drawer) */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Cover Letter Preview</DialogTitle>
            <DialogDescription>Rendered using current variables and tone.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <pre className="rounded-xl bg-muted p-4 whitespace-pre-wrap text-sm min-h-[320px]">
              {renderedPreview}
            </pre>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => {
                const blob = new Blob([renderedPreview || ""], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${selected?.title || "cover-letter"}.txt`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success("Exported as text file");
              }}>
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
              <Button onClick={() => toast.success("Counted a usage (stub)")}>Use Template</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog (stub) */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Template</DialogTitle>
            <DialogDescription>Send a read-only copy to a teammate via email.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Label htmlFor="share-email">Recipient Email</Label>
            <Input id="share-email" type="email" value={shareEmail} onChange={(e) => setShareEmail(e.target.value)} placeholder="teammate@example.com" />
          </div>
          <DialogFooter>
            <Button onClick={onShare}><Share2 className="mr-2 h-4 w-4" />Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer note */}
      <div className="text-xs text-muted-foreground text-center">Front-end only for now. We will wire API calls next.</div>
    </div>
  );
}
