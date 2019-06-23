import { Injectable } from '@angular/core';
import { AppService } from './app.service';
import { RepoService } from './repo.service';
import { BsaberService } from './bsaber.service';
import { StatusBarService } from './status-bar.service';
import { LoadingSpinnerService } from './loading-spinner.service';
import { AdbClientService } from './adb-client.service';

@Injectable({
    providedIn: 'root',
})
export class ElectronService {
    constructor(
        private appService: AppService,
        private repoService: RepoService,
        private bsaberService: BsaberService,
        private statusService: StatusBarService,
        private spinnerService: LoadingSpinnerService,
        private adbService: AdbClientService
    ) {
        this.setupIPC();
    }

    setupIPC() {
        this.appService.electron.ipcRenderer.on('pre-open-url', (event, data) => {
            this.spinnerService.setMessage('Do you want to install this file?<br>' + data);
            this.spinnerService.setupConfirm().then(() => this.adbService.installAPK(data));
        });
        this.appService.electron.ipcRenderer.on('open-url', (event, data) => {
            if (data) {
                let url = data.split('#');
                switch (url[0]) {
                    case 'sidequest://repo/':
                        this.repoService.addRepo(url[1]);
                        break;
                    case 'sidequest://sideload/':
                        this.spinnerService.showLoader();
                        this.spinnerService.setMessage('Installing APK...');
                        this.adbService.installAPK(url[1]).then(() => {
                            this.spinnerService.hideLoader();
                            this.statusService.showStatus('APK installed!! ' + url[1]);
                        });
                        break;
                    case 'sidequest://bsaber/':
                        this.spinnerService.showLoader();
                        this.spinnerService.setMessage('Saving to My Songs...');
                        this.bsaberService
                            .downloadSong(url[1])
                            .then(id => {
                                this.bsaberService
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
}
