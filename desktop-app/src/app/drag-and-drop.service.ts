import { Injectable } from '@angular/core';
import { AppService } from './app.service';
import { LoadingSpinnerService } from './loading-spinner.service';
import { StatusBarService } from './status-bar.service';
import { AdbClientService } from './adb-client.service';

@Injectable({
  providedIn: 'root'
})
export class DragAndDropService {

  constructor(private adbService:AdbClientService,
              private appService:AppService,
              private spinnerService:LoadingSpinnerService,
              private statusService:StatusBarService) {
    this.setupDragAndDrop();
  }
  setupDragAndDrop(){
    let dragTimeout;
    document.ondragover = () => {
      clearTimeout(dragTimeout);
      this.spinnerService.setMessage(this.appService.isFilesOpen?'Drop files to upload':'Drop the file here to install!');
      this.spinnerService.showDrag();
      return false;
    };

    document.ondragleave = () => {
      dragTimeout = setTimeout(() => {
        this.spinnerService.hideLoader();
      }, 1000);
      return false;
    };

    document.ondragend = () => {
      this.spinnerService.hideLoader();
      return false;
    };

    document.ondrop = e => {
      e.preventDefault();
      if(this.appService.isFilesOpen&&this.appService.filesComponent){
        return this.appService.filesComponent
          .uploadFilesFromList(Object.keys(e.dataTransfer.files).map(i=>e.dataTransfer.files[i].path));
      }
      this.spinnerService.hideLoader();
      let installableFiles = Object.keys(e.dataTransfer.files).filter(
        (val, index) => {
          return ['.apk','.obb','.zip'].includes(
            this.appService.path.extname(e.dataTransfer.files[index].name)
          );
        }
      );
      installableFiles.forEach((val, index) => {
        let filepath = e.dataTransfer.files[val].path;
        this.spinnerService.setMessage(
          `Installing ${filepath}, Please wait...`
        );
        let install = this.adbService.installFile(filepath);
        if (install) {
          install.then(() => {
              this.statusService.showStatus(
                'Installed APK File: ' + filepath,
                false
              );
            })
            .catch(e => {
              this.statusService.showStatus(e.toString(), true);
            });
        }
      });
      return false;
    };
  }
}
