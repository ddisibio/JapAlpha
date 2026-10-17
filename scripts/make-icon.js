// Renders build/icon.png (1024x1024) using Electron's Chromium canvas.
const { app, BrowserWindow } = require("electron");
const fs = require("fs");
const path = require("path");

const page = `<!doctype html><canvas id="c" width="1024" height="1024"></canvas><script>
const x = document.getElementById("c").getContext("2d");
const g = x.createLinearGradient(0, 0, 1024, 1024);
g.addColorStop(0, "#4c4cbf");
g.addColorStop(1, "#16162e");
x.fillStyle = g;
x.beginPath();
x.roundRect(0, 0, 1024, 1024, 220);
x.fill();
x.font = '500 620px "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif';
x.textAlign = "center";
x.textBaseline = "middle";
x.fillStyle = "#f0f0ff";
x.fillText("あ", 512, 560);
<\/script>`;

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1024,
    height: 1024,
    show: false,
    webPreferences: { offscreen: true },
  });
  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(page)}`);
  await new Promise((r) => setTimeout(r, 600));
  const dataUrl = await win.webContents.executeJavaScript(
    "document.getElementById('c').toDataURL('image/png')"
  );
  const out = path.join(__dirname, "..", "build", "icon.png");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, Buffer.from(dataUrl.split(",")[1], "base64"));
  console.log("wrote", out);
  app.quit();
});
