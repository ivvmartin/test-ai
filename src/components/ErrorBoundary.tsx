"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "./ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] w-full items-center justify-center p-4">
          <div className="flex w-full max-w-md flex-col items-center justify-center space-y-6 text-center">
            <div className="rounded-full bg-red-50 p-4">
              <AlertTriangle className="size-8 text-red-600" />
            </div>

            <div className="space-y-2">
              <h2 className="font-semibold text-xl tracking-tight">
                Нещо се обърка
              </h2>
              <p className="text-muted-foreground text-sm">
                Възникна неочаквана грешка. Моля, опитайте отново
              </p>
            </div>

            <Button
              onClick={this.handleReset}
              className="bg-[#21355a] hover:bg-[#35517f]"
            >
              <RefreshCw className="mr-2 size-4" />
              Опитай отново
            </Button>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-4 w-full rounded-lg bg-red-50 p-4 text-left">
                <summary className="cursor-pointer font-medium text-red-900 text-sm">
                  Детайли за грешката
                </summary>
                <pre className="mt-2 overflow-auto text-xs text-red-800">
                  {this.state.error.toString()}
                  {"\n\n"}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Lightweight Error Boundary for smaller components
 */
export function SimpleErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center p-4">
          <p className="text-muted-foreground text-sm">Неуспешно зареждане</p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
