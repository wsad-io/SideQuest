import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SideQuestCardComponent } from './side-quest-card.component';

describe('SideQuestCardComponent', () => {
  let component: SideQuestCardComponent;
  let fixture: ComponentFixture<SideQuestCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SideQuestCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SideQuestCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
