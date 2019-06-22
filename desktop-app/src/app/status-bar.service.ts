import { Injectable } from '@angular/core';
import { AppService } from './app.service';
import { StatusBarComponent } from './status-bar/status-bar.component';

@Injectable({
  providedIn: 'root'
})
export class StatusBarService {
  status:StatusBarComponent;
  constructor(private appService:AppService) { }
  setStatus(status:StatusBarComponent){
    this.status = status;
  }
  showStatus(message:string, isWarning?:boolean) {
    this.status.statusMessage = message;
    this.status.isWarning = isWarning;
    this.status.isActive = true;
  }
  hideStatus() {
    this.status.isActive = this.status.showDiscord = false;
  }
  copyStatus() {
    this.appService.electron.clipboard.writeText(this.status.statusMessage);
    this.status.showDiscord = true;
    this.showStatus(
      'Copied to your clipboard! Please post this in our discord server in the #general channel:'
    );
  }
}
