import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BookListComponent } from './book-list.component';
import { Book } from '../../../core/models/book.model';

const mockBooks: Book[] = [
  { id: 1, title: 'Clean Code',       author: 'Robert Martin', publicationDate: '2008-08-01', userId: 1 },
  { id: 2, title: 'The Pragmatic Programmer', author: 'Dave Thomas', publicationDate: '1999-10-20', userId: 1 }
];

describe('BookListComponent', () => {
  let fixture: ComponentFixture<BookListComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    // Bootstrap Modal is not available in the test environment — stub it out
    (window as any).bootstrap = {
      Modal: class {
        show() {}
        hide() {}
      }
    };

    await TestBed.configureTestingModule({
      imports: [BookListComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BookListComponent);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should show a loading state before books are fetched', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance.isLoading()).toBe(true);
    http.expectOne(r => r.url.includes('/books')).flush(mockBooks);
  });

  it('should display books returned by the API', () => {
    fixture.detectChanges();
    http.expectOne(r => r.url.includes('/books')).flush(mockBooks);
    fixture.detectChanges();

    expect(fixture.componentInstance.books().length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('Clean Code');
    expect(fixture.nativeElement.textContent).toContain('The Pragmatic Programmer');
  });

  it('should show an error message when the API call fails', () => {
    fixture.detectChanges();
    http.expectOne(r => r.url.includes('/books'))
        .flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(fixture.componentInstance.errorMsg()).toContain('Failed to load books');
  });

  it('should remove the book from the list after delete is confirmed', () => {
    fixture.detectChanges();
    http.expectOne(r => r.url.includes('/books')).flush(mockBooks);
    fixture.detectChanges();

    fixture.componentInstance.pendingDeleteId.set(1);
    fixture.componentInstance.confirmDelete();

    http.expectOne(r => r.url.includes('/books/1') && r.method === 'DELETE').flush(null);
    fixture.detectChanges();

    expect(fixture.componentInstance.books().length).toBe(1);
    expect(fixture.componentInstance.books()[0].title).toBe('The Pragmatic Programmer');
  });

  it('should set isLoading to false after books are loaded', () => {
    fixture.detectChanges();
    http.expectOne(r => r.url.includes('/books')).flush(mockBooks);
    fixture.detectChanges();

    expect(fixture.componentInstance.isLoading()).toBe(false);
  });
});
