import { Component, Input, OnInit } from '@angular/core';
import { JSONApp, JSONPackage } from '../repo-item/repo-item.component';

@Component({
  selector: 'app-side-quest-app-version',
  templateUrl: './side-quest-app-version.component.html',
  styleUrls: ['./side-quest-app-version.component.css']
})
export class SideQuestAppVersionComponent implements OnInit {
  @Input('apk') apk:JSONPackage;
  constructor() { }

  ngOnInit() {
  }

}
