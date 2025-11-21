import { CoreProvider } from "./providers";
import { ErrorBoundary } from "./error-boundary";
import { InstallPrompt } from "./install-prompt";
import { ServiceWorkerRegister } from "./service-worker-register";
import { PerformanceMonitor } from "../components/PerformanceMonitor";
import "./globals.css";

export const metadata = {
  title: "BytePad 3.0 Companion",
  description: "Multi-surface Creative Board OS - PWA Companion",
  manifest: "/manifest.json",
  themeColor: "#4f46e5",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BytePad",
  },
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
          </CoreProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

