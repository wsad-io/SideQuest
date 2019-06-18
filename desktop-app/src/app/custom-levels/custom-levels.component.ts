import { Component, OnInit } from '@angular/core';
import { LoadingSpinnerService } from '../loading-spinner.service';
import { AdbClientService } from '../adb-client.service';
import { StatusBarService } from '../status-bar.service';
import { AppService } from '../app.service';
import { BsaberService } from '../bsaber.service';

@Component({
  selector: 'app-custom-levels',
  templateUrl: './custom-levels.component.html',
  styleUrls: ['./custom-levels.component.css']
})
export class CustomLevelsComponent implements OnInit {

  constructor(public spinnerService:LoadingSpinnerService,
              public adbService:AdbClientService,
              public appService:AppService,
              public statusService:StatusBarService,
              public bsaberService:BsaberService) {
    this.appService.resetTop();
    appService.webService.isWebviewOpen = false;
    this.appService.setTitle('Beast Saber Custom Levels.');
    this.appService.showCustomActions = true;
  }
  ngOnInit() {
    this.bsaberService.getMySongs()
  }
}
