import { app, BrowserWindow, Menu, MenuItemConstructorOptions } from "electron";

/**
 * Create application menu
 */
export function createMenu(mainWindow: BrowserWindow): void {
  const template: MenuItemConstructorOptions[] = [
    {
      label: "File",
      submenu: [
        {
          label: "New Board",
          accelerator: "CmdOrCtrl+N",
          click: () => {
            mainWindow.webContents.send("menu:newBoard");
          },
        },
        {
          label: "Open Board",
          accelerator: "CmdOrCtrl+O",
          click: () => {
            mainWindow.webContents.send("menu:openBoard");
          },
        },
        { type: "separator" },
        {
          label: "Export",
          accelerator: "CmdOrCtrl+E",
          click: () => {
            mainWindow.webContents.send("menu:export");
          },
        },
        {
          label: "Import",
          accelerator: "CmdOrCtrl+I",
          click: () => {
            mainWindow.webContents.send("menu:import");
          },
        },
        { type: "separator" },
        {
          role: "quit",
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo", label: "Undo" },
        { role: "redo", label: "Redo" },
        { type: "separator" },
        { role: "cut", label: "Cut" },
        { role: "copy", label: "Copy" },
        { role: "paste", label: "Paste" },
        { role: "selectAll", label: "Select All" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload", label: "Reload" },
        { role: "forceReload", label: "Force Reload" },
        { role: "toggleDevTools", label: "Toggle Developer Tools" },
        { type: "separator" },
        { role: "resetZoom", label: "Actual Size" },
        { role: "zoomIn", label: "Zoom In" },
        { role: "zoomOut", label: "Zoom Out" },
        { type: "separator" },
        { role: "togglefullscreen", label: "Toggle Fullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize", label: "Minimize" },
        { role: "close", label: "Close" },
      ],
    },
    {
      role: "help",
      submenu: [
        {
          label: "About BytePad Studio",
          click: () => {
            mainWindow.webContents.send("menu:about");
          },
        },
      ],
    },
  ];

  // macOS menu adjustments
  if (process.platform === "darwin") {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: "about", label: "About BytePad Studio" },
        { type: "separator" },
        { role: "services", label: "Services" },
        { type: "separator" },
        { role: "hide", label: "Hide BytePad Studio" },
        { role: "hideOthers", label: "Hide Others" },
        { role: "unhide", label: "Show All" },
        { type: "separator" },
        { role: "quit", label: "Quit BytePad Studio" },
      ],
    });

    // Window menu
    template[4].submenu = [
      { role: "close", label: "Close" },
      { role: "minimize", label: "Minimize" },
      { role: "zoom", label: "Zoom" },
      { type: "separator" },
      { role: "front", label: "Bring All to Front" },
    ];
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

