import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { JSONApp, RepoItem } from '../repo-item/repo-item.component';
import { RepoService } from '../repo.service';

@Component({
    selector: 'app-package-item',
    templateUrl: './package-item.component.html',
    styleUrls: ['./package-item.component.css'],
})
export class PackageItemComponent implements OnInit {
    @Input('package') package: string;
    @Output('settings') settings = new EventEmitter();
    repoApp: JSONApp;
    constructor(public repoService: RepoService) {}

    ngOnInit() {}

    openSettings() {
        this.settings.emit({ package: this.package });
    }
}
