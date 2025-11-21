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
  // Initialize core in main process
  core = initializeCore();
  await core.init();

  // Set up IPC handlers
  setupIpcHandlers(core);

  // Create application window
  const mainWindow = createWindow();

  // Create application menu
  createMenu(mainWindow);

  // Handle window closed
  mainWindow.on("closed", () => {
    // Dereference the window object
  });
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

// Security: Prevent new window creation
app.on("web-contents-created", (_, contents) => {
  contents.on("new-window", (event, navigationUrl) => {
    event.preventDefault();
    // Open external links in default browser
    require("electron").shell.openExternal(navigationUrl);
  });
});

