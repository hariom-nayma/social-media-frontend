import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShakaPlayer } from './shaka-player';

describe('ShakaPlayer', () => {
  let component: ShakaPlayer;
  let fixture: ComponentFixture<ShakaPlayer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShakaPlayer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShakaPlayer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
