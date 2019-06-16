import { Component, OnInit } from '@angular/core';
import { AppService } from '../app.service';
import { AdbClientService } from '../adb-client.service';

@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.css']
})
export class SetupComponent implements OnInit {
  isInstallingLauncher:boolean;
  isInstalledLauncher:boolean;
  isInstallingExpanse:boolean;
  isInstalledExpanse:boolean;
  constructor(public appService:AppService, private adbService:AdbClientService) { }

  ngOnInit() {
  }

  isExpanseInstalled(){
    this.isInstalledExpanse = !!~this.adbService.devicePackages.indexOf('app.theexpanse.app');
    return this.isInstalledExpanse;
  }

  isLauncherInstalled(){
    this.isInstalledLauncher = !!~this.adbService.devicePackages.indexOf('com.sidequest.wrapper2') &&
      !!~this.adbService.devicePackages.indexOf('com.sidequest.wrapper') &&
      !!~this.adbService.devicePackages.indexOf('com.sidequest.launcher');
    return this.isInstalledLauncher;
  }

  installLauncher(){
      this.isInstallingLauncher = true;
      this.adbService
        .installApk(
          'https://cdn.theexpanse.app/SideQuestWrapper.apk'
        )
        .then(() =>
          this.adbService.installApk(
            'https://cdn.theexpanse.app/SideQuestWrapper2.apk'
          )
        )
        .then(() =>
          this.adbService.installApk(
            'https://cdn.theexpanse.app/SideQuestLauncher.apk'
          )
        )
        .then(()=>this.adbService.getPackages())
        .then(() => {

          this.isInstallingLauncher = false;
          this.isInstalledLauncher = true;
        });
  }
  installExpanse(){
    this.isInstallingExpanse = true;
    this.adbService
      .installApk('https://cdn.theexpanse.app/TheExpanse.apk')
      .then(()=>this.adbService.getPackages())
      .then(() => {
        this.isInstallingExpanse = false;
        this.isInstalledExpanse = true;
      });
  }
}
