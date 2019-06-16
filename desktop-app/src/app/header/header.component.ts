import { Component, OnInit } from '@angular/core';
import { AdbClientService } from '../adb-client.service';
import { AppService, ThemeMode } from '../app.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  theme = ThemeMode;
  constructor(private adbService:AdbClientService, public appService:AppService) {

  }

  ngOnInit() {

  }
}
