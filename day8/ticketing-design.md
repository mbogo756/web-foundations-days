# TicketHub System Design

## 1. Requirements

### Functional requirements

- Visitors can browse upcoming concerts and events.
- Visitors can view an event’s available seats and prices.
- Registered users can temporarily hold available seats.
- Users can pay for held seats and receive tickets.
- Users can view their purchased tickets.
- Users can release a hold or let it expire if they do not complete payment.

### Non-functional requirements

- **Speed:** Event listings and seat maps should load quickly, including during a popular sale.
- **Correctness:** A seat must never be confirmed in two different orders.
- **Fairness:** During a high-demand sale, users should enter the purchase flow in a controlled, orderly way rather than overwhelming the system.
- **Availability:** The site should remain usable if an application server fails.
- **Security:** Users should only access their own orders and tickets, and payment details must be handled securely.
- **Reliability:** Expired or failed purchase attempts should release their seat holds so those seats can be purchased by someone else.


## 2. Traffic estimates

### Assumptions

- The normal-day page views are spread across 24 hours for the average estimate.
- During the popular sale, the 200,000 people arrive over 10 minutes.
- Each person makes about three requests during the sale: browsing event or seat details, requesting a seat hold, and submitting checkout.
- One ticket is treated as one successful seat sale for these estimates.

### Normal day

- **Page views:** 50,000 visitors × 10 pages = 500,000 page views per day.
- **Average page views per second:** 500,000 ÷ 86,400 = about 5.8 per second.
- **Tickets sold:** 5,000 per day.
- **Average tickets sold per second:** 5,000 ÷ 86,400 = about 0.06 per second.

### Popular concert sale

- **People arriving:** 200,000 ÷ 600 seconds = about 333 people per second.
- **Estimated requests:** 200,000 people × 3 requests ÷ 600 seconds = about 1,000 requests per second on average during the sale.
- **Seats available:** 20,000 seats. If all sell within 10 minutes, the system confirms about 33 ticket sales per second.
- **Demand compared with supply:** 10 people are trying to buy for every available seat.

The sale creates a much higher and more concentrated load than a normal day. The system should handle at least 1,000 requests per second and have extra capacity for bursts. A fair waiting room can release visitors to the purchase flow at a controlled rate.

## 3. API design

All endpoints use JSON. Requests that buy tickets require an authenticated user.

| Method | Endpoint | Purpose | Success |
|---|---|---|---|
| GET | `/api/events` | List upcoming events, with optional date or location filters. | `200 OK` |
| GET | `/api/events/{eventId}/seats` | Show the event's seats and whether each is available, held, or sold. | `200 OK` |
| POST | `/api/events/{eventId}/holds` | Temporarily hold selected seats for the authenticated user. | `201 Created` |
| POST | `/api/orders` | Create an order and begin payment for a valid seat hold. | `201 Created` |
| GET | `/api/me/tickets` | List tickets purchased by the authenticated user. | `200 OK` |
| GET | `/api/orders/{orderId}` | Check the status of an order and its payment. | `200 OK` |

Example seat-hold request:

