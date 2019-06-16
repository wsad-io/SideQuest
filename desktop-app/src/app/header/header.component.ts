import { Component, OnInit, ViewChild } from '@angular/core';
import { AdbClientService, ConnectionStatus } from '../adb-client.service';
import { AppService, ThemeMode } from '../app.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  @ViewChild('header',{static:false}) header;
  theme = ThemeMode;
  isMaximized:boolean;
  constructor(public adbService:AdbClientService, public appService:AppService) {

  }
  ngOnInit(){}
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
}
