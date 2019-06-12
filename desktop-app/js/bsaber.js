class Bsaber {
    constructor(app) {
        this.app = app;
        this.customLevels =
            '/sdcard/Android/data/com.beatgames.beatsaber/files/CustomLevels/';
        this.beatSaberPackage = 'com.beatgames.beatsaber';
        this.beatBackupPath = path.join(
            appData,
            'bsaber-backups',
            this.beatSaberPackage
        );
        let bsVersions = localStorage.getItem('beat-saber-version');
        try {
            this.supportedBeatSaberVersions = bsVersions
                ? JSON.parse(bsVersions)
                : ['1.1.0'];
        } catch (e) {
            localStorage.setItem(
                'beat-saber-version',
                JSON.stringify(['1.1.0'])
            );
            this.supportedBeatSaberVersions = ['1.1.0']; //'1.0.2','1.0.1','1.0.0'
        }
        this.questSaberPatchVersion =
            localStorage.getItem('quest-saber-patch-version') || 'v0.6.2';
    }
    saveJson(jSon) {
        let _jSon = {
            apkPath: jSon.apkPath,
            sign: true,
            patchSignatureCheck: true,
            levels: {},
            packs: [],
            exitAfterward: true,
            colors: {
                colorA: jSon.colors.colorA,
                colorB: jSon.colors.colorB,
            },
            replaceText: jSon.replaceText,
        };
        jSon.packs.forEach((p, i) => {
            let pack = {
                id: p.id === '__default_pack' ? p.id : 'pack_' + i,
                name: p.name,
                coverImagePath: p.coverImagePath,
                levelIDs: p.levelIDs.map(l => {
                    _jSon.levels[l.id + '_' + l.name] = l.path;
                    return l.id + '_' + l.name;
                }),
            };
            _jSon.packs.push(pack);
        });
        fs.writeFileSync(
            path.join(appData, '__json.json'),
            JSON.stringify(_jSon)
        );
    }
    getAppJson() {
        let patched_file = path.join(appData, 'bsaber-base_patched.apk');
        let songKeys = this.app.songs.map(s => s.id + '_' + s.name);
        let defaultJSON = {
            apkPath: patched_file,
            sign: true,
            patchSignatureCheck: true,
            levels: {},
            packs: [
                {
                    // Must be unique between packs but doesn't need to be consistent
                    id: '__default_pack',
                    // Display name of the pack
                    name: 'Custom Songs',
                    // Image file for the cover that will be displayed for the pack
                    coverImagePath: path.join(
                        __dirname,
                        'default-pack-cover.png'
                    ),
                    // List of level IDs in the pack in the order you want them displayed.
                    // Each levelID can be in multiple packs if you want.
                    levelIDs: this.app.songs,
                },
            ],
            exitAfterward: true,
            colors: {
                // A is the red/left hand by default, but left-handed people might use the setting to switch hands
                colorA: null,
                // null for either resets to the default color for that saber
                colorB: null,
            },
            replaceText: {
                // See https://github.com/sc2ad/QuestModdingTools/blob/master/BeatSaberLocale.txt for
                //"BUTTON_PLAY": "GO!",
            },
        };
        this.app.songs.forEach(song => {
            defaultJSON.levels[song.id + '_' + song.name] = song.path;
        });
        let jsonFile = path.join(appData, '__json.json');
        let data = defaultJSON;
        if (fs.existsSync(jsonFile)) {
            try {
                data = fs.readFileSync(jsonFile, 'utf8');
                data = JSON.parse(data);
                if (data.ensureInstalled) {
                    data.levels = data.ensureInstalled;
                    delete data.ensureInstalled;
                }
                if (!data.colors) {
                    data.colors = defaultJSON.colors;
                }
                if (!data.replaceText) {
                    data.replaceText = defaultJSON.replaceText;
                }
                if (!data.packs) {
                    data.packs = [defaultJSON.packs[0]];
                }
                data.packs.forEach(d => {
                    d.levelIDs = d.levelIDs
                        .map(l => {
                            let index = songKeys.indexOf(l);
                            if (index > -1) {
                                return this.app.songs[index];
                            } else {
                                return null;
                            }
                        })
                        .filter(l => l);
                });
            } catch (e) {
                console.log(e);
                this.app.showStatus(
                    'Error Loading JSON file; __json.json',
                    true,
                    true
                );
            }
        } else {
            fs.writeFileSync(
                path.join(appData, '__json.json'),
                JSON.stringify(data)
            );
        }
        return data;
    }
    setExecutable(path) {
        return new Promise(resolve => {
            const ls = spawn('chmod', ['+x', path]);
            ls.on('close', code => {
                resolve();
            });
        });
    }
    convertSong(dir) {
        return new Promise(resolve => {
            const ls = spawn(this.converterBinaryPath, [
                path.join(dir, 'info.json'),
            ]);
            ls.on('close', code => {
                resolve();
            });
        });
    }
    questSaberPatch() {
        return new Promise((resolve, reject) => {
            const exec = require('child_process').exec;
            exec(
                '"' +
                    this.questSaberBinaryPath +
                    '" < "' +
                    path.join(appData, '__json.json') +
                    '"',
                function(err, stdout, stderr) {
                    if (err) {
                        return reject(err);
                    }
                    try {
                        stdout = JSON.parse(stdout);
                        console.log('QuestSaberPatch Response: ', stdout);
                    } catch (e) {
                        console.warn('QuestSaberPatch Failure: ', stdout);
                        return reject('JSON parse error from jsonApp2.exe');
                    }
                    if (stderr) return reject(stderr);
                    return resolve(stdout);
                }
            );
        });
    }
    async patchAPK() {
        return new Promise((resolve, reject) => {
            let patched_file = path.join(appData, 'bsaber-base_patched.apk');
            if (!this.app.setup.doesFileExist(patched_file)) {
                if (!this.resetPatched()) {
                    return reject('Could not copy base file, Does not exist!');
                }
            }
            this.questSaberPatch()
                .then(resolve)
                .catch(reject);
        });
    }
    async getBSandQSPVersions() {
        const jsonUrl =
            'https://raw.githubusercontent.com/the-expanse/SideQuest/master/vendor_versions.txt';
        return new Promise((resolve, reject) => {
            request(jsonUrl, (error, response, body) => {
                if (error) {
                    return reject(error);
                } else {
                    try {
                        let repo_body = JSON.parse(body);
                        resolve(repo_body);
                    } catch (e) {
                        return reject('JSON parse Error');
                    }
                }
            });
        })
            .then(resp => {
                if (resp['beat-saber'] && resp['beat-saber'].length) {
                    this.supportedBeatSaberVersions = resp['beat-saber'];
                    localStorage.setItem(
                        'beat-saber-version',
                        JSON.stringify(resp['beat-saber'])
                    );
                }
                if (resp['quest-saber-patch']) {
                    this.questSaberPatchVersion = resp['quest-saber-patch'];
                    localStorage.setItem(
                        'quest-saber-patch-version',
                        resp['quest-saber-patch']
                    );
                }
                if (resp['sidequest']) {
                    if (resp['sidequest'] !== this.app.appVersionName) {
                        document.querySelector(
                            '.update-available'
                        ).style.display = 'block';
                    }
                }
            })
            .catch(e => {
                console.warn(e);
            });
    }
    async downloadQuestSaberPatch() {
        await this.getBSandQSPVersions();
        let url =
            'https://github.com/trishume/QuestSaberPatch/releases/download/' +
            this.questSaberPatchVersion +
            '/questsaberpatch-';
        let name = 'questsaberpatch/jsonApp2.exe';
        switch (os.platform()) {
            case 'win32':
                name = 'questsaberpatch/jsonApp2.exe';
                break;
            case 'darwin':
                name = 'questsaberpatch/jsonApp2';
                break;
            case 'linux':
                name = 'questsaberpatch/jsonApp2';
                break;
        }
        let downloadPath = path.join(appData, 'saber-quest-patch', name);
        this.questSaberBinaryPath = downloadPath;
        if (this.app.setup.doesFileExist(downloadPath))
            return Promise.resolve();
        return new Promise((resolve, reject) => {
            this.app.setup
                .downloadFile(
                    url + 'windows.zip',
                    url + 'linux.zip',
                    url + 'osx.zip',
                    downloadUrl => {
                        let urlParts = downloadUrl.split('/');
                        return path.join(
                            appData,
                            urlParts[urlParts.length - 1]
                        );
                    }
                )
                .then(_path => {
                    let callback = error => {
                        if (error) return reject(error);
                        fs.unlink(_path, err => {
                            // if(err) return reject(err);
                            if (
                                os.platform() === 'darwin' ||
                                os.platform() === 'linux'
                            ) {
                                this.setExecutable(
                                    this.questSaberBinaryPath
                                ).then(() => resolve());
                            } else {
                                return resolve();
                            }
                        });
                    };

                    extract(
                        _path,
                        { dir: path.join(appData, 'saber-quest-patch') },
                        callback
                    );
                });
        });
    }
    downloadConverterBinary() {
        let url =
            'https://github.com/lolPants/songe-converter/releases/download/v0.4.3/songe-converter';
        let name = '.exe';
        switch (os.platform()) {
            case 'win32':
                name = '.exe';
                break;
            case 'darwin':
                name = '-mac';
                break;
            case 'linux':
                name = '';
                break;
        }
        let urlParts = (url + name).split('/');
        let downloadPath = path.join(appData, urlParts[urlParts.length - 1]);
        if (this.app.setup.doesFileExist(downloadPath)) {
            this.converterBinaryPath = downloadPath;
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            this.app.setup
                .downloadFile(url + '.exe', url, url + '-mac', downloadUrl => {
                    let urlParts = downloadUrl.split('/');
                    return path.join(appData, urlParts[urlParts.length - 1]);
                })
                .then(path => {
                    this.converterBinaryPath = path;
                    if (
                        os.platform() === 'darwin' ||
                        os.platform() === 'linux'
                    ) {
                        return this.setExecutable(
                            this.converterBinaryPath
                        ).then(() => resolve());
                    } else {
                        return resolve();
                    }
                });
        });
    }
    removeSong(id) {
        //return this.app.setup.adb.shell(this.app.setup.deviceSerial,'rm -r '+path.posix.join(this.customLevels,id));
        this.deleteFolderRecursive(path.join(appData, 'bsaber', id));
        return Promise.resolve();
    }
    deleteFolderRecursive(path) {
        if (fs.existsSync(path)) {
            fs.readdirSync(path).forEach(file => {
                let curPath = path + '/' + file;
                if (fs.lstatSync(curPath).isDirectory()) {
                    // recurse
                    this.deleteFolderRecursive(curPath);
                } else {
                    // delete file
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    }
    setBeatVersion(skipCheck) {
        return this.app.setup
            .getPackageInfo(this.beatSaberPackage)
            .then(version => {
                this.beatSaberVersion = (version || '').trim();
                let visualVersion = document.querySelector(
                    '.beat-saber-version'
                );
                if (
                    !~this.supportedBeatSaberVersions.indexOf(
                        this.beatSaberVersion
                    )
                ) {
                    visualVersion.innerHTML =
                        '<span style="background-color:red;color:white">WRONG BEAT SABER VERSION: ' +
                        this.beatSaberVersion +
                        '</span>';
                    if (!skipCheck)
                        throw new Error('Wrong beat saber version installed!');
                } else {
                    visualVersion.innerHTML =
                        'Beat Saber Version: ' + this.beatSaberVersion;
                }
            });
    }
    resetPatched() {
        if (
            this.app.setup.doesFileExist(path.join(appData, 'bsaber-base.apk'))
        ) {
            fs.copyFileSync(
                path.join(appData, 'bsaber-base.apk'),
                path.join(appData, 'bsaber-base_patched.apk')
            );
            return true;
        }
    }
    async resetBase() {
        if (this.app.setup.deviceStatus !== 'connected') {
            this.app.showStatus(
                'Cant reset base, no Device Connected!!',
                true,
                true
            );
            return Promise.resolve();
        }
        if (!this.isBeatSaberInstalled()) {
            this.app.showStatus('Beat Saber not installed!!', true, true);
            return Promise.resolve();
        }
        if (fs.existsSync(path.join(appData, 'bsaber-base.apk'))) {
            fs.unlinkSync(path.join(appData, 'bsaber-base.apk'));
        }
        return this.backUpBeatSaberBinary();
    }
    async backUpBeatSaberBinary() {
        if (!~this.app.setup.devicePackages.indexOf(this.beatSaberPackage))
            return Promise.reject('Not installed');
        this.app.toggleLoader(true);
        this.beatSaberVersion = '0.0.0.0';
        this.app.spinner.setMessage('Backing Up - 0MB');
        return this.setBeatVersion(true)
            .then(() =>
                this.app.setup.adb.shell(
                    this.app.setup.deviceSerial,
                    'pm path ' + this.beatSaberPackage
                )
            )
            .then(adb.util.readAll)
            .then(res =>
                res
                    .toString()
                    .trim()
                    .substr(8)
            )
            .then(apkPath =>
                this.app.setup.adb.pull(this.app.setup.deviceSerial, apkPath)
            )
            .then(
                transfer =>
                    new Promise((resolve, reject) => {
                        let backup_save_path =
                            this.beatBackupPath +
                            this.beatSaberVersion.trim() +
                            '_' +
                            JSON.stringify(new Date())
                                .split('"')
                                .join('')
                                .split(':')
                                .join('-')
                                .trim() +
                            '.apk';
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
                            setTimeout(() => {
                                if (
                                    !this.app.setup.doesFileExist(
                                        path.join(appData, 'bsaber-base.apk')
                                    )
                                ) {
                                    fs.copyFileSync(
                                        backup_save_path,
                                        path.join(appData, 'bsaber-base.apk')
                                    );
                                }
                                return resolve();
                            }, 5000);
                        });
                        transfer.on('error', reject);
                        transfer.pipe(fs.createWriteStream(backup_save_path));
                    })
            )
            .then(() => {
                this.app.showStatus('Backup made successfully!');
                this.app.toggleLoader(false);
            })
            .catch(e => {
                this.app.showStatus(e.toString(), true, true);
                this.app.toggleLoader(false);
            });
    }
    async runQuestSaberPatch(songs) {
        if (!~this.app.setup.devicePackages.indexOf(this.beatSaberPackage))
            return Promise.reject('Not installed');
        if (!songs.length) return Promise.reject('No songs selected');
        return this.setBeatVersion(true)
            .then(() => this.patchAPK())
            .catch(e => {
                this.app.showStatus(e.toString(), true, true);
            });
    }
    async restoreDataBackup(folderName) {
        if (
            !this.app.setup.doesFileExist(
                path.join(appData, 'bsaber-data-backups', folderName)
            )
        ) {
            return;
        }
        if (!(await this.hasBeatSDFolder('data'))) {
            await this.app.setup.makeDirectory(
                '/sdcard/Android/data/com.beatgames.beatsaber/'
            );
            await this.app.setup.makeDirectory(
                '/sdcard/Android/data/com.beatgames.beatsaber/files/'
            );
        }
        if (!(await this.hasBeatSDFolder('obb'))) {
            await this.app.setup.makeDirectory(
                '/sdcard/Android/obb/com.beatgames.beatsaber/'
            );
        }
        let backupDirectory = path.join(
            appData,
            'bsaber-data-backups',
            folderName,
            'obb'
        );
        return this.app.setup.adb
            .push(
                this.app.setup.deviceSerial,
                path.join(
                    appData,
                    'bsaber-data-backups',
                    folderName,
                    'PlayerData.dat'
                ),
                '/sdcard/Android/data/com.beatgames.beatsaber/files/PlayerData.dat'
            )
            .then(() =>
                this.app.setup.doesFileExist(
                    path.join(
                        appData,
                        'bsaber-data-backups',
                        folderName,
                        'LocalLeaderboards.dat'
                    )
                )
                    ? this.app.setup.adb.push(
                          this.app.setup.deviceSerial,
                          path.join(
                              appData,
                              'bsaber-data-backups',
                              folderName,
                              'LocalLeaderboards.dat'
                          ),
                          '/sdcard/Android/data/com.beatgames.beatsaber/files/LocalLeaderboards.dat'
                      )
                    : Promise.resolve()
            )
            .then(() =>
                this.app.setup.doesFileExist(
                    path.join(
                        appData,
                        'bsaber-data-backups',
                        folderName,
                        'LocalDailyLeaderboards.dat'
                    )
                )
                    ? this.app.setup.adb.push(
                          this.app.setup.deviceSerial,
                          path.join(
                              appData,
                              'bsaber-data-backups',
                              folderName,
                              'LocalDailyLeaderboards.dat'
                          ),
                          '/sdcard/Android/data/com.beatgames.beatsaber/files/LocalDailyLeaderboards.dat'
                      )
                    : Promise.resolve()
            )
            .then(() =>
                this.app.setup.doesFileExist(
                    path.join(
                        appData,
                        'bsaber-data-backups',
                        folderName,
                        'settings.cfg'
                    )
                )
                    ? this.app.setup.adb.push(
                          this.app.setup.deviceSerial,
                          path.join(
                              appData,
                              'bsaber-data-backups',
                              folderName,
                              'settings.cfg'
                          ),
                          '/sdcard/Android/data/com.beatgames.beatsaber/files/settings.cfg'
                      )
                    : Promise.resolve()
            )
            .then(
                () =>
                    new Promise((resolve, reject) => {
                        fs.readdir(backupDirectory, (err, data) => {
                            if (err) {
                                reject(
                                    'Error reading backup directory: ' +
                                        backupDirectory +
                                        ', Error:' +
                                        err
                                );
                            } else {
                                resolve(
                                    (data || []).filter(
                                        d => d.substr(d.length - 4) === '.obb'
                                    )
                                );
                            }
                        });
                    })
            )
            .then(obbFiles => {
                return Promise.all(
                    obbFiles.map(obb => {
                        return this.app.setup.adb.push(
                            this.app.setup.deviceSerial,
                            path.join(
                                appData,
                                'bsaber-data-backups',
                                folderName,
                                'obb',
                                obb
                            ),
                            '/sdcard/Android/obb/com.beatgames.beatsaber/' + obb
                        );
                    })
                );
            });
    }
    async makeDataBackup() {
        let folderName = JSON.stringify(new Date())
            .split('"')
            .join('')
            .split(':')
            .join('-')
            .trim();
        if (await this.hasBeatSDFolder('data')) {
            this.app.mkdir(
                path.join(appData, 'bsaber-data-backups', folderName)
            );
            await this.app.setup.adb
                .pull(
                    this.app.setup.deviceSerial,
                    '/sdcard/Android/data/com.beatgames.beatsaber/files/PlayerData.dat'
                )
                .then(
                    transfer =>
                        new Promise((resolve, reject) => {
                            transfer.on('end', resolve);
                            transfer.on('error', reject);
                            transfer.pipe(
                                fs.createWriteStream(
                                    path.join(
                                        appData,
                                        'bsaber-data-backups',
                                        folderName,
                                        'PlayerData.dat'
                                    )
                                )
                            );
                        })
                )
                .then(() =>
                    this.app.setup.adb.pull(
                        this.app.setup.deviceSerial,
                        '/sdcard/Android/data/com.beatgames.beatsaber/files/settings.cfg'
                    )
                )
                .then(
                    transfer =>
                        new Promise((resolve, reject) => {
                            let settingsPath = path.join(
                                appData,
                                'bsaber-data-backups',
                                folderName,
                                'settings.cfg'
                            );
                            transfer.on('end', resolve);
                            transfer.on('error', err => {
                                if (
                                    this.app.setup.doesFileExist(settingsPath)
                                ) {
                                    fs.unlinkSync(settingsPath);
                                }
                                resolve();
                            });
                            transfer.pipe(fs.createWriteStream(settingsPath));
                        })
                )
                .then(() =>
                    this.app.setup.adb.pull(
                        this.app.setup.deviceSerial,
                        '/sdcard/Android/data/com.beatgames.beatsaber/files/LocalLeaderboards.dat'
                    )
                )
                .then(
                    transfer =>
                        new Promise((resolve, reject) => {
                            let settingsPath = path.join(
                                appData,
                                'bsaber-data-backups',
                                folderName,
                                'LocalLeaderboards.dat'
                            );
                            transfer.on('end', resolve);
                            transfer.on('error', err => {
                                if (
                                    this.app.setup.doesFileExist(settingsPath)
                                ) {
                                    fs.unlinkSync(settingsPath);
                                }
                                resolve();
                            });
                            transfer.pipe(fs.createWriteStream(settingsPath));
                        })
                )
                .then(() =>
                    this.app.setup.adb.pull(
                        this.app.setup.deviceSerial,
                        '/sdcard/Android/data/com.beatgames.beatsaber/files/LocalDailyLeaderboards.dat'
                    )
                )
                .then(
                    transfer =>
                        new Promise((resolve, reject) => {
                            let settingsPath = path.join(
                                appData,
                                'bsaber-data-backups',
                                folderName,
                                'LocalDailyLeaderboards.dat'
                            );
                            transfer.on('end', resolve);
                            transfer.on('error', err => {
                                if (
                                    this.app.setup.doesFileExist(settingsPath)
                                ) {
                                    fs.unlinkSync(settingsPath);
                                }
                                resolve();
                            });
                            transfer.pipe(fs.createWriteStream(settingsPath));
                        })
                )
                .catch(e => {});
        }
        if (await this.hasBeatSDFolder('obb')) {
            this.app.mkdir(
                path.join(appData, 'bsaber-data-backups', folderName)
            );
            this.app.mkdir(
                path.join(appData, 'bsaber-data-backups', folderName, 'obb')
            );
            let folders = await this.app.setup.getFolders(
                '/sdcard/Android/obb/com.beatgames.beatsaber/'
            );
            await (folders || []).forEach(async folder => {
                await this.app.setup.adb
                    .pull(
                        this.app.setup.deviceSerial,
                        '/sdcard/Android/obb/com.beatgames.beatsaber/' + folder
                    )
                    .then(
                        transfer =>
                            new Promise((resolve, reject) => {
                                transfer.on('end', resolve);
                                transfer.on('error', reject);
                                transfer.pipe(
                                    fs.createWriteStream(
                                        path.join(
                                            appData,
                                            'bsaber-data-backups',
                                            folderName,
                                            'obb',
                                            folder
                                        )
                                    )
                                );
                            })
                    )
                    .catch(e => {});
            });
        }
        return folderName;
    }
    async hasBeatSDFolder(name) {
        let folders = await this.app.setup.getFolders(
            '/sdcard/Android/' + name + '/'
        );
        return !!~folders.indexOf('com.beatgames.beatsaber');
    }
    async isBeatSaberInstalled() {
        await this.app.setup.getPackages();
        return ~this.app.setup.devicePackages.indexOf(this.beatSaberPackage);
    }
    makeCustomDirectory() {
        return this.app.setup.makeDirectory(this.customLevels);
    }
    getCurrentDeviceSongs() {
        //this.app.setup.adb.shell(this.app.setup.deviceSerial,'ls '+this.customLevels)
        //             .then(adb.util.readAll)
        this.currentSongs = (this.app.songs || []).map(d => d.id);
        this.app.beatView.executeJavaScript(
            `
            window.beatInstalled = ['` +
                this.currentSongs.join("','") +
                `'];
            [].slice.call(document.querySelectorAll('.bsaber-tooltip.-download-zip')).forEach(e=>{
                let hrefParts = e.href.split('/');
                let downloadButton = e.parentElement.querySelector('.bsaber-tooltip.-sidequest');
                let removeButton = e.parentElement.querySelector('.bsaber-tooltip.-sidequest-remove');
                let alreadyInstalled = e.parentElement.querySelector('.beat-already-installed');
                if(~window.beatInstalled.indexOf(hrefParts[hrefParts.length-1])){
                    if(downloadButton) downloadButton.style.display = 'none';
                    if(alreadyInstalled) alreadyInstalled.style.display = 'inline-block';
                    if(removeButton) removeButton.style.display = 'inline-block';
                }else{
                    if(downloadButton) downloadButton.style.display = 'inline-block';
                    if(alreadyInstalled) alreadyInstalled.style.display = 'none';
                    if(removeButton) removeButton.style.display = 'none';
                }
            });
        `
        );
        return Promise.resolve(this.currentSongs);
    }
    convertSongCheck(beatsaber) {
        return new Promise((resolve, reject) => {
            fs.readdir(beatsaber.dir, async (err, name) => {
                if (err || !name.length)
                    return reject(
                        err || 'Song directory empty! - ' + beatsaber.dir
                    );
                let innerDir = path.join(beatsaber.dir, name[0]);
                if (fs.existsSync(path.join(innerDir, 'info.json'))) {
                    await this.convertSong(innerDir);
                }
                resolve();
            });
        });
    }
    pushSongToDevice(beatsaber) {
        return new Promise((resolve, reject) => {
            fs.readdir(beatsaber.dir, async (err, name) => {
                if (err || !name.length)
                    return reject(
                        err || 'Song directory empty! - ' + beatsaber.dir
                    );
                let innerDir = path.join(beatsaber.dir, name[0]),
                    deviceInnerName = path.posix.join(
                        this.customLevels,
                        beatsaber.name,
                        name[0]
                    );
                if (fs.existsSync(path.join(innerDir, 'info.json'))) {
                    await this.convertSong(innerDir);
                }
                this.app.setup
                    .makeDirectory(
                        path.posix.join(this.customLevels, beatsaber.name)
                    )
                    .then(() => this.app.setup.makeDirectory())
                    .then(() => {
                        fs.readdir(innerDir, (err, names) => {
                            if (err || !names.length)
                                return reject(
                                    err || 'Song directory empty! - ' + innerDir
                                );
                            Promise.all(
                                names.map(n => {
                                    return this.app.setup.adb
                                        .push(
                                            this.app.setup.deviceSerial,
                                            path.join(innerDir, n),
                                            path.posix.join(deviceInnerName, n)
                                        )
                                        .then(transfer => {
                                            return new Promise(
                                                (_resolve, _reject) => {
                                                    transfer.on(
                                                        'progress',
                                                        stats => {}
                                                    );
                                                    transfer.on('end', () => {
                                                        _resolve();
                                                    });
                                                    transfer.on(
                                                        'error',
                                                        _reject
                                                    );
                                                }
                                            );
                                        });
                                })
                            )
                                .then(resolve)
                                .catch(reject);
                        });
                    });
            });
        }).catch(e => {
            console.log(e);
        });
    }
    downloadSong(downloadUrl) {
        let parts = downloadUrl.split('/');
        let zipPath = path.join(appData, parts[parts.length - 1]);
        let name = parts[parts.length - 1].split('.')[0];
        const requestOptions = {
            timeout: 30000,
            'User-Agent': this.app.setup.getUserAgent(),
        };
        return new Promise((resolve, reject) => {
            progress(request(downloadUrl, requestOptions), { throttle: 300 })
                .on('error', error => {
                    debug(`Request Error ${error}`);
                    reject(error);
                })
                .on('progress', state => {
                    this.app.spinner.setMessage(
                        'Saving to My Custom Levels... ' +
                            Math.round(state.percent * 100) +
                            '%'
                    );
                    //console.log('progress', state);
                })
                .on('end', () => {
                    let dir = path.join(appData, 'bsaber', name);
                    fs.mkdir(dir, () => {
                        extract(zipPath, { dir: dir }, error => {
                            if (error) {
                                this.app.deleteFolderRecursive(dir);
                                reject(error);
                            } else {
                                fs.unlink(zipPath, err => {
                                    this.convertSongCheck({ dir, name }).then(
                                        () =>
                                            resolve(
                                                parts[parts.length - 1].split(
                                                    '.'
                                                )[0]
                                            )
                                    );
                                });
                            }
                        });
                    });
                })
                .pipe(fs.createWriteStream(zipPath));
        });
    }
}
