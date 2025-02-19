const { app, BrowserWindow } = require('electron');
const path = require('path');
const electronReload = require('electron-reload');

let win;

function createWindow() {
    win = new BrowserWindow({
        width: 500,  
        height: 250,
        x: Math.floor((require('electron').screen.getPrimaryDisplay().workAreaSize.width - 500) / 2), // Zentriert auf dem Desktop
        y: 0,  // Oben auf dem Desktop
        frame: false,  // Ohne Fensterrahmen
        resizable: false,  // Verhindert das Vergrößern/Verkleinern des Fensters
        movable: true,  // Macht das Fenster verschiebbar
        webPreferences: {
            preload: path.join(__dirname, 'renderer', 'renderer.js')
        }
    });

    win.loadFile('renderer/index.html');

    // Fenster immer im Vordergrund
    win.setAlwaysOnTop(true, 'screen-saver');

    // Fenster bleibt im Vordergrund, außer wenn es den Fokus verliert
    win.on('blur', () => win.setAlwaysOnTop(false));
    win.on('focus', () => win.setAlwaysOnTop(true, 'screen-saver'));

    // Event für das Verschieben
    win.on('move', () => {
        let [x, y] = win.getBounds();
        console.log(`Fenster verschoben: X=${x}, Y=${y}`);
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
