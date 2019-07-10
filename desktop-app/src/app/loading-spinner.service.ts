import { ChangeDetectorRef, Injectable } from '@angular/core';
import { LoadingSpinnerComponent } from './loading-spinner/loading-spinner.component';

@Injectable({
    providedIn: 'root',
})
export class LoadingSpinnerService {
    spinner: LoadingSpinnerComponent;
    constructor() {}
    setSpinner(spinner: LoadingSpinnerComponent) {
        this.spinner = spinner;
    }
    setMessage(message) {
        if (this.spinner) {
            this.spinner.loadingMessage = message;
        }
    }
    showDrag() {
        if (this.spinner) {
            this.spinner.isLoading = false;
            this.spinner.isActive = true;
        }
    }
    showLoader() {
        if (this.spinner) {
            this.spinner.isLoading = this.spinner.isActive = true;
        }
    }
    hideLoader() {
        if (this.spinner) {
            this.spinner.isLoading = this.spinner.isActive = false;
        }
    }
    setupConfirm() {
        return new Promise(resolve => {
            this.spinner.isConfirm = true;
            this.spinner.confirmResolve = resolve;
        });
    }
}
