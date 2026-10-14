import * as React from "react";
import type { ResumePreviewData } from "~/routes/resumes.$id.preview-data";
import { ResumePreview } from "../preview/ResumePreview";

const previewCache = new Map<string, ResumePreviewData>();

// Concurrency limiter: max 4 active network requests
let activeFetches = 0;
const MAX_CONCURRENT_FETCHES = 4;
const fetchQueue: Array<() => void> = [];

function enqueueFetch(fetchFn: () => Promise<void>) {
  const tryNext = () => {
    if (activeFetches < MAX_CONCURRENT_FETCHES && fetchQueue.length > 0) {
      activeFetches++;
      const next = fetchQueue.shift();
      if (next) next();
    }
  };

  const execute = async () => {
    try {
      await fetchFn();
    } finally {
      activeFetches--;
      tryNext();
    }
  };

  if (activeFetches < MAX_CONCURRENT_FETCHES) {
    activeFetches++;
    void execute();
  } else {
    fetchQueue.push(() => void execute());
  }
}

export interface ResumeThumbnailProps {
  resumeId: string;
  initials: string;
  paletteClass: string;
  templateId?: string;
}

export function ResumeThumbnail({
  resumeId,
  initials,
  paletteClass,
  templateId,
}: ResumeThumbnailProps) {
  const [data, setData] = React.useState<ResumePreviewData | null>(
    () => previewCache.get(resumeId) || null
  );
  const [error, setError] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    if (data) return;

    const el = containerRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "150px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [data]);

  React.useEffect(() => {
    if (!isVisible || data || error) return;

    const cached = previewCache.get(resumeId);
    if (cached) {
      setData(cached);
      return;
    }

    let isMounted = true;
    enqueueFetch(async () => {
      try {
        const res = await fetch(`/resumes/${resumeId}/preview-data`);
        if (!res.ok) throw new Error("Failed to load");
        const json = (await res.json()) as ResumePreviewData;
        previewCache.set(resumeId, json);
        if (isMounted) {
          setData(json);
        }
      } catch {
        if (isMounted) {
          setError(true);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isVisible, resumeId, data, error]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-background"
      data-testid="resume-thumbnail"
    >
      {data && !error ? (
        <div
          inert={true}
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none select-none origin-top-left overflow-hidden opacity-95"
        >
          <div className="w-[800px] transform scale-[0.22] origin-top-left">
            <ResumePreview
              content={data.content}
              design={data.design}
              templateId={data.templateId}
            />
          </div>
        </div>
      ) : (
        <div
          className={`flex h-full w-full flex-col justify-between rounded border p-3 ${paletteClass}`}
        >
          <span className="font-mono text-lg font-black tracking-wider">{initials}</span>
          <div className="space-y-1.5 opacity-60">
            <div className="h-1.5 w-1/3 rounded-full bg-current" />
            <div className="h-1 w-full rounded-full bg-current opacity-40" />
            <div className="h-1 w-4/5 rounded-full bg-current opacity-40" />
          </div>
        </div>
      )}
    </div>
  );
}
