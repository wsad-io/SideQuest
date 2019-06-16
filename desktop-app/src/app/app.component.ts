import { Component, ViewChild } from '@angular/core';
import { AppService } from './app.service';
import { LoadingSpinnerService } from './loading-spinner.service';
import { StatusBarService } from './status-bar.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  @ViewChild('spinner',{static:false}) spinner;
  @ViewChild('status',{static:false}) status;
  constructor(private spinnerService:LoadingSpinnerService,private statusService:StatusBarService){
  }
  ngAfterViewInit(){

    this.spinnerService.setSpinner(this.spinner);
    this.statusService.setStatus(this.status);
  }
}
