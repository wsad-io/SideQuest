import { Component, OnInit } from '@angular/core';
import { RepoService } from '../repo.service';
import { Router } from '@angular/router';
import { WebviewService } from '../webview.service';

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.css']
})
export class SideMenuComponent implements OnInit {

  constructor(public router:Router,public repoService:RepoService, private webService:WebviewService) { }

  ngOnInit() {
  }
  openRepo(index){
    this.router.navigateByUrl('/apps/'+index);
  }
  openBeatSaber(){
    this.webService.isWebviewOpen = true;
  }

}
