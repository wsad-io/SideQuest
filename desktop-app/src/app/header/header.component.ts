import { Component, OnInit, ViewChild } from '@angular/core';
import { AdbClientService, ConnectionStatus } from '../adb-client.service';
import { AppService, FolderType, ThemeMode } from '../app.service';
import { WebviewService } from '../webview.service';
import { LoadingSpinnerService } from '../loading-spinner.service';
import { StatusBarService } from '../status-bar.service';
import { RepoService } from '../repo.service';
import { BsaberService, QuestSaberPatchResponseJson } from '../bsaber.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  @ViewChild('header',{static:false}) header;
  @ViewChild('syncSongsModal',{static:false}) syncSongsModal;
  @ViewChild('installAPKModal',{static:false}) installAPKModal;
  theme = ThemeMode;
  folder = FolderType;
  isMaximized:boolean;
  addrepoUrl:string = '';
  qspResponse:QuestSaberPatchResponseJson;
  constructor(public adbService:AdbClientService,
              public appService:AppService,
              public bsaberService:BsaberService,
              public webService:WebviewService,
              public spinnerService:LoadingSpinnerService,
              public statusService:StatusBarService,
              public repoService:RepoService) {

  }
  ngOnInit(){}
  isConnected(){
    return this.adbService.deviceStatus === ConnectionStatus.CONNECTED;
  }
  ngAfterViewInit() {
    this.appService.setTitleEle(this.header.nativeElement)
  }
  getConnectionCssClass(){
    return {
      'connection-status-connected': this.adbService.deviceStatus === ConnectionStatus.CONNECTED,
      'connection-status-unauthorized': this.adbService.deviceStatus === ConnectionStatus.UNAUTHORIZED,
      'connection-status-disconnected': this.adbService.deviceStatus === ConnectionStatus.DISCONNECTED,
      'connection-status-too-many': this.adbService.deviceStatus === ConnectionStatus.TOOMANY
    }
  }
  closeApp(){
    this.appService.remote.getCurrentWindow().close();
  }
  minimizeApp(){
    this.appService.remote.getCurrentWindow().minimize();
  }
  maximizeApp(){
    this.isMaximized = !this.isMaximized;
    this.appService.remote.getCurrentWindow()[this.isMaximized?'unmaximize':'maximize']();
  }
  openDebugger(){
    this.appService.remote.getCurrentWindow().toggleDevTools();
  }
  selectAppToInstall() {
    this.appService.electron.remote.dialog.showOpenDialog(
      {
        properties: ['openFile','multiSelections'],
        defaultPath: this.adbService.savePath,
      },
      files => {
        files.forEach(f => {
          let filepath = f;
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
      });
  }
  addRepo(){
    this.spinnerService.showLoader();
    this.repoService.addRepo(this.addrepoUrl)
      .then(()=>this.addrepoUrl = '')
      .then(()=>this.spinnerService.hideLoader())
      .then(()=>this.statusService.showStatus('Repo added OK!!'))
      .then(()=>this.repoService.saveRepos())
      .catch(e=>this.statusService.showStatus(e.toString(),true));
  }
  patchBeatSaber(){
    this.syncSongsModal.closeModal();
    this.spinnerService.showLoader();
    this.spinnerService.setMessage('Patching Beat Saber...<br>This might take some time.');
    this.bsaberService.questSaberPatch()
      .then((json:QuestSaberPatchResponseJson)=>{
        if(json.error){
          return new Error(json.error);
        }
        this.qspResponse = json;
        this.spinnerService.hideLoader();
        this.installAPKModal.openModal();
      })
      .catch(e=>{
        this.spinnerService.hideLoader();
        this.statusService.showStatus(e.toString(),true);
      })
  }
  installSkippedLength(){
    return Object.keys(this.qspResponse.installSkipped||{}).length;
  }
  getInstallSkipped(){
    return Object.keys(this.qspResponse.installSkipped||{}).map(k=>k+':'+this.qspResponse.installSkipped[k]).join(', ')
  }
  installPatchedAPK(){
    this.adbService.installAPK(this.appService.path.join(this.appService.appData,'bsaber-base_patched.apk'),true);
  }
}
