const electron = require('electron');

function createWindow() {
    var win = new electron.BrowserWindow({
        width: 1920,
        height: 1080,
    });

    win.loadFile('index.html');
}

electron.app.whenReady().then(function () {
    createWindow();
});
