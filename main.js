const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
// IPC handler to open folder picker dialog
ipcMain.handle('select-export-folder', async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Select folder to export report',
  });
  if (result.canceled || !result.filePaths || !result.filePaths[0]) {
    return null;
  }
  return result.filePaths[0];
});
const isDev = process.env.NODE_ENV !== 'production'

const path = require('path');

function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#121212',
  icon: path.join(__dirname, 'app', 'assets', 'img', 'logo.png'),
     show: false, 
     webPreferences: {
      nodeIntegration: true,
      contextIsolation: false // (add this for older Electron versions)
    }
  });

  // if(isDev){
  //   win.webContents.openDevTools();
  // }
  
  win.loadFile('app/ui/dashboard.html');
  win.once('ready-to-show', () => {
    win.show();
  });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});