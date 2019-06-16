import { Component, OnInit } from '@angular/core';
import { WebviewService } from '../webview.service';

@Component({
  selector: 'webview',
  templateUrl: './webview.component.html',
  styleUrls: ['./webview.component.css']
})
export class WebviewComponent implements OnInit {

  constructor(webService:WebviewService) {
    webService.isWebviewOpen = true;
  }

  ngOnInit() {

  }

}
