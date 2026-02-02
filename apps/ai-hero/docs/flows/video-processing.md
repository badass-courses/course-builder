# Video Processing Pipeline

This document details the complete video processing pipeline in ai-hero, from initial upload through transcription and real-time status updates.

## Overview

The video processing pipeline orchestrates multiple services to handle video uploads, processing, and transcription:

- **AWS S3**: Temporary video file storage
- **Mux**: Video encoding, hosting, and delivery
- **Deepgram**: Audio transcription with timestamps
- **Inngest**: Event-driven workflow orchestration
- **PartyKit**: Real-time status broadcasting to clients
- **Database**: Video resource state management

## Architecture Diagram

```mermaid
flowchart TB
    Client[Client Browser]
    API[Next.js API]
    S3[AWS S3]
    Mux[Mux Service]
    Deepgram[Deepgram]
    Inngest[Inngest]
    DB[(Database)]
    Party[PartyKit]

    Client -->|1. Request signed URL| API
    API -->|2. Generate signed URL| S3
    Client -->|3. Upload video| S3
    Client -->|4. Trigger processing| API
    API -->|5. Send VIDEO_UPLOADED event| Inngest
    Inngest -->|6. Create Mux asset| Mux
    Inngest -->|7. Create video resource| DB
    Inngest -->|8. Order transcription| Deepgram
    Mux -->|9. Webhook: asset.ready| API
    API -->|10. Send MUX_WEBHOOK event| Inngest
    Inngest -->|11. Update state to 'ready'| DB
    Inngest -->|12. Broadcast status| Party
    Deepgram -->|13. Webhook: transcript| API
    API -->|14. Send TRANSCRIPT_READY| Inngest
    Inngest -->|15. Save transcript| DB
    Inngest -->|16. Broadcast transcript| Party
    Party -->|17. Real-time updates| Client
```

## Video Upload Flow

The upload flow uses AWS S3 with pre-signed URLs for direct client-side uploads.

```mermaid
sequenceDiagram
    participant Client
    participant NextAPI as Next.js API
    participant S3 as AWS S3
    participant Inngest
    participant Mux
    participant DB as Database

    Client->>NextAPI: GET /api/aws/sign-s3-url?filename=video.mp4
    NextAPI->>NextAPI: Generate UUID path
    NextAPI->>S3: Create PutObjectCommand
    NextAPI->>NextAPI: Generate signed URL (1hr expiry)
    NextAPI-->>Client: {signedUrl, publicUrl, filename}

    Client->>S3: PUT video file (with progress)
    S3-->>Client: Upload complete

    Client->>NextAPI: POST /api/video/upload
    Note over Client,NextAPI: {originalMediaUrl, fileName, parentResourceId}

    NextAPI->>Inngest: Send VIDEO_UPLOADED event
    Note over NextAPI,Inngest: Event includes user ID, mediaUrl, resourceId

    Inngest->>Mux: Create Mux asset
    Note over Inngest,Mux: Pass resourceId as passthrough
    Mux-->>Inngest: {id, playback_ids, status}

    Inngest->>DB: Create videoResource
    Note over Inngest,DB: State: 'processing'<br/>Store muxAssetId, muxPlaybackId

    Inngest->>DB: Detach existing videos (if any)
    Note over Inngest,DB: Only 1 video per lesson

    Inngest->>DB: Attach video to parent resource
    DB-->>Inngest: Video resource created
```

### Key Files

- `src/video-uploader/get-signed-s3-url.ts` - Generates pre-signed S3 URLs
- `src/video-uploader/upload-to-s3.ts` - Client-side upload with progress
- `packages/core/src/inngest/video-processing/functions/video-uploaded.ts` - Handles VIDEO_UPLOADED event
- `packages/core/src/lib/mux.ts` - Mux API integration

## Mux Processing & Webhooks

Mux processes the video and sends webhook notifications at various stages.

```mermaid
sequenceDiagram
    participant Mux
    participant Webhook as /api/mux/webhook
    participant Inngest
    participant DB as Database
    participant Party as PartyKit

    Note over Mux: Video encoding starts

    Mux->>Webhook: POST video.asset.created
    Note over Mux,Webhook: {type, object: {id}, data: {passthrough}}
    Webhook->>Inngest: Send MUX_WEBHOOK_EVENT
    Note over Webhook,Inngest: Raw webhook forwarded

    Note over Mux: Encoding continues...

    Mux->>Webhook: POST video.asset.ready
    Webhook->>Inngest: Send MUX_WEBHOOK_EVENT

    Inngest->>Inngest: Filter: type == "video.asset.ready"
    Inngest->>DB: getVideoResource(passthrough)
    DB-->>Inngest: videoResource

    Inngest->>DB: Update state to 'ready'
    DB-->>Inngest: Updated

    Inngest->>Party: broadcastMessage
    Note over Inngest,Party: Room: videoResourceId<br/>Event: video.asset.ready<br/>Body: muxPlaybackId

    Party-->>Client: Real-time notification
    Note over Client: Video player can now load
```

### Mux Webhook Events

