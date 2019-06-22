import { Component, OnInit, ViewChild } from '@angular/core';
import { AdbClientService, ConnectionStatus } from '../adb-client.service';
import { AppService, FolderType, ThemeMode } from '../app.service';
import { WebviewService } from '../webview.service';
import { LoadingSpinnerService } from '../loading-spinner.service';
import { StatusBarService } from '../status-bar.service';
import { RepoService } from '../repo.service';
import { BsaberService } from '../bsaber.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  @ViewChild('header',{static:false}) header;
  theme = ThemeMode;
  folder = FolderType;
  isMaximized:boolean;
  addrepoUrl:string = '';
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
}
