import { Injectable } from '@angular/core';
import { AppService } from './app.service';
import { LoadingSpinnerService } from './loading-spinner.service';
import { StatusBarService } from './status-bar.service';
import { AdbClientService } from './adb-client.service';
import { WebviewService } from './webview.service';

@Injectable({
    providedIn: 'root',
})
export class DragAndDropService {
    message: string;
    isDragging: boolean;
    constructor(
        private adbService: AdbClientService,
        private appService: AppService,
        private spinnerService: LoadingSpinnerService,
        private statusService: StatusBarService,
        private webService: WebviewService
    ) {}
    setupDragAndDrop(ele) {
        let dragTimeout;
        ele.ondragover = () => {
            clearTimeout(dragTimeout);
            this.message = this.appService.isFilesOpen ? 'Drop files to upload!' : 'Drop the file here to install!';
            this.isDragging = true;
            return false;
        };

        ele.ondragleave = () => {
            dragTimeout = setTimeout(() => {
                this.isDragging = false;
            }, 1000);
            return false;
        };

        ele.ondragend = () => {
            this.isDragging = false;
            return false;
        };

        ele.ondrop = async e => {
            if (!this.isDragging) return;
            this.isDragging = false;
            e.preventDefault();
            if (this.appService.isFilesOpen && this.appService.filesComponent) {
                return this.appService.filesComponent.uploadFilesFromList(
                    Object.keys(e.dataTransfer.files).map(i => e.dataTransfer.files[i].path)
                );
            }
            for (let i = 0; i < e.dataTransfer.files.length; i++) {
                let file = e.dataTransfer.files[i];
                let filepath = file.path;
                if (['.apk', '.obb'].includes(this.appService.path.extname(filepath))) {
                    if (this.appService.path.extname(filepath) === '.apk') {
                        await this.adbService.installAPK(filepath, true);
                    } else {
                        await this.adbService.installLocalObb(filepath);
                    }
                } else {
                    this.statusService.showStatus('Unrecognised File: ' + filepath, true);
                }
            }
            this.spinnerService.hideLoader();
            return false;
        };
    }
}
