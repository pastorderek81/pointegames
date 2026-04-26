const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { execSync, spawn } = require('child_process');
const https = require('https');
const http = require('http');

let opWin = null;
let audWin = null;
let isQuitting = false;

ipcMain.on('hub-state', (event, state) => {
  [opWin, audWin].forEach(win => {
    if (win && !win.isDestroyed() && win.webContents.id !== event.sender.id)
      win.webContents.send('hub-state', state);
  });
});

ipcMain.on('hub-request', (event) => {
  [opWin, audWin].forEach(win => {
    if (win && !win.isDestroyed() && win.webContents.id !== event.sender.id)
      win.webContents.send('hub-request');
  });
});

ipcMain.on('toggle-audience', (event, show) => {
  if (!audWin || audWin.isDestroyed()) return;
  if (show === true)       { audWin.show(); audWin.focus(); }
  else if (show === false) { audWin.hide(); }
  else { audWin.isVisible() ? audWin.hide() : (audWin.show(), audWin.focus()); }
});

ipcMain.on('audience-visible', (event) => {
  event.returnValue = audWin && !audWin.isDestroyed() && audWin.isVisible();
});

// ── AUTO-UPDATE ─────────────────────────────────────────────────────────────
ipcMain.on('do-auto-update', (event, downloadUrl) => {
  if (!downloadUrl) return;
  const appPath = app.getPath('exe').replace(/\/Contents\/MacOS\/.+$/, '');
  const tmpDir = path.join(app.getPath('temp'), 'gamehub-update');
  const dmgPath = path.join(tmpDir, 'update.dmg');

  // Send progress to renderer
  const send = (msg) => {
    if (opWin && !opWin.isDestroyed()) opWin.webContents.send('update-progress', msg);
  };

  send('Downloading update...');

  // Clean up temp
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch(e) {}
  fs.mkdirSync(tmpDir, { recursive: true });

  // Download the DMG (follow redirects)
  function download(url, dest, cb) {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'GameHub' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest, cb);
      }
      if (res.statusCode !== 200) return cb(new Error('HTTP ' + res.statusCode));
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => { file.close(); cb(null); });
    }).on('error', cb);
  }

  download(downloadUrl, dmgPath, (err) => {
    if (err) { send('Download failed: ' + err.message); return; }
    send('Installing update...');

    try {
      // Mount the DMG
      const mountOutput = execSync(`hdiutil attach "${dmgPath}" -nobrowse -quiet -mountpoint "${tmpDir}/mount" 2>&1 || hdiutil attach "${dmgPath}" -nobrowse -quiet 2>&1`).toString();

      // Find the mounted volume
      let mountPoint = tmpDir + '/mount';
      if (!fs.existsSync(mountPoint)) {
        // Find it from hdiutil output
        const lines = execSync('hdiutil info 2>&1').toString();
        const match = lines.match(/\/Volumes\/Game Hub[^\n]*/);
        if (match) mountPoint = match[0].trim();
        else {
          const match2 = lines.match(/\/Volumes\/[^\n]*Game[^\n]*/);
          if (match2) mountPoint = match2[0].trim();
        }
      }

      // Find the .app in the mounted volume
      const items = fs.readdirSync(mountPoint);
      const appName = items.find(i => i.endsWith('.app'));
      if (!appName) { send('Error: No .app found in DMG'); return; }

      const newAppPath = path.join(mountPoint, appName);
      const installPath = '/Applications/' + appName;

      // Write a shell script that waits for this process to exit, swaps the .app, and relaunches
      const myPid = process.pid;
      const logPath = path.join(tmpDir, 'update.log');
      const script = `#!/bin/bash
exec > "${logPath}" 2>&1
echo "[update] waiting for PID ${myPid} to exit..."
# Wait for the Electron main process to actually exit (up to 30s)
for i in $(seq 1 60); do
  if ! kill -0 ${myPid} 2>/dev/null; then break; fi
  sleep 0.5
done
echo "[update] PID gone, swapping app bundle"
rm -rf "${installPath}"
cp -R "${newAppPath}" "${installPath}"
# Clear quarantine so macOS doesn't block re-launch
xattr -rd com.apple.quarantine "${installPath}" 2>/dev/null || true
hdiutil detach "${mountPoint}" -quiet 2>/dev/null || true
echo "[update] launching new version"
open -n "${installPath}"
echo "[update] done"
rm -rf "${tmpDir}" 2>/dev/null || true
`;
      const scriptPath = path.join(tmpDir, 'update.sh');
      fs.writeFileSync(scriptPath, script, { mode: 0o755 });

      send('Restarting with new version...');

      // Spawn the update script detached so it survives our quit
      const child = spawn('bash', [scriptPath], {
        detached: true,
        stdio: 'ignore',
        cwd: '/'
      });
      child.unref();

      // Force quit — set the flag so audience-window close handler doesn't block
      isQuitting = true;
      setTimeout(() => {
        try {
          if (audWin && !audWin.isDestroyed()) audWin.destroy();
          if (opWin && !opWin.isDestroyed()) opWin.destroy();
        } catch(e) {}
        app.exit(0); // app.exit is more forceful than app.quit
      }, 800);

    } catch(e) {
      send('Update failed: ' + e.message);
      // Try to unmount on error
      try { execSync(`hdiutil detach "${tmpDir}/mount" -quiet 2>/dev/null`); } catch(e2) {}
    }
  });
});

function createWindows() {
  const prefs = { nodeIntegration: true, contextIsolation: false };

  opWin = new BrowserWindow({
    width: 1020, height: 800, minWidth: 480, minHeight: 420,
    title: 'Game Hub — Operator',
    backgroundColor: '#030304',
    webPreferences: prefs,
  });
  opWin.loadFile(path.join(__dirname, 'index.html'), { hash: 'operator' });
  // When the operator window is closed, quit the whole app (don't leave hidden audience window running)
  opWin.on('close', () => { isQuitting = true; });
  opWin.on('closed', () => {
    opWin = null;
    if (audWin && !audWin.isDestroyed()) audWin.destroy();
    app.quit();
  });

  audWin = new BrowserWindow({
    width: 1280, height: 800, minWidth: 800, minHeight: 600,
    title: 'Game Hub — Audience',
    backgroundColor: '#030304',
    show: false,
    webPreferences: prefs,
  });
  audWin.loadFile(path.join(__dirname, 'index.html'), { hash: 'audience' });
  audWin.on('close', (e) => {
    // Only hide (instead of close) while the app is still running normally AND we're not quitting
    if (!isQuitting && opWin && !opWin.isDestroyed()) {
      e.preventDefault();
      audWin.hide();
    }
  });
}

app.on('before-quit', () => { isQuitting = true; });
app.whenReady().then(createWindows);
app.on('window-all-closed', () => app.quit());
