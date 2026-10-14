import { Link } from "react-router";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  ArrowLeft,
  Sparkles,
  Globe,
  Cpu,
  ShieldCheck,
  Zap,
  HeartHandshake,
} from "lucide-react";

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export function meta() {
  return [
    { title: "About Resumint — Honest, Open-Source Resume Craft" },
    {
      name: "description",
      content:
        "Learn why Resumint was created: a zero-paywall, zero-AI-hallucination resume builder engineered for speed and ATS compliance on Cloudflare Workers.",
    },
    { property: "og:title", content: "About Resumint — Honest, Open-Source Resume Craft" },
    {
      property: "og:description",
      content:
        "The story, architecture, and principles behind Resumint: pure web craft, client-side vector PDFs, and explainable ATS checking.",
    },
  ];
}

export default function About() {
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
            Mission & Architecture
          </Badge>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
          About Resumint
        </h1>
        <p className="mt-4 text-base md:text-lg text-muted-foreground">
          Reimagining resume building with engineering honesty, privacy, and zero paywalls.
        </p>
      </div>

      <div className="space-y-12 text-foreground text-sm md:text-base leading-relaxed">
        {/* Philosophy */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            The Problem with Modern Resume Builders
          </h2>
          <p className="text-muted-foreground">
            Most online resume tools trap job seekers with deceitful patterns: promising a "free resume",
            forcing a 15-minute multi-step questionnaire, and then demanding a credit card before
            allowing a single PDF download. Worse, many inject complex multi-column tables, text boxes,
            or graphical bars that choke the Applicant Tracking Systems used by recruiters.
          </p>
          <p className="text-muted-foreground">
            <strong>Resumint was built as an antidote to this friction.</strong> You jump straight into the
            editor with zero registration, see an instant live preview, test your content against an
            explainable heuristic checklist, and export crisp vector PDFs completely free.
          </p>
        </section>

        {/* Guiding Principles */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Our Core Principles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-border/60 bg-card p-6 shadow-xs">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-foreground mb-1">Zero Paywalls, Zero Tricks</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                No credit card forms, no surprise charges, no trial subscriptions, and no watermarks on your PDF.
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-6 shadow-xs">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-foreground mb-1">Guest-First Craft</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                You can write, format, test, and export without ever creating an account. Sign-up is strictly optional.
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-6 shadow-xs">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-foreground mb-1">True ATS Compliance</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Strict single-column semantic HTML markup. Real headings, clean lists, and no nested tables.
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-6 shadow-xs">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-foreground mb-1">Privacy & Data Sovereignty</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Zero third-party trackers, zero AI model training on your resumes, and full one-click data deletion.
              </p>
            </div>
          </div>
        </section>

        {/* Technical Stack */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            The Modern Edge Stack
          </h2>
          <p className="text-muted-foreground">
            Resumint is engineered to run at the edge with near-zero latency and high efficiency:
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground text-sm">
            <li><strong>Framework:</strong> React Router v7 on Cloudflare Workers runtime.</li>
            <li><strong>Database:</strong> Cloudflare D1 distributed serverless SQL with Drizzle ORM.</li>
            <li><strong>Authentication:</strong> Better Auth with WebCrypto PBKDF2 password hashing.</li>
            <li><strong>Styling:</strong> Tailwind CSS v4, shadcn/ui accessible components, and modern typography.</li>
            <li><strong>PDF Export:</strong> Client-side paged media CSS print engine (@page format).</li>
            <li><strong>ATS Engine:</strong> 100% client-side deterministic rule checker and job keyword tokenizer.</li>
          </ul>
        </section>

        {/* Open Source & Links */}
        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center space-y-4">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            Open Source & Transparent
          </h2>
          <p className="text-foreground/80 text-sm max-w-xl mx-auto">
            Resumint is completely open source under the MIT License. Contributions, feedback, and
            bug reports are welcome on GitHub.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <a
              href="https://github.com/Faizanshaikh12/Resumint"
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="outline" className="gap-2 font-medium">
                <GithubIcon className="h-4 w-4" /> View on GitHub
              </Button>
            </a>
            <a
              href="https://github.com/Faizanshaikh12"
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="outline" className="gap-2 font-medium">
                <Globe className="h-4 w-4" /> Developer Portfolio
              </Button>
            </a>
            <Link to="/build">
              <Button className="gap-2 font-semibold shadow-xs">
                Build a Resume <Zap className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
