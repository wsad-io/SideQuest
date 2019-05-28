const { ipcRenderer: ipc, remote } = require('electron');
let receiveMessage = remote.getGlobal('receiveMessage');
function init() {
    attachIPCListeners();
    window.Bridge = {
        sendMessage
    };
}
function sendMessage(message) {
    receiveMessage(message);
}
function attachIPCListeners() {
    ipc.on('info', (event, data) => {
        window.Bridge.infoFromMain(data);
    });
}

init();