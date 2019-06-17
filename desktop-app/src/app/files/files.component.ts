import { Component, OnInit, ViewChild } from '@angular/core';
import { AdbClientService, ConnectionStatus } from '../adb-client.service';
import { AppService } from '../app.service';
import { LoadingSpinnerService } from '../loading-spinner.service';
import { StatusBarService } from '../status-bar.service';
interface FileFolderListing{
  name:string,
  icon:string,
  size:number,
  time:Date
}
interface BreadcrumbListing{
  name:string,
  path:string
}
declare let M;
@Component({
  selector: 'app-files',
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.css']
})
export class FilesComponent implements OnInit {
  @ViewChild('filesModal',{static:false}) filesModal;
  @ViewChild('fixedAction',{static:false}) fixedAction;
  files:FileFolderListing[] = [];
  breadcrumbs:BreadcrumbListing[] = [];
  isOpen:boolean = false;
  currentPath:string;
  folderName:string;
  currentFile:FileFolderListing;
  constructor(public spinnerService:LoadingSpinnerService,
              public adbService:AdbClientService,
              public appService:AppService,
              public statusService:StatusBarService) {
    this.appService.resetTop();
    appService.webService.isWebviewOpen = false;
  }
  ngOnAfterViewInit(){
    M.FloatingActionButton.init(this.fixedAction.nativeElement, {});
  }
  ngOnInit() {
    this.appService.setTitle('Headset Files');
  }
  makeFolder(){
    if(~this.files.filter(f=>f.icon==='folder').map(f=>f.name).indexOf(this.folderName)){
      return this.statusService.showStatus('A folder already exists with that name!!', true);
    }else{
      this.adbService.makeDirectory(this.appService.path.posix.join(this.currentPath,this.folderName))
        .then(r=>{
          this.open(this.currentPath);
        })
    }
  }
  uploadFiles(){
    this.appService.electron.remote.dialog.showOpenDialog(
      {
        properties: ['openFile','openFiles'],
        defaultPath: this.adbService.savePath,
      },
      files => {
        if (files !== undefined && files.length) {
          Promise.all(files.map(f=> {
            console.log(f, this.appService.path.posix.join(this.currentPath,this.appService.path.basename(f)));
            return this.adbService.client.push(
              this.adbService.deviceSerial,
              f, this.appService.path.posix.join(this.currentPath,this.appService.path.basename(f)))
              .then(transfer => {
                return new Promise((resolve, reject) => {
                  transfer.on('progress', stats => {
                    this.statusService.showStatus('File uploading: ' + f + ' ' +
                      (Math.round(
                        (stats.bytesTransferred / 1024 / 1024)*100
                      )/100) +
                      'MB');
                  });
                  transfer.on('end', () => {
                     return resolve();
                  });
                  transfer.on('error', reject);
                })
              })
          })).then(()=>{
            this.statusService.showStatus('Files Uploaded!!');
            this.open(this.currentPath);
          })
            .catch(e=>this.statusService.showStatus(e.toString(),true));
        }
      }
    );
  }
  saveFile(){
    let savePath = this.appService.path.join(this.adbService.savePath,this.currentFile.name);
    this.statusService.showStatus('Saving file: ' + savePath+"...");
      this.adbService.client.pull(
        this.adbService.deviceSerial,
        this.appService.path.posix.join(this.currentPath,this.currentFile.name))
        .then(
          transfer =>{
            //new Promise((resolve, reject) => {
              console.log(savePath, this.appService.path.posix.join(this.currentPath,this.currentFile.name));
              transfer.on('progress', stats => {
                this.statusService.showStatus('File saved: ' + savePath + ' ' +
                  Math.round(
                    stats.bytesTransferred / 1024 / 1024
                  ) +
                  'MB');
              });
              transfer.on('end', () => {
                // this.statusService.showStatus('File saved successfully!!');
                // this.spinnerService.hideLoader();
                //  return resolve();
                console.log('end');
              });
              //transfer.on('error', reject);
              transfer.pipe(this.appService.fs.createWriteStream(savePath));
            }//)
        ).catch(e=>{
          console.log(e);
      });
  }
  pickLocation(){
    this.appService.electron.remote.dialog.showOpenDialog(
      {
        properties: ['openDirectory'],
        defaultPath: this.adbService.savePath,
      },
      files => {
        if (files !== undefined && files.length === 1) {
          this.adbService.savePath = files[0];
          this.adbService.setSavePath();
        }
      }
    );
  }
  isConnected(){
    let isConnected = this.adbService.deviceStatus === ConnectionStatus.CONNECTED;
    if(isConnected&&!this.isOpen){
      this.isOpen = true;
      this.open('/sdcard/');
    }
    return isConnected
  }
  getCrumb(path:string){
    let parts = path.split('/');
    let name = parts.pop();
    let parentPath = parts.join('/');
    if(parts.length>0){
      this.getCrumb(parentPath);
    }
    this.breadcrumbs.push({path,name});
  }
  openFile(file:FileFolderListing){
    if(file.icon === 'folder'){
      this.open(this.appService.path.posix.join(this.currentPath,file.name));
    }else{
      this.currentFile = file;
      this.filesModal.openModal();
    }
  }
  open(path:string){

    this.spinnerService.showLoader();
    this.spinnerService.setMessage('Loading files...');
    this.currentPath = path;
    this.breadcrumbs = [];
    this.getCrumb(this.currentPath.split('/').filter(d=>d).join('/'));
    if(!this.isConnected()){
      return Promise.resolve();
    }
    return this.adbService.client.readdir(this.adbService.deviceSerial, path)
      .then(files=> {

        this.files = files.map(file=> {
          let name = file.name;
          let size = Math.round((file.size/1024/1024)*100)/100;
          let time = file.mtime;
          let icon = 'folder';
          if(file.isFile()){
            let fileParts = file.name.split('.');
            let extension = (fileParts[fileParts.length-1]||"").toLowerCase();
            switch(extension){
              case "gif":
              case "png":
              case "jpeg":
              case "jpg":
                icon = 'photo';
                break;
              case "wav":
              case "ogg":
              case "mp3":
                icon = 'music_note';
                break;
              case "avi":
              case "mp4":
                icon = 'ondemand_video';
                break;
              case "txt":
              case "docx":
              case "doc":
                icon = 'receipt';
                break;
              case "pptx":
              case "ppt":
                icon = 'picture_in_picture';
                break;
              case "xlsx":
              case "xls":
                icon = 'grid_on';
                break;
              default:
                icon = 'receipt';
                break
            }
          }
          return {name,icon,size,time}
        });
        this.files.sort(function(a, b) {
          let textA = a.name.toUpperCase();
          let textB = b.name.toUpperCase();
          return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
        });
        this.files = this.files
          .filter(d => d.icon === 'folder')
          .concat(this.files
            .filter(d => d.icon !== 'folder'));

        this.spinnerService.hideLoader();
      });
  }

}
