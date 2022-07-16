const electron = require('electron');
const path = require('path');

function createWindow() {
    var win = new electron.BrowserWindow({
        width: 1920,
        height: 1080,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    console.log(`loading main window`);

    win.loadFile(path.join(__dirname, 'index.html'));

    win.on('ready-to-show', function () {
        win.show();
    });
}

electron.app.whenReady().then(function () {
    createWindow();
});
