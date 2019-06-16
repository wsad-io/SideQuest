import { Injectable } from '@angular/core';
import { LoadingSpinnerService } from './loading-spinner.service';
import { RepoItem } from './repo-item/repo-item.component';
import { RepoService } from './repo.service';
export enum ThemeMode {
  LIGHT,DARK
}
@Injectable({
  providedIn: 'root'
})
export class AppService {
  appData:string;
  fs:any;
  path:any;
  nativeApp:any;
  os:any;
  request:any;
  currentTheme:ThemeMode = ThemeMode.DARK;
  constructor() {
    this.path = (<any>window).require('path');
    this.fs = (<any>window).require('fs');
    this.request = (<any>window).require('request');
    /*
    const opn = require('opn');
const remote = require('electron').remote;
const ipcRenderer = require('electron').ipcRenderer;
const eApp = require('electron').remote.app;
const dialog = require('electron').remote.dialog;
const clipboard = require('electron').clipboard;
const shell = require('electron').shell;
const adb = require('adbkit');
const extract = require('extract-zip');
const targz = require('targz');
const os = require('os');
const fs = require('fs');
const path = require('path');
const request = require('request');
const progress = require('request-progress');
const md5 = require('md5');
const Readable = require('stream').Readable;
const appData = path.join(eApp.getPath('appData'),'SideQuest');
const semver = require('semver');
const { spawn } = require('child_process');
     */
    this.nativeApp = (<any>window).require('electron').remote.app;
    this.appData = this.path.join(this.nativeApp.getPath('appData'),'SideQuest');
  }
  public doesFileExist(path) {
    try {
    //  return this.fs.existsSync(path);
    } catch (err) {
      return false;
    }
  }
  isTheme(theme:ThemeMode){
    return this.currentTheme === theme;
  }
  setTheme(theme:ThemeMode){
    this.currentTheme = theme;
  }

}