- `video.upload.asset_created` - Upload asset created
- `video.upload.complete` - Upload complete
- `video.asset.created` - Asset created from upload
- `video.asset.ready` - Asset fully processed and ready
- `video.asset.errored` - Processing error

### Key Files

- `src/app/api/mux/webhook/route.ts` - Webhook endpoint
- `packages/core/src/inngest/video-processing/events/event-video-mux-webhook.ts` - Event schema
- `packages/core/src/inngest/video-processing/functions/video-ready.ts` - Handles asset.ready

## Transcription Flow

Transcription is ordered from Deepgram immediately after video resource creation.

```mermaid
sequenceDiagram
    participant Inngest
    participant Deepgram
    participant WebhookAPI as Webhook Endpoint
    participant DB as Database
    participant Party as PartyKit

    Inngest->>Inngest: Receive VIDEO_RESOURCE_CREATED
    Note over Inngest: Triggered by video-uploaded handler

    Inngest->>DB: getVideoResource(videoResourceId)
    DB-->>Inngest: videoResource

    Inngest->>Deepgram: POST /v1/listen
    Note over Inngest,Deepgram: Body: {url: originalMediaUrl}<br/>Params: model=whisper-large<br/>punctuate, paragraphs, utterances<br/>callback URL with videoResourceId

    Deepgram-->>Inngest: {request_id}
    Note over Deepgram: Async transcription starts

    Note over Deepgram: Processing audio...

    Deepgram->>WebhookAPI: POST callback URL
    Note over Deepgram,WebhookAPI: ?videoResourceId=xxx<br/>Body: DeepgramResults

    WebhookAPI->>WebhookAPI: Parse DeepgramResults
    Note over WebhookAPI: Extract paragraphs, words,<br/>timestamps, confidence

    WebhookAPI->>WebhookAPI: Generate SRT
    Note over WebhookAPI: Standard SRT format<br/>Word-level SRT<br/>Paragraph format with timestamps

    WebhookAPI->>DB: Save transcript to videoResource
    Note over WebhookAPI,DB: Store: transcript, srt, wordLevelSrt

    WebhookAPI->>Inngest: Send VIDEO_TRANSCRIPT_READY

    Inngest->>DB: getVideoResource(videoResourceId)
    DB-->>Inngest: videoResource with transcript

    Inngest->>Party: broadcastMessage
    Note over Inngest,Party: Room: videoResourceId<br/>Event: transcript.ready<br/>Body: transcript text

    Party-->>Client: Real-time transcript update
```

### Transcript Formats

Deepgram provides multiple transcript formats:

1. **Paragraph format with timestamps**: `[00:15] Text of paragraph...`
2. **Standard SRT**: Time-coded subtitles (5.5s max per line)
3. **Word-level SRT**: Individual word timestamps

### Key Files

- `packages/core/src/inngest/video-processing/functions/order-transcript.ts` - Orders transcription
- `src/coursebuilder/transcript-provider.ts` - Deepgram provider config
- `packages/core/src/providers/deepgram.ts` - Deepgram API integration
- `packages/core/src/inngest/video-processing/functions/transcript-ready.ts` - Handles TRANSCRIPT_READY

## Video-to-Resource Attachment

Videos can be attached to posts (lessons) via tRPC mutations.

```mermaid
sequenceDiagram
    participant Client
    participant TRPC as tRPC Router
    participant Query as video-resource-query
    participant DB as Database
    participant Inngest
    participant Party as PartyKit

    Client->>TRPC: attachToPost(postId, videoResourceId)
    TRPC->>Query: attachVideoResourceToPost()

    Query->>DB: Find existing video resources for post
    Note over Query,DB: Check contentResourceResource table<br/>WHERE resourceOfId=postId<br/>AND type='videoResource'

    alt Existing videos found
        Query->>DB: Delete existing attachments
        DB-->>Query: Deleted

        Query->>Inngest: Send VIDEO_DETACHED_EVENT
        Note over Query,Inngest: {postId, videoResourceId}

        Inngest->>Party: broadcastMessage
        Note over Inngest,Party: Room: postId<br/>Event: video.asset.detached
    end

    Query->>DB: Insert new attachment
    Note over Query,DB: contentResourceResource.insert({<br/>resourceOfId: postId,<br/>resourceId: videoResourceId<br/>})
    DB-->>Query: Attached

    Query->>Inngest: Send VIDEO_ATTACHED_EVENT
    Inngest->>Party: broadcastMessage
    Note over Inngest,Party: Room: postId<br/>Event: video.asset.attached

    Party-->>Client: Real-time notification
    TRPC-->>Client: Success
```

### Key Files

- `src/trpc/api/routers/videoResource.ts` - tRPC router
- `src/lib/video-resource-query.ts` - Attachment logic
- `src/inngest/functions/video-resource-attached.ts` - PartyKit broadcasts
- `src/inngest/events/video-attachment.ts` - Event definitions

## Video Processing States

Video resources progress through distinct states during processing.

