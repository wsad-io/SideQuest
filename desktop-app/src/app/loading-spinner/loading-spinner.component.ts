import { Component, OnInit } from '@angular/core';
import { LoadingSpinnerService } from '../loading-spinner.service';

@Component({
  selector: 'app-loading-spinner',
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.css']
})
export class LoadingSpinnerComponent implements OnInit {
  isActive:boolean = true;
  isLoading:boolean;
  loadingMessage:string;
  constructor(spinnerService:LoadingSpinnerService) {
    spinnerService.setSpinner(this);
  }
  ngOnInit() {

  }
}
