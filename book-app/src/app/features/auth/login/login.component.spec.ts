import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { LoginComponent } from './login.component';

@Component({ standalone: true, template: '' })
class BooksStubComponent {}

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([{ path: 'books', component: BooksStubComponent }]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    http    = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('should render the username and password fields', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('#username')).not.toBeNull();
    expect(el.querySelector('#password')).not.toBeNull();
  });

  it('should disable the submit button when the form is empty', () => {
    const btn = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('should enable the submit button when username and password are valid', () => {
    fixture.componentInstance.loginForm.setValue({ username: 'alice', password: 'secret123' });
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it('should show a validation message when username is too short', () => {
    fixture.componentInstance.loginForm.get('username')?.setValue('ab');
    fixture.componentInstance.loginForm.get('username')?.markAsTouched();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('at least 3 characters');
  });

  it('should POST to /auth/login with the form values on submit', () => {
    fixture.componentInstance.loginForm.setValue({ username: 'alice', password: 'secret123' });
    fixture.detectChanges();
    fixture.componentInstance.onSubmit();

    const req = http.expectOne(r => r.url.includes('/auth/login'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'alice', password: 'secret123' });
    req.flush({ token: 'fake-token' });
  });

  it('should show an error message when the API returns 401', () => {
    fixture.componentInstance.loginForm.setValue({ username: 'alice', password: 'wrongpass' });
    fixture.componentInstance.onSubmit();

    http.expectOne(r => r.url.includes('/auth/login'))
        .flush(null, { status: 401, statusText: 'Unauthorized' });

    fixture.detectChanges();
    expect(fixture.componentInstance.errorMsg()).toContain('Invalid username or password');
  });

  it('should set isLoading to true while the request is in flight', () => {
    fixture.componentInstance.loginForm.setValue({ username: 'alice', password: 'secret123' });
    fixture.componentInstance.onSubmit();

    expect(fixture.componentInstance.isLoading()).toBe(true);
    http.expectOne(r => r.url.includes('/auth/login')).flush({ token: 'fake-token' });
  });
});
