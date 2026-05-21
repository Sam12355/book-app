import { Component, inject, OnInit, AfterViewInit, ViewChild, ElementRef, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { QuotesService } from '../../core/services/quotes.service';
import { Quote } from '../../core/models/quote.model';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-quotes',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './quotes.component.html',
  styleUrl: './quotes.component.scss'
})
export class QuotesComponent implements OnInit, AfterViewInit {

  // Services injected with Angular's inject() function
  private quotesService = inject(QuotesService);
  private fb            = inject(FormBuilder);
  private toast         = inject(ToastService);

  // Signals for reactive UI state — the template updates automatically when these change
  quotes          = signal<Quote[]>([]);         // All quotes for the logged-in user
  isLoading       = signal(true);               // True while the initial list is loading
  errorMsg        = signal('');                 // Shows any API error to the user
  savingId        = signal<number | null>(null); // Id of the quote currently being saved or deleted
  editingId       = signal<number | null>(null); // Id of the quote whose card is in edit mode (null means none)
  pendingDeleteId = signal<number | null>(null); // Id queued for deletion, waiting for modal confirmation

  // Reference to the modal element in the template so Bootstrap JS can control it
  @ViewChild('deleteModalEl') deleteModalEl!: ElementRef;
  private deleteModal: any;

  ngAfterViewInit(): void {
    // Create the Bootstrap Modal instance once after the view renders
    // bootstrap is available globally from bootstrap.bundle.min.js loaded in angular.json
    this.deleteModal = new (window as any).bootstrap.Modal(this.deleteModalEl.nativeElement);
  }

  // The add form stays visible at the top of the page at all times
  addForm = this.fb.group({
    text: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]]
  });
  isAdding = signal(false); // True while the add request is waiting for the API to respond

  // One shared edit form is reused for whichever quote the user clicks Edit on
  editForm = this.fb.group({
    text: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]]
  });

  ngOnInit(): void {
    this.loadQuotes();
  }

  loadQuotes(): void {
    this.isLoading.set(true);
    this.quotesService.getQuotes().subscribe({
      next:  (data) => { this.quotes.set(data); this.isLoading.set(false); },
      error: ()     => { this.errorMsg.set('Failed to load quotes.'); this.isLoading.set(false); }
    });
  }

  addQuote(): void {
    if (this.addForm.invalid) return;

    this.isAdding.set(true);
    this.quotesService.createQuote({ text: this.addForm.value.text! }).subscribe({
      next: (newQuote) => {
        this.quotes.update(list => [...list, newQuote]);
        this.addForm.reset();
        this.isAdding.set(false);
        this.toast.show('Quote added.');
      },
      error: () => {
        this.errorMsg.set('Failed to add quote.');
        this.isAdding.set(false);
      }
    });
  }

  // Puts one quote card into edit mode and pre-fills the shared edit form with its current text
  startEdit(quote: Quote): void {
    this.editingId.set(quote.id);
    this.editForm.patchValue({ text: quote.text });
  }

  // Returns the card to view mode without saving anything
  cancelEdit(): void {
    this.editingId.set(null);
    this.editForm.reset();
  }

  saveEdit(id: number): void {
    if (this.editForm.invalid) return;

    this.savingId.set(id);
    this.quotesService.updateQuote(id, { text: this.editForm.value.text! }).subscribe({
      next: (updated) => {
        // Swap the old quote object in the array with the updated one the API returned
        this.quotes.update(list => list.map(q => q.id === id ? updated : q));
        this.editingId.set(null);
        this.editForm.reset();
        this.savingId.set(null);
        this.toast.show('Quote updated.');
      },
      error: () => {
        this.errorMsg.set('Failed to update quote.');
        this.savingId.set(null);
      }
    });
  }

  // First step of deletion: store the id and open the confirm modal
  deleteQuote(id: number): void {
    this.pendingDeleteId.set(id);
    this.deleteModal.show();
  }

  // Called when the user clicks the Delete button inside the modal
  confirmDelete(): void {
    const id = this.pendingDeleteId();
    if (id === null) return;

    this.deleteModal.hide();
    this.savingId.set(id); // Shows a spinner on that quote card while the request is in flight

    this.quotesService.deleteQuote(id).subscribe({
      next: () => {
        // Remove the quote from the local signal without re-fetching the whole list
        this.quotes.update(list => list.filter(q => q.id !== id));
        this.savingId.set(null);
        this.pendingDeleteId.set(null);
        this.toast.show('Quote deleted.');
      },
      error: () => {
        this.errorMsg.set('Failed to delete quote.');
        this.savingId.set(null);
        this.pendingDeleteId.set(null);
      }
    });
  }

  // Called when the user clicks Cancel in the modal — nothing is deleted
  cancelDelete(): void {
    this.pendingDeleteId.set(null);
    this.deleteModal.hide();
  }
}
