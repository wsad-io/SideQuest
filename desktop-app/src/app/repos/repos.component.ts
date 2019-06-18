import { Component, OnInit } from '@angular/core';
import { RepoItem } from '../repo-item/repo-item.component';
import { RepoService } from '../repo.service';
import { AppService } from '../app.service';
import { StatusBarService } from '../status-bar.service';

@Component({
  selector: 'app-repos',
  templateUrl: './repos.component.html',
  styleUrls: ['./repos.component.css']
})
export class ReposComponent implements OnInit {
  constructor(public repoService:RepoService,private appService:AppService,private statusService:StatusBarService) {
    appService.webService.isWebviewOpen = false;
    this.appService.resetTop();
    this.appService.showRepo = true;
  }

  ngOnInit() {
    this.appService.setTitle("Repositories");
  }
}