```json
{
  "seatIds": [101, 102]
}

{
  "holdId": "hold-789",
  "seatIds": [101, 102],
  "expiresAt": "2026-10-30T18:15:00Z"
}


## 4. Data model

### Tables and relationships

- **Users:** Stores registered buyers. One user can place many orders.
- **Events:** Stores event details. One event has many seats and many orders.
- **Seats:** Stores the individual seats for an event, including each seat's price and status. A seat belongs to one event and can be linked to an order while held or sold.
- **Orders:** Stores a user's purchase attempt for an event, including its status and hold expiry time. One order can contain several seats.

### Example SQL schema

```sql
CREATE TABLE users (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE events (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    venue VARCHAR(200) NOT NULL,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE orders (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    event_id INTEGER NOT NULL REFERENCES events(id),
    status VARCHAR(20) NOT NULL
        CHECK (status IN ('pending', 'paid', 'failed', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE seats (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id),
    seat_number VARCHAR(20) NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'available'
        CHECK (status IN ('available', 'held', 'sold')),
    order_id INTEGER REFERENCES orders(id),
    UNIQUE (event_id, seat_number)
);
```

### Preventing double-booking

The unique constraint on `(event_id, seat_number)` ensures that the same physical seat is represented only once for an event. When a user requests a hold, the server starts a database transaction, locks the requested seat rows, and changes a seat from `available` to `held` only if it is still available. If any requested seat is unavailable, the transaction rolls back and no partial hold is created. After payment is confirmed, another transaction changes the order to `paid` and the held seats to `sold`. If the hold expires or payment fails, the seats are released. This makes the database, rather than the browser, the authority on seat availability.


## 5. Architecture

```text
+--------+    +-----+    +------------------+    +----------------------+
| Client | -> | DNS | -> | CDN              | -> | Fair waiting room    |
+--------+    +-----+    +------------------+    +----------+-----------+
                                                            |
                                                            v
                                                  +---------+---------+
                                                  | Load balancer     |
                                                  +----+---------+----+
                                                       |         |
                                                       v         v
                                                +----------+ +----------+
                                                | App      | | App      |
                                                | server 1 | | server 2 |
                                                +----+-----+ +----+-----+
                                                     |            |
                         +---------------------------+------------+----------------+
                         |                           |                             |
                         v                           v                             v
                  +-------------+            +---------------+             +---------------+
                  | Cache       |            | Primary       | ----------> | Read replica  |
                  |             |            | database      |             |               |
                  +-------------+            +-------+-------+             +---------------+
                                                      |
                                                      v
                                               +-------------+
                                               | Job queue   |
                                               +------+------+
                                                      |
                                                      v
                                               +-------------+
                                               | Workers     |
                                               +------+------+
                                                      |
                                                      v
                                               +-------------+
                                               | Email/ticket|
                                               | service     |
                                               +-------------+

                                      App servers <----> Payment provider
```

### Components

- **Client:** Lets buyers browse events, select seats, pay, and view their tickets.
- **DNS:** Directs the TicketHub domain to the service.
- **CDN:** Serves static files and public event content from locations close to buyers.
- **Fair waiting room:** Gives sale visitors an orderly place to wait and admits them at a controlled rate.
- **Load balancer:** Distributes admitted requests across healthy app servers.
- **App servers:** Run the API, authenticate buyers, validate requests, and coordinate holds and orders.
- **Cache:** Speeds up frequently requested public event information; seat availability is checked against the database before a hold is confirmed.
- **Primary database:** Holds authoritative seat, order, and payment status and handles transactional updates.
- **Read replica:** Serves read-heavy queries such as event listings, reducing load on the primary database.
- **Job queue:** Holds background tasks, such as ticket delivery, so they do not delay checkout responses.
- **Workers:** Process queued tasks and retry temporary failures.
- **Payment provider:** Processes payments and sends confirmation to TicketHub.

During a popular sale, the waiting room limits how quickly buyers reach the application, while the load balancer spreads admitted traffic across multiple app servers. Event information can be cached and read from the replica. Seat holds and purchases still go through transactions on the primary database, so speed improvements do not weaken seat correctness. Workers handle ticket delivery after payment confirmation.


## 6. Trade-offs

- **Fairness versus speed:** A waiting room protects the system and gives buyers an orderly entry, but some users must wait longer to reach the seat map.
- **Fast reads versus fresh seat availability:** A cache and read replica make event pages faster, but their data can briefly be out of date. TicketHub therefore checks the primary database transactionally before confirming a seat hold or sale.
- **Short holds versus purchase time:** Brief seat holds let more buyers try for tickets, but may expire while a buyer is completing payment. The system should give users a clear expiry time and release seats automatically when a hold expires.