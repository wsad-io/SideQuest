import { Injectable } from '@angular/core';
import { LoadingSpinnerService } from './loading-spinner.service';
import { RepoItem } from './repo-item/repo-item.component';
import { RepoService } from './repo.service';
export enum ThemeMode {
  LIGHT,DARK
}
export enum FolderType{
  MAIN,ADB,BSABER,BSABER_BACKUPS,APK_BACKUPS,DATA_BACKUPS,QUEST_SABER_PATCH
}

@Injectable({
  providedIn: 'root'
})
export class AppService {
  appData:string;
  fs:any;
  path:any;
  nativeApp:any;
  remote:any;
  electron:any;
  os:any;
  request:any;
  extract:any;
  progress:any;
  Readable:any;
  opn:any;
  currentTheme:ThemeMode = ThemeMode.DARK;
  constructor() {
    this.path = (<any>window).require('path');
    this.fs = (<any>window).require('fs');
    this.request = (<any>window).require('request');
    this.extract =(<any>window).require('extract-zip');
    this.progress =(<any>window).require('request-progress');
    this.os =(<any>window).require('os');
    this.Readable = (<any>window).require('stream').Readable;
    this.opn = (<any>window).require('opn');
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
    this.electron = (<any>window).require('electron');
    this.remote = this.electron.remote;
    this.nativeApp = this.electron.remote.app;
    this.appData = this.path.join(this.nativeApp.getPath('appData'),'SideQuest');

    let theme = localStorage.getItem('theme');
    if(theme&&theme==='light'){
      this.currentTheme = ThemeMode.LIGHT;
    }
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
    localStorage.setItem('theme',theme===ThemeMode.DARK?'dark':'light');
  }
  getThemeCssClass(prefix:string,isButton?:boolean){
    let classes = {};
    classes[prefix+'-dark-theme'] = this.isTheme(ThemeMode.DARK);
    classes[prefix+'-light-theme'] = this.isTheme(ThemeMode.LIGHT);
    if(isButton||prefix==='button'){
      classes['waves-dark'] = true;
      classes['waves-light'] = false;
    }
    return classes;
  }
  openFolder(folder:FolderType){
    switch(folder){
      case FolderType.MAIN:
        this.electron.shell.openItem(this.appData);
        break;
      case FolderType.BSABER_BACKUPS:
        this.electron.shell.openItem(this.path.join(this.appData, 'bsaber-backups'));
        break;
      case FolderType.ADB:
        this.electron.shell.openItem(this.path.join(this.appData, 'platform-tools'));
        break;
      case FolderType.APK_BACKUPS:
        this.electron.shell.openItem(this.path.join(this.appData, 'apk-backups'));
        break;
      case FolderType.DATA_BACKUPS:
        this.electron.shell.openItem(this.path.join(this.appData, 'bsaber-data-backups'));
        break;
      case FolderType.QUEST_SABER_PATCH:
        this.electron.shell.openItem(this.path.join(this.appData, 'saber-quest-patch','questsaberpatch'));
        break;
    }
  }
}
