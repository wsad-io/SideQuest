import { Component, Input, OnInit } from '@angular/core';
import { RepoItem } from '../repo-item/repo-item.component';

@Component({
  selector: 'app-package-item',
  templateUrl: './package-item.component.html',
  styleUrls: ['./package-item.component.css']
})
export class PackageItemComponent implements OnInit {
  @Input('package') package:string;
  constructor() { }

  ngOnInit() {
  }

}
