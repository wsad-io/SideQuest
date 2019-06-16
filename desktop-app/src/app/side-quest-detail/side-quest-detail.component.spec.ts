import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SideQuestDetailComponent } from './side-quest-detail.component';

describe('SideQuestDetailComponent', () => {
  let component: SideQuestDetailComponent;
  let fixture: ComponentFixture<SideQuestDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SideQuestDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SideQuestDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
