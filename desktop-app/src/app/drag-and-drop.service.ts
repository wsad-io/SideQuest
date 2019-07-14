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
            if (this.webService.isWebviewOpen) return;
            console.log('ondragover');
            //clearTimeout(dragTimeout);
            this.message = this.appService.isFilesOpen ? 'Drop files to upload!' : 'Drop the file here to install!';
            this.isDragging = true;
            return false;
        };

        ele.ondragleave = () => {
            if (this.webService.isWebviewOpen) return;
            this.isDragging = false;
            return false;
        };

        ele.ondragend = () => {
            if (this.webService.isWebviewOpen) return;
            this.isDragging = false;
            return false;
        };

        ele.ondrop = e => {
            if (this.webService.isWebviewOpen || !this.isDragging) return;
            this.isDragging = false;
            e.preventDefault();
            if (this.appService.isFilesOpen && this.appService.filesComponent) {
                return this.appService.filesComponent.uploadFilesFromList(
                    Object.keys(e.dataTransfer.files).map(i => e.dataTransfer.files[i].path)
                );
            }
            [].slice.call(e.dataTransfer.files).forEach(file => {
                let filepath = file.path;
                if (['.apk', '.obb'].includes(this.appService.path.extname(filepath))) {
                    if (this.appService.path.extname(filepath) === '.apk') {
                        this.adbService.installAPK(filepath, true);
                    } else {
                        this.adbService.installLocalObb(filepath);
                    }
                } else {
                    this.spinnerService.hideLoader();
                    this.statusService.showStatus('Unrecognised File: ' + filepath, true);
                }
            });
            return false;
        };
    }
}
