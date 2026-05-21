import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { BooksService } from './books.service';
import { Book } from '../models/book.model';

describe('BooksService', () => {
  let service: BooksService;
  let http: HttpTestingController;

  const mockBook: Book = {
    id: 1,
    title: 'Clean Code',
    author: 'Robert Martin',
    publicationDate: '2008-08-01',
    userId: 1
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(BooksService);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should send GET to /api/books', () => {
    service.getBooks().subscribe();

    const req = http.expectOne(r => r.url.includes('/books') && !r.url.includes('/books/'));
    expect(req.request.method).toBe('GET');
    req.flush([mockBook]);
  });

  it('should return an array of books from getBooks()', () => {
    let result: Book[] = [];
    service.getBooks().subscribe(books => result = books);

    http.expectOne(r => r.url.includes('/books')).flush([mockBook]);

    expect(result.length).toBe(1);
    expect(result[0].title).toBe('Clean Code');
  });

  it('should send GET to /api/books/:id', () => {
    service.getBook(1).subscribe();

    const req = http.expectOne(r => r.url.includes('/books/1'));
    expect(req.request.method).toBe('GET');
    req.flush(mockBook);
  });

  it('should send POST with book data to createBook()', () => {
    const payload = { title: 'New Book', author: 'Author', publicationDate: '2024-01-01' };
    service.createBook(payload).subscribe();

    const req = http.expectOne(r => r.url.includes('/books'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockBook);
  });

  it('should send PUT with updated data to updateBook()', () => {
    const payload = { title: 'Updated', author: 'Author', publicationDate: '2024-01-01' };
    service.updateBook(1, payload).subscribe();

    const req = http.expectOne(r => r.url.includes('/books/1'));
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush({ ...mockBook, ...payload });
  });

  it('should send DELETE to /api/books/:id', () => {
    service.deleteBook(1).subscribe();

    const req = http.expectOne(r => r.url.includes('/books/1'));
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
