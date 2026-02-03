import { app, BrowserWindow } from 'electron';
import * as path from 'path';

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true, // For MVP; improve security later
            contextIsolation: false
        }
    });

    // Load the Next.js app
    // In dev, load localhost. In prod, load index.html
    const isDev = !app.isPackaged;

    if (isDev) {
        win.loadURL('http://localhost:3000');
        win.webContents.openDevTools();
    } else {
        // Phase 5: Implement static file loading
        console.log("Production build loading not yet implemented");
    }
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
