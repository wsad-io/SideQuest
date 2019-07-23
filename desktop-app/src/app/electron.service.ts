import { Injectable } from '@angular/core';
import { AppService } from './app.service';
import { RepoService } from './repo.service';
import { BsaberService } from './bsaber.service';
import { StatusBarService } from './status-bar.service';
import { LoadingSpinnerService } from './loading-spinner.service';
import { AdbClientService } from './adb-client.service';
import { WebviewService } from './webview.service';
import { Router } from '@angular/router';
import { BeatOnService } from './beat-on.service';

@Injectable({
    providedIn: 'root',
})
export class ElectronService {
    isInstalledLauncher: boolean;
    isInstallingLauncher: boolean;
    constructor(
        private appService: AppService,
        private repoService: RepoService,
        private bsaberService: BsaberService,
        private statusService: StatusBarService,
        private spinnerService: LoadingSpinnerService,
        private adbService: AdbClientService,
        private webviewService: WebviewService,
        private beatonService: BeatOnService,
        private router: Router
    ) {
        this.setupIPC();
    }
    async installMultiple(urls) {
        for (let i = 0; i < urls.length; i++) {
            const etx = urls[i]
                .split('?')[0]
                .split('.')
                .pop()
                .toLowerCase();
            switch (etx) {
                case 'apk':
                    await this.adbService.installAPK(urls[i], false, false, i + 1, urls.length);
                    break;
                case 'obb':
                    await this.adbService.installObb(urls[i], i + 1, urls.length);
                    break;
            }
        }
    }

