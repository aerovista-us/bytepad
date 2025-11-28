import { app, BrowserWindow } from "electron";
import { initializeCore } from "./core/setup";
import { createWindow } from "./window";
import { createMenu } from "./menu";
import { setupIpcHandlers } from "./ipc/handlers";

// Handle creating/removing shortcuts on Windows when installing/uninstalling
try {
  if (require("electron-squirrel-startup")) {
    app.quit();
  }
} catch (e) {
  // electron-squirrel-startup not available, continue
}

// Initialize BytePadCore
let core: ReturnType<typeof initializeCore> | null = null;

const initializeApp = async () => {
  try {
    console.log("Initializing BytePad app...");
    
    // Initialize core in main process
    console.log("Initializing core...");
    core = initializeCore();
    await core.init();
    console.log("Core initialized successfully");

    // Set up IPC handlers
    console.log("Setting up IPC handlers...");
    setupIpcHandlers(core);
    console.log("IPC handlers set up");

    // Create application window
    console.log("Creating window...");
    const mainWindow = createWindow();
    console.log("Window created");

    // Create application menu
    console.log("Creating menu...");
    createMenu(mainWindow);
    console.log("Menu created");

    // Handle window closed
    mainWindow.on("closed", () => {
      console.log("Window closed");
      // Dereference the window object
    });

    console.log("App initialization complete");
  } catch (error) {
    console.error("Failed to initialize app:", error);
    // Show error dialog
    const { dialog, BrowserWindow } = require("electron");
    
    // Create a window to show the error if no windows exist
    const errorWindow = new BrowserWindow({
      width: 600,
      height: 400,
      show: true,
      center: true,
    });
    
    dialog.showErrorBox(
      "BytePad Startup Error",
      `Failed to initialize BytePad:\n\n${error instanceof Error ? error.message : String(error)}\n\nCheck the console for details.`
    );
    
    // Don't quit immediately - let user see the error
    // app.quit();
  }
};

// This method will be called when Electron has finished initialization
app.on("ready", initializeApp);

// Quit when all windows are closed, except on macOS
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS, re-create window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    initializeApp();
  }
});

// Security: Prevent new window creation and handle external links
app.on("web-contents-created", (_, contents) => {
  // Handle external navigation (new window requests)
  contents.setWindowOpenHandler(({ url }) => {
    // Open external links in default browser
    require("electron").shell.openExternal(url);
    // Prevent Electron from opening a new window
    return { action: "deny" };
  });
});

