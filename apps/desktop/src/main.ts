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

    // Ignore self-signed certificate errors
    app.commandLine.appendSwitch('ignore-certificate-errors');

    if (isDev) {
        win.loadURL('http://localhost:3000');
        win.webContents.openDevTools();
    } else {
        // Load the production URL
        // Using nexus.local as configured in Nginx
        win.loadURL('https://nexus.local');
        // fallback or alternative: win.loadURL('https://192.168.1.103'); 
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
