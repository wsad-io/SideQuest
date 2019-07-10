import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BeatOnComponent } from './beat-on.component';

describe('BeatOnComponent', () => {
    let component: BeatOnComponent;
    let fixture: ComponentFixture<BeatOnComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [BeatOnComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(BeatOnComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
