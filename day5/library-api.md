# Library Books REST API

This API manages books. Each book has an id, title, author and publicationYear.

## List all books

- Method: GET
- Path: /books
- Description: Return all books.
- Request body: None.
- Success status: 200 OK.

## Get one book

- Method: GET
- Path: /books/{id}
- Description: Return the book with the specified ID.
- Request body: None.
- Success status: 200 OK.

## Create a book

- Method: POST
- Path: /books
- Description: Create a book and assign it an ID.
- Success status: 201 Created.
- Example request body:

```json
{
  "title": "The River Between",
  "author": "Ngugi wa Thiong'o",
  "publicationYear": 1965
}
```

## Update a book

- Method: PUT
- Path: /books/{id}
- Description: Replace all editable fields of an existing book.
- Success status: 200 OK.
- Example request body:

```json
{
  "title": "The River Between",
  "author": "Ngugi wa Thiong'o",
  "publicationYear": 1965
}
```

## Delete a book

- Method: DELETE
- Path: /books/{id}
- Description: Delete the book with the specified ID.
- Request body: None.
- Success status: 204 No Content.

## List books by an author

- Method: GET
- Path: /books?author=Ngugi%20wa%20Thiong%27o
- Description: Return books matching the author query parameter.
- Request body: None.
- Success status: 200 OK, with an empty array if no books match.

## Error responses

- 400 Bad Request: The request contains invalid data.
  Example: POST /books is missing a required title, or publicationYear is not an integer.
- 404 Not Found: The requested book does not exist.
  Example: GET /books/999 requests a book ID that does not exist.