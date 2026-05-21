import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BooksService } from '../../../core/services/books.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-book-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './book-form.component.html',
  styleUrl: './book-form.component.scss'
})
export class BookFormComponent implements OnInit {

  // ── Injected dependencies ─────────────────────────────────────────────────
  private fb           = inject(FormBuilder);
  private booksService = inject(BooksService);
  private router       = inject(Router);
  private route        = inject(ActivatedRoute);
  private toast        = inject(ToastService);

  // ── Mode detection ────────────────────────────────────────────────────────
  // Read the :id param from the URL — if it exists we are in Edit mode, else Add mode
  // route.snapshot.paramMap reads the URL once at component creation time
  private bookId = this.route.snapshot.paramMap.get('id'); // null = Add, "5" = Edit book #5
  isEditMode = signal(!!this.bookId);                      // !! converts string|null to true|false

  // ── UI state signals ──────────────────────────────────────────────────────
  isLoading  = signal(false); // True while saving (submit) OR while loading book data (edit mode)
  errorMsg   = signal('');    // API error messages
  pageTitle  = signal(this.isEditMode() ? 'Edit Book' : 'Add New Book'); // Dynamic page title

  // ── Reactive form ─────────────────────────────────────────────────────────
  bookForm = this.fb.group({
    title:           ['', [Validators.required, Validators.minLength(1), Validators.maxLength(200)]],
    author:          ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
    publicationDate: ['', Validators.required] // ISO date string "YYYY-MM-DD"
  });

  // ── Convenience getters ───────────────────────────────────────────────────
  get title()           { return this.bookForm.get('title'); }
  get author()          { return this.bookForm.get('author'); }
  get publicationDate() { return this.bookForm.get('publicationDate'); }

  // ── OnInit — load existing book data if in Edit mode ─────────────────────
  ngOnInit(): void {
    if (this.isEditMode() && this.bookId) {
      this.loadBook(+this.bookId); // + converts string "5" to number 5
    }
  }

  // ── Fetch the existing book and pre-fill the form ─────────────────────────
  private loadBook(id: number): void {
    this.isLoading.set(true);

    this.booksService.getBook(id).subscribe({
      next: (book) => {
        // patchValue fills only the specified fields — setValue would require ALL fields
        // publicationDate arrives as "1965-08-01T00:00:00" — slice(0,10) gives "1965-08-01"
        // which matches the format the <input type="date"> element expects
        this.bookForm.patchValue({
          title:           book.title,
          author:          book.author,
          publicationDate: book.publicationDate.slice(0, 10)
        });
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMsg.set('Failed to load book details. Please go back and try again.');
        this.isLoading.set(false);
      }
    });
  }

  // ── Form submit — create or update depending on mode ─────────────────────
  onSubmit(): void {
    if (this.bookForm.invalid) return;

    this.isLoading.set(true);
    this.errorMsg.set('');

    const data = {
      title:           this.bookForm.value.title!,
      author:          this.bookForm.value.author!,
      publicationDate: this.bookForm.value.publicationDate!
    };

    // Choose the right API call based on mode
    const request$ = this.isEditMode()
      ? this.booksService.updateBook(+this.bookId!, data) // Edit: PUT /api/books/:id
      : this.booksService.createBook(data);               // Add:  POST /api/books

    request$.subscribe({
      next: () => {
        this.toast.show(this.isEditMode() ? 'Book updated successfully.' : 'Book added successfully.');
        this.router.navigate(['/books']);
      },
      error: () => {
        this.errorMsg.set('Failed to save book. Please try again.');
        this.isLoading.set(false);
      }
    });
  }
}
