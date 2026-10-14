export const PAST_ACTION_VERBS = new Set([
  "accelerated", "achieved", "acquired", "adapted", "administered", "advised",
  "advocated", "allocated", "analyzed", "appraised", "architected", "arranged",
  "assembled", "assessed", "audited", "automated", "balanced", "boosted",
  "briefed", "budgeted", "built", "calculated", "calibrated", "capitalized",
  "cataloged", "centralized", "championed", "charted", "clarified", "classified",
  "coached", "collaborated", "compiled", "completed", "composed", "computed",
  "conceived", "conducted", "configured", "consolidated", "constructed", "consulted",
  "converted", "coordinated", "counseled", "crafted", "created", "cultivated",
  "customized", "debugged", "decentralized", "decreased", "defined", "delegated",
  "delivered", "demonstrated", "deployed", "designed", "detailed", "determined",
  "developed", "devised", "diagnosed", "directed", "discovered", "dispatched",
  "distributed", "documented", "doubled", "drafted", "drove", "earned",
  "eliminated", "enabled", "enacted", "encouraged", "engineered", "enhanced",
  "enlarged", "enlisted", "ensured", "established", "estimated", "evaluated",
  "examined", "executed", "expanded", "expedited", "experimented", "explained",
  "explored", "extracted", "fabricated", "facilitated", "fashioned", "finalized",
  "forecasted", "formulated", "fostered", "founded", "fulfilled", "gained",
  "gathered", "generated", "governed", "guided", "halted", "handled",
  "harmonized", "headed", "heightened", "hired", "identified", "illustrated",
  "implemented", "improved", "improvised", "increased", "indexed", "influenced",
  "informed", "initiated", "innovated", "inspected", "inspired", "installed",
  "instituted", "instructed", "integrated", "intensified", "interpreted", "interviewed",
  "introduced", "invented", "investigated", "isolated", "launched", "lead",
  "lectured", "led", "leveraged", "licensed", "lobbied", "localized",
  "located", "magnified", "maintained", "managed", "mapped", "marketed",
  "mastered", "maximized", "measured", "mediated", "mentored", "merged",
  "migrated", "minimized", "modeled", "moderated", "modernized", "modified",
  "monitored", "motivated", "navigated", "negotiated", "nurtured", "obtained",
  "operated", "optimized", "orchestrated", "organized", "originated", "outperformed",
  "overhauled", "oversaw", "partnered", "performed", "persuaded", "piloted",
  "pioneered", "planned", "positioned", "prepared", "presented", "presided",
  "prioritized", "produced", "programmed", "projected", "promoted", "proposed",
  "provided", "published", "purchased", "quantified", "raised", "rated",
  "realigned", "rebuilt", "reclaimed", "reconciled", "recorded", "recruited",
  "redesigned", "reduced", "refactored", "refined", "refocused", "reformed",
  "regulated", "rehabilitated", "reinforced", "remodeled", "rendered", "renegotiated",
  "reorganized", "replaced", "repositioned", "represented", "researched", "resolved",
  "restored", "restructured", "retrieved", "revamped", "reviewed", "revitalized",
  "routed", "saved", "scaled", "scheduled", "screened", "scrutinized",
  "secured", "selected", "separated", "served", "shaped", "simplified",
  "slashed", "solidified", "solved", "spearheaded", "specialized", "specified",
  "standardized", "stimulated", "strategized", "streamlined", "strengthened", "structured",
  "supervised", "supplemented", "supported", "surpassed", "surveyed", "sustained",
  "synthesized", "systematized", "targeted", "taught", "tested", "tracked",
  "trained", "transcribed", "transformed", "translated", "transported", "tripled",
  "troubleshot", "unified", "unlocked", "updated", "upgraded", "utilized",
  "validated", "valued", "verified", "visualized", "widened", "won", "yielded"
]);

