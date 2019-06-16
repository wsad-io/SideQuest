import { SetupComponent } from './setup/setup.component';
import { Routes } from '@angular/router';
import { ReposComponent } from './repos/repos.component';

export const AppRoutes: Routes = [
  { path: 'setup', component: SetupComponent},
  { path: 'repos', component: ReposComponent},
];
