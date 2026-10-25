# SnapShare Scaling Plan

## Assumptions

- SnapShare has 10 million registered users.
- 10% of registered users are active each day.
- Each active user uploads 1 photo and views 50 feed pages per day.
- An original photo averages 2 MB, and its thumbnail averages 50 KB.
- Peak traffic is 5 times average traffic.
- A day has 86,400 seconds, and a year has 365 days.
- Storage uses decimal units: 1 MB = 1,000 KB.
- Uploaded photos are retained throughout the year.
- Storage estimates exclude backups, extra copies and database metadata.

## Daily Active Users

10,000,000 × 10% = 1,000,000 daily active users.


## Traffic Estimates

### Photo uploads

Each of the 1,000,000 daily active users uploads 1 photo:

- Daily uploads: 1,000,000 × 1 = 1,000,000.
- Average uploads per second: 1,000,000 ÷ 86,400 ≈ 11.6.
- Peak uploads per second: 11.6 × 5 ≈ 58.

### Feed views

Each active user views 50 feed pages per day:

- Daily feed views: 1,000,000 × 50 = 50,000,000.
- Average feed views per second: 50,000,000 ÷ 86,400 ≈ 579.
- Peak feed views per second: 579 × 5 ≈ 2,894.

These estimates treat one feed page view as one feed API request.
Requests for the individual photo files are additional traffic.


## Storage Estimates

Each upload includes an original photo and one thumbnail:

- Storage per upload: 2 MB + 0.05 MB = 2.05 MB.
- Daily storage growth: 1,000,000 × 2.05 MB = 2.05 TB.
- Annual storage growth: 2.05 TB × 365 = 748.25 TB.

The annual total consists of 730 TB of original photos and
18.25 TB of thumbnails, excluding backups and extra copies.

## Read-Heavy or Write-Heavy?

SnapShare is read-heavy: users view 50 million feed pages but upload
only 1 million photos each day, giving roughly 50 feed reads per upload.

The design should prioritise fast reads using a CDN for photo delivery,
a cache for frequently requested data, and a database read replica
to handle suitable read queries.

Uploads still require reliable storage and background processing,
especially during peak traffic.

## Where Photos Are Stored

Original photos and thumbnails should be stored in object storage,
rather than directly inside the database.

Large photo files would increase database size, backup costs and
the amount of data the database must handle. Object storage is designed
for storing and serving files at scale.

The database stores metadata such as the photo ID, uploader ID,
caption, upload time, processing status and object storage keys.
The CDN delivers the photo files to users.


## Architecture Diagram


[User / Browser]
    |
    | Feed requests and upload requests
    v
[Load Balancer]
    |
    v
[App Servers] ---------> [Cache]
    |
    | Writes
    +------------------> [Primary Database]
    |                           |
    |                           | Replication
    |                           v
    | Reads              [Read Replica]
    +-------------------------->|
    |
    | Save original photo
    +------------------> [Object Storage]
    |
    | Enqueue thumbnail job
    v
[Queue] ----------------> [Thumbnail Worker]
                                  |
                                  | Read original, save thumbnail
                                  v
                           [Object Storage]
                                  ^
                                  |
                           Fetch on cache miss
                                  |
[User / Browser] ----------> [CDN]
                  Photo requests

The worker also updates the photo's processing status and thumbnail
storage key in the primary database.


## Component Responsibilities

- **CDN:** Caches photos and thumbnails near users, reducing download time and requests to object storage.
- **Load balancer:** Distributes incoming API requests across healthy app servers.
- **App servers:** Handle authentication, uploads and feed requests, allowing application capacity to grow by adding servers.
- **Cache:** Keeps frequently requested feed data in memory to reduce database queries and improve response times.
- **Primary database:** Stores users, follow relationships and photo metadata, enforcing consistency when data changes.
- **Read replica:** Handles suitable read queries to reduce load on the primary database.
- **Object storage:** Stores original photos and thumbnails without making the database handle large image files.
- **Queue:** Holds thumbnail jobs until workers can process them, absorbing bursts of uploads.
- **Thumbnail worker:** Creates thumbnails in the background so image processing does not delay upload responses.


## Photo Upload Flow

1. The user selects a photo and sends an authenticated upload request through the load balancer to an app server.
2. The app server checks the user's permission and validates the file's size and type.
3. The app server saves the original photo in object storage.
4. The app server creates a record in the primary database containing the uploader, caption, original storage key and a pending thumbnail status.
5. The app server places a thumbnail job containing the photo ID and original storage key on the queue.
6. The app server confirms the upload to the user while thumbnail processing continues in the background.
7. A worker takes the job, retrieves the original and creates a thumbnail.
8. The worker saves the thumbnail in object storage and updates its storage key and processing status in the primary database.
9. The app invalidates affected cached feed data so later requests can retrieve the updated information.
10. Users request images through the CDN, which retrieves them from object storage on a cache miss and caches them for later requests.

Failed thumbnail jobs are retried. Processing the same job again should
safely produce the same result without creating duplicate photo records.


## Trade-offs

### Faster reads versus temporarily outdated data

Caching and read replicas reduce database load and speed up feed requests.
However, cached data and replicas may briefly lag behind the primary.
After an upload, reading from the primary can help the uploader see
their new photo immediately.

### Faster upload responses versus delayed thumbnails

Background workers let upload requests finish without waiting for
thumbnail creation. However, thumbnails may not be available immediately,
so the interface needs a processing placeholder and failed jobs need retries.

### Better performance versus cost and complexity

A CDN, cache, read replica and queue improve performance and help absorb
traffic peaks. However, they add infrastructure costs and require
monitoring, configuration and failure handling.