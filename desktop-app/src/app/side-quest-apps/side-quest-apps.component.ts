import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { RepoService } from '../repo.service';
import { Observable } from 'rxjs/internal/Observable';
import { Subscription } from 'rxjs/internal/Subscription';
import { JSONApp, RepoBody } from '../repo-item/repo-item.component';
import { AppService } from '../app.service';

@Component({
  selector: 'app-side-quest-apps',
  templateUrl: './side-quest-apps.component.html',
  styleUrls: ['./side-quest-apps.component.css']
})
export class SideQuestAppsComponent implements OnInit {
  sub:Subscription;
  apps:JSONApp[];
  currentRepo:number = 0;

  constructor(private route: ActivatedRoute,private repoService:RepoService,private appService:AppService,router:Router) {
    this.appService.resetTop();
    this.appService.showSearch = true;
    this.sub = router.events.subscribe((val) => {
      if(val instanceof NavigationEnd){
        appService.webService.isWebviewOpen = false;
        this.currentRepo = parseInt(this.route.snapshot.paramMap.get("index"))||0;
      }
    });
  }
  ngOnInit() {

  }
  getApps(){
    let apps = this.repoService.setCurrent(this.currentRepo);
    if(apps){
      this.appService.setTitle(apps.name);
    }
    return apps.body.apps;
  }
  ngOnDestroy(){
    if(this.sub)this.sub.unsubscribe();
  }
}
