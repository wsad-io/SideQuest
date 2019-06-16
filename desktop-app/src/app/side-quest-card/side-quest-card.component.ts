import { Component, Input, OnInit } from '@angular/core';
import { JSONApp } from '../repo-item/repo-item.component';
import { RepoService } from '../repo.service';
import { AppService } from '../app.service';

@Component({
  selector: 'app-side-quest-card',
  templateUrl: './side-quest-card.component.html',
  styleUrls: ['./side-quest-card.component.css']
})
export class SideQuestCardComponent implements OnInit {
  @Input('app') app:JSONApp;
  constructor(public repoService:RepoService,public appService:AppService) {

  }

  ngOnInit() {
    //console.log(this.app);
  }

}
