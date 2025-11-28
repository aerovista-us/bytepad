import { CoreProvider } from "./providers";
import { ErrorBoundary } from "./error-boundary";
import { InstallPrompt } from "./install-prompt";
import { ServiceWorkerRegister } from "./service-worker-register";
import { PerformanceMonitor } from "../components/PerformanceMonitor";
import { DebugOverlay } from "../components/debug-overlay";
import "./globals.css";

export const metadata = {
  title: "BytePad 3.0 Companion",
  description: "Multi-surface Creative Board OS - PWA Companion",
  manifest: "/manifest.json",
  themeColor: "#4f46e5",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  // Note: appleWebApp is deprecated in favor of Web App Manifest (which we use)
  // Removed to eliminate deprecation warnings - manifest.json handles PWA configuration
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <CoreProvider>
            {children}
            <InstallPrompt />
            <ServiceWorkerRegister />
            <PerformanceMonitor />
            <DebugOverlay />
          </CoreProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

