import { Component, OnInit } from '@angular/core';
import { AdbClientService } from '../adb-client.service';

@Component({
  selector: 'app-packages',
  templateUrl: './packages.component.html',
  styleUrls: ['./packages.component.css']
})
export class PackagesComponent implements OnInit {

  constructor(public adbService:AdbClientService) {
  }

  ngOnInit() {
    this.adbService.getPackages();
  }

}
