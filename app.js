const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
let mainWindow, open_url, is_loaded;
const ADB = require('./adbkit');
function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 768,
        minWidth: 990,
        minHeight: 480,
        transparent: true,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
        },
    });
    if (process.env.NODE_ENV === 'dev') {
        mainWindow.loadURL('http://localhost:4205');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile('build/app/index.html');
    }
    mainWindow.on('closed', function() {
        mainWindow = null;
    });
    setupMenu();
    mainWindow.webContents.once('dom-ready', async e => {
        parseOpenUrl(process.argv);
    });

    const { protocol } = require('electron');

    protocol.registerBufferProtocol(
        'beatsaver',
        (request, callback) => {
            mainWindow.webContents.send(
                'open-url',
                'sidequest://bsaber/#https://beatsaver.com/api/download/key/' + request.url.replace('beatsaver://', '')
            );
        },
        error => {
            if (error) console.error('Failed to register protocol');
        }
    );

    protocol.registerStringProtocol(
        'sidequest',
        (request, callback) => {
            mainWindow.webContents.send('open-url', request.url);
        },
        error => {
            if (error) console.error('Failed to register protocol');
        }
    );

    mainWindow.webContents.session.on('will-download', (evt, item, webContents) => {
        let url = item.getURL();
        let etx = path.extname(url.split('?')[0]);
        if (~url.indexOf('https://beatsaver.com/cdn')) {
            mainWindow.webContents.send('open-url', 'sidequest://bsaber/#' + url);
        } else if (etx === '.apk') {
            mainWindow.webContents.send('pre-open-url', url);
        }
        item.cancel();
    });
}

function setupMenu() {
    const template = [
        {
            label: 'SideQuest',
            submenu: [
                {
                    label: 'Quit',
                    accelerator: 'Command+Q',
                    click: function() {
                        app.quit();
                    },
                },
            ],
        },
        {
            label: 'Edit',
            submenu: [
                {
                    label: 'Undo',
                    accelerator: 'CmdOrCtrl+Z',
                    selector: 'undo:',
                },
                {
                    label: 'Redo',
                    accelerator: 'Shift+CmdOrCtrl+Z',
                    selector: 'redo:',
                },
                { type: 'separator' },
                { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
                {
                    label: 'Copy',
                    accelerator: 'CmdOrCtrl+C',
                    selector: 'copy:',
                },
                {
                    label: 'Paste',
                    accelerator: 'CmdOrCtrl+V',
                    selector: 'paste:',
                },
                {
                    label: 'Select All',
                    accelerator: 'CmdOrCtrl+A',
                    selector: 'selectAll:',
                },
            ],
        },
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

const gotTheLock = app.requestSingleInstanceLock ? app.requestSingleInstanceLock() : true;
let parseOpenUrl = argv => {
    if (argv[1] && argv[1].length && argv[1].substr(0, 12) === 'sidequest://') {
        //fs.writeFileSync(path.join(app.getPath('appData'), 'SideQuest', 'test_output_loaded.txt'), argv[1].toString());
        mainWindow.webContents.send('open-url', argv[1].toString());
    }
};

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        parseOpenUrl(commandLine);
        if (mainWindow) {
            if (mainWindow.isMinimized()) myWindow.restore();
            mainWindow.focus();
        }
    });

    app.on('ready', createWindow);
    // Quit when all windows are closed.
    app.on('window-all-closed', function() {
        if (process.platform !== 'darwin') app.quit();
        if (adb.client) adb.client.kill();
    });

    app.on('activate', function() {
        if (mainWindow === null) createWindow();
    });
    app.setAsDefaultProtocolClient('sidequest');
    app.on('open-url', function(event, url) {
        event.preventDefault();
        //fs.writeFileSync(path.join(app.getPath('appData'), 'SideQuest', 'test_output.txt'), url);
        if (is_loaded) {
            mainWindow.webContents.send('open-url', url);
        } else {
            open_url = url;
        }
    });
}

global.receiveMessage = function(text) {
    mainWindow.webContents.send('info', text);
};
const { ipcMain } = require('electron');
const adb = new ADB();
ipcMain.on('adb-command', (event, arg) => {
    const success = d => {
        if (!event.sender.isDestroyed()) {
            event.sender.send('adb-command', { command: arg.command, resp: d });
        }
    };
    const reject = e => {
        if (!event.sender.isDestroyed()) {
            event.sender.send('adb-command', { command: arg.command, error: e });
        }
    };
    const status = d => {
        if (!event.sender.isDestroyed()) {
            event.sender.send('adb-command', { command: arg.command, status: d });
        }
    };
    switch (arg.command) {
        case 'setupAdb':
            adb.setupAdb(arg.settings.adbPath, success, reject);
            break;
        case 'listDevices':
            adb.listDevices(success, reject);
            break;
        case 'getPackages':
            adb.getPackages(arg.settings.serial, success, reject);
            break;
        case 'shell':
            adb.shell(arg.settings.serial, arg.settings.command, success, reject);
            break;
        case 'readdir':
            adb.readdir(arg.settings.serial, arg.settings.path, success, reject);
            break;
        case 'push':
            adb.push(arg.settings.serial, arg.settings.path, arg.settings.savePath, success, status, reject);
            break;
        case 'pull':
            adb.pull(arg.settings.serial, arg.settings.path, arg.settings.savePath, success, status, reject);
            break;
        case 'stat':
            adb.stat(arg.settings.serial, arg.settings.path, success, reject);
            break;
        case 'install':
            adb.install(arg.settings.serial, arg.settings.path, arg.settings.isLocal, success, status, reject);
            break;
        case 'uninstall':
            adb.uninstall(arg.settings.serial, arg.settings.packageName, success, reject);
            break;
        case 'installRemote':
            adb.installRemote(arg.settings.serial, arg.settings.path, success, reject);
            break;
        case 'clear':
            adb.clear(arg.settings.serial, arg.settings.packageName, success, reject);
            break;
        case 'connect':
            adb.connect(arg.settings.deviceIp, success, reject);
            break;
        case 'disconnect':
            adb.disconnect(arg.settings.host, success, reject);
            break;
        case 'usb':
            adb.usb(arg.settings.serial, success, reject);
            break;
        case 'tcpip':
            adb.tcpip(arg.settings.serial, success, reject);
            break;
        case 'setProperties':
            adb.setProperties(arg.settings.serial, arg.settings.command, success, reject);
            break;
    }
});
