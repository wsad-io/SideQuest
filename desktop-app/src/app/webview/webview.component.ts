import { Component, OnInit } from '@angular/core';
import { WebviewService } from '../webview.service';
import { AppService } from '../app.service';

@Component({
  selector: 'app-webview',
  templateUrl: './webview.component.html',
  styleUrls: ['./webview.component.css']
})
export class WebviewComponent implements OnInit {

  constructor(webService:WebviewService,appService:AppService) {
    appService.resetTop();
    webService.isWebviewOpen = true;
    appService.showBrowserBar = true;
    appService.setTitle('Beast Saber')
  }

  ngOnInit() {

  }

}
