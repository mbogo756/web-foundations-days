# Reflection

The most difficult concept in the course was understanding how a system can handle many people trying to buy the same seat at once without selling it twice. I worked through it by tracing a seat’s state from available, to held, to sold, and identifying where the database transaction and seat constraints must make the final decision. That helped me see why the browser or cache cannot be trusted as the source of truth for seat availability.

Feedback on my earlier API documentation showed me that leaving out endpoints and error responses makes a design incomplete for the people who need to build it. For this capstone, I would improve the API section further by adding more detailed request and response examples, including what happens when a seat is already held or a payment fails.

Next, I want to learn how to implement database transactions and concurrency controls in a real application. I would also like to learn how payment webhooks confirm successful payments reliably, especially when a provider retries a notification or responds slowly.