```mermaid
stateDiagram-v2
    [*] --> uploading: Client uploads to S3
    uploading --> processing: VIDEO_UPLOADED event

    processing --> ready: Mux video.asset.ready
    processing --> transcribing: Order Deepgram
    processing --> errored: Mux video.asset.errored

    transcribing --> transcribed: Deepgram callback

    ready --> [*]: Video playable
    transcribed --> [*]: Transcript available
    errored --> [*]: Processing failed

    note right of processing
        Mux encoding in progress
        State stored in DB
    end note

    note right of transcribing
        Deepgram processing
        Parallel to video encoding
    end note
```

### State Field Values

- `uploading` - File upload in progress (client-side)
- `processing` - Mux is encoding the video
- `ready` - Video is encoded and playable
- `errored` - Processing failed

Transcript state is separate and stored in the `transcript` field.

## Video Splitting Workflow

The system can analyze transcripts to determine logical split points for breaking videos into segments.

```mermaid
flowchart TB
    Start[Video with Transcript] --> Request[REQUEST_VIDEO_SPLIT_POINTS event]
    Request --> Load[Load transcript from DB]
    Load --> Analyze[determineSplitPoints AI analysis]

    Analyze --> Output[Split points array]
    Note1[Contains timestamps and reasons]
    Output -.-> Note1

    Output --> Future[Future: Actual video splitting]
    Note2[Not yet implemented:<br/>Would dispatch to video<br/>splitting service]
    Future -.-> Note2

    style Future stroke-dasharray: 5 5
    style Note1 fill:#f9f,stroke:#333
    style Note2 fill:#ff9,stroke:#333
```

### Split Points Format

```typescript
{
  timestamp: number,      // Seconds into video
  reason: string,         // Why this is a good split point
  confidence: number      // 0-1 confidence score
}
```

### Key Files

- `src/inngest/functions/split_video.ts` - Compute split points
- `src/inngest/events/split_video.ts` - REQUEST_VIDEO_SPLIT_POINTS event
- `src/transcript-processing/determine-split-points.ts` - AI-based analysis

## Real-time Updates via PartyKit

All video processing events are broadcast to connected clients in real-time.

```mermaid
sequenceDiagram
    participant Client
    participant Party as PartyKit Server
    participant Inngest

    Client->>Party: Connect to room (videoResourceId)
    Party-->>Client: WebSocket established

    loop Processing Events
        Inngest->>Party: broadcastMessage
        Note over Inngest,Party: Various events:<br/>- videoResource.created<br/>- video.asset.ready<br/>- transcript.ready<br/>- video.asset.attached

        Party->>Client: WebSocket message
        Client->>Client: Update UI
    end

    Client->>Party: Disconnect
```

### Broadcast Events

| Event | Room ID | Payload |
|-------|---------|---------|
| `videoResource.created` | videoResourceId | Full video resource object |
| `video.asset.ready` | videoResourceId | muxPlaybackId |
| `transcript.ready` | videoResourceId | Transcript text |
| `video.asset.attached` | postId | {postId, videoResourceId} |
| `video.asset.detached` | postId | {postId, videoResourceId} |

## Environment Variables

```bash
# AWS S3 Upload
AWS_VIDEO_UPLOAD_REGION=us-east-1
AWS_VIDEO_UPLOAD_ACCESS_KEY_ID=xxx
AWS_VIDEO_UPLOAD_SECRET_ACCESS_KEY=xxx
AWS_VIDEO_UPLOAD_BUCKET=bucket-name
AWS_VIDEO_UPLOAD_FOLDER=partner-uploads

# Mux
MUX_ACCESS_TOKEN_ID=xxx
MUX_SECRET_KEY=xxx
MUX_WEBHOOK_SIGNING_SECRET=xxx

# Deepgram
DEEPGRAM_API_KEY=xxx

# PartyKit
PARTYKIT_URL=https://your-party.partykit.dev
```

## Error Handling

### Upload Failures
- S3 pre-signed URL expires after 1 hour
- Client retries with exponential backoff
- Failed uploads don't create video resources

### Mux Processing Errors
- `video.asset.errored` webhook received
- Video resource state set to 'errored'
- Client notified via PartyKit
- Manual retry available via admin UI

### Transcription Failures
- Deepgram returns error in callback
- Video resource remains without transcript
- Video still playable, transcript can be re-ordered
- Fallback: Manual transcript upload

## Performance Considerations

### Upload Optimization
- Direct S3 upload bypasses Next.js server
- Supports files up to 5GB
- Progress tracking via axios
- Unique filenames prevent collisions (UUID prefix)

### Parallel Processing
- Mux encoding and Deepgram transcription run in parallel
- Video becomes playable before transcript completes
- Non-blocking workflow via Inngest events

### Database Queries
- Video resource queries include related resources
- Paginated listing with cursor-based pagination
- Indexes on `type` and `createdAt` fields

## Future Enhancements

1. **Video Splitting**: Implement actual video splitting based on determined split points
2. **Thumbnail Generation**: Extract thumbnails at split points or specific timestamps
3. **Progress Tracking**: More granular encoding progress updates from Mux
4. **Retry Logic**: Automatic retry for failed transcriptions
5. **Webhook Verification**: Implement Mux webhook signature verification
6. **Upload Resumption**: Support resumable uploads for large files
