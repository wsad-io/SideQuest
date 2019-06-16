import { Injectable } from '@angular/core';
import { LoadingSpinnerComponent } from './loading-spinner/loading-spinner.component';

@Injectable({
  providedIn: 'root'
})
export class LoadingSpinnerService {
  spinner:LoadingSpinnerComponent;
  constructor() {

  }
  setSpinner(spinner:LoadingSpinnerComponent){
    this.spinner = spinner;
  }
  setMessage(message) {
    this.spinner.loadingMessage = message;
  }
  showDrag() {
    this.spinner.isLoading = false;
    this.spinner.isActive = true;
  }
  showLoader() {
    this.spinner.isLoading = this.spinner.isActive = true;
  }
  hideLoader() {
    this.spinner.isLoading = this.spinner.isActive = false;
  }
}
