const { app, BrowserWindow, screen } = require("electron");
const path = require("path");
const fs = require("fs");

const stateFile = () => path.join(app.getPath("userData"), "window-state.json");

// Restore the last window position only if it still overlaps a connected
// display — otherwise saved coords from an unplugged monitor would spawn
// the window off-screen.
function loadWindowState() {
  try {
    const s = JSON.parse(fs.readFileSync(stateFile(), "utf8"));
    if (typeof s.width !== "number" || typeof s.height !== "number")
      return null;
    if (typeof s.x === "number" && typeof s.y === "number") {
      const visible = screen.getAllDisplays().some((d) => {
        const a = d.workArea;
        return (
          s.x < a.x + a.width &&
          s.x + s.width > a.x &&
          s.y < a.y + a.height &&
          s.y + s.height > a.y
        );
      });
      if (!visible) {
        delete s.x;
        delete s.y;
      }
    }
    return s;
  } catch {
    return null;
  }
}

function saveWindowState(win) {
  // Normal bounds = size/pos before maximizing, so un-maximizing later
  // restores a sane rectangle.
  const { x, y, width, height } = win.getNormalBounds();
  const state = { x, y, width, height, maximized: win.isMaximized() };
  try {
    fs.writeFileSync(stateFile(), JSON.stringify(state));
  } catch {
    // Non-fatal: window just won't remember its geometry.
  }
}

function createWindow() {
  const saved = loadWindowState() || {};
  const win = new BrowserWindow({
    width: saved.width || 960,
    height: saved.height || 760,
    x: saved.x,
    y: saved.y,
    minWidth: 700,
    minHeight: 560,
    title: "JapAlpha",
    backgroundColor: "#16161e",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (saved.maximized) win.maximize();
  win.on("close", () => saveWindowState(win));

  win.loadFile(path.join(__dirname, "renderer", "index.html"));
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
