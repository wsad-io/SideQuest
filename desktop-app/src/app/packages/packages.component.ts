import { Component, OnInit, ViewChild } from '@angular/core';
import { AdbClientService, ConnectionStatus } from '../adb-client.service';
import { AppService, FolderType } from '../app.service';
import { LoadingSpinnerService } from '../loading-spinner.service';
import { StatusBarService } from '../status-bar.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { RepoService } from '../repo.service';
import { BsaberService } from '../bsaber.service';

@Component({
    selector: 'app-packages',
    templateUrl: './packages.component.html',
    styleUrls: ['./packages.component.css'],
})
export class PackagesComponent implements OnInit {
    @ViewChild('appSettingsModal', { static: false }) appSettingsModal;

    folder = FolderType;
    currentPackage: any = { appRepo: {}, package: '' };
    backups: string[];
    dataBackups: string[];
    isBackingUp: boolean;
    isOpen: boolean;
    sub: Subscription;
    constructor(
        public adbService: AdbClientService,
        public appService: AppService,
        public spinnerService: LoadingSpinnerService,
        public statusService: StatusBarService,
        private repoService: RepoService,
        private bsaberService: BsaberService,
        router: Router,
        route: ActivatedRoute
    ) {
        appService.webService.isWebviewOpen = false;
        appService.resetTop();
        this.appService.setTitle('Installed Apps');
        this.sub = router.events.subscribe(val => {
            if (val instanceof NavigationEnd) {
                let currentPackage = route.snapshot.paramMap.get('packageName');
                if (currentPackage) {
                    this.currentPackage.package = currentPackage;
                    if (this.repoService.allApps[currentPackage]) {
                        this.currentPackage.repoApp = this.repoService.allApps[currentPackage];
                    }
                }
            }
        });
    }

    ngOnInit() {}
    isConnected() {
        let isConnected = this.adbService.deviceStatus === ConnectionStatus.CONNECTED;
        if (isConnected && !this.isOpen) {
            this.isOpen = true;
            this.adbService.getPackages().then(() => {
                if (this.currentPackage.package && ~this.adbService.devicePackages.indexOf(this.currentPackage.package)) {
                    this.appSettingsModal.openModal();
                } else if (this.currentPackage.package) {
                    this.statusService.showStatus(
                        'App not installed...' + (this.currentPackage.package ? this.currentPackage.package : ''),
                        true
                    );
                }
            });
        }
        return isConnected;
    }
    ngAfterViewInit() {}
    getCurrentInstalledInfo() {
        this.adbService
            .getPackageInfo(this.currentPackage.package)
            .then(() => this.adbService.getBackups(this.currentPackage.package))
            .then(backups => (this.backups = backups))
            .then(() => this.adbService.getDataBackups(this.currentPackage.package))
            .then(dataBackups => (this.dataBackups = dataBackups));
    }
    async backupApk() {
        this.appSettingsModal.closeModal();
        let location = await this.adbService.getPackageLocation(this.currentPackage.package);
        this.adbService.backupPackage(location, this.currentPackage.package).then(savePath => {
            if (this.currentPackage.package === this.bsaberService.beatSaberPackage && !this.bsaberService.backupExists()) {
                this.appService.fs.copyFileSync(savePath, this.appService.path.join(this.appService.appData, 'bsaber-base.apk'));
                this.appService.fs.copyFileSync(
                    savePath,
                    this.appService.path.join(this.appService.appData, 'bsaber-base_patched.apk')
                );
            }
        });
    }
    backupData() {
        this.appSettingsModal.closeModal();
        this.adbService.makeDataBackup(this.currentPackage.package);
    }
    showBackupFileName(file) {
        return this.appService.path.basename(file);
    }
    restoreBackup(backup: string) {
        this.appSettingsModal.closeModal();
        this.adbService
            .restoreDataBackup(this.currentPackage.package, backup)
            .then(() => this.statusService.showStatus('Backup restored ok!!'));
    }
    installBackupApk(filePath) {
        this.appSettingsModal.closeModal();
        this.adbService.installAPK(filePath, true);
    }
    uninstallApk() {
        this.appSettingsModal.closeModal();
        this.adbService.uninstallAPK(this.currentPackage.package);
    }
    forceClose() {
        this.adbService
            .adbCommand('shell', {
                serial: this.adbService.deviceSerial,
                command: 'am force-stop ' + this.currentPackage.package,
            })
            .then(r => {
                this.statusService.showStatus('Force Close Sent!!');
            });
    }
    clearData() {
        this.adbService
            .adbCommand('clear', {
                serial: this.adbService.deviceSerial,
                packageName: this.currentPackage.package,
            })
            .then(r => {
                console.log(r);
                this.statusService.showStatus('Clear Data Sent!!');
            });
    }
}
