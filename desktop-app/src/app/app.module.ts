import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { SideMenuComponent } from './side-menu/side-menu.component';
import { SideMenuItemComponent } from './side-menu-item/side-menu-item.component';
import { ContentComponent } from './content/content.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';



import { MzTooltipModule } from 'ngx-materialize'
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

@NgModule({
  declarations: [
    AppComponent,
    SideMenuComponent,
    SideMenuItemComponent,
    ContentComponent,
    HeaderComponent,
    StatusBarComponent,
    LoadingSpinnerComponent,
    SetupComponent,
    LoadingSpinnerSmallComponent,
    ReposComponent,
    RepoItemComponent
  ],
  imports: [
    BrowserModule,
    DragulaModule.forRoot(),
    RouterModule.forRoot(AppRoutes),
    MzTooltipModule,
    BrowserAnimationsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
