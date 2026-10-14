import { Link } from "react-router";
import { Badge } from "~/components/ui/badge";
import { ShieldCheck, Lock, Cookie, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "~/components/ui/button";

export function meta() {
  return [
    { title: "Privacy Policy — Resumint" },
    {
      name: "description",
      content:
        "Transparent, plain-language privacy policy explaining data storage, cookies, and our zero-tracking, zero-AI commitment.",
    },
    { property: "og:title", content: "Privacy Policy — Resumint" },
    {
      property: "og:description",
      content:
        "Learn how Resumint handles your resume data with complete privacy, zero third-party trackers, and full data deletion rights.",
    },
  ];
}

export default function Privacy() {
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
            Legal Transparency
          </Badge>
          <span className="text-xs text-muted-foreground">Last updated: October 2026</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
          Privacy Policy
        </h1>
        <p className="mt-4 text-base md:text-lg text-muted-foreground">
          We believe resume creation should be private, secure, and free from invasive tracking.
        </p>
      </div>

      {/* Legal Notice Disclaimer Banner */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 mb-8 text-xs text-amber-800 dark:text-amber-300">
        <strong>Notice:</strong> This privacy policy is provided as template disclosure text accurate to Resumint's open-source architecture. It does not constitute formal legal counsel. If operating Resumint for commercial purposes, review with qualified legal counsel.
      </div>

      <div className="space-y-10 text-foreground text-sm md:text-base leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            1. Guest Mode & Local Storage
          </h2>
          <p className="text-muted-foreground">
            When you build a resume on Resumint without an account (at <code className="text-xs font-mono font-medium text-foreground bg-muted border border-border/40 px-1.5 py-0.5 rounded">/build</code>), your resume content is stored exclusively in your browser's <code className="text-xs font-mono font-medium text-foreground bg-muted border border-border/40 px-1.5 py-0.5 rounded">localStorage</code> under the key <code className="text-xs font-mono font-medium text-foreground bg-muted border border-border/40 px-1.5 py-0.5 rounded">resumint_guest_draft</code>.
          </p>
          <p className="text-muted-foreground">
            In guest mode, your candidate details, experience, skills, and resume design never touch our servers during editing. PDF generation is executed 100% locally on your device via standard browser print APIs.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            2. Account Mode & Cloudflare D1 Storage
          </h2>
          <p className="text-muted-foreground">
            When you create an account to save and synchronize your resumes, we store only the information necessary to provide the service:
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground">
            <li><strong>Account Identity:</strong> Your email address and display name.</li>
            <li><strong>Authentication Credentials:</strong> Passwords are cryptographically salted and hashed using WebCrypto PBKDF2 with 100,000 iterations. We cannot view or recover plain-text passwords.</li>
            <li><strong>Resume Documents:</strong> Structured JSON representations of your resume sections, version snapshots (up to 20 per document), and styling preferences.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Cookie className="h-5 w-5 text-primary" />
            3. Cookies & Session Storage
          </h2>
          <p className="text-muted-foreground">
            Resumint uses strictly functional, first-party cookies necessary for authentication and security. We do not use advertising or cross-site tracking cookies.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-border/60 rounded-lg">
              <thead className="bg-muted text-foreground uppercase font-semibold">
                <tr>
                  <th className="p-3">Cookie Name</th>
                  <th className="p-3">Purpose</th>
                  <th className="p-3">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-muted-foreground">
                <tr>
                  <td className="p-3 font-mono font-medium text-foreground">better-auth.session_token</td>
                  <td className="p-3">Authenticates your session to access protected dashboard routes.</td>
                  <td className="p-3">Session / Rolling</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-medium text-foreground">rv_[slug]</td>
                  <td className="p-3">Deduplicates public share page view counts without storing IP addresses or PII.</td>
                  <td className="p-3">30 minutes</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-medium text-foreground">resumint_unlocked_[slug]</td>
                  <td className="p-3">HMAC-signed proof of password unlock for password-protected shared resumes.</td>
                  <td className="p-3">2 hours</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            4. Share via Link & Visibility
          </h2>
          <p className="text-muted-foreground">
            When you choose to enable the <strong>Share via Link</strong> feature, a random cryptographic slug is generated (e.g., <code className="text-xs font-mono font-medium text-foreground bg-muted border border-border/40 px-1.5 py-0.5 rounded">/r/[slug]</code>). Shared resumes carry strict <code className="text-xs font-mono font-medium text-foreground bg-muted border border-border/40 px-1.5 py-0.5 rounded">X-Robots-Tag: noindex, nofollow</code> headers and robots meta tags so search engines do not crawl your resume.
          </p>
          <p className="text-muted-foreground">
            You can add an optional password, set an automatic expiration date, or revoke the link at any time from your dashboard or editor.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-primary" />
            5. Data Export & Permanent Deletion
          </h2>
          <p className="text-muted-foreground">
            You maintain full sovereignty over your data:
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground">
            <li><strong>Download All Data:</strong> You can export every resume in standard JSON format in one click under your account Settings.</li>
            <li><strong>Permanent Account Deletion:</strong> You can permanently delete your account at any time under Settings. Deletion immediately triggers a database cascade that completely erases your user record, all resumes, all version snapshots, all share links, and all active sessions.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            6. Artificial Intelligence & Third-Party Sharing
          </h2>
          <p className="text-muted-foreground">
            Resumint does not sell, rent, or monetize your resume data. We do not use third-party analytics trackers (such as Google Analytics or Facebook Pixel). We do not feed your resume text or job descriptions into third-party AI models (OpenAI, Anthropic, etc.). The ATS Checker runs 100% locally using deterministic wordlist heuristics.
          </p>
        </section>
      </div>
    </div>
  );
}
