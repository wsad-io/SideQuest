import { Injectable } from '@angular/core';
import { AppService } from './app.service';
//import * as path from 'path';

@Injectable({
  providedIn: 'root'
})
export class AdbClientService {
  adb:any;
  client:any;
  adbPath:string;
  constructor(public appService:AppService) {
    this.client = (<any>window).require('adbkit');
    this.adbPath = appService.path.join(appService.appData, 'platform-tools')
  }
  async setupAdb() {
    if (!this.isAdbDownloaded()) {
      //await this.downloadTools();
    }
   this.adb = this.client.createClient({
     bin: this.appService.path.join(this.adbPath, this.getAdbBinary()),
   });
    //this.connection_refresh.addEventListener('click',async ()=>this.updateConnectedStatus(await this.connectedStatus()));
  }
  isAdbDownloaded() {
    //return this.doesFileExist(this.adbPath);
  }
  getAdbBinary() {
    switch (this.appService.os.platform()) {
      case 'win32':
        return 'adb.exe';
      default:
        return 'adb';
    }
  }
}
