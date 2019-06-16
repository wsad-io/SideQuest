import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SideQuestAppVersionComponent } from './side-quest-app-version.component';

describe('SideQuestAppVersionComponent', () => {
  let component: SideQuestAppVersionComponent;
  let fixture: ComponentFixture<SideQuestAppVersionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SideQuestAppVersionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SideQuestAppVersionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
