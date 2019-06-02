const {app, BrowserWindow} = require('electron');
const path = require('path');
const fs = require('fs');
let mainWindow,open_url,is_loaded;

function createWindow () {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 768,
        minWidth: 990,
        minHeight: 480,
        transparent: true,
        frame: false,
        webPreferences: {
            nodeIntegration: true
        },
        icon: path.join(__dirname, 'desktop-app/icons/png/64x64.png')
    });
    mainWindow.loadFile('desktop-app/index.html');
    //mainWindow.webContents.openDevTools();
    mainWindow.on('closed', function () {
        mainWindow = null
    });
    mainWindow.setMenu(null);
    mainWindow.webContents.once('dom-ready', async e=>{
        parseOpenUrl(process.argv);
    });
}
const gotTheLock = app.requestSingleInstanceLock?app.requestSingleInstanceLock():true;
let parseOpenUrl = argv=>{
    if(argv[1]&&argv[1].length&&argv[1].substr(0,12) === 'sidequest://'){
        fs.writeFileSync(path.join(app.getPath('appData'),'SideQuest','test_output_loaded.txt'),argv[1].toString());
        mainWindow.webContents.send('open-url', argv[1].toString() );
    }
};

if (!gotTheLock) {
    app.quit()
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        parseOpenUrl(commandLine);
        if (mainWindow) {
            if (mainWindow.isMinimized()) myWindow.restore()
            mainWindow.focus()
        }
    });


    app.on('ready', createWindow);
// Quit when all windows are closed.
    app.on('window-all-closed', function () {
        if (process.platform !== 'darwin') app.quit()
    });

    app.on('activate', function () {
        if (mainWindow === null) createWindow()
    });
    app.setAsDefaultProtocolClient('sidequest');
    // app.on('open-url', function (event, url) {
    //     event.preventDefault();
    //     fs.writeFileSync(path.join(app.getPath('appData'),'SideQuest','test_output.txt'),url);
    //     if(is_loaded){
    //         mainWindow.webContents.send('open-url', url );
    //     }else{
    //         open_url = url;
    //     }
    // });
}


global.receiveMessage = function(text) {
    mainWindow.webContents.send('info', text );
};
