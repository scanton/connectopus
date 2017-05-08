const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

var mainWindow = null;

app.on('ready', () => {
	mainWindow = new BrowserWindow({ width: 1200, height: 1000, center: true });
	mainWindow.loadURL('file://' + __dirname + '/index.html');
	//mainWindow.webContents.openDevTools();
});