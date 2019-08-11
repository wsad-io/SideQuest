import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'app-current-task-item',
    templateUrl: './current-task-item.component.html',
    styleUrls: ['./current-task-item.component.css'],
})
export class CurrentTaskItemComponent implements OnInit {
    @Input() task;
    constructor() {}

    ngOnInit() {}
}
