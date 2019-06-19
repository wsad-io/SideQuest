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
    client: any;
    adbPath: string;
    devicePackages: string[] = [];
    deviceSerial: string;
    lastConnectionCheck: number;
    deviceStatus: ConnectionStatus = ConnectionStatus.UNAUTHORIZED;
    deviceStatusMessage: string = 'Connecting...';
    pollInterval: number = 1000 * 5;
    savePath: string;
    constructor(
        public appService: AppService,
        private spinnerService: LoadingSpinnerService,
        private statusService: StatusBarService
    ) {
        this.lastConnectionCheck = performance.now(); //-this.pollInterval;
        this.ADB = (<any>window).require('adbkit');
        this.adbPath = appService.path.join(appService.appData, 'platform-tools');

        this.savePath = localStorage.getItem('save-path') || this.appService.path.join(this.appService.appData, 'tmp');
        this.setSavePath();
        this.setupAdb().then(() => this.connectedStatus());
    }
    installFile(filepath) {
        this.spinnerService.showLoader();
        let extention = this.appService.path.extname(filepath);
        switch (extention) {
            case '.apk':
                return this.installLocalApk(filepath).then(() => this.spinnerService.hideLoader());
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
    setSavePath() {
        localStorage.setItem('save-path', this.savePath);
    }
    getPackages() {
        if (!this.client || this.deviceStatus !== ConnectionStatus.CONNECTED) {
            return Promise.resolve();
        }
        return this.client.getPackages(this.deviceSerial).then(packages => {
            this.devicePackages = packages.sort((a, b) => {
                let textA = a.toUpperCase();
                let textB = b.toUpperCase();
                return textA < textB ? -1 : textA > textB ? 1 : 0;
            });
        });
    }
    getPackageInfo(packageName) {
        return this.client
            .shell(this.deviceSerial, 'yar' + packageName + '  | grep versionName')
            .then(this.ADB.util.readAll)
            .then(res => {
                let versionParts = res.toString().split('=');
                return versionParts.length ? versionParts[1] : '0.0.0.0';
            });
    }
    makeDirectory(dir) {
        return this.client.shell(this.deviceSerial, 'mkdir "' + dir + '"').then(this.ADB.util.readAll);
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
        if (now - this.lastConnectionCheck < this.pollInterval) return requestAnimationFrame(this.connectedStatus.bind(this));
        this.lastConnectionCheck = now;
        return this.client
            .listDevices()
            .then(devices => devices.filter(device => device.type !== 'offline'))
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
                console.warn(err);
                requestAnimationFrame(this.connectedStatus.bind(this));
            });
    }
    async setupAdb() {
        if (!this.isAdbDownloaded()) {
            await this.downloadTools();
        }
        this.client = this.ADB.createClient({
            bin: this.appService.path.join(this.adbPath, this.getAdbBinary()),
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
    shellCommand(command: string) {
        return this.client
            .shell(this.deviceSerial, command)
            .then(this.ADB.util.readAll)
            .catch(e => {
                this.statusService.showStatus(e.toString(), true);
            });
    }
    async downloadTools() {
        // document.getElementById('connection-status-message').innerHTML =
        //   'Please see the Setup screen to get started. - <a class="help-link">Setup</a> ';
        // setTimeout(() => {
        //   document.getElementById('connection-status-message').innerHTML =
        //     'Downloading ADB please wait...';
        // }, 3000);
        let url = 'https://dl.google.com/android/repository/platform-tools-latest-';
        return new Promise((resolve, reject) => {
            this.appService
                .downloadFile(url + 'windows.zip', url + 'linux.zip', url + 'darwin.zip', url => this.adbPath + '.zip')
                .then(path =>
                    this.appService.extract(path, { dir: this.appService.appData }, error => {
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
    getPackageLocation(packageName) {
        return this.client
            .shell(this.deviceSerial, 'pm list packages -f ' + packageName + '')
            .then(this.ADB.util.readAll)
            .then(res => {
                let parts = res.toString().split(':');
                if (parts.length > 1) {
                    return parts[1].split('=')[0];
                } else {
                    return false;
                }
            });
    }
    backupPackage(apkPath, packageName) {
        this.spinnerService.showLoader();
        this.spinnerService.setMessage('Backing Up - 0MB');
        return this.client.pull(this.deviceSerial, apkPath).then(
            transfer =>
                new Promise((resolve, reject) => {
                    let backup_save_path = this.appService.path.join(
                        this.appService.appData,
                        'apk-backups',
                        packageName +
                            '_' +
                            JSON.stringify(new Date())
                                .split('"')
                                .join('')
                                .split(':')
                                .join('-')
                                .trim() +
                            '.apk'
                    );
                    transfer.on('progress', stats => {
                        this.spinnerService.setMessage('Backing Up - ' + Math.round(stats.bytesTransferred / 1024 / 1024) + 'MB');
                    });
                    transfer.on('end', () => {
                        this.statusService.showStatus(packageName + ' backed up successfully!!');
                        this.spinnerService.hideLoader();
                        return resolve();
                    });
                    transfer.on('error', reject);
                    transfer.pipe(this.appService.fs.createWriteStream(backup_save_path));
                })
        );
    }
    installLocalApk(filepath: string, dontCatchError?: boolean) {
        let p = this.client.install(this.deviceSerial, this.appService.fs.createReadStream(filepath));
        if (!dontCatchError) {
            p = p.catch(e => {
                this.spinnerService.hideLoader();
                this.statusService.showStatus(e.toString(), true);
            });
        }
        return p;
    }
    installLocalObb(filepath: string, dontCatchError = false, cb = null) {
        let filename = this.appService.path.basename(filepath);
        let packageId = filename.match(/main.[0-9]{1,}.([a-z]{1,}.[A-z]{1,}.[A-z]{1,}).obb/)[1];
        let p = this.client
            .push(this.deviceSerial, this.appService.fs.createReadStream(filepath), `/sdcard/Android/obb/${packageId}/${filename}`)
            .then(
                transfer =>
                    new Promise((resolve, reject) => {
                        let text = 'Uploading Obb...';
                        let timer = setInterval(() => {
                            text = text + '.';
                            this.spinnerService.setMessage(text + '<br>This will take some time.');
                        }, 3000);
                        transfer.on('end', () => {
                            clearInterval(timer);
                            resolve();
                        });
                        transfer.on('error', () => {
                            clearInterval(timer);
                            reject();
                        });
                    })
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
                this.installLocalApk(filepath);
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
    installApk(url) {
        return this.client
            .install(
                this.deviceSerial,
                new this.appService.Readable().wrap(
                    this.appService.progress(this.appService.request(url), { throttle: 300 }).on('progress', state => {
                        this.spinnerService.setMessage('Downloading APK... ' + Math.round(state.percent * 100) + '%<br>' + url);
                    })
                )
            )
            .catch(e => {
                this.spinnerService.hideLoader();
                this.statusService.showStatus(e.toString(), true);
            });
    }
    uninstallApk(pkg) {
        this.spinnerService.setMessage('Uninstalling ' + pkg);
        this.spinnerService.showLoader();
        return this.client
            .uninstall(this.deviceSerial, pkg)
            .then(() => {
                this.spinnerService.hideLoader();
                this.statusService.showStatus('APK uninstalled!!');
            })
            .catch(e => {
                this.spinnerService.hideLoader();
                this.statusService.showStatus(e.toString(), true);
            });
    }
}
