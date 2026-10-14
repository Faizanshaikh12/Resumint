import type { AtsContext, AtsRule, Check } from "../types";
import { SAMPLE_PLACEHOLDER_STRINGS } from "../data/placeholders";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_DIGITS_REGEX = /\d/g;

export const contactRules: AtsRule = (ctx: AtsContext): Check[] => {
  const checks: Check[] = [];
  const personal = ctx.content.personal;

  // 1. Name present (Weight: 4)
  const name = personal?.name?.trim() || "";
  const isNamePlaceholder =
    name.toLowerCase() === "your name" ||
    name.toLowerCase() === "first last" ||
    name.toLowerCase() === "firstname lastname";

  if (!name || isNamePlaceholder) {
    checks.push({
      id: "contact-name",
      category: "contact",
      weight: 4,
      status: "fail",
      credit: 0,
      title: "Full name",
      message: isNamePlaceholder
        ? "Placeholder name detected ('Your Name')."
        : "No full name found in your contact information.",
      fix: "Enter your full name at the top of your resume.",
      targets: [{ sectionId: "personal", field: "name" }],
    });
  } else {
    checks.push({
      id: "contact-name",
      category: "contact",
      weight: 4,
      status: "pass",
      credit: 1,
      title: "Full name",
      message: `Full name is present (${name}).`,
      targets: [{ sectionId: "personal", field: "name" }],
    });
  }

  // 2. Email format (Weight: 4)
  const email = personal?.email?.trim() || "";
  const isEmailPlaceholder =
    email.includes("example.com") || email.includes("your.email");

  if (!email || isEmailPlaceholder) {
    checks.push({
      id: "contact-email",
      category: "contact",
      weight: 4,
      status: isEmailPlaceholder ? "warn" : "fail",
      credit: 0,
      title: "Email address",
      message: isEmailPlaceholder
        ? "Sample placeholder email detected (example.com)."
        : "No email address found.",
      fix: "Add a genuine professional email address so recruiters can contact you.",
      targets: [{ sectionId: "personal", field: "email" }],
    });
  } else if (!EMAIL_REGEX.test(email)) {
    checks.push({
      id: "contact-email",
      category: "contact",
      weight: 4,
      status: "warn",
      credit: 0.5,
      title: "Email address format",
      message: `Email address "${email}" may not be properly formatted.`,
      fix: "Ensure your email has a valid user@domain.com format.",
      targets: [{ sectionId: "personal", field: "email" }],
    });
  } else {
    checks.push({
      id: "contact-email",
      category: "contact",
      weight: 4,
      status: "pass",
      credit: 1,
      title: "Email address",
      message: "Valid email address provided.",
      targets: [{ sectionId: "personal", field: "email" }],
    });
  }

  // 3. Phone plausible (Weight: 2)
  const phone = personal?.phone?.trim() || "";
  const isPhonePlaceholder =
    phone.includes("555-0123") ||
    phone.includes("555-0199") ||
    phone.includes("555-5555");
  const phoneDigits = (phone.match(PHONE_DIGITS_REGEX) || []).length;

  if (!phone || isPhonePlaceholder) {
    checks.push({
      id: "contact-phone",
      category: "contact",
      weight: 2,
      status: "warn",
      credit: 0,
      title: "Phone number",
      message: isPhonePlaceholder
        ? "Placeholder phone number detected."
        : "No phone number listed.",
      fix: "Add a real phone number with area code for recruiter phone screens.",
      targets: [{ sectionId: "personal", field: "phone" }],
    });
  } else if (phoneDigits < 7) {
    checks.push({
      id: "contact-phone",
      category: "contact",
      weight: 2,
      status: "warn",
      credit: 0.5,
      title: "Phone number validity",
      message: "Phone number has fewer than 7 digits.",
      fix: "Provide a complete phone number with area code.",
      targets: [{ sectionId: "personal", field: "phone" }],
    });
  } else {
    checks.push({
      id: "contact-phone",
      category: "contact",
      weight: 2,
      status: "pass",
      credit: 1,
      title: "Phone number",
      message: "Valid phone number provided.",
      targets: [{ sectionId: "personal", field: "phone" }],
    });
  }

  // 4. Location present (Weight: 2)
  const location = personal?.location?.trim() || "";
  const isLocationPlaceholder =
    location.toLowerCase() === "city, state" ||
    location.toLowerCase() === "city, st" ||
    location.toLowerCase() === "anytown, usa";

  if (!location || isLocationPlaceholder) {
    checks.push({
      id: "contact-location",
      category: "contact",
      weight: 2,
      status: "warn",
      credit: 0,
      title: "Location",
      message: isLocationPlaceholder
        ? "Placeholder location text detected."
        : "No city or location specified.",
      fix: "Add your city and state/country (e.g., 'Austin, TX' or 'London, UK'). Street address is not needed.",
      targets: [{ sectionId: "personal", field: "location" }],
    });
  } else {
    checks.push({
      id: "contact-location",
      category: "contact",
      weight: 2,
      status: "pass",
      credit: 1,
      title: "Location",
      message: `Location specified (${location}).`,
      targets: [{ sectionId: "personal", field: "location" }],
    });
  }

  // 5. Links are well-formed https URLs (Weight: 2)
  const links = personal?.links || [];
  if (links.length > 0) {
    const invalidLinks: string[] = [];
    const nonHttpsLinks: string[] = [];

    for (const link of links) {
      const url = link.url?.trim() || "";
      if (!url) continue;
      if (!/^https?:\/\//i.test(url)) {
        invalidLinks.push(url);
      } else if (!/^https:\/\//i.test(url)) {
        nonHttpsLinks.push(url);
      }
    }

    if (invalidLinks.length > 0) {
      checks.push({
        id: "contact-links",
        category: "contact",
        weight: 2,
        status: "warn",
        credit: 0.5,
        title: "Web links",
        message: `Some links are missing protocol (${invalidLinks[0]}).`,
        fix: "Add 'https://' prefix to all personal links (e.g. LinkedIn, GitHub, portfolio).",
        targets: [{ sectionId: "personal", field: "links" }],
      });
    } else if (nonHttpsLinks.length > 0) {
      checks.push({
        id: "contact-links",
        category: "contact",
        weight: 2,
        status: "warn",
        credit: 0.75,
        title: "Secure links (HTTPS)",
        message: "Some links use unencrypted http:// instead of https://.",
        fix: "Use secure https:// URLs for your external links.",
        targets: [{ sectionId: "personal", field: "links" }],
      });
    } else {
      checks.push({
        id: "contact-links",
        category: "contact",
        weight: 2,
        status: "pass",
        credit: 1,
        title: "Web links",
        message: "All links are well-formed secure https:// URLs.",
        targets: [{ sectionId: "personal", field: "links" }],
      });
    }
  } else {
    // Links are optional, neutral pass
    checks.push({
      id: "contact-links",
      category: "contact",
      weight: 2,
      status: "pass",
      credit: 1,
      title: "Web links",
      message: "No invalid links detected.",
      targets: [{ sectionId: "personal", field: "links" }],
    });
  }

  // 6. No placeholder values in contact (Weight: 1)
  const placeholderHits: string[] = [];
  const checkPlaceholder = (val: string | undefined, label: string) => {
    if (!val) return;
    const lower = val.toLowerCase().trim();
    for (const p of SAMPLE_PLACEHOLDER_STRINGS) {
      if (lower === p || (p.length > 5 && lower.includes(p))) {
        placeholderHits.push(label);
        break;
      }
    }
  };

  checkPlaceholder(personal?.name, "Name");
  checkPlaceholder(personal?.email, "Email");
  checkPlaceholder(personal?.phone, "Phone");
  checkPlaceholder(personal?.location, "Location");

  if (placeholderHits.length > 0) {
    checks.push({
      id: "contact-placeholders",
      category: "contact",
      weight: 1,
      status: "fail",
      credit: 0,
      title: "Contact placeholder text",
      message: `Sample or placeholder text detected in: ${placeholderHits.join(", ")}.`,
      fix: "Replace template sample values with your genuine contact details.",
      targets: [{ sectionId: "personal" }],
    });
  } else {
    checks.push({
      id: "contact-placeholders",
      category: "contact",
      weight: 1,
      status: "pass",
      credit: 1,
      title: "Contact authenticity",
      message: "No placeholder contact details detected.",
      targets: [{ sectionId: "personal" }],
    });
  }

  return checks;
};
