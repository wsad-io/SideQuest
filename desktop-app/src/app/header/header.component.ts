import { Component, OnInit, ViewChild } from '@angular/core';
import { AdbClientService, ConnectionStatus } from '../adb-client.service';
import { AppService, FolderType, ThemeMode } from '../app.service';
import { WebviewService } from '../webview.service';
import { LoadingSpinnerService } from '../loading-spinner.service';
import { StatusBarService } from '../status-bar.service';
import { RepoService } from '../repo.service';
import { BsaberService, QuestSaberPatchResponseJson } from '../bsaber.service';
interface ReplaceText {
    key: string;
    value: string;
}
@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
    @ViewChild('header', { static: false }) header;
    @ViewChild('syncSongsModal', { static: false }) syncSongsModal;
    @ViewChild('installAPKModal', { static: false }) installAPKModal;
    @ViewChild('autoFixModal', { static: false }) autoFixModal;
    theme = ThemeMode;
    folder = FolderType;
    isMaximized: boolean;
    addrepoUrl: string = '';
    colorA: string;
    colorB: string;
    replaceText: ReplaceText[] = [];
    addkey: string;
    addvalue: string;
    qspResponse: QuestSaberPatchResponseJson;
    constructor(
        public adbService: AdbClientService,
        public appService: AppService,
        public bsaberService: BsaberService,
        public webService: WebviewService,
        public spinnerService: LoadingSpinnerService,
        public statusService: StatusBarService,
        public repoService: RepoService
    ) {}
    ngOnInit() {}
    isConnected() {
        return this.adbService.deviceStatus === ConnectionStatus.CONNECTED;
    }
    ngAfterViewInit() {
        this.appService.setTitleEle(this.header.nativeElement);
    }
    getConnectionCssClass() {
        return {
            'connection-status-connected': this.adbService.deviceStatus === ConnectionStatus.CONNECTED,
            'connection-status-unauthorized': this.adbService.deviceStatus === ConnectionStatus.UNAUTHORIZED,
            'connection-status-disconnected': this.adbService.deviceStatus === ConnectionStatus.DISCONNECTED,
            'connection-status-too-many': this.adbService.deviceStatus === ConnectionStatus.TOOMANY,
        };
    }
    closeApp() {
        this.appService.remote.getCurrentWindow().close();
    }
    minimizeApp() {
        this.appService.remote.getCurrentWindow().minimize();
    }
    maximizeApp() {
        this.isMaximized = !this.isMaximized;
        this.appService.remote.getCurrentWindow()[this.isMaximized ? 'unmaximize' : 'maximize']();
    }
    openDebugger() {
        this.appService.remote.getCurrentWindow().toggleDevTools();
    }
    selectAppToInstall() {
        this.appService.electron.remote.dialog.showOpenDialog(
            {
                properties: ['openFile', 'multiSelections'],
                defaultPath: this.adbService.savePath,
            },
            files => {
                files.forEach(f => {
                    let filepath = f;
                    this.spinnerService.setMessage(`Installing ${filepath}, Please wait...`);
                    let install = this.adbService.installFile(filepath);
                    if (install) {
                        install
                            .then(() => {
                                this.statusService.showStatus('Installed APK File: ' + filepath, false);
                            })
                            .catch(e => {
                                this.statusService.showStatus(e.toString(), true);
                            });
                    }
                });
            }
        );
    }
    addRepo() {
        this.spinnerService.showLoader();
        this.repoService
            .addRepo(this.addrepoUrl)
            .then(() => (this.addrepoUrl = ''))
            .then(() => this.spinnerService.hideLoader())
            .then(() => this.statusService.showStatus('Repo added OK!!'))
            .then(() => this.repoService.saveRepos())
            .catch(e => this.statusService.showStatus(e.toString(), true));
    }
    async patchBeatSaber() {
        if (this.adbService.deviceStatus !== ConnectionStatus.CONNECTED) {
            return this.statusService.showStatus('No device connected!', true);
        }

      this.bsaberService.beatSaberVersion = (await this.adbService.getPackageInfo(this.bsaberService.beatSaberPackage)).trim();

        if (!~this.bsaberService.supportedBeatSaberVersions.indexOf(this.bsaberService.beatSaberVersion)) {
            return this.statusService.showStatus(
                'Beat Saber version not supported yet!! ' + this.bsaberService.beatSaberVersion,
                true
            );
        }
        this.syncSongsModal.closeModal();
        this.spinnerService.showLoader();
        this.spinnerService.setMessage('Patching Beat Saber...<br>This might take some time.');
        this.replaceText.forEach(text => {
            this.bsaberService.jSon.replaceText[text.key] = text.value;
        });
        if (this.colorA) {
            let color = this.colorA.substr(5, this.colorA.length - 6);
            let parts: any[] = color.split(',');
            if (!this.bsaberService.jSon.colors.colorA) {
                this.bsaberService.jSon.colors.colorA = { r: 1, g: 0, b: 0, a: 1 };
            }
            this.bsaberService.jSon.colors.colorA.r = parts[0] / 255;
            this.bsaberService.jSon.colors.colorA.g = parts[1] / 255;
            this.bsaberService.jSon.colors.colorA.b = parts[2] / 255;
            this.bsaberService.jSon.colors.colorA.a = 1;
        }
        if (this.colorB) {
            let color = this.colorB.substr(5, this.colorB.length - 6);
            let parts: any[] = color.split(',');
            if (!this.bsaberService.jSon.colors.colorB) {
                this.bsaberService.jSon.colors.colorB = { r: 0, g: 0, b: 1, a: 1 };
            }
            this.bsaberService.jSon.colors.colorB.r = parts[0] / 255;
            this.bsaberService.jSon.colors.colorB.g = parts[1] / 255;
            this.bsaberService.jSon.colors.colorB.b = parts[2] / 255;
            this.bsaberService.jSon.colors.colorB.a = 1;
        }
        this.bsaberService.saveJson(this.bsaberService.jSon);
        this.bsaberService
            .questSaberPatch()
            .then((json: QuestSaberPatchResponseJson) => {
                if (json.error) {
                    this.autoFixModal.showModal();
                    return new Error(json.error);
                }
                this.qspResponse = json;
                this.spinnerService.hideLoader();
                this.installAPKModal.openModal();
            })
            .catch(e => {
                this.autoFixModal.showModal();
                this.spinnerService.hideLoader();
                this.statusService.showStatus(e.toString(), true);
            });
    }
    installSkippedLength() {
        return Object.keys(this.qspResponse.installSkipped || {}).length;
    }
    getInstallSkipped() {
        return Object.keys(this.qspResponse.installSkipped || {})
            .map(k => k + ':' + this.qspResponse.installSkipped[k])
            .join(', ');
    }
    installPatchedAPK() {
        this.adbService.installAPK(this.appService.path.join(this.appService.appData, 'bsaber-base_patched.apk'), true, true);
    }
    removeText(text) {
        this.replaceText = this.replaceText.filter(d => d !== text);
    }
    getReplaceAndColors() {
        this.replaceText = Object.keys(this.bsaberService.jSon.replaceText).map(k => ({
            key: k,
            value: this.bsaberService.jSon.replaceText[k],
        }));
        if (this.bsaberService.jSon.colors.colorA) {
            this.colorA =
                'rgba(' +
                this.bsaberService.jSon.colors.colorA.r * 255 +
                ',' +
                this.bsaberService.jSon.colors.colorA.g * 255 +
                ',' +
                this.bsaberService.jSon.colors.colorA.b * 255 +
                ',1)';
        } else {
            this.resetColor(true);
        }
        if (this.bsaberService.jSon.colors.colorB) {
            this.colorB =
                'rgba(' +
                this.bsaberService.jSon.colors.colorB.r * 255 +
                ',' +
                this.bsaberService.jSon.colors.colorB.g * 255 +
                ',' +
                this.bsaberService.jSon.colors.colorB.b * 255 +
                ',1)';
        } else {
            this.resetColor(false);
        }
    }
    resetColor(isColorA: boolean) {
        if (isColorA) {
            this.colorA = 'rgba(240,48,48,1)';
        }

        if (!isColorA) {
            this.colorB = 'rgba(48,158,255,1)';
        }
    }
    openSyncSongs(){
      this.bsaberService.hasBackup = this.bsaberService.backupExists();
      this.getReplaceAndColors();
      this.syncSongsModal.openModal();
    }
}
