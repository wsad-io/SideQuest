import { Component, ViewChild } from '@angular/core';
import { AppService } from './app.service';
import { LoadingSpinnerService } from './loading-spinner.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  @ViewChild('spinner') spinner;
  constructor(spinnerService:LoadingSpinnerService){
    spinnerService.setSpinner(this.spinner)
  }
}
