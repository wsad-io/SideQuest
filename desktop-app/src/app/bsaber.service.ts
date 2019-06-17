import { Injectable } from '@angular/core';
import { AppService } from './app.service';
import { AdbClientService } from './adb-client.service';

@Injectable({
    providedIn: 'root',
})
export class BsaberService {
    customLevels: string = '/sdcard/Android/data/com.beatgames.beatsaber/files/CustomLevels/';
    beatSaberPackage: string = 'com.beatgames.beatsaber';
    beatBackupPath: string;
    supportedBeatSaberVersions: string[] = ['1.1.0', '1.0.2', '1.0.1', '1.0.0'];
    questSaberPatchVersion: string = localStorage.getItem('quest-saber-patch-version') || 'v0.7.0';
    questSaberBinaryPath: string;
    converterBinaryPath: string;
    constructor(private appService: AppService, private adbService: AdbClientService) {
        this.beatBackupPath = appService.path.join(appService.appData, 'bsaber-backups', this.beatSaberPackage);

        let bsVersions = localStorage.getItem('beat-saber-version');
        try {
            this.supportedBeatSaberVersions = bsVersions ? JSON.parse(bsVersions) : ['1.1.0'];
        } catch (e) {
            localStorage.setItem('beat-saber-version', JSON.stringify(['1.1.0']));
            this.supportedBeatSaberVersions = ['1.1.0', '1.0.2', '1.0.1', '1.0.0'];
        }
        this.downloadQSP().then(() => <Promise<void>>this.downloadConverterBinary());
    }
    async getBSandQSPVersions() {
        const jsonUrl = 'https://raw.githubusercontent.com/the-expanse/SideQuest/master/vendor_versions.txt';
        return new Promise((resolve, reject) => {
            this.appService.request(jsonUrl, (error, response, body) => {
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
                    localStorage.setItem('beat-saber-version', JSON.stringify(resp['beat-saber']));
                }
                if (resp['quest-saber-patch']) {
                    this.questSaberPatchVersion = resp['quest-saber-patch'];
                    localStorage.setItem('quest-saber-patch-version', resp['quest-saber-patch']);
                }
                if (resp['sidequest']) {
                    this.appService.updateAvailable = resp['sidequest'] !== this.appService.versionName;
                }
            })
            .catch(e => {
                console.warn(e);
            });
    }
    async downloadQSP() {
        await this.getBSandQSPVersions();
        let url =
            'https://github.com/trishume/QuestSaberPatch/releases/download/' + this.questSaberPatchVersion + '/questsaberpatch-';
        let name = 'questsaberpatch/jsonApp2.exe';
        switch (this.appService.os.platform()) {
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
        let downloadPath = this.appService.path.join(this.appService.appData, 'saber-quest-patch', name);
        this.questSaberBinaryPath = downloadPath;
        if (this.appService.doesFileExist(downloadPath)) return Promise.resolve();
        return new Promise((resolve, reject) => {
            this.appService
                .downloadFile(url + 'windows.zip', url + 'linux.zip', url + 'osx.zip', downloadUrl => {
                    let urlParts = downloadUrl.split('/');
                    return this.appService.path.join(this.appService.appData, urlParts[urlParts.length - 1]);
                })
                .then(_path => {
                    let callback = error => {
                        if (error) return reject(error);
                        this.appService.fs.unlink(_path, err => {
                            // if(err) return reject(err);
                            if (this.appService.os.platform() === 'darwin' || this.appService.os.platform() === 'linux') {
                                this.appService.setExecutable(this.questSaberBinaryPath).then(() => resolve());
                            } else {
                                return resolve();
                            }
                        });
                    };

                    this.appService.extract(
                        _path,
                        { dir: this.appService.path.join(this.appService.appData, 'saber-quest-patch') },
                        callback
                    );
                });
        });
    }
    downloadConverterBinary() {
        let url = 'https://github.com/lolPants/songe-converter/releases/download/v0.4.3/songe-converter';
        let name = '.exe';
        switch (this.appService.os.platform()) {
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
        let downloadPath = this.appService.path.join(this.appService.appData, urlParts[urlParts.length - 1]);
        if (this.appService.doesFileExist(downloadPath)) {
            this.converterBinaryPath = downloadPath;
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            this.appService
                .downloadFile(url + '.exe', url, url + '-mac', downloadUrl => {
                    let urlParts = downloadUrl.split('/');
                    return this.appService.path.join(this.appService.appData, urlParts[urlParts.length - 1]);
                })
                .then(path => {
                    this.converterBinaryPath = path.toString();
                    if (this.appService.os.platform() === 'darwin' || this.appService.os.platform() === 'linux') {
                        return this.appService.setExecutable(this.converterBinaryPath).then(() => resolve());
                    } else {
                        return resolve();
                    }
                });
        });
    }
}
