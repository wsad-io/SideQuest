import { Component, OnInit } from '@angular/core';
import { AdbClientService } from '../adb-client.service';
import { AppService } from '../app.service';

@Component({
  selector: 'app-packages',
  templateUrl: './packages.component.html',
  styleUrls: ['./packages.component.css']
})
export class PackagesComponent implements OnInit {
  currentPackage:any = {appRepo:{},package:''};
  constructor(public adbService:AdbClientService, appService:AppService) {
    appService.webService.isWebviewOpen = false;
    appService.resetTop();
  }

  ngOnInit() {
    this.adbService.getPackages();
  }
  getCurrentInstalledInfo(){
    this.adbService.getPackageInfo(this.currentPackage.package)
      .then(info=>{
        console.log(this.currentPackage.package,info);
      })
  }
}
