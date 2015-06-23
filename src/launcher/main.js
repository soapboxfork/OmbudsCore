var app = require('app');  // Module to control application life.
var BrowserWindow = require('browser-window');  // Module to create native browser window.

require('crash-reporter').start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
var mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    if (process.platform != 'darwin')
        app.quit();
});

var Menu = require('menu');




// This method will be called when Electron has done everything
// initialization and ready for creating browser windows.
app.on('ready', function() {
    initWindow();

    function initWindow () {
        // Create the browser window.
        mainWindow = new BrowserWindow({width: 1058, height: 640, resizable: false});

        // and load the index.html of the app.
        //mainWindow.loadUrl('file://' + __dirname + '/index.html');
        mainWindow.loadUrl('http://localhost:1055');

        // Emitted when the window is closed.
        mainWindow.on('closed', function() {
            // Dereference the window object, usually you would store windows
            // in an array if your app supports multi windows, this is the time
            // when you should delete the corresponding element.
            mainWindow = null;
        });

        initMenu(mainWindow);
    }
    

    function initMenu (window) {
        var webContents = window.webContents;

        var template = [{
            label: 'Edit',
            submenu: [
                {
                    label: 'Undo',
                    accelerator: 'CommandorControl+Z',
                    selector: 'undo:'
                },
                {
                    label: 'Redo',
                    accelerator: 'Shift+CommandorControl+Z',
                    selector: 'redo:'
                },
                {
                    label: 'Copy',
                    accelerator: 'CommandorControl+C',
                    selector: 'copy:'
                },
                {
                    label: 'Paste',
                    accelerator: 'CommandorControl+V',
                    selector: 'paste:'
                },
                {
                    label: 'Select All',
                    accelerator: 'CommandorControl+A',
                    click: function() { webContents.selectAll(); }
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                {
                    label: 'Reload',
                    accelerator: 'CommandorControl+R',
                    click: function() { window.reload(); }
                },
                {
                    label: 'Forward',
                    click: function() { 
                        if (webContents.canGoForward()) {
                            webContents.goForward();
                        }
                    }
                },
                {
                    label: 'Back',
                    click: function() { 
                        if (webContents.canGoBack()) {
                            webContents.goBack();
                        }
                    }
                }
            ]
        }
        ];
        var menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    }

});
