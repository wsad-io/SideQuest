class Setup {
    constructor(app, callback) {
        this.app = app;
        this.devicePackages = [];
        this.deviceStatus = 'disconnected';
        this.deviceSerial = '';
        this.adbPath = path.join(appData, 'platform-tools');
        this.connection_refresh = document.getElementById('connection-refresh');
        this.connection_refresh_loading = document.getElementById(
            'connection-refresh-loading'
        );
    }
    async setup() {
        await this.setupAdb().then(async () => {
            this.updateConnectedStatus(await this.connectedStatus());
            setInterval(async () => {
                this.updateConnectedStatus(await this.connectedStatus());
            }, 5000);
        });
    }
    isAdbDownloaded() {
        return this.doesFileExist(this.adbPath);
    }
    doesFileExist(path) {
        try {
            return fs.existsSync(path);
        } catch (err) {
            return false;
        }
    }
    makeDirectory(dir) {
        return this.app.setup.adb.shell(
            this.app.setup.deviceSerial,
            'mkdir ' + dir
        );
    }
    updateConnectedStatus(status) {
        this.deviceStatus = status;
        document.getElementById('connection-status').className =
            'connection-status-' + status;
        let statusMessage = document.getElementById(
            'connection-status-message'
        );
        switch (status) {
            case 'too-many':
                statusMessage.innerHTML =
                    'Warning: Please connect only one android device to your PC - <a class="help-link">Setup</a>';
                break;
            case 'connected':
                statusMessage.innerHTML = 'Connected';
                break;
            case 'disconnected':
                statusMessage.innerHTML =
                    'Disconnected: Connect/Reconnect your headset via USB - <a class="help-link">Setup</a>';
                break;
            case 'unauthorized':
                statusMessage.innerHTML =
                    'Unauthorized: Put your headset on and click always allow and then OK - <a class="help-link">Setup</a>';
                break;
        }
        let help = document.querySelector('.help-link');
        if (help) {
            help.addEventListener('click', () => {
                this.app.openSetupScreen();
            });
        }
        if (this.deviceStatus !== 'connected') {
            document.getElementById('connection-ip-address').innerHTML = '';
            // this.app.enable_wifi.style.display = 'none';
        }
    }
    getPackageLocation(packageName) {
        return this.adb
            .shell(this.deviceSerial, 'pm list packages -f ' + packageName + '')
            .then(adb.util.readAll)
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
        this.app.toggleLoader(true);
        this.app.spinner.setMessage('Backing Up - 0MB');
        return this.app.setup.adb
            .pull(this.app.setup.deviceSerial, apkPath)
            .then(
                transfer =>
                    new Promise((resolve, reject) => {
                        let backup_save_path = path.join(
                            appData,
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
                            this.app.spinner.setMessage(
                                'Backing Up - ' +
                                    Math.round(
                                        stats.bytesTransferred / 1024 / 1024
                                    ) +
                                    'MB'
                            );
                        });
                        transfer.on('end', () => {
                            this.app.statusBar.showStatus(
                                packageName + ' backed up successfully!!'
                            );
                            this.app.toggleLoader(false);
                            return resolve();
                        });
                        transfer.on('error', reject);
                        transfer.pipe(fs.createWriteStream(backup_save_path));
                    })
            );
    }
    installLocalApk(filepath, dontCatchError) {
        let p = this.adb.install(
            this.deviceSerial,
            fs.createReadStream(filepath)
        );
        if (!dontCatchError) {
            p = p.catch(e => {
                this.app.toggleLoader(false);
                this.app.showStatus(e.toString(), true, true);
            });
        }
        return p;
    }
    installLocalObb(filepath, dontCatchError, cb = null) {
        let filename = path.basename(filepath);
        let packageId = filename.match(
            /main.[0-9]{1,}.([a-z]{1,}.[A-z]{1,}.[A-z]{1,}).obb/
        )[1];
        let p = this.adb
            .push(
                this.deviceSerial,
                fs.createReadStream(filepath),
                `/sdcard/Android/obb/${packageId}/${filename}`
            )
            .then(
                transfer =>
                    new Promise((resolve, reject) => {
                        let text = 'Uploading Obb...';
                        let timer = setInterval(() => {
                            text = text + '.';
                            this.app.spinner_loading_message.innerHTML =
                                text + '<br>This will take some time.';
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
                this.app.toggleLoader(false);
                this.app.showStatus(e.toString(), true, true);
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
                if (
                    path
                        .basename(filepath)
                        .match(
                            /main.[0-9]{1,}.[a-z]{1,}.[A-z]{1,}.[A-z]{1,}.obb/
                        )
                ) {
                    this.installLocalObb(filepath);
                } else {
                    console.log('Invalid OBB');
                }
            },
        };
        path.basename(filepath);
        this.cleanUpFolder();
        extract(filepath, { dir: path.join(appData, 'tmp') }, extractErr => {
            if (!extractErr) {
                console.log('Extracted Zip');
                fs.readdir(path.join(appData, 'tmp'), (readErr, files) => {
                    let installableFiles = Object.keys(files).filter(
                        (val, index) => {
                            return Object.keys(typeBasedActions).includes(
                                path.extname(files[index])
                            );
                        }
                    );
                    installableFiles.forEach(file => {
                        typeBasedActions[path.extname(filepath)](
                            filepath,
                            this
                        );
                    });
                });
            } else {
                console.warn(extractErr);
            }
        });
        cb();
    }
    cleanUpFolder(folderPath = path.join(appData, 'tmp')) {
        fs.readdir(folderPath, (readErr, files) => {
            files.forEach((val, index) => {
                fs.unlink(folderPath + val, delErr => {
                    if (delErr) {
                        console.warn(delErr);
                    }
                });
            });
        });
    }
    installApk(url) {
        return this.adb
            .install(this.deviceSerial, new Readable().wrap(request(url)))
            .catch(e => {
                this.app.toggleLoader(false);
                this.app.showStatus(e.toString(), true, true);
            });
    }
    uninstallApk(pkg) {
        this.app.spinner.setMessage('Uninstalling ' + pkg);
        this.app.toggleLoader(true);
        return this.adb
            .uninstall(this.deviceSerial, pkg)
            .then(() => {
                this.app.toggleLoader(false);
                this.app.showStatus('APK uninstalled!!');
            })
            .catch(e => {
                this.app.toggleLoader(false);
                this.app.showStatus(e.toString(), true, true);
            });
    }
    enableWifiMode() {
        if (this.showHideWifiButton()) {
            return this.adb
                .usb(this.deviceSerial)
                .then(() => this.adb.kill())
                .then(async () => {
                    setTimeout(
                        async () =>
                            this.updateConnectedStatus(
                                await this.connectedStatus()
                            ),
                        5000
                    );
                    alert('You can now reconnect the USB cable.');
                });
        } else {
            return this.adb
                .tcpip(this.deviceSerial, 5556)
                .then(() => this.adb.connect(this.deviceIp, 5556))
                .then(() => this.adb.kill())
                .then(() => {
                    setTimeout(
                        async () =>
                            this.updateConnectedStatus(
                                await this.connectedStatus()
                            ),
                        5000
                    );
                    alert('You can now disconnect the USB cable.');
                });
        }
    }
    getIpAddress() {
        //this.app.enable_wifi.style.display = 'block';
        return this.adb
            .shell(this.deviceSerial, 'ip route')
            .then(adb.util.readAll)
            .then(res => {
                let output_parts = res
                    .toString()
                    .trim()
                    .split(' ');
                this.deviceIp = output_parts[output_parts.length - 1];
                document.getElementById('connection-ip-address').innerHTML =
                    'Device IP<br>' + output_parts[output_parts.length - 1];
            });
    }
    showHideWifiButton() {
        if (this.deviceIp && this.deviceSerial === this.deviceIp + ':5556') {
            this.app.enable_wifi.innerText = 'USB Mode';
            return true;
        } else {
            this.app.enable_wifi.innerText = 'Wifi Mode';
            return false;
        }
    }
    async getFolders(root) {
        return this.app.setup.adb
            .shell(this.app.setup.deviceSerial, 'ls ' + root)
            .then(adb.util.readAll)
            .then(res => {
                return res
                    .toString()
                    .split('\n')
                    .reduce((a, b) => {
                        a = a.concat(
                            b
                                .split(' ')
                                .filter(d => d)
                                .map(d => d.trim())
                        );
                        return a;
                    }, []);
            });
    }
    getPackageInfo(packageName) {
        return this.adb
            .shell(
                this.deviceSerial,
                'dumpsys package ' + packageName + '  | grep versionName'
            )
            .then(adb.util.readAll)
            .then(res => {
                let versionParts = res.toString().split('=');
                return versionParts.length ? versionParts[1] : '0.0.0.0';
            });
    }
    getPackages() {
        return this.adb.getPackages(this.deviceSerial).then(packages => {
            this.devicePackages = packages.sort((a, b) => {
                let textA = a.toUpperCase();
                let textB = b.toUpperCase();
                return textA < textB ? -1 : textA > textB ? 1 : 0;
            });
        });
    }
    async setupAdb() {
        if (!this.isAdbDownloaded()) {
            await this.downloadTools();
        }
        this.adb = adb.createClient({
            bin: path.join(this.adbPath, this.getAdbBinary()),
        });
        //this.connection_refresh.addEventListener('click',async ()=>this.updateConnectedStatus(await this.connectedStatus()));
    }
    async connectedStatus() {
        // this.connection_refresh_loading.style.display = 'block';
        // this.connection_refresh.style.display = 'none';
        return this.adb
            .listDevices()
            .then(devices =>
                devices.filter(device => device.type !== 'offline')
            )
            .then(devices => {
                // setTimeout(()=>{
                //     this.connection_refresh_loading.style.display = 'none';
                //     this.connection_refresh.style.display = 'block';
                // },100);
                if (devices.length === 1) {
                    this.deviceSerial = devices[0].id;
                    if (devices[0].type === 'device') {
                        this.getPackages();
                        // this.getIpAddress()
                        //     .then(()=>this.showHideWifiButton());
                        return 'connected';
                    } else if (devices[0].type === 'offline') {
                        return 'disconnected';
                    } else {
                        return 'unauthorized';
                    }
                } else {
                    if (devices.length > 1) {
                        return 'too-many';
                    } else {
                        return 'disconnected';
                    }
                }
            })
            .catch(err => {
                console.log(err);
            });
    }
    getUserAgent() {
        const nodeString = `NodeJs/${process.version}`;
        const packageString = 'OpenStoreVR';
        const computerString = `Hostname/${os.hostname()} Platform/${os.platform()} PlatformVersion/${os.release()}`;
        return `${packageString} ${nodeString} ${computerString}`;
    }
    getAdbBinary() {
        switch (os.platform()) {
            case 'win32':
                return 'adb.exe';
            default:
                return 'adb';
        }
    }
    async downloadFile(winUrl, linUrl, macUrl, getPath, message) {
        const requestOptions = {
            timeout: 30000,
            'User-Agent': this.getUserAgent(),
        };
        let downloadUrl = linUrl;
        switch (os.platform()) {
            case 'win32':
                downloadUrl = winUrl;
                break;
            case 'darwin':
                downloadUrl = macUrl;
                break;
            case 'linux':
                downloadUrl = linUrl;
                break;
        }
        if (!downloadUrl) return;
        let downloadPath = getPath(downloadUrl);
        return new Promise((resolve, reject) => {
            progress(request(downloadUrl, requestOptions), { throttle: 300 })
                .on('error', error => {
                    console.log(`Request Error ${error}`);
                    reject(error);
                })
                .on('progress', state => {
                    this.app.spinner.setMessage(
                        'Downloading... ' +
                            Math.round(state.percent * 100) +
                            '%'
                    );
                    //console.log('progress', state);
                })
                .on('end', () => {
                    this.app.spinner.setMessage(
                        'Processing... <br>This might take 10 - 30 seconds.'
                    );
                    return resolve(downloadPath);
                })
                .pipe(fs.createWriteStream(downloadPath));
        });
    }
    async downloadTools() {
        document.getElementById('connection-status-message').innerHTML =
            'Please see the Setup screen to get started. - <a class="help-link">Setup</a> ';
        setTimeout(() => {
            document.getElementById('connection-status-message').innerHTML =
                'Downloading ADB please wait...';
        }, 3000);
        let url =
            'https://dl.google.com/android/repository/platform-tools-latest-';
        return new Promise((resolve, reject) => {
            this.downloadFile(
                url + 'windows.zip',
                url + 'linux.zip',
                url + 'darwin.zip',
                url => this.adbPath + '.zip'
            ).then(path =>
                extract(path, { dir: appData }, error => {
                    if (error) {
                        reject(error);
                    } else {
                        fs.unlink(path, err => {
                            if (err) return reject(err);
                            resolve();
                        });
                    }
                })
            );
        });
        // const WINDOWS_URL = 'https://dl.google.com/android/repository/platform-tools-latest-windows.zip';
        // const LINUX_URL = 'https://dl.google.com/android/repository/platform-tools-latest-linux.zip';
        // const OSX_URL = 'https://dl.google.com/android/repository/platform-tools-latest-darwin.zip';
        // let downloadUrl = LINUX_URL;
        // switch (os.platform()) {
        //     case 'win32':
        //         downloadUrl = WINDOWS_URL;
        //         break;
        //     case 'darwin':
        //         downloadUrl = OSX_URL;
        //         break;
        //     case 'linux':
        //         downloadUrl = LINUX_URL;
        //         break;
        // }
        // let zipPath = this.adbPath+".zip";
        // const requestOptions = {timeout: 30000, 'User-Agent': this.getUserAgent()};
        // return new Promise((resolve,reject)=>{
        //     request(downloadUrl, requestOptions)
        //         .on('error', (error)  => {
        //             debug(`Request Error ${error}`);
        //             reject(error);
        //         })
        //         .pipe(fs.createWriteStream(zipPath))
        //         .on('finish', ()  => {
        //             extract(zipPath, {dir: appData},(error) => {
        //                 if(error) {
        //                     reject(error);
        //                 }else{
        //                     fs.unlink(zipPath, (err) => {
        //                         resolve();
        //                     });
        //                 }
        //             });
        //         });
        // })
    }
}
