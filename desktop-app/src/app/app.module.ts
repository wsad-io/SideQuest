import { BrowserModule } from '@angular/platform-browser';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { SideMenuComponent } from './side-menu/side-menu.component';
import { ContentComponent } from './content/content.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MzButtonModule, MzModalModule, MzTooltipModule } from 'ngx-materialize';
import { DragulaModule } from 'ng2-dragula';
import { HeaderComponent } from './header/header.component';
import { StatusBarComponent } from './status-bar/status-bar.component';
import { LoadingSpinnerComponent } from './loading-spinner/loading-spinner.component';
import { RouterModule } from '@angular/router';
import { SetupComponent } from './setup/setup.component';
import { AppRoutes } from './app.routes';
import { LoadingSpinnerSmallComponent } from './loading-spinner-small/loading-spinner-small.component';
import { ReposComponent } from './repos/repos.component';
import { RepoItemComponent } from './repo-item/repo-item.component';
import { PackagesComponent } from './packages/packages.component';
import { PackageItemComponent } from './package-item/package-item.component';
import { ToolsComponent } from './tools/tools.component';
import { LinkComponent } from './link/link.component';
import { FormsModule } from '@angular/forms';
import { SanitizeHtmlPipe } from './sanitize-html.pipe';
import { SideQuestAppsComponent } from './side-quest-apps/side-quest-apps.component';
import { SideQuestCardComponent } from './side-quest-card/side-quest-card.component';
import { SideQuestDetailComponent } from './side-quest-detail/side-quest-detail.component';
import { SideQuestAppVersionComponent } from './side-quest-app-version/side-quest-app-version.component';
import { WebviewComponent } from './webview/webview.component';
import { WebviewDirective } from './webview.directive';
import { FilesComponent } from './files/files.component';
import { CustomLevelsComponent } from './custom-levels/custom-levels.component';
import { SongPackManagerComponent } from './song-pack-manager/song-pack-manager.component';

@NgModule({
    declarations: [
        AppComponent,
        SideMenuComponent,
        ContentComponent,
        HeaderComponent,
        StatusBarComponent,
        LoadingSpinnerComponent,
        SetupComponent,
        LoadingSpinnerSmallComponent,
        ReposComponent,
        RepoItemComponent,
        PackagesComponent,
        PackageItemComponent,
        ToolsComponent,
        LinkComponent,
        SanitizeHtmlPipe,
        SideQuestAppsComponent,
        SideQuestCardComponent,
        SideQuestDetailComponent,
        SideQuestAppVersionComponent,
        WebviewComponent,
        WebviewDirective,
        FilesComponent,
        CustomLevelsComponent,
        SongPackManagerComponent,
    ],
    imports: [
        BrowserModule,
        DragulaModule.forRoot(),
        FormsModule,
        RouterModule.forRoot(AppRoutes),
        MzTooltipModule,
        MzModalModule,
        MzButtonModule,
        BrowserAnimationsModule,
    ],
    providers: [],
    bootstrap: [AppComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
