var app = require('app');  // Module to control application life.
var shell = require('shell');

var BrowserWindow = require('browser-window');  // Module to create native browser window.

// The hostname of the backend server that provides the business logic
var hostname = "localhost:1055"
var hosturl = "http://localhost:1055/"

require('crash-reporter').start();

// Force hostnames to redirect to where we want them.
app.commandLine.appendSwitch('host-rules', 'MAP * ' + hostname);
//app.commandLine.appendSwitch('client-certificate', '/Users/nskelsey/soapboxsys/OmbudsCore/src/examples/tlsserv/cert.pem');
app.commandLine.appendSwitch('disable-http-cache');
//app.commandLine.appendSwitch('ignore-certificate-errors');
//app.commandLine.appendSwitch('v', 1);
//app.commandLine.appendSwitch('debug-brk', 5858);


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
var mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
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
        mainWindow.loadUrl(hosturl + '#/setup')

        // Emitted when the window is closed.
        mainWindow.on('closed', function() {
            // Dereference the window object, usually you would store windows
            // in an array if your app supports multi windows, this is the time
            // when you should delete the corresponding element.
            mainWindow = null;
        });


        // Intercepts widow requests to open pages. This only allows the 
        // window to travel to urls exposed by the app server.
        // TODO add a session specific token, so links from within posts
        // cannot escape there sandbox.
        mainWindow.webContents.on('will-navigate', function(e, url) {
            if (url.substr(0, hosturl.length) != hosturl) {
                e.preventDefault();
                console.log('Saw external protocol request!:', url)
                if (url.startsWith('http')) {
                    shell.openExternal(url);
                }
            }
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
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Quit',
                    accelerator: 'CommandorControl+Q',
                    selector: 'terminate:'
                }
            ]
        }
        ];
        var menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    }

});

// Intercepts protocol requests for security and additional functionality...
function registerProtocolIntercept() {
    var protocol = require('protocol');
    protocol.registerProtocol('omb', httpHandler);
    protocol.registerProtocol('http', httpHandler);
    //protocol.interceptProtocol('https', httpHandler);
}

function httpHandler(request) {
    console.log(request);
    if (request.url.substr(1,4) != "http") {
        console.log(request.url)
    }
    return null
}
