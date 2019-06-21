import { Component, Input, OnInit } from '@angular/core';
import { JSONApp, JSONPackage } from '../repo-item/repo-item.component';
import { AdbClientService } from '../adb-client.service';

@Component({
  selector: 'app-side-quest-app-version',
  templateUrl: './side-quest-app-version.component.html',
  styleUrls: ['./side-quest-app-version.component.css']
})
export class SideQuestAppVersionComponent implements OnInit {
  @Input('apk') apk:JSONPackage;
  constructor(private adbService:AdbClientService) { }

  ngOnInit() {
  }
  install(){
    this.adbService.installAPK(this.apk.apkName);
  }
}
