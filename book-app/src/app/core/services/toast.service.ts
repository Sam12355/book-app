import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'danger';
}

@Injectable({ providedIn: 'root' })
export class ToastService {

  toasts = signal<Toast[]>([]); // Reactive list — the toast component reads this and re-renders automatically

  private nextId = 0; // Simple counter so each toast has a unique id for tracking and removal

  show(message: string, type: 'success' | 'danger' = 'success'): void {
    const id = this.nextId++;
    this.toasts.update(list => [...list, { id, message, type }]);
    setTimeout(() => this.dismiss(id), 3500); // Auto-remove after 3.5 seconds
  }

  dismiss(id: number): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
