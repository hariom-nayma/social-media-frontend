import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Oauth2Redirect } from './oauth2-redirect';

describe('Oauth2Redirect', () => {
  let component: Oauth2Redirect;
  let fixture: ComponentFixture<Oauth2Redirect>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Oauth2Redirect]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Oauth2Redirect);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
