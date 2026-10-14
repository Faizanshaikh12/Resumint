import React, { Component, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export interface ResumeErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ResumeErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ResumeErrorBoundary extends Component<
  ResumeErrorBoundaryProps,
  ResumeErrorBoundaryState
> {
  constructor(props: ResumeErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ResumeErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Resume preview failed to render:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 border border-amber-200 bg-amber-50 rounded-lg text-amber-900 space-y-3 m-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" aria-hidden="true" />
            <h3 className="font-semibold text-sm">Preview Rendering Issue</h3>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            There was a problem rendering the preview with the selected template and data.
            Your content remains safely preserved in the editor.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-200 hover:bg-amber-300 rounded text-amber-950 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Retry Preview
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
