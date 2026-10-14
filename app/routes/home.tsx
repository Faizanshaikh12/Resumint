import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import type { Route } from "./+types/home";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Download,
  LayoutTemplate,
  Share2,
  CheckCircle2,
  Zap,
  ChevronDown,
  Lock,
  Layers,
  FileCheck2,
} from "lucide-react";
import { TEMPLATES } from "~/components/templates/registry";
import { createDeveloperSample } from "~/lib/resume/samples";
import type { TemplateId } from "~/lib/schemas/resume";

export function meta() {
  return [
    { title: "Resumint — Fast, Honest, ATS-Friendly Resume Builder" },
    {
      name: "description",
      content:
        "Build, style, and export ATS-ready resumes in minutes. Zero sign-up barrier, 5 ATS-compliant templates, real-time checklist score, and client-side vector PDF export.",
    },
    { property: "og:title", content: "Resumint — Fast, Honest, ATS-Friendly Resume Builder" },
    {
      property: "og:description",
      content:
        "Build, style, and export ATS-ready resumes in minutes with zero upfront login friction, explainable ATS checks, and client-side PDF export.",
    },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://resumint.dev" },
    { property: "og:image", content: "/og-image.png" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "Resumint — Fast, Honest, ATS-Friendly Resume Builder" },
    {
      name: "twitter:description",
      content:
        "Build, style, and export ATS-ready resumes in minutes with zero upfront login friction, explainable ATS checks, and client-side PDF export.",
    },
    { name: "twitter:image", content: "/og-image.png" },
  ];
}