    setupIPC() {
        this.appService.electron.ipcRenderer.on('pre-open-url', (event, data) => {
            this.spinnerService.showLoader();
            this.spinnerService.setMessage('Do you want to install this file?<br><br>' + data);
            this.spinnerService.setupConfirm().then(() => this.adbService.installAPK(data));
        });
        this.appService.electron.ipcRenderer.on('update-status', (event, data) => {
            this.statusService.showStatus(JSON.stringify(data), true);
        });
        this.appService.electron.ipcRenderer.on('open-url', (event, data) => {
            if (data) {
                let url = data.split('#');
                switch (url[0]) {
                    case 'sidequest://repo/':
                        this.repoService.addRepo(url[1]);
                        break;
                    case 'sidequest://sideload-multi/':
                        try {
                            let urls = JSON.parse(data.replace('sidequest://sideload-multi/#', ''));
                            this.installMultiple(urls);
                        } catch (e) {
                            this.statusService.showStatus('Could not parse install url: ' + data, true);
                        }
                        this.webviewService.isWebviewLoading = false;
                        break;
                    case 'sidequest://sideload/':
                        this.spinnerService.showLoader();
                        this.spinnerService.setMessage('Installing APK...');
                        this.adbService
                            .installAPK(url[1])
                            .then(() => {
                                this.spinnerService.hideLoader();
                                this.statusService.showStatus('APK installed!! ' + url[1]);
                            })
                            .catch(e => {
                                this.spinnerService.hideLoader();
                                this.statusService.showStatus(e.message ? e.message : e.code ? e.code : e.toString(), true);
                            });
                        break;
                    case 'sidequest://launcher/':
                        if (!this.isLauncherInstalled()) {
                            this.installLauncher();
                        } else {
                            this.statusService.showStatus('Launcher already installed!');
                        }
                        break;
                    case 'sidequest://navigate/':
                        this.router.navigateByUrl(url[1]);
                        this.appService.showBack = true;
                        this.webviewService.isWebviewLoading = false;
                        break;
                    case 'sidequest://api/':
                        // grab and parse a url like this - sidequest://api/#adbService:installAPK:<url_of_apk>:true
                        // let parts = url[1].split(':');
                        // let service = parts.unshift();
                        // let method = parts.unshift();
                        // if (
                        //   service &&
                        //   this[service] &&
                        //   method &&
                        //   this[service][method] &&
                        //   typeof this[service][method] === 'function'
                        // ) {
                        //   parts = parts.map(p => {
                        //     switch (p) {
                        //       case 'null':
                        //         return null;
                        //       case 'true':
                        //         return true;
                        //       case 'false':
                        //         return false;
                        //       default:
                        //         return p.trim();
                        //     }
                        //   });
                        //   console.log(parts, service, method);
                        //   this[service][method].call.apply(parts);
                        // }
                        break;
                    case 'sidequest://bsaber/':
                        this.spinnerService.showLoader();
                        this.spinnerService.setMessage('Saving to BeatOn...');
                        this.beatonService
                            .downloadSong(url[1], this.adbService)
                            .then(() => this.spinnerService.hideLoader())
                            .then(() => this.statusService.showStatus('Item Downloaded Ok!!'))
                            .catch(e => {
                                this.statusService.showStatus(e.toString(), true);
                                this.spinnerService.hideLoader();
                            });
                        break;
                    case 'sidequest://bsaber-multi/':
                        try {
                            let urls = JSON.parse(data.replace('sidequest://bsaber-multi/#', ''));
                            (async () => {
                                this.spinnerService.showLoader();
                                this.spinnerService.setMessage('Saving to BeatOn...');
                                for (let i = 0; i < urls.length; i++) {
                                    await this.beatonService.downloadSong(urls[i], this.adbService);
                                }
                                this.statusService.showStatus('Item Downloaded Ok!!');
                                this.spinnerService.hideLoader();
                            })();
                        } catch (e) {
                            this.statusService.showStatus('Could not parse install url: ' + data, true);
                        }
                        this.webviewService.isWebviewLoading = false;
                        break;
                    default:
                        this.statusService.showStatus('Custom protocol not recognised: ' + (data || ''), true);
                        break;
                }
            }
        });
        this.appService.electron.ipcRenderer.on('info', (event, data) => {
            try {
                data = JSON.parse(data);
                if (data.beatsaber) {
                    this.spinnerService.setMessage('Saving to My Custom Levels...');
                    this.spinnerService.showLoader();
                    this.bsaberService
                        .downloadSong(data.beatsaber)
                        .then(id => {
                            return this.bsaberService
                                .getMySongs()
                                .then(() => this.spinnerService.hideLoader())
                                .then(() => this.statusService.showStatus('Level Downloaded Ok!!'))
                                .then(() => {
                                    this.bsaberService.jSon.packs.forEach(p => {
                                        if (p.id === '__default_pack') {
                                            (this.bsaberService.songs || []).forEach((song: any) => {
                                                if (song.id === id) {
                                                    p.levelIDs.push(song);
                                                }
                                            });
                                        }
                                    });
                                    this.bsaberService.saveJson(this.bsaberService.jSon);
                                });
                        })
                        .catch(e => {
                            this.statusService.showStatus(e.toString(), true);
                            this.spinnerService.hideLoader();
                        });
                }
                if (data.beatsaberRemove) {
                    this.spinnerService.setMessage('Removing Beatsaber Song...');
                    this.spinnerService.hideLoader();
                    this.bsaberService
                        .removeSong(data.beatsaberRemove)
                        // .then(()=>new Promise(r=>setTimeout(r,500)))
                        .then(() => this.bsaberService.getMySongs())
                        .then(() => this.spinnerService.hideLoader())
                        .catch(e => {
                            this.statusService.showStatus(e.toString(), true);
                            this.spinnerService.hideLoader();
                        });
                }
            } catch (e) {}
        });
    }

    isLauncherInstalled() {
        this.isInstalledLauncher =
            !!~this.adbService.devicePackages.indexOf('com.sidequest.wrapper2') &&
            !!~this.adbService.devicePackages.indexOf('com.sidequest.wrapper') &&
            !!~this.adbService.devicePackages.indexOf('com.sidequest.launcher');
        return this.isInstalledLauncher;
    }

    installLauncher() {
        this.isInstallingLauncher = true;
        return this.adbService
            .installAPK('https://cdn.theexpanse.app/SideQuestWrapper.apk')
            .then(() => this.adbService.installAPK('https://cdn.theexpanse.app/SideQuestWrapper2.apk'))
            .then(() => this.adbService.installAPK('https://cdn.theexpanse.app/SideQuestLauncher.apk'))
            .then(() => this.adbService.getPackages())
            .then(() => {
                this.isInstallingLauncher = false;
                this.isInstalledLauncher = true;
            });
    }
}
