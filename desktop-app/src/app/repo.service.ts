import { Injectable } from '@angular/core';
import { AppService } from './app.service';
import { LoadingSpinnerService } from './loading-spinner.service';
import { RepoBody, RepoItem } from './repo-item/repo-item.component';

@Injectable({
  providedIn: 'root'
})
export class RepoService {
  repos:RepoItem[] = [];
  constructor(private appService:AppService,private spinnerService:LoadingSpinnerService) {
    this.getRepos();
  }
  getRepos(){
    this.appService.fs.readFile(this.appService.appData + '/sources.txt', 'utf8', (err, data) => {
      if (!err) {
        console.log(data);
        setTimeout(() =>data.split('\n').forEach(url => this.addRepo(url)));
      }
    });
  }
  addRepo(url:string){

    console.log(this.repos.length);
    this.spinnerService.setMessage(`Loading ${url}`);
    let index = ++this.repos.length;
    url = url.trim();
    if (url[url.length - 1] !== '/') {
      url += '/';
    }
    return new Promise(async (resolve, reject) => {
      if (~this.repos.map(d => d.url).indexOf(url)) {
        reject('Repo already added!');
      }
      const jsonUrl = url + 'index-v1.json';
      this.appService.request(jsonUrl, (error, response, body) => {
        if (error) {
          return reject(error);
        } else {
          try {
            let repo_body:RepoBody = JSON.parse(body);
            if (!this.isValidRepo(repo_body)) {
              reject('Repo not valid or unsupported version!');
            } else {
              resolve(repo_body);
            }
          } catch (e) {
            return reject('JSON parse Error');
          }
        }
      });
    }).then((repo:RepoBody) => {
      this.repos.push({
        name: repo.repo.name,
        icon: repo.repo.icon,
        url: url,
        order: index,
        body: repo,
        categories: repo.apps
          .reduce((a, b) => {
            b.icon = url + 'icons/' + b.icon;
            return a.concat(b.categories);
          }, [])
          .filter((v, i, self) => self.indexOf(v) === i),
      });
    });
  }
  isValidRepo(repo:RepoBody) {
    if (!repo) return false;
    if (!repo.repo) return false;
    if (
      !repo.repo.version ||
      !(repo.repo.version > 17 && repo.repo.version < 24)
    )
      return false;
    return true;
  }
}
