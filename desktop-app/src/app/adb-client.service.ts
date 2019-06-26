import { Injectable } from '@angular/core';
import { AppService } from './app.service';
import { LoadingSpinnerService } from './loading-spinner.service';
import { StatusBarService } from './status-bar.service';

export enum ConnectionStatus {
    CONNECTED,
    OFFLINE,
    UNAUTHORIZED,
    DISCONNECTED,
    TOOMANY, //TODO: HAndle multiple devices
}
@Injectable({
    providedIn: 'root',
})
export class AdbClientService {
    ADB: any;
    adbPath: string;
    devicePackages: string[] = [];
    deviceSerial: string;
    lastConnectionCheck: number;
    deviceStatus: ConnectionStatus = ConnectionStatus.UNAUTHORIZED;
    deviceStatusMessage: string = 'Connecting...';
    pollInterval: number = 1000 * 5;
    savePath: string;
    isTransferring: boolean;
    adbResolves: any;
    files: any;
    localFiles: any;
    deviceIp: string;
    wifiEnabled: boolean;
    wifiHost: string;
    constructor(
        public appService: AppService,
        private spinnerService: LoadingSpinnerService,
        private statusService: StatusBarService
    ) {
        this.lastConnectionCheck = performance.now() - 1000; //-this.pollInterval;
        this.adbPath = appService.path.join(appService.appData, 'platform-tools');

        this.adbResolves = {};
        this.savePath = localStorage.getItem('save-path') || this.appService.path.join(this.appService.appData, 'tmp');
        this.setSavePath();
    }
    installFile(filepath) {
        this.spinnerService.showLoader();
        this.spinnerService.setMessage('Installing...');
        let extention = this.appService.path.extname(filepath);
        switch (extention) {
            case '.apk':
                return this.installAPK(filepath, true).then(() => {
                    this.spinnerService.hideLoader();
                    this.statusService.showStatus('APK installed!! ' + filepath);
                });
            case '.obb':
                if (this.appService.path.basename(filepath).match(/main.[0-9]{1,}.[a-z]{1,}.[A-z]{1,}.[A-z]{1,}.obb/)) {
                    return this.installLocalObb(filepath).then(() => this.spinnerService.hideLoader());
                } else {
                    this.spinnerService.hideLoader();
                    return Promise.reject('Invalid OBB');
                }
            case '.zip':
                return this.installLocalZip(filepath, false, () => this.spinnerService.hideLoader());
        }
    }
    toggleWifiMode() {
        if (this.wifiEnabled) {
            return this.adbCommand('usb', { serial: this.deviceSerial }).then(() =>
                this.statusService.showStatus('Please reconnect your USB cable!')
            );
        } else {
            return this.adbCommand('tcpip', { serial: this.deviceSerial }).then(() =>
                this.statusService.showStatus('You can now disconnect your usb cable.')
            );
        }
    }
    connect() {
        this.adbCommand('connect', { deviceIp: this.deviceIp }).then(r => {
            this.wifiHost = r.toString();
        });
    }
    getIpAddress() {
        return this.adbCommand('shell', { serial: this.deviceSerial, command: 'ip route' })
            .then(res => {
                let output_parts = res.trim().split(' ');
                this.deviceIp = output_parts[output_parts.length - 1];
            })
            .catch(e => {});
    }
    setSavePath() {
        localStorage.setItem('save-path', this.savePath);
    }
    getPackages() {
        if (this.deviceStatus !== ConnectionStatus.CONNECTED) {
            return Promise.resolve();
        }
        return this.adbCommand('getPackages', { serial: this.deviceSerial }).then(packages => {
            this.devicePackages = packages.sort((a, b) => {
                let textA = a.toUpperCase();
                let textB = b.toUpperCase();
                return textA < textB ? -1 : textA > textB ? 1 : 0;
            });
        });
    }
    getPackageInfo(packageName) {
        return this.adbCommand('shell', {
            serial: this.deviceSerial,
            command: 'dumpsys package ' + packageName + ' | grep versionName',
        }).then(res => {
            let versionParts = res.split('=');
            return versionParts.length ? versionParts[1] : '0.0.0.0';
        });
    }
    makeDirectory(dir) {
        return this.adbCommand('shell', { serial: this.deviceSerial, command: 'mkdir "' + dir + '"' });
    }
    updateConnectedStatus(status: ConnectionStatus) {
        this.deviceStatus = status;
        document.getElementById('connection-status').className = 'connection-status-' + status;
        switch (status) {
            case ConnectionStatus.TOOMANY:
                this.deviceStatusMessage = 'Warning: Please connect only one android device to your PC';
                break;
            case ConnectionStatus.CONNECTED:
                this.getPackages();
                this.deviceStatusMessage = 'Connected';
                break;
            case ConnectionStatus.DISCONNECTED:
                this.deviceStatusMessage = 'Disconnected: Connect/Reconnect your headset via USB';
                break;
            case ConnectionStatus.UNAUTHORIZED:
                this.deviceStatusMessage = 'Unauthorized: Put your headset on and click always allow and then OK';
                break;
        }
    }
    async connectedStatus() {
        let now = performance.now();
        if (now - this.lastConnectionCheck < this.pollInterval || this.isTransferring)
            return requestAnimationFrame(this.connectedStatus.bind(this));
        this.lastConnectionCheck = now;
        return this.adbCommand('listDevices')
            .then((devices: any) => devices.filter(device => device.type !== 'offline'))
            .then(devices => {
                if (devices.length === 1) {
                    this.deviceSerial = devices[0].id;
                    if (devices[0].type === 'device') {
                        return ConnectionStatus.CONNECTED;
                    } else {
                        return ConnectionStatus.UNAUTHORIZED;
                    }
                } else {
                    if (devices.length > 1) {
                        return ConnectionStatus.TOOMANY;
                    } else {
                        return ConnectionStatus.DISCONNECTED;
                    }
                }
            })
            .then(status => {
                this.updateConnectedStatus(status);
                requestAnimationFrame(this.connectedStatus.bind(this));
            })
            .catch(err => {
                requestAnimationFrame(this.connectedStatus.bind(this));
            });
    }
    adbCommand(command: string, settings?, callback?) {
        return new Promise<any>((resolve, reject) => {
            this.adbResolves[command] = { resolve, reject, callback };
            this.appService.electron.ipcRenderer.send('adb-command', { command, settings });
        });
    }
    async setupAdb() {
        if (!this.isAdbDownloaded()) {
            await this.downloadTools();
        }
        this.appService.electron.ipcRenderer.on('adb-command', (event, arg: any) => {
            if (this.adbResolves[arg.command]) {
                if (arg.status && this.adbResolves[arg.command].callback) {
                    this.adbResolves[arg.command].callback(arg.status);
                } else if (arg.error) {
                    this.adbResolves[arg.command].reject(arg.error);
                } else {
                    this.adbResolves[arg.command].resolve(arg.resp);
                }
            }
        });
        this.adbCommand('setupAdb', {
            adbPath: this.appService.path.join(this.adbPath, this.getAdbBinary()),
        });
    }
    isAdbDownloaded() {
        return this.doesFileExist(this.adbPath);
    }

