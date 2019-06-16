import { Component, OnInit } from '@angular/core';
import { RepoItem } from '../repo-item/repo-item.component';
import { RepoService } from '../repo.service';

@Component({
  selector: 'app-repos',
  templateUrl: './repos.component.html',
  styleUrls: ['./repos.component.css']
})
export class ReposComponent implements OnInit {
  constructor(public repoService:RepoService) { }

  ngOnInit() {
    this.getRepos();
  }
  getRepos(){
  }
}
