const electron = require('electron');

electron.contextBridge.exposeInMainWorld('versions', {
    node: function () {
        return process.versions.node;
    },
    chrome: function () {
        return process.versions.chrome;
    },
    electron: function () {
        return process.versions.electron;
    }
});
