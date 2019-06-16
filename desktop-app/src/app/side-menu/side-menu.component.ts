import { Component, OnInit } from '@angular/core';
import { RepoService } from '../repo.service';

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.css']
})
export class SideMenuComponent implements OnInit {

  constructor(public repoService:RepoService) { }

  ngOnInit() {
    setTimeout(()=>console.log(this.repoService.repos),5000)
  }

  consoleIt(test){
    //console.log(test);
  }
}
