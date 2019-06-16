import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { RepoService } from '../repo.service';
import { Observable } from 'rxjs/internal/Observable';
import { Subscription } from 'rxjs/internal/Subscription';
import { JSONApp, RepoBody } from '../repo-item/repo-item.component';

@Component({
  selector: 'app-side-quest-apps',
  templateUrl: './side-quest-apps.component.html',
  styleUrls: ['./side-quest-apps.component.css']
})
export class SideQuestAppsComponent implements OnInit {
  sub:Subscription;
  apps:JSONApp[];
  currentRepo:number = 0;

  constructor(private route: ActivatedRoute,private repoService:RepoService,router:Router) {
    this.sub = router.events.subscribe((val) => {
      if(val instanceof NavigationEnd){
        this.currentRepo = parseInt(this.route.snapshot.paramMap.get("index"))||0;
      }
    });
  }
  ngOnInit() {

  }
  getApps(){
    if(this.repoService.repos.length&&this.repoService.repos[this.currentRepo]){
      this.repoService.currentRepo = this.repoService.repos[this.currentRepo];
      return this.repoService.currentRepo.body.apps;
    }else{
      return [];
    }
  }
  ngOnDestroy(){
    if(this.sub)this.sub.unsubscribe();
  }
}