export const PRESENT_ACTION_VERBS = new Set([
  "accelerate", "achieve", "acquire", "adapt", "administer", "advise",
  "advocate", "allocate", "analyze", "architect", "arrange", "assemble",
  "assess", "audit", "automate", "balance", "boost", "brief",
  "budget", "build", "calculate", "calibrate", "centralize", "champion",
  "chart", "clarify", "classify", "coach", "collaborate", "compile",
  "complete", "compose", "compute", "conceive", "conduct", "configure",
  "consolidate", "construct", "consult", "convert", "coordinate", "counsel",
  "craft", "create", "cultivate", "customize", "debug", "decrease",
  "define", "delegate", "deliver", "demonstrate", "deploy", "design",
  "detail", "determine", "develop", "devise", "diagnose", "direct",
  "discover", "dispatch", "distribute", "document", "draft", "drive",
  "earn", "eliminate", "enable", "enact", "encourage", "engineer",
  "enhance", "ensure", "establish", "estimate", "evaluate", "examine",
  "execute", "expand", "expedite", "experiment", "explain", "explore",
  "extract", "fabricate", "facilitate", "fashion", "finalize", "forecast",
  "formulate", "foster", "found", "fulfill", "gain", "gather",
  "generate", "govern", "guide", "halt", "handle", "harmonize",
  "head", "hire", "identify", "illustrate", "implement", "improve",
  "increase", "index", "influence", "inform", "initiate", "innovate",
  "inspect", "inspire", "install", "institute", "instruct", "integrate",
  "intensify", "interpret", "interview", "introduce", "invent", "investigate",
  "launch", "lead", "lecture", "leverage", "license", "locate",
  "maintain", "manage", "map", "market", "master", "maximize",
  "measure", "mediate", "mentor", "merge", "migrate", "minimize",
  "model", "moderate", "modernize", "modify", "monitor", "motivate",
  "navigate", "negotiate", "nurture", "obtain", "operate", "optimize",
  "orchestrate", "organize", "originate", "outperform", "overhaul", "oversee",
  "partner", "perform", "persuade", "pilot", "pioneer", "plan",
  "position", "prepare", "present", "preside", "prioritize", "produce",
  "program", "project", "promote", "propose", "provide", "publish",
  "quantify", "raise", "rate", "realign", "rebuild", "reconcile",
  "record", "recruit", "redesign", "reduce", "refactor", "refine",
  "regulate", "reinforce", "remodel", "render", "reorganize", "replace",
  "research", "resolve", "restore", "restructure", "retrieve", "revamp",
  "review", "revitalize", "route", "save", "scale", "schedule",
  "screen", "secure", "select", "serve", "shape", "simplify",
  "slash", "solve", "spearhead", "standardize", "stimulate", "strategize",
  "streamline", "strengthen", "structure", "supervise", "support", "surpass",
  "survey", "synthesize", "systematize", "target", "teach", "test",
  "track", "train", "transform", "translate", "troubleshoot", "unify",
  "update", "upgrade", "utilize", "validate", "verify", "visualize", "yield"
]);

export const WEAK_OPENING_PHRASES = [
  "responsible for",
  "helped with",
  "worked on",
  "assisted with",
  "tasked with",
  "duties included",
  "in charge of",
  "handled the",
  "helped to",
  "served as",
  "was responsible for",
  "participated in",
  "contributed to"
];

export function isActionVerb(word: string, isCurrentRole = false): {
  isValid: boolean;
  tense: "past" | "present" | "unknown";
} {
  const clean = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!clean) return { isValid: false, tense: "unknown" };

  if (PAST_ACTION_VERBS.has(clean)) {
    return { isValid: true, tense: "past" };
  }

  if (PRESENT_ACTION_VERBS.has(clean)) {
    return { isValid: true, tense: "present" };
  }

  // Common regular past-tense ending heuristic if length > 4
  if (clean.endsWith("ed") && clean.length > 4) {
    return { isValid: true, tense: "past" };
  }

  return { isValid: false, tense: "unknown" };
}
