import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  afterEach(() => {
    vi.useRealTimers(); // Restore real timers after each test so other tests are not affected
  });

  it('should start with no toasts', () => {
    expect(service.toasts().length).toBe(0);
  });

  it('should add a toast when show() is called', () => {
    service.show('Book saved.');

    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].message).toBe('Book saved.');
  });

  it('should default to success type when no type argument is passed', () => {
    service.show('Done!');

    expect(service.toasts()[0].type).toBe('success');
  });

  it('should store the type passed to show()', () => {
    service.show('Something went wrong.', 'danger');

    expect(service.toasts()[0].type).toBe('danger');
  });

  it('should give each toast a unique id', () => {
    service.show('First');
    service.show('Second');

    const [a, b] = service.toasts();
    expect(a.id).not.toBe(b.id);
  });

  it('should remove a toast when dismiss() is called with its id', () => {
    service.show('Hello');
    const id = service.toasts()[0].id;

    service.dismiss(id);

    expect(service.toasts().length).toBe(0);
  });

  it('should only remove the toast with the matching id', () => {
    service.show('First');
    service.show('Second');
    const firstId = service.toasts()[0].id;

    service.dismiss(firstId);

    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].message).toBe('Second');
  });

  it('should auto-remove a toast after 3500ms', () => {
    vi.useFakeTimers(); // Replace setTimeout with a controllable fake
    service.show('Temporary');
    expect(service.toasts().length).toBe(1);

    vi.advanceTimersByTime(3500);

    expect(service.toasts().length).toBe(0);
  });

  it('should not remove toast before 3500ms have elapsed', () => {
    vi.useFakeTimers();
    service.show('Still here');

    vi.advanceTimersByTime(3000);
    expect(service.toasts().length).toBe(1); // Still present at 3 seconds

    vi.advanceTimersByTime(500);
    expect(service.toasts().length).toBe(0); // Gone at 3.5 seconds
  });
});
