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
    center: true, // Center window on screen
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

  console.log("Window created:", {
    width: mainWindow.getSize()[0],
    height: mainWindow.getSize()[1],
    visible: mainWindow.isVisible(),
  });

  // Show window after a timeout if ready-to-show doesn't fire (fallback)
  const showTimeout = setTimeout(() => {
    if (!mainWindow.isVisible()) {
      console.log("Window not visible after timeout - forcing show");
      mainWindow.show();
      mainWindow.focus();
      if (isDev) {
        mainWindow.webContents.openDevTools();
      }
    }
  }, 5000);

  // Show window when ready to prevent visual flash
  mainWindow.once("ready-to-show", () => {
    clearTimeout(showTimeout); // Clear the fallback timeout
    console.log("Window ready to show - displaying now");
    mainWindow.show();
    mainWindow.focus();
    mainWindow.moveTop(); // Bring to front
    
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle load errors
  mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription, validatedURL) => {
    console.error(`Failed to load ${validatedURL}:`, errorCode, errorDescription);
    // Show window even on error so user can see what happened
    if (!mainWindow.isVisible()) {
      mainWindow.show();
      mainWindow.focus();
    }
    if (isDev && validatedURL.includes("localhost:3000")) {
      // In dev mode, retry loading if Next.js dev server isn't ready yet
      console.log("Retrying connection to Next.js dev server...");
      setTimeout(() => {
        mainWindow.loadURL("http://localhost:3000");
      }, 1000);
    }
  });

  // Log when page loads successfully
  mainWindow.webContents.on("did-finish-load", () => {
    console.log("Page loaded successfully");
  });

  // Log when window is shown
  mainWindow.on("show", () => {
    console.log("Window is now visible");
  });

  // Load the app
  if (isDev) {
    // Development: Load from Next.js dev server
    // Terminal 1: pnpm dev (starts Next.js on localhost:3000)
    // Terminal 2: pnpm --filter desktop start (starts Electron)
    console.log("Loading http://localhost:3000...");
    mainWindow.loadURL("http://localhost:3000");
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


