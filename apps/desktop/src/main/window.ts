import { app, BrowserWindow, screen } from "electron";
import * as path from "path";

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

/**
 * Create the main application window
 */
export function createWindow(): BrowserWindow {
  // Get primary display dimensions
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  // Create the browser window with security best practices
  const mainWindow = new BrowserWindow({
    width: Math.min(1200, width),
    height: Math.min(800, height),
    minWidth: 800,
    minHeight: 600,
    show: false, // Don't show until ready
    webPreferences: {
      // Security: Use preload script for IPC bridge
      preload: path.join(__dirname, "../preload/index.js"),
      // Security: Context isolation enabled (default in Electron 20+)
      contextIsolation: true,
      // Security: Node integration disabled in renderer
      nodeIntegration: false,
      // Security: Sandbox enabled for renderer processes
      sandbox: true,
      // Security: Disable webSecurity only if needed for local file access
      webSecurity: true,
    },
    // icon: path.join(__dirname, "../../assets/icon.png"), // Uncomment when icon is available
  });

  // Show window when ready to prevent visual flash
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    
    // Focus window
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Load the app
  if (isDev) {
    // Development: Load from Next.js dev server
    // Terminal 1: pnpm dev (starts Next.js on localhost:3000)
    // Terminal 2: pnpm --filter desktop start (starts Electron)
    mainWindow.loadURL("http://localhost:3000");
    
    // Enable hot reload in development
    mainWindow.webContents.on("did-fail-load", () => {
      // Retry loading if Next.js dev server isn't ready yet
      setTimeout(() => {
        mainWindow.loadURL("http://localhost:3000");
      }, 1000);
    });
  } else {
    // Production: Load static Next.js build
    // Path must be workspace-relative, not absolute
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  // Handle window closed
  mainWindow.on("closed", () => {
    // Window closed
  });

  return mainWindow;
}

