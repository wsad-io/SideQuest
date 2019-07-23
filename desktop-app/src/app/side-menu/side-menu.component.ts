import { Component, OnInit } from '@angular/core';
import { RepoService } from '../repo.service';
import { Router } from '@angular/router';
import { WebviewService } from '../webview.service';
import { AdbClientService } from '../adb-client.service';
import { AppService } from '../app.service';

@Component({
    selector: 'app-side-menu',
    templateUrl: './side-menu.component.html',
    styleUrls: ['./side-menu.component.css'],
})
export class SideMenuComponent implements OnInit {
    constructor(
        public router: Router,
        public repoService: RepoService,
        private webService: WebviewService,
        private adbService: AdbClientService,
        private appService: AppService
    ) {}

    ngOnInit() {}
    openRepo(index) {
        this.router.navigateByUrl('/apps/' + index);
    }
    openBeatSaber() {
        this.webService.isWebviewOpen = true;
    }

    openCategory(category) {
        this.appService.resetTop();
        this.webService.loadUrl('http://sidequestvr.com/#/apps/' + category);
        this.webService.isWebviewOpen = true;
        this.appService.showBrowserBar = true;
        this.appService.setTitle('SideQuest');
    }
}