export default function Home() {
  const [searchParams] = useSearchParams();
  const accountDeleted = searchParams.get("deleted") === "true";
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("modern");
  const sampleData = useMemo(() => createDeveloperSample(), []);
  const activeTemplateDef = TEMPLATES[selectedTemplate];
  const ActiveComponent = activeTemplateDef.Component;

  // Render sample with the selected template's default design merged with sample content
  const previewDesign = {
    ...sampleData.design,
    ...activeTemplateDef.defaultDesign,
    templateId: selectedTemplate,
  };

  return (
    <div className="flex flex-col items-center overflow-x-hidden">
      {/* Account Deletion Confirmation Banner */}
      {accountDeleted && (
        <div
          role="status"
          data-testid="account-deleted-banner"
          className="w-full bg-emerald-500/10 border-b border-emerald-500/30 text-emerald-800 dark:text-emerald-300 py-3 px-4 text-center text-sm font-medium"
        >
          Your account and all associated data have been permanently deleted.
        </div>
      )}

      {/* Hero Section */}
      <section className="w-full py-16 md:py-28 px-4 text-center bg-radial from-primary/10 via-background to-background border-b border-border/40">
        <div className="container mx-auto max-w-4xl flex flex-col items-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 mb-6 shadow-xs">
            <Sparkles className="h-3.5 w-3.5" />
            <span>100% Free · No Sign-Up Barrier · Heuristic ATS Score · Client-Side PDF</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-foreground max-w-3xl leading-tight">
            The Fast, Honest, <span className="text-primary">ATS-Friendly</span> Resume Builder
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Craft clean, ATS-parsed resumes in minutes right in your browser. Jump straight into the
            editor with zero sign-up friction, test with an explainable 0-100 checklist, and export
            pixel-perfect vector PDFs.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center w-full max-w-md">
            <Link to="/build" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto h-12 px-8 text-base font-semibold gap-2 shadow-md"
                data-testid="hero-build-cta"
              >
                Build your resume <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto h-12 px-8 text-base font-medium"
                data-testid="hero-login-cta"
              >
                Log in
              </Button>
            </Link>
          </div>

          {/* Key Value Points */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl text-left border-t border-border/40 pt-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Zero mandatory sign-up</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>5 ATS-compliant templates</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>0-100 rule checklist</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Local vector PDF export</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works (3 Steps) */}
      <section className="w-full py-20 px-4 bg-muted/20 border-b border-border/40">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="mb-3 font-semibold text-blue-700 dark:text-blue-400 border-primary/20 bg-primary/5">
              Streamlined Workflow
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              How Resumint Works in 3 Steps
            </h2>
            <p className="mt-4 text-muted-foreground text-base">
              No bloated wizards or paywalled surprise fees. Straightforward, professional resume creation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="flex flex-col bg-card rounded-2xl border border-border/60 p-8 shadow-xs relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg mb-6 shadow-xs">
                1
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Build or Import</h3>
              <p className="text-muted-foreground dark:text-slate-300 text-sm leading-relaxed mb-4">
                Start fresh immediately in guest mode or import your existing JSON backup. All progress
                is automatically persisted in your local browser storage.
              </p>
              <div className="mt-auto pt-4 border-t border-border/40 text-xs text-muted-foreground flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span>Zero account barrier to start</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col bg-card rounded-2xl border border-border/60 p-8 shadow-xs relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg mb-6 shadow-xs">
                2
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Refine, Style & Score</h3>
              <p className="text-muted-foreground dark:text-slate-300 text-sm leading-relaxed mb-4">
                Switch between 5 ATS-safe templates, tune typography and margins, and run our
                heuristic 0-100 ATS checklist and job description keyword matcher.
              </p>
              <div className="mt-auto pt-4 border-t border-border/40 text-xs text-muted-foreground flex items-center gap-1.5">
                <FileCheck2 className="h-3.5 w-3.5 text-primary" />
                <span>Explainable rule-based scoring</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col bg-card rounded-2xl border border-border/60 p-8 shadow-xs relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg mb-6 shadow-xs">
                3
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Export & Share</h3>
              <p className="text-muted-foreground dark:text-slate-300 text-sm leading-relaxed mb-4">
                Generate high-resolution vector PDFs via browser @page CSS printing, download JSON
                backups, or publish a secret password-protected share link.
              </p>
              <div className="mt-auto pt-4 border-t border-border/40 text-xs text-muted-foreground flex items-center gap-1.5">
                <Share2 className="h-3.5 w-3.5 text-primary" />
                <span>Clean PDFs & secret link sharing</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Template Showcase */}
      <section id="templates" className="w-full py-20 px-4 border-b border-border/40">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="outline" className="mb-3 font-semibold text-blue-700 dark:text-blue-400 border-primary/20 bg-primary/5">
              ATS-Optimized Templates
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              5 Templates Built for Scanning Algorithms
            </h2>
            <p className="mt-4 text-muted-foreground text-base">
              Every template is single-column, strictly semantic HTML with valid heading hierarchy.
              No complex tables, text boxes, or unparseable columns.
            </p>
          </div>

          {/* Template Selector Tabs */}
          <div
            role="tablist"
            aria-label="Resume Templates"
            className="flex flex-wrap justify-center gap-2 mb-10"
          >
            {(Object.keys(TEMPLATES) as TemplateId[]).map((tmplId) => {
              const tmpl = TEMPLATES[tmplId];
              const isSelected = selectedTemplate === tmplId;
              return (
                <button
                  key={tmplId}
                  role="tab"
                  aria-selected={isSelected}
                  id={`tab-${tmplId}`}
                  aria-controls={`panel-${tmplId}`}
                  onClick={() => setSelectedTemplate(tmplId)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all border ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background text-muted-foreground border-border/80 hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {tmpl.name}
                </button>
              );
            })}
          </div>

          {/* Template Detail and Live Preview Container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Template Information */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-card rounded-2xl border border-border/60 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-foreground">{activeTemplateDef.name}</h3>
                  <Badge variant="secondary" className="font-mono text-xs uppercase">
                    {activeTemplateDef.id}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                  {activeTemplateDef.description}
                </p>

                <div className="space-y-4 border-t border-border/40 pt-4 mb-6">
                  <div>
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                      ATS Parsing Compatibility
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {activeTemplateDef.atsNotes}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                      Typography & Accent
                    </h4>
                    <p className="text-xs text-muted-foreground capitalize">
                      {activeTemplateDef.defaultDesign.fontFamily?.replace("-", " ")} ·{" "}
                      {activeTemplateDef.defaultDesign.accentColor}
                    </p>
                  </div>
                </div>

                <Link to={`/build?template=${selectedTemplate}`} className="w-full block">
                  <Button className="w-full gap-2 font-semibold">
                    Use This Template <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {/* Integrity Callout */}
              <div className="rounded-xl border border-border/40 bg-muted/30 p-5 text-xs text-muted-foreground leading-relaxed">
                <div className="flex items-center gap-2 font-semibold text-foreground mb-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>Semantic HTML Guarantee</span>
                </div>
                Resumint templates render real &lt;section&gt;, &lt;h1&gt;, &lt;h2&gt;, and &lt;article&gt; tags,
                guaranteeing recruitment parsers extract jobs, skills, and dates accurately.
              </div>
            </div>

            {/* Live-Rendered Sample Preview */}
            <div
              id={`panel-${selectedTemplate}`}
              role="tabpanel"
              aria-labelledby={`tab-${selectedTemplate}`}
              className="lg:col-span-8 flex justify-center bg-muted/40 rounded-2xl border border-border/60 p-4 sm:p-8 shadow-inner overflow-hidden"
            >
              <div className="relative w-full max-w-[580px] bg-white text-slate-900 rounded-lg shadow-xl border border-border/40 overflow-hidden transform transition-all duration-300">
                {/* Visual Scale Frame */}
                <div
                  inert={true}
                  aria-hidden="true"
                  className="p-6 text-[11px] leading-snug select-none pointer-events-none"
                >
                  <ActiveComponent content={sampleData.content} design={previewDesign} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights (Real Features Only) */}
      <section id="features" className="w-full py-20 px-4 bg-muted/10 border-b border-border/40">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="mb-3 font-semibold text-blue-700 dark:text-blue-400 border-primary/20 bg-primary/5">
              Core Capabilities
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Engineered for Speed, Privacy, and Impact
            </h2>
            <p className="mt-4 text-muted-foreground text-base">
              Every tool inside Resumint is focused on getting you noticed by hiring managers, without
              tracking scripts or corporate bloat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="flex flex-col bg-card rounded-2xl border border-border/60 p-6 shadow-xs transition-all hover:shadow-md hover:border-primary/40">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                <LayoutTemplate className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">5 ATS-Safe Templates</h3>
              <p className="text-sm text-muted-foreground dark:text-slate-300 leading-relaxed">
                Modern, Classic, Minimal, Executive, and Technical templates built to pass standard
                applicant tracking systems without layout confusion.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col bg-card rounded-2xl border border-border/60 p-6 shadow-xs transition-all hover:shadow-md hover:border-primary/40">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Rule-Based ATS Checklist</h3>
              <p className="text-sm text-muted-foreground dark:text-slate-300 leading-relaxed">
                Deterministic 0-100 score analyzing essential contact fields, action verbs, quantified
                metrics, chronological dates, and formatting consistency.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col bg-card rounded-2xl border border-border/60 p-6 shadow-xs transition-all hover:shadow-md hover:border-primary/40">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Download className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Client-Side Vector PDF</h3>
              <p className="text-sm text-muted-foreground dark:text-slate-300 leading-relaxed">
                Generate crisp A4 and US Letter PDFs locally via @page CSS print rules in milliseconds.
                No server queues, no timeouts, and zero data leakage.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="flex flex-col bg-card rounded-2xl border border-border/60 p-6 shadow-xs transition-all hover:shadow-md hover:border-primary/40">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Share2 className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Secret Share via Link</h3>
              <p className="text-sm text-muted-foreground dark:text-slate-300 leading-relaxed">
                Publish a read-only live link with optional password protection, custom expiration
                timestamps, and privacy-preserving view counts.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="flex flex-col bg-card rounded-2xl border border-border/60 p-6 shadow-xs transition-all hover:shadow-md hover:border-primary/40">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Autosave & Local Draft</h3>
              <p className="text-sm text-muted-foreground dark:text-slate-300 leading-relaxed">
                Start crafting instantly as a guest. All edits, reordered sections, and custom themes
                persist safely in your browser with full undo/redo history.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="flex flex-col bg-card rounded-2xl border border-border/60 p-6 shadow-xs transition-all hover:shadow-md hover:border-primary/40">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Private & Data Sovereign</h3>
              <p className="text-sm text-muted-foreground dark:text-slate-300 leading-relaxed">
                Export portable JSON backups anytime, download all your data in one click, or
                permanently delete your account. No AI model training on your personal resume.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Honest FAQ Section */}
      <section id="faq" className="w-full py-20 px-4 border-b border-border/40">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="mb-3 font-semibold text-blue-700 dark:text-blue-400 border-primary/20 bg-primary/5">
              Honest Answers
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-muted-foreground text-base">
              Transparent facts about how Resumint works, what is stored, and what to expect.
            </p>
          </div>

          <div className="space-y-4">
            {/* FAQ Item 1 */}
            <details
              name="faq"
              className="group rounded-xl border border-border/60 bg-card p-6 transition-colors hover:border-primary/40"
            >
              <summary className="flex items-center justify-between cursor-pointer font-semibold text-foreground text-base list-none">
                <span>Is Resumint truly free?</span>
                <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-open:rotate-180 shrink-0 ml-2" />
              </summary>
              <div className="mt-4 text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-4">
                Yes, 100% free. There are no credit cards, no premium trial paywalls, no hidden export
                fees, and no watermarks placed on your PDF. You can build, score, customize, and export
                resumes without paying a cent.
              </div>
            </details>

            {/* FAQ Item 2 */}
            <details
              name="faq"
              className="group rounded-xl border border-border/60 bg-card p-6 transition-colors hover:border-primary/40"
            >
              <summary className="flex items-center justify-between cursor-pointer font-semibold text-foreground text-base list-none">
                <span>Do I need an account to build and export a resume?</span>
                <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-open:rotate-180 shrink-0 ml-2" />
              </summary>
              <div className="mt-4 text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-4">
                No. You can jump directly into the guest builder at <Link to="/build" className="text-primary underline">/build</Link> and immediately start typing. Your draft is automatically saved in your browser's local storage. Creating an account is only needed if you wish to manage multiple resumes or access them across different devices.
              </div>
            </details>

            {/* FAQ Item 3 */}
            <details
              name="faq"
              className="group rounded-xl border border-border/60 bg-card p-6 transition-colors hover:border-primary/40"
            >
              <summary className="flex items-center justify-between cursor-pointer font-semibold text-foreground text-base list-none">
                <span>How is my personal data stored and secured?</span>
                <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-open:rotate-180 shrink-0 ml-2" />
              </summary>
              <div className="mt-4 text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-4">
                In guest mode, your data never leaves your browser. When you create an account, your resumes and account credentials are encrypted and stored in Cloudflare D1 databases. Passwords are securely hashed with WebCrypto PBKDF2 (100,000 rounds). We do not track you, sell your data, or train artificial intelligence models on your resume content.
              </div>
            </details>

            {/* FAQ Item 4 */}
            <details
              name="faq"
              className="group rounded-xl border border-border/60 bg-card p-6 transition-colors hover:border-primary/40"
            >
              <summary className="flex items-center justify-between cursor-pointer font-semibold text-foreground text-base list-none">
                <span>Does the ATS score guarantee I will pass corporate ATS systems?</span>
                <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-open:rotate-180 shrink-0 ml-2" />
              </summary>
              <div className="mt-4 text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-4">
                No tool can guarantee job interviews or simulate every proprietary corporate ATS algorithm. Resumint's 0-100 score is an educational, explainable heuristic guide based on proven recruitment standards (clear single-column hierarchy, strong action verbs, quantified metrics, and standard date formatting). It helps you catch common oversights before you apply.
              </div>
            </details>

            {/* FAQ Item 5 */}
            <details
              name="faq"
              className="group rounded-xl border border-border/60 bg-card p-6 transition-colors hover:border-primary/40"
            >
              <summary className="flex items-center justify-between cursor-pointer font-semibold text-foreground text-base list-none">
                <span>Can I export all my data or delete my account?</span>
                <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-open:rotate-180 shrink-0 ml-2" />
              </summary>
              <div className="mt-4 text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-4">
                Yes. Under your account Settings, you can download all your resumes in standard JSON format in one click. You can also permanently delete your account at any time, which immediately cascades and erases all your resumes, snapshots, share links, and session tokens.
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="w-full py-20 px-4 bg-radial from-primary/15 via-background to-background text-center">
        <div className="container mx-auto max-w-3xl flex flex-col items-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Ready to Build an ATS-Ready Resume?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl">
            Start building in your browser right now. No credit card, no registration barrier, and no
            delays.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center">
            <Link to="/build">
              <Button size="lg" className="h-12 px-8 text-base font-semibold gap-2 shadow-md">
                Build your resume now <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
