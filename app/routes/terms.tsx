import { Link } from "react-router";
import { Badge } from "~/components/ui/badge";
import { ArrowLeft, Scale, AlertCircle, FileText, CheckCircle } from "lucide-react";
import { Button } from "~/components/ui/button";

export function meta() {
  return [
    { title: "Terms of Service — Resumint" },
    {
      name: "description",
      content:
        "Plain-language terms of service for Resumint resume builder, including service scope and educational ATS disclaimer.",
    },
    { property: "og:title", content: "Terms of Service — Resumint" },
    {
      property: "og:description",
      content:
        "Read the terms of use for Resumint open-source resume builder, covering data rights, fair use, and heuristic ATS disclaimer.",
    },
  ];
}

export default function Terms() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 md:py-16">
      <div className="mb-8">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Button>
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-blue-700 dark:text-blue-400 border-primary/20 bg-primary/5 font-semibold">
            Service Terms
          </Badge>
          <span className="text-xs text-muted-foreground">Last updated: October 2026</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
          Terms of Service
        </h1>
        <p className="mt-4 text-base md:text-lg text-muted-foreground">
          Straightforward terms governing your use of Resumint.
        </p>
      </div>

      {/* Legal Notice Disclaimer Banner */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 mb-8 text-xs text-amber-800 dark:text-amber-300">
        <strong>Notice:</strong> These terms are provided as template service guidelines accurate to Resumint's open-source architecture. They do not constitute formal legal counsel. If deploying for commercial enterprise operations, review with qualified legal counsel.
      </div>

      <div className="space-y-10 text-foreground text-sm md:text-base leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            1. Acceptance & Nature of Service
          </h2>
          <p className="text-muted-foreground">
            By accessing or using Resumint (either as a guest or with a registered account), you agree to these Terms. Resumint is an independent open-source web application designed to help individuals create, format, score, and export resumes using modern browser technologies and Cloudflare Workers edge computing.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            2. ATS Scoring & Career Advice Disclaimer
          </h2>
          <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-muted-foreground text-sm space-y-2">
            <p>
              <strong>Educational Heuristic Only:</strong> The Resumint Resume Checker and Job Description Matcher provide an automated, rule-based heuristic score (0–100) based on commonly accepted recruitment guidelines (single-column layouts, action verbs, quantified results, and chronological consistency).
            </p>
            <p>
              <strong>No Hiring Guarantee:</strong> Resumint does not guarantee that your resume will pass any specific corporate Applicant Tracking System (such as Workday, Taleo, Greenhouse, or Lever), nor does it guarantee job interviews or employment offers. You remain solely responsible for the truthfulness, accuracy, and presentation of your professional credentials.
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            3. Ownership of Resume Content
          </h2>
          <p className="text-muted-foreground">
            You retain 100% copyright and ownership of all resume text, biographical details, employment history, and personal data you input into Resumint. We claim no intellectual property rights over your documents.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            4. Acceptable Use
          </h2>
          <p className="text-muted-foreground">
            You agree to use Resumint in compliance with applicable laws. You agree not to:
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground">
            <li>Attempt to probe, scan, or compromise the security of Resumint servers or Cloudflare Workers APIs.</li>
            <li>Submit malicious payloads, cross-site scripting (XSS) vectors, or automated spam requests to public share links.</li>
            <li>Exceed reasonable service rate limits or engage in distributed denial-of-service attempts.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            5. Availability & Warranty Disclaimer
          </h2>
          <p className="text-muted-foreground">
            Resumint is provided on an "as-is" and "as-available" basis without warranties of any kind, either express or implied. While we strive for high edge reliability on Cloudflare's global network, we do not warrant that the service will be uninterrupted, error-free, or permanently maintained. We encourage users to maintain local JSON backups of their resumes.
          </p>
        </section>
      </div>
    </div>
  );
}
