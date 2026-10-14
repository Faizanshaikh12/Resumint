import type { ResumeContent, ResumeDesign, TemplateId } from "../schemas/resume";

export type SaveResult =
  | { ok: true; version: number; updatedAt?: string | Date }
  | { ok: false; reason: "conflict"; serverVersion: number }
  | {
      ok: false;
      reason: "not_found" | "oversize" | "invalid" | "network" | "error";
      error: string;
      fieldErrors?: Record<string, string[]>;
    };

export type RenameResult =
  | { ok: true; title: string }
  | { ok: false; error: string };

export interface ResumePersistence {
  save(
    content: ResumeContent,
    expectedVersion: number,
    design?: ResumeDesign,
    templateId?: TemplateId
  ): Promise<SaveResult>;
  rename?(title: string): Promise<RenameResult>;
}

/**
 * Parses action responses across standard JSON and React Router Single Fetch formats.
 */
function parseActionResponse(text: string, status: number): any {
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    const firstLine = text.split("\n")[0]?.trim();
    if (firstLine) {
      try {
        parsed = JSON.parse(firstLine);
      } catch {
        // Fallback to token search below
      }
    }
  }

  // 1. Direct standard JSON object
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && "ok" in parsed) {
    return parsed;
  }

  // 2. React Router Single Fetch array tokens
  if (Array.isArray(parsed)) {
    const result: Record<string, any> = {};
    for (let i = 0; i < parsed.length - 1; i++) {
      const key = parsed[i];
      if (
        typeof key === "string" &&
        ["ok", "version", "updatedAt", "reason", "serverVersion", "error", "title"].includes(key)
      ) {
        result[key] = parsed[i + 1];
      }
    }
    if ("ok" in result || "reason" in result || "error" in result) {
      return result;
    }
  }

  // 3. Regex token extraction from stream chunks
  const okMatch = /"ok",\s*(true|false)/.exec(text);
  const versionMatch = /"version",\s*(\d+)/.exec(text);
  const reasonMatch = /"reason",\s*"([^"]+)"/.exec(text);
  const serverVersionMatch = /"serverVersion",\s*(\d+)/.exec(text);
  const errorMatch = /"error",\s*"([^"]+)"/.exec(text);
  const titleMatch = /"title",\s*"([^"]+)"/.exec(text);

  if (okMatch || reasonMatch || errorMatch || titleMatch) {
    return {
      ok: okMatch ? okMatch[1] === "true" : status < 400,
      version: versionMatch ? parseInt(versionMatch[1]!, 10) : undefined,
      reason: reasonMatch ? reasonMatch[1] : undefined,
      serverVersion: serverVersionMatch ? parseInt(serverVersionMatch[1]!, 10) : undefined,
      error: errorMatch ? errorMatch[1] : undefined,
      title: titleMatch ? titleMatch[1] : undefined,
    };
  }

  return { ok: status < 400 };
}

/**
 * Server persistence adapter for authenticated resume editing.
 * Issues same-origin POST requests to /resumes/:id/edit with optimistic concurrency.
 */
export function createServerPersistence(resumeId: string): ResumePersistence {
  return {
    async save(
      content: ResumeContent,
      expectedVersion: number,
      design?: ResumeDesign,
      templateId?: TemplateId
    ): Promise<SaveResult> {
      try {
        const payload = JSON.stringify({
          intent: "save",
          expectedVersion,
          content,
          design,
          templateId,
        });

        // 200 KB serialized size guard on client before network call
        if (payload.length > 204800) {
          return {
            ok: false,
            reason: "oversize",
            error: "Resume content exceeds maximum allowed size of 200 KB",
          };
        }

        const res = await fetch(`/resumes/${encodeURIComponent(resumeId)}/edit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: payload,
        });

        const rawText = await res.text();
        const data = parseActionResponse(rawText, res.status);

        if (res.status === 409 || data.reason === "conflict") {
          return {
            ok: false,
            reason: "conflict",
            serverVersion: data.serverVersion ?? expectedVersion + 1,
          };
        }

        if (res.status === 404 || data.reason === "not_found") {
          return {
            ok: false,
            reason: "not_found",
            error: data.error || "Resume not found",
          };
        }

        if (res.status === 413 || data.reason === "oversize") {
          return {
            ok: false,
            reason: "oversize",
            error: "Resume content exceeds maximum allowed size of 200 KB",
          };
        }

        if (!res.ok || data.ok === false) {
          return {
            ok: false,
            reason: res.status === 400 ? "invalid" : "error",
            error: data.error || "Failed to save resume",
            fieldErrors: data.fieldErrors,
          };
        }

        return {
          ok: true,
          version: data.version ?? expectedVersion + 1,
          updatedAt: data.updatedAt,
        };
      } catch (err: any) {
        return {
          ok: false,
          reason: "network",
          error: err?.message || "Network error while saving",
        };
      }
    },

    async rename(title: string): Promise<RenameResult> {
      try {
        const res = await fetch(`/resumes/${encodeURIComponent(resumeId)}/edit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            intent: "rename",
            title,
          }),
        });

        const rawText = await res.text();
        const data = parseActionResponse(rawText, res.status);

        if (!res.ok || data.ok === false) {
          return {
            ok: false,
            error: data.error || "Failed to rename resume",
          };
        }

        return {
          ok: true,
          title: data.title || title,
        };
      } catch (err: any) {
        return {
          ok: false,
          error: err?.message || "Network error while renaming",
        };
      }
    },
  };
}
