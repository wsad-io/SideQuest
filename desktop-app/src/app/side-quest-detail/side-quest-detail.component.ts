import { ApplicationRef, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/internal/Subscription';
import { RepoService } from '../repo.service';
import { JSONApp, JSONPackage, RepoItem } from '../repo-item/repo-item.component';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { AppService } from '../app.service';

@Component({
  selector: 'app-side-quest-detail',
  templateUrl: './side-quest-detail.component.html',
  styleUrls: ['./side-quest-detail.component.css']
})
export class SideQuestDetailComponent implements OnInit {
  sub:Subscription;
  repo:RepoItem;
  package:JSONPackage[];
  app:JSONApp;
  currentApp:string;
  appDescription:string;
  currentRepo:number = 0;

  constructor(private route: ActivatedRoute,private repoService:RepoService,public appService:AppService,router:Router,private appRef:ChangeDetectorRef) {
    this.sub = router.events.subscribe((val) => {
      if (val instanceof NavigationEnd) {
        this.currentApp = this.route.snapshot.paramMap.get("package");
        this.currentRepo = parseInt(this.route.snapshot.paramMap.get("index"))||0;
        appService.webService.isWebviewOpen = false;
      }
    });
  }
  ngOnInit() {
   // console.log(this.currentApp);

  }
  ngOnDestroy(){
    if(this.sub)this.sub.unsubscribe();
  }
  getRepo(){
    this.repo = <RepoItem>this.repoService.setCurrent(this.currentRepo);
    if(!this.app&&this.repo&&this.repo.body.apps.length){
      let apps = this.repoService.currentRepo.body.apps.filter(a=>a.packageName === this.currentApp);
      if(apps.length){
        this.app = apps[0];
        this.package = this.repoService.currentRepo.body.packages[this.currentApp];
        this.appService.setTitle(this.app.name);
        this.appDescription = "<h4>"+this.app.name+"</h4><br>"+this.getAppSummary(this.app)+"<br><br>"+this.getLongMetaData(this.app);
        this.appRef.detectChanges();
      }
    }
  }

  getAppSummary(app) {
    if (app.summary || app.description) {
      return (
        (app.summary || '') +
        (app.summary && app.description ? '<br><br>' : '') +
        (app.description || '')
      );
    } else if (app.localized) {
      const firstKey = app.localized['en-US']
        ? 'en-US'
        : Object.keys(app.localized)[0];
      if (firstKey) {
        return (
          (app.localized[firstKey].summary || '') +
          (app.localized[firstKey].summary &&
          app.localized[firstKey].description
            ? '<br><br>'
            : '') +
          (app.localized[firstKey].description || '')
        );
      } else {
        return 'No description...';
      }
    } else {
      return 'No description...';
    }
  }
  getLongMetaData(app) {
    let output = '';
    let properties = [
      'packageName',
      'authorEmail',
      'webSite',
      'sourceCode',
      'issueTracker',
      'changelog',
    ];
    let webProperties = properties.filter(
      p => p !== 'packageName' && p !== 'authorEmail'
    );
    properties.forEach(p => {
      if (app[p]) {
        if (~webProperties.indexOf(p)) {
          output +=
            p +
            ': <span class="link" data-url="' +
            app[p] +
            '">' +
            app[p] +
            '</span><br>';
        } else {
          output += p + ': <b>' + app[p] + '</b><br>';
        }
      }
    });
    return output;
  }
  getAppMetadata(app) {
    let output = '';
    let dateProperties = ['added', 'lastUpdated'];
    let properties = ['authorName', 'license'];
    dateProperties.forEach(p => {
      if (app[p]) {
        output +=
          p + ': <b>' + new Date(app[p]).toDateString() + '</b><br>';
      }
    });
    properties.forEach(p => {
      if (app[p]) {
        output += p + ': <b>' + app[p] + '</b><br>';
      }
    });
    return output;
  }
}
