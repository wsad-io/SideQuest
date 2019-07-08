import { Injectable } from '@angular/core';
import { AdbClientService } from './adb-client.service';
import { HttpClient } from '@angular/common/http';
import { LoadingSpinnerService } from './loading-spinner.service';
import { StatusBarService } from './status-bar.service';
import { AppService } from './app.service';

interface BeatOnStatus {
    CurrentStatus: string;
    IsBeatSaberInstalled: boolean;
}
export interface HostSetupEvent {
    SetupEvent: SetupEventType;
    Message: string;
    Type: string;
}

export enum SetupEventType {
    Step1Complete = 'Step1Complete',
    Step2Complete = 'Step2Complete',
    Step3Complete = 'Step3Complete',
    Error = 'Error',
    StatusMessage = 'StatusMessage',
}
@Injectable({
    providedIn: 'root',
})
export class BeatOnService {
    beatOnEnabled: boolean;
    beatOnPID: string;
    websocket: WebSocket;
    beatOnStatus: BeatOnStatus = {
        CurrentStatus: '',
        IsBeatSaberInstalled: false,
    };

    constructor(
        private http: HttpClient,
        private spinnerService: LoadingSpinnerService,
        private statusService: StatusBarService,
        private appService: AppService
    ) {}
    setupBeatOn(adbService: AdbClientService) {
        this.spinnerService.showLoader();
        return this.beatOnStep(adbService, '1')
            .then(() => this.spinnerService.setMessage('Uninstalling APK'))
            .then(() => adbService.uninstallAPK('com.beatgames.beatsaber'))
            .then(() => this.spinnerService.showLoader())
            .then(() => this.beatOnStep(adbService, '2?skipuninstall'))
            .then(() => this.beatOnStep(adbService, '3?skipinstall'))
            .then(() => this.spinnerService.setMessage('Installing APK'))
            .then(() => {
                setTimeout(
                    () =>
                        adbService
                            .adbCommand('installRemote', {
                                serial: adbService.deviceSerial,
                                path: '/sdcard/Android/data/com.emulamer.beaton/cache/beatsabermod.apk',
                            })
                            .then(r => {
                                console.log(r);
                                this.spinnerService.hideLoader();
                                this.statusService.showStatus('Beat On Installed!');
                            })
                            .catch(e => {
                                this.spinnerService.hideLoader();
                                this.statusService.showStatus(e.message ? e.message : e.code ? e.code : e.toString(), true);
                            }),
                    4000
                );
            });
    }
    beatOnRequest(adbService: AdbClientService, endpoint: string, method: string = 'GET') {
        return this.http.get('http://' + adbService.deviceIp + ':50000/host/' + endpoint).toPromise();
    }
    beatOnStep(adbService: AdbClientService, step: string) {
        return this.http
            .post('http://' + adbService.deviceIp + ':50000/host/mod/install/step' + step, '')
            .toPromise()
            .then(r => console.log(r));
    }
    checkIsBeatOnRunning(adbService: AdbClientService) {
        return adbService
            .adbCommand('shell', {
                serial: adbService.deviceSerial,
                command: 'pidof com.emulamer.beaton',
            })
            .then(res => {
                this.beatOnEnabled = !!res;
                this.beatOnPID = res;
            })
            .then(() => {
                if (this.beatOnEnabled && adbService.deviceIp) {
                    return this.beatOnRequest(adbService, 'mod/status').then((body: BeatOnStatus) => {
                        this.beatOnStatus = body;
                    });
                }
            });
    }
    async syncSongs(adbService: AdbClientService) {
        this.spinnerService.setMessage('Restoring Backup...');
        this.spinnerService.showLoader();
        let packageBackupPath = this.appService.path.join(this.appService.appData, 'bsaber');
        if (this.appService.fs.existsSync(packageBackupPath)) {
            adbService.localFiles = [];
            await adbService
                .getLocalFoldersRecursive(packageBackupPath)
                .then(() => {
                    adbService.localFiles.forEach(file => {
                        file.savePath = this.appService.path.posix.join(
                            '/sdcard/BeatOnData/CustomSongs/',
                            file.name
                                .replace(packageBackupPath, '')
                                .split('\\')
                                .join('/')
                        );
                    });
                    return adbService.uploadFile(adbService.localFiles.filter(f => f.__isFile));
                })
                .then(() =>
                    this.http.post('http://' + adbService.deviceIp + ':50000/host/beatsaber/reloadsongfolders', '').toPromise()
                )
                .then(() => {
                    setTimeout(() => {
                        this.spinnerService.hideLoader();
                        this.statusService.showStatus('Songs synced to Beat On OK!');
                    }, 5000);
                });
        }
    }
    setupBeatOnSocket(adbService: AdbClientService) {
        if (this.websocket != null && this.websocket.readyState === WebSocket.OPEN) {
            console.log('HostMessageService.openSocket called, but the connection is already open.');
            return;
        }
        if (this.websocket != null) this.websocket.close();

        this.websocket = new WebSocket('ws://' + adbService.deviceIp + ':50001');
        this.websocket.onopen = (ev: Event) => {
            console.log('Connection opened');
        };
        //
        this.websocket.onmessage = (ev: MessageEvent) => {
            const reader = new FileReader();
            reader.onload = () => {
                let msgStr = <string>reader.result;
                let msgEvent: HostSetupEvent = JSON.parse(msgStr);
                if (msgEvent.Message) {
                    this.spinnerService.setMessage(msgEvent.Message);
                    //this.setupMessage.emit(<HostSetupEvent>msgEvent);
                    // } else if (msgEvent.Type == 'Toast') {
                    //   this.toastMessage.emit(<HostShowToast>msgEvent);
                    // } else if (msgEvent.Type == 'DownloadStatus') {
                    //   this.downloadStatusMessage.emit(<HostDownloadStatus>msgEvent);
                    // } else if (msgEvent.Type == 'ConfigChange') {
                    //   this.configChangeMessage.emit(<HostConfigChangeEvent>msgEvent);
                    // } else if (msgEvent.Type = 'OpStatus') {
                    //this.opStatusMessage.emit();
                } else {
                    console.log(`Unknown host message: ${msgStr}`);
                }
            };
            reader.readAsText(ev.data);
        };
        //
        this.websocket.onclose = (ev: Event) => {
            console.log('Connection was closed, reconnecting in several seconds...');
        };
        //
        this.websocket.onerror = (ev: Event) => {
            console.log('WEBSOCKET ERROR OH NOOOOO!');
        };
    }
}
