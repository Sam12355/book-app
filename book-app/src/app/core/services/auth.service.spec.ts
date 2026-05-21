import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Component } from '@angular/core';
import { AuthService } from './auth.service';

// Minimal stub component so the router has a valid /login route to navigate to during logout()
@Component({ standalone: true, template: '' })
class LoginStubComponent {}

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', component: LoginStubComponent }])
      ]
    });

    service = TestBed.inject(AuthService);
    http    = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    http.verify(); // Fail if any HTTP request was made but not asserted
    localStorage.clear();
  });

  // ── Token storage ─────────────────────────────────────────────────────────

  it('should return null when no token is in localStorage', () => {
    expect(service.getToken()).toBeNull();
  });

  it('should persist a token to localStorage via saveToken()', () => {
    service.saveToken('my-jwt-token');

    expect(service.getToken()).toBe('my-jwt-token');
  });

  it('should set isLoggedIn signal to true after saveToken()', () => {
    service.saveToken('my-jwt-token');

    expect(service.isLoggedIn()).toBe(true);
  });

  it('should report isLoggedIn as false when localStorage is empty', () => {
    expect(service.isLoggedIn()).toBe(false);
  });

  // ── Logout ────────────────────────────────────────────────────────────────

  it('should remove the token from localStorage on logout', () => {
    service.saveToken('my-jwt-token');
    service.logout();

    expect(service.getToken()).toBeNull();
  });

  it('should set isLoggedIn to false on logout', () => {
    service.saveToken('my-jwt-token');
    service.logout();

    expect(service.isLoggedIn()).toBe(false);
  });

  // ── Login ─────────────────────────────────────────────────────────────────

  it('should POST credentials to /auth/login', () => {
    service.login({ username: 'alice', password: 'secret' }).subscribe();

    const req = http.expectOne(r => r.url.includes('/auth/login'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'alice', password: 'secret' });
    req.flush({ token: 'server-token' });
  });

  it('should save the token returned by the login API', () => {
    service.login({ username: 'alice', password: 'secret' }).subscribe();

    http.expectOne(r => r.url.includes('/auth/login')).flush({ token: 'server-token-abc' });

    expect(service.getToken()).toBe('server-token-abc');
    expect(service.isLoggedIn()).toBe(true);
  });

  // ── Register ──────────────────────────────────────────────────────────────

  it('should POST credentials to /auth/register', () => {
    service.register({ username: 'alice', password: 'secret' }).subscribe();

    const req = http.expectOne(r => r.url.includes('/auth/register'));
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  it('should include the correct body in the register request', () => {
    service.register({ username: 'bob', password: 'pass123' }).subscribe();

    const req = http.expectOne(r => r.url.includes('/auth/register'));
    expect(req.request.body).toEqual({ username: 'bob', password: 'pass123' });
    req.flush(null);
  });
});
