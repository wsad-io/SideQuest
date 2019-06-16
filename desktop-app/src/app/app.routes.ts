import { SetupComponent } from './setup/setup.component';
import { Routes } from '@angular/router';
import { ReposComponent } from './repos/repos.component';
import { PackagesComponent } from './packages/packages.component';
import { ToolsComponent } from './tools/tools.component';
import { SideQuestAppsComponent } from './side-quest-apps/side-quest-apps.component';

export const AppRoutes: Routes = [
  { path: 'setup', component: SetupComponent},
  { path: 'repos', component: ReposComponent},
  { path: 'packages', component: PackagesComponent},
  { path: 'tools', component: ToolsComponent},
  { path: 'apps/:index', component: SideQuestAppsComponent},
  { path: '**', component: SideQuestAppsComponent},
];
