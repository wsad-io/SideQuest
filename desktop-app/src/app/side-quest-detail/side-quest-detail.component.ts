import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/internal/Subscription';
import { RepoService } from '../repo.service';
import { JSONApp } from '../repo-item/repo-item.component';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-side-quest-detail',
  templateUrl: './side-quest-detail.component.html',
  styleUrls: ['./side-quest-detail.component.css']
})
export class SideQuestDetailComponent implements OnInit {
  sub:Subscription;
  apps:JSONApp[];
  currentRepo:number = 0;

  constructor(private route: ActivatedRoute,private repoService:RepoService,router:Router) {
    this.sub = router.events.subscribe((val) => {
      if (val instanceof NavigationEnd) {
        this.currentRepo = parseInt(this.route.snapshot.paramMap.get("index")) || 0;
      }
    });
  }
  ngOnInit() {
  }

}
