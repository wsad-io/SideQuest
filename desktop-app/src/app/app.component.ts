import { Component, CUSTOM_ELEMENTS_SCHEMA, ViewChild } from '@angular/core';
import { AppService } from './app.service';
import { LoadingSpinnerService } from './loading-spinner.service';
import { StatusBarService } from './status-bar.service';
import { WebviewService } from './webview.service';
import { DragAndDropService } from './drag-and-drop.service';
declare let __dirname;
@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
})
export class AppComponent {
    @ViewChild('spinner', { static: false }) spinner;
    @ViewChild('status', { static: false }) status;
    @ViewChild('webview', { static: false }) webview;
    constructor(
        private spinnerService: LoadingSpinnerService,
        private statusService: StatusBarService,
        private appService: AppService,
        public webService: WebviewService,
        public dragService: DragAndDropService
    ) {}
    ngAfterViewInit() {
        this.spinnerService.setSpinner(this.spinner);
        this.statusService.setStatus(this.status);
        console.log(this.webview);
        this.webService.setWebView(this.webview.nativeElement);
    }
}
