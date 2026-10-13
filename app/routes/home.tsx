import { Link } from "react-router";
import type { Route } from "./+types/home";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { ArrowRight, Sparkles, ShieldCheck, Download, LayoutTemplate } from "lucide-react";

export function meta() {
  return [
    { title: "Resumint — Accurate, ATS-Friendly Resume Builder" },
    {
      name: "description",
      content:
        "Build, customize, and export high-impact resumes instantly with zero upfront sign-up friction.",
    },
  ];
}

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-16 md:py-28 px-4 text-center bg-radial from-primary/5 via-background to-background">
        <div className="container mx-auto max-w-4xl flex flex-col items-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Pure Craft. Zero AI Hallucinations. 100% Free to Start.</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-foreground max-w-3xl leading-tight">
            The Accurate, Zero-Friction <span className="text-primary">Resume Builder</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Craft beautiful, ATS-optimized resumes right in your browser. Jump straight into the
            editor without sign-up friction, customize your design, and export pixel-perfect PDFs.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Link to="/resumes/new">
              <Button size="lg" className="h-12 px-8 text-base font-semibold gap-2 shadow-md">
                Start Building Resume <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="h-12 px-6 text-base">
                Explore Features
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section
        id="features"
        className="w-full py-16 md:py-24 border-t border-border/40 bg-muted/10 px-4"
      >
        <div className="container mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Built for Speed, Privacy, and Results
            </h2>
            <p className="mt-4 text-muted-foreground">
              Everything you need to land your next interview, engineered with modern web standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="transition-all hover:shadow-md hover:border-primary/30">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <LayoutTemplate className="h-5 w-5" />
                </div>
                <CardTitle>Guest-First Editing</CardTitle>
                <CardDescription>
                  Start creating immediately without a mandatory login barrier. Edits are safely
                  stored in your browser draft.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                When you are ready to save or share, sign up in place with zero lost keystrokes or
                annoying page reloads.
              </CardContent>
            </Card>

            <Card className="transition-all hover:shadow-md hover:border-primary/30">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <CardTitle>ATS-Compliant Hierarchy</CardTitle>
                <CardDescription>
                  Real semantic HTML with structured typography, ensuring Applicant Tracking Systems
                  read every word flawlessly.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Unit-tested rule checklists examine action verbs, quantified achievements, and
                standard date formatting.
              </CardContent>
            </Card>

            <Card className="transition-all hover:shadow-md hover:border-primary/30">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <Download className="h-5 w-5" />
                </div>
                <CardTitle>Client-Side PDF Export</CardTitle>
                <CardDescription>
                  High-fidelity @page print styling generates identical PDFs in milliseconds without
                  heavy server overhead.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Export directly to standard A4 and Letter formats anytime, completely free of
                charge.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
