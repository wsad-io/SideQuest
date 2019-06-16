import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SideQuestAppsComponent } from './side-quest-apps.component';

describe('SideQuestAppsComponent', () => {
  let component: SideQuestAppsComponent;
  let fixture: ComponentFixture<SideQuestAppsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SideQuestAppsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SideQuestAppsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
