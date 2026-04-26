const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let opWin = null;
let audWin = null;

ipcMain.on('pc-state', (event, state) => {
  [opWin, audWin].forEach(win => {
    if (win && !win.isDestroyed() && win.webContents.id !== event.sender.id)
      win.webContents.send('pc-state', state);
  });
});

ipcMain.on('pc-request', (event) => {
  [opWin, audWin].forEach(win => {
    if (win && !win.isDestroyed() && win.webContents.id !== event.sender.id)
      win.webContents.send('pc-request');
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

function createWindows() {
  const prefs = { nodeIntegration: true, contextIsolation: false };

  opWin = new BrowserWindow({
    width: 1020, height: 760, minWidth: 800, minHeight: 600,
    title: 'Phrase Frenzy — Operator',
    backgroundColor: '#060614',
    webPreferences: prefs,
  });
  opWin.loadFile(path.join(__dirname, 'index.html'), { hash: 'operator' });
  opWin.on('closed', () => { opWin = null; });

  audWin = new BrowserWindow({
    width: 1280, height: 800, minWidth: 800, minHeight: 600,
    title: 'Phrase Frenzy — Audience',
    backgroundColor: '#08081e',
    show: false,
    webPreferences: prefs,
  });
  audWin.loadFile(path.join(__dirname, 'index.html'), { hash: 'audience' });
  audWin.on('closed', () => { audWin = null; });
}

app.whenReady().then(createWindows);
app.on('window-all-closed', () => app.quit());
