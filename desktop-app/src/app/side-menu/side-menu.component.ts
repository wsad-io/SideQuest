import { Component, OnInit } from '@angular/core';
import { RepoService } from '../repo.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.css']
})
export class SideMenuComponent implements OnInit {

  constructor(public router:Router,public repoService:RepoService) { }

  ngOnInit() {
  }
  openRepo(index){
    this.router.navigateByUrl('/apps/'+index);
  }
}
