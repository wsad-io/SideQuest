import { Component, OnInit } from '@angular/core';
import { AppService } from '../app.service';

@Component({
    selector: 'app-beat-on',
    templateUrl: './beat-on.component.html',
    styleUrls: ['./beat-on.component.css'],
})
export class BeatOnComponent implements OnInit {
    constructor(public appService: AppService) {}

    ngOnInit() {}
}
