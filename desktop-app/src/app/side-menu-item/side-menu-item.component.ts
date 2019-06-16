import { Component, Input, OnInit } from '@angular/core';
import { RepoItem } from '../repo-item/repo-item.component';

@Component({
  selector: 'app-side-menu-item',
  templateUrl: './side-menu-item.component.html',
  styleUrls: ['./side-menu-item.component.css']
})
export class SideMenuItemComponent implements OnInit {
  @Input('repo') repo:RepoItem;
  constructor() { }

  ngOnInit() {
    console.log(this.repo);
  }
}
