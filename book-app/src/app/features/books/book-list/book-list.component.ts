import { Component, inject, OnInit, AfterViewInit, ViewChild, ElementRef, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BooksService } from '../../../core/services/books.service';
import { Book } from '../../../core/models/book.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './book-list.component.html',
  styleUrl: './book-list.component.scss'
})
export class BookListComponent implements OnInit, AfterViewInit {

  // Services are injected using Angular's inject() function instead of constructor parameters
  private booksService = inject(BooksService);
  private toast        = inject(ToastService);

  // Signals hold reactive state — the template re-renders automatically when any signal changes
  books           = signal<Book[]>([]);         // Full list of books fetched from the API
  isLoading       = signal(true);               // Shows the loading spinner while waiting for the API
  errorMsg        = signal('');                 // Displays an error message when something goes wrong
  deletingId      = signal<number | null>(null); // Tracks which row is currently being deleted (shows spinner on that row)
  pendingDeleteId = signal<number | null>(null); // Stores the id of the book the user clicked delete on, before confirming

  // ViewChild gives us a reference to the modal element in the template so Bootstrap can control it
  @ViewChild('deleteModalEl') deleteModalEl!: ElementRef;
  private deleteModal: any; // Holds the Bootstrap Modal instance created in ngAfterViewInit

  ngAfterViewInit(): void {
    // Bootstrap's Modal class is available globally because bootstrap.bundle.min.js is loaded in angular.json
    // We create the modal instance once here so we can call .show() and .hide() from TypeScript
    this.deleteModal = new (window as any).bootstrap.Modal(this.deleteModalEl.nativeElement);
  }

  ngOnInit(): void {
    this.loadBooks();
  }

  loadBooks(): void {
    this.isLoading.set(true);
    this.errorMsg.set('');

    this.booksService.getBooks().subscribe({
      next: (data) => {
        this.books.set(data);       // Populate the signal with the response array
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMsg.set('Failed to load books. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  // First step of deletion: record which book the user wants to remove, then open the confirm modal
  deleteBook(id: number): void {
    this.pendingDeleteId.set(id);
    this.deleteModal.show();
  }

  // Called when the user clicks the Delete button inside the modal
  confirmDelete(): void {
    const id = this.pendingDeleteId();
    if (id === null) return;

    this.deleteModal.hide();
    this.deletingId.set(id); // Shows a spinner on the row that is being deleted

    this.booksService.deleteBook(id).subscribe({
      next: () => {
        this.books.update(list => list.filter(b => b.id !== id));
        this.deletingId.set(null);
        this.pendingDeleteId.set(null);
        this.toast.show('Book deleted.');
      },
      error: () => {
        this.errorMsg.set('Failed to delete book. Please try again.');
        this.deletingId.set(null);
        this.pendingDeleteId.set(null);
      }
    });
  }

  // Called when the user clicks Cancel in the modal — clears the queued id and closes the modal
  cancelDelete(): void {
    this.pendingDeleteId.set(null);
    this.deleteModal.hide();
  }

  // The API returns dates in ISO format like "1965-08-01" — this formats them to "Aug 1, 1965"
  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }
}
