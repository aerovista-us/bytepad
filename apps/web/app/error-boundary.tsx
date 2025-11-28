"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { isElectron } from "../lib/bridge";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Enhanced logging for IPC failures
    const isIpcError = error.message.includes("IPC") || 
                      error.message.includes("Electron") ||
                      (error as any).timeout !== undefined;

    console.error("BytePad Error Boundary caught an error:", {
      error,
      errorInfo,
      isIpcError,
      isElectron: isElectron(),
      stack: error.stack,
    });

    // Log IPC failures specifically
    if (isIpcError && isElectron()) {
      console.error("IPC Failure Details:", {
        message: error.message,
        timeout: (error as any).timeout,
        classification: (error as any).classification,
        retryable: (error as any).retryable,
        componentStack: errorInfo.componentStack,
      });
    }

    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      const error = this.state.error;
      const isIpcError = error?.message.includes("IPC") || 
                        error?.message.includes("Electron") ||
                        (error as any)?.timeout !== undefined;
      const isStorageError = error?.message.includes("storage") ||
                            error?.message.includes("IndexedDB") ||
                            error?.message.includes("filesystem");

      return (
        this.props.fallback || (
          <div className="p-6 bg-red-50 border border-red-200 rounded max-w-2xl mx-auto mt-8">
            <h2 className="text-xl font-bold text-red-800 mb-2">
              {isIpcError ? "Connection Error" : isStorageError ? "Storage Error" : "Something went wrong"}
            </h2>
            <p className="text-red-600 mb-4">
              {error?.message || "An unexpected error occurred"}
            </p>
            
            {isIpcError && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>IPC Connection Issue:</strong> The desktop app may have lost connection to the main process.
                  Try refreshing the window or restarting the app.
                </p>
              </div>
            )}

            {isStorageError && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>Storage Issue:</strong> There was a problem accessing data storage.
                  Your data is safe, but you may need to check storage permissions.
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Try again
              </button>
              {isElectron() && (
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Reload window
                </button>
              )}
            </div>

            {process.env.NODE_ENV === "development" && this.state.errorInfo && (
              <details className="mt-4">
                <summary className="text-sm text-gray-600 cursor-pointer">Error details (dev only)</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {this.state.error?.stack}
                  {"\n\n"}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        )
      );
    }

    return this.props.children;
  }
}