    doesFileExist(path) {
        try {
            return this.appService.fs.existsSync(path);
        } catch (err) {
            return false;
        }
    }
    getAdbBinary() {
        switch (this.appService.os.platform()) {
            case 'win32':
                return 'adb.exe';
            default:
                return 'adb';
        }
    }
    async downloadTools() {
        let url = 'https://dl.google.com/android/repository/platform-tools-latest-';
        this.spinnerService.showLoader();
        this.spinnerService.setMessage('Downloading/Extracting ADB...');
        console.log('downloading adb');
        return new Promise((resolve, reject) => {
            this.appService
                .downloadFile(url + 'windows.zip', url + 'linux.zip', url + 'darwin.zip', url => this.adbPath + '.zip')
                .then(path =>
                    this.appService.extract(path, { dir: this.appService.appData }, error => {
                        this.spinnerService.hideLoader();
                        if (error) {
                            reject(error);
                        } else {
                            this.appService.fs.unlink(path, err => {
                                if (err) return reject(err);
                                resolve();
                            });
                        }
                    })
                );
        });
    }
    getFilenameDate() {
        return JSON.stringify(new Date())
            .split('"')
            .join('')
            .split(':')
            .join('-')
            .trim();
    }
    getPackageLocation(packageName) {
        return this.adbCommand('shell', { serial: this.deviceSerial, command: 'pm list packages -f ' + packageName }).then(res => {
            let parts = res.split(':');
            if (parts.length > 1) {
                return parts[1].split('=')[0];
            } else {
                return false;
            }
        });
    }
    async makeBackupFolders(packageName: string) {
        let mainBackupPath = this.appService.path.join(this.appService.appData, 'backups', packageName);
        return this.appService
            .mkdir(mainBackupPath)
            .then(() => this.appService.mkdir(this.appService.path.join(mainBackupPath, 'apks')))
            .then(() => this.appService.mkdir(this.appService.path.join(mainBackupPath, 'data')));
    }
    async getBackups(packageName: string) {
        await this.makeBackupFolders(packageName);
        let backupPath = this.appService.path.join(this.appService.appData, 'backups', packageName, 'apks');
        return this.appService.fs
            .readdirSync(backupPath)
            .map(file => this.appService.path.join(backupPath, file))
            .filter(file => !this.appService.fs.lstatSync(file).isDirectory() && this.appService.path.extname(file) === '.apk');
    }
    async getDataBackups(packageName: string) {
        await this.makeBackupFolders(packageName);
        let backupPath = this.appService.path.join(this.appService.appData, 'backups', packageName, 'data');
        return this.appService.fs
            .readdirSync(backupPath)
            .map(folder => this.appService.path.join(backupPath, folder))
            .filter(folder => this.appService.fs.lstatSync(folder).isDirectory());
    }
    async backupPackage(apkPath, packageName) {
        this.spinnerService.showLoader();
        this.spinnerService.setMessage('Backing Up - 0MB');
        this.isTransferring = true;
        let version = await this.getPackageInfo(packageName);
        if (!version) {
            this.spinnerService.hideLoader();
            this.statusService.showStatus('APK not found, is the app installed? ' + packageName, true);
            return Promise.reject('APK not found, is the app installed? ');
        }
        let savePath = this.appService.path.join(
            this.appService.appData,
            'backups',
            packageName,
            'apks',
            this.getFilenameDate() + '_' + version.trim() + '.apk'
        );
        return this.makeBackupFolders(packageName)
            .then(() =>
                this.adbCommand('pull', { serial: this.deviceSerial, path: apkPath, savePath: savePath }, stats => {
                    this.spinnerService.setMessage('Backing Up - ' + Math.round(stats.bytesTransferred / 1024 / 1024) + 'MB');
                })
            )
            .then(() => {
                this.spinnerService.hideLoader();
                this.isTransferring = false;
                this.statusService.showStatus(
                    packageName + ' backed up to ' + this.appService.path.basename(savePath) + ' successfully!!'
                );
                return savePath;
            })
            .catch(e => {
                this.spinnerService.hideLoader();
                this.isTransferring = false;
                this.statusService.showStatus(e.message ? e.message : e.toString(), true);
            });
    }
    installAPK(filePath: string, isLocal?: boolean, shouldUninstall?: boolean) {
        if (this.deviceStatus !== ConnectionStatus.CONNECTED) {

            this.statusService.showStatus('Apk install failed: No device connected!', true);
            return Promise.reject('Apk install failed: No device connected!');
        }
        this.spinnerService.setMessage('Installing Apk...<br>' + filePath);
        this.spinnerService.showLoader();
        return this.adbCommand('install', { serial: this.deviceSerial, path: filePath, isLocal: !!isLocal }, status => {
            console.log(status);
            this.spinnerService.setMessage(
                status.percent === 1
                    ? 'Installing Apk...<br>' + filePath
                    : 'Downloading APK:<br>' + filePath + '<br>' + Math.round(status.percent * 100) + '%'
            );
        })
            .then(r => {
                this.spinnerService.hideLoader();
                this.statusService.showStatus('APK file installed ok!! ' + filePath);
            })
            .catch(e => {
                if (e.code && shouldUninstall) {
                    return this.uninstallAPK('com.beatgames.beatsaber').then(() => this.installAPK(filePath, isLocal));
                }
                this.spinnerService.hideLoader();
                this.statusService.showStatus(e.message ? e.message : e.code ? e.code : e.toString(), true);
            });
    }
    uninstallAPK(pkg) {
        this.spinnerService.setMessage('Uninstalling ' + pkg);
        this.spinnerService.showLoader();
        return this.adbCommand('uninstall', { serial: this.deviceSerial, packageName: pkg })
            .then(() => {
                this.spinnerService.hideLoader();
                this.statusService.showStatus('APK uninstalled!!');
            })
            .catch(e => {
                this.spinnerService.hideLoader();
                this.statusService.showStatus(e.message ? e.message : e.code ? e.code : e.toString(), true);
            });
    }
    makeFolder(files) {
        if (!files.length) return null;
        let f: any = files.shift();
        this.spinnerService.setMessage('Making folder: <br>' + f.saveName);
        return this.appService.mkdir(f.saveName).then(() => this.makeFolder(files));
    }
    downloadFile(files) {
        if (!files.length) return;
        let f: any = files.shift();
        return this.adbCommand('pull', { serial: this.deviceSerial, path: f.name, savePath: f.saveName }, stats => {
            this.spinnerService.setMessage(
                'File downloading: ' +
                    this.appService.path.basename(f.name) +
                    ' <br>' +
                    Math.round((stats.bytesTransferred / 1024 / 1024) * 100) / 100 +
                    'MB'
            );
        }).then(r => this.downloadFile(files));
    }
    async getFoldersRecursive(root: string) {
        return this.getFolders(root).then(entries => {
            entries.forEach(f => {
                f.name = this.appService.path.posix.join(root, f.name);
            });
            this.files = this.files.concat(entries);
            let folders = entries.filter(f => !f.__isFile);
            let recurse = () => {
                if (!folders.length) return null;
                let folder = folders.shift();
                return this.getFoldersRecursive(folder.name).then(() => recurse());
            };
            return recurse();
        });
    }
    async getLocalFoldersRecursive(root: string) {
        return new Promise(resolve => {
            this.appService.fs.readdir(root, async (err, entries) => {
                entries = entries.map(f => {
                    let name = this.appService.path.join(root, f);
                    return { name: name, __isFile: !this.appService.fs.statSync(name).isDirectory() };
                });
                this.localFiles = this.localFiles.concat(entries);
                let folders = entries.filter(f => !f.__isFile);
                let recurse = () => {
                    if (!folders.length) return Promise.resolve();
                    let folder = folders.shift();
                    return this.getLocalFoldersRecursive(folder.name).then(() => recurse());
                };
                return recurse().then(() => resolve());
            });
        });
    }
    async uploadFile(files) {
        if (!files.length) return;
        let f: any = files.shift();
        return this.adbCommand('push', { serial: this.deviceSerial, path: f.name, savePath: f.savePath }, stats => {
            this.spinnerService.setMessage(
                'File uploading: ' +
                    this.appService.path.basename(f.name) +
                    ' <br>' +
                    Math.round((stats.bytesTransferred / 1024 / 1024) * 100) / 100 +
                    'MB'
            );
        }).then(r => this.uploadFile(files));
    }
    async restoreDataBackup(packageName: string, folderName: string) {
        this.spinnerService.setMessage('Restoring Backup...');
        this.spinnerService.showLoader();
        let packageBackupPath = this.appService.path.join(
            this.appService.appData,
            'backups',
            packageName,
            'data',
            folderName,
            'files'
        );
        if (this.appService.fs.existsSync(packageBackupPath)) {
            this.localFiles = [];
            await this.getLocalFoldersRecursive(packageBackupPath)
                .then(() => {
                    this.localFiles.forEach(file => {
                        file.savePath = this.appService.path.posix.join(
                            '/sdcard/Android/data/' + packageName + '/files',
                            file.name
                                .replace(packageBackupPath, '')
                                .split('\\')
                                .join('/')
                        );
                    });
                    return this.uploadFile(this.localFiles.filter(f => f.__isFile));
                })
                .then(() => this.spinnerService.hideLoader());
        }
        let obbBackupPath = this.appService.path.join(this.appService.appData, 'backups', packageName, 'data', folderName, 'obb');
        if (this.appService.fs.existsSync(obbBackupPath)) {
            this.appService.fs.readdir(obbBackupPath, async (err, entries) => {
                for (let i = 0; i < entries.length; i++) {
                    this.spinnerService.showLoader();
                    await this.adbCommand(
                        'push',
                        {
                            serial: this.deviceSerial,
                            path: this.appService.path.join(obbBackupPath, entries[i]),
                            savePath: '/sdcard/Android/obb/' + packageName + '/' + entries[i],
                        },
                        stats => {
                            this.spinnerService.setMessage(
                                'File uploading: ' +
                                    entries[i] +
                                    ' <br>' +
                                    Math.round((stats.bytesTransferred / 1024 / 1024) * 100) / 100 +
                                    'MB'
                            );
                        }
                    );
                    this.spinnerService.hideLoader();
                }
            });
        }
    }
    async makeDataBackup(packageName: string) {
        this.spinnerService.setMessage('Starting Backup...');
        this.spinnerService.showLoader();
        let folderName = this.getFilenameDate();
        let packageBackupPath = this.appService.path.join(this.appService.appData, 'backups', packageName, 'data', folderName);
        this.files = [];
        await this.adbCommand('stat', { serial: this.deviceSerial, path: '/sdcard/Android/data/' + packageName })
            .then(() =>
                this.adbCommand('stat', { serial: this.deviceSerial, path: '/sdcard/Android/data/' + packageName + '/files/' })
            )
            .then(() => {
                return this.getFoldersRecursive('/sdcard/Android/data/' + packageName + '/files/')
                    .then(() => this.appService.mkdir(packageBackupPath))
                    .then(() => this.appService.mkdir(this.appService.path.join(packageBackupPath, 'files')))
                    .then(
                        () =>
                            (this.files = this.files.map(f => {
                                f.saveName = this.appService.path.join(
                                    packageBackupPath,
                                    f.name.replace('/sdcard/Android/data/' + packageName, '')
                                );
                                return f;
                            }))
                    )
                    .then(() => this.makeFolder(this.files.filter(f => !f.__isFile)))
                    .then(() => this.downloadFile(this.files.filter(f => f.__isFile)))
                    .catch(e => {
                        this.spinnerService.hideLoader();
                        this.statusService.showStatus(e.toString(), true);
                    });
            })
            .catch(e => {});
        this.spinnerService.showLoader();
        await this.adbCommand('stat', { serial: this.deviceSerial, path: '/sdcard/Android/obb/' + packageName })
            .then(() => this.appService.mkdir(this.appService.path.join(packageBackupPath, 'obb')))
            .then(() => this.getFolders('/sdcard/Android/obb/' + packageName))
            .then(files =>
                files
                    .map(f => {
                        f.name = this.appService.path.posix.join('/sdcard/Android/obb/' + packageName, f.name);
                        f.saveName = this.appService.path.join(
                            packageBackupPath,
                            'obb',
                            f.name.replace('/sdcard/Android/obb/' + packageName, '')
                        );
                        return f;
                    })
                    .filter(f => f.__isFile)
            )
            .then(files => this.downloadFile(files))
            .then(() => {
                this.spinnerService.hideLoader();
                this.statusService.showStatus('Data for app ' + packageName + ' backed up to ' + packageBackupPath);
            })
            .catch(e => {
                this.spinnerService.hideLoader();
                this.statusService.showStatus('Data for app ' + packageName + ' backed up to ' + packageBackupPath);
            });
    }
    async hasSDFolder(name: string, packageName: string) {
        let folders = await this.getFolders('/sdcard/Android/' + name + '/');
        return !!~folders.map(d => d.name).indexOf(packageName);
    }
    async getFolders(root) {
        return this.adbCommand('readdir', { serial: this.deviceSerial, path: root }).catch(e =>
            this.statusService.showStatus(e.toString(), true)
        );
    }
    installLocalObb(filepath: string, dontCatchError = false, cb = null) {
        let filename = this.appService.path.basename(filepath);
        let packageId = filename.match(/main.[0-9]{1,}.([a-z]{1,}.[A-z]{1,}.[A-z]{1,}).obb/)[1];
        let p = this.adbCommand(
            'push',
            {
                serial: this.deviceSerial,
                path: filepath,
                savePath: `/sdcard/Android/obb/${packageId}/${filename}`,
            },
            stats => {
                this.spinnerService.setMessage(
                    'File uploading: ' + filename + ' <br>' + Math.round((stats.bytesTransferred / 1024 / 1024) * 100) / 100 + 'MB'
                );
            }
        );
        if (cb) {
            cb();
        }
        if (!dontCatchError) {
            p = p.catch(e => {
                console.log('here');
                this.spinnerService.hideLoader();
                this.statusService.showStatus(e.toString(), true);
            });
        }
        return p;
    }
    installLocalZip(filepath, dontCatchError, cb) {
        const typeBasedActions = {
            '.apk': function(filepath, bind) {
                this.installAPK(filepath, true);
            },
            '.obb': function(filepath, bind) {
                if (this.appService.path.basename(filepath).match(/main.[0-9]{1,}.[a-z]{1,}.[A-z]{1,}.[A-z]{1,}.obb/)) {
                    this.installLocalObb(filepath);
                } else {
                    console.log('Invalid OBB');
                }
            },
        };

        this.cleanUpFolder();
        this.appService.extract(filepath, { dir: this.appService.path.join(this.appService.appData, 'tmp') }, extractErr => {
            if (!extractErr) {
                console.log('Extracted Zip');
                this.appService.fs.readdir(this.appService.path.join(this.appService.appData, 'tmp'), (readErr, files) => {
                    let installableFiles = Object.keys(files).filter((val, index) => {
                        return Object.keys(typeBasedActions).includes(this.appService.path.extname(files[index]));
                    });
                    installableFiles.forEach(file => {
                        typeBasedActions[this.appService.path.extname(filepath)](filepath, this);
                    });
                });
            } else {
                console.warn(extractErr);
            }
        });
        cb();
    }
    cleanUpFolder(folderPath = this.appService.path.join(this.appService.appData, 'tmp')) {
        this.appService.fs.readdir(folderPath, (readErr, files) => {
            files.forEach((val, index) => {
                this.appService.fs.unlink(folderPath + val, delErr => {
                    if (delErr) {
                        console.warn(delErr);
                    }
                });
            });
        });
    }
}
