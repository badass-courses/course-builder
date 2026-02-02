# AI-Assisted Content Creation Flow

## Overview

ai-hero integrates OpenAI GPT models for AI-assisted content creation, providing capabilities for:
- Real-time chat with context from resources (video transcripts, course content)
- Transcript processing and analysis (split points, code extraction)
- Concept/tag extraction using semantic similarity
- AI-powered content generation with custom prompts
- Rate limiting via Upstash Redis

## Architecture Components

### Core AI Components
- **OpenAI Provider**: Configured via `@coursebuilder/core/providers/openai`
- **AI SDK**: Vercel AI SDK for streaming responses (`ai` package)
- **Chat API**: `/api/chat` endpoint for general-purpose chat
- **Resource Chat**: Inngest-powered workflow for resource-based conversations
- **Concept Extraction**: Pinecone vector DB for semantic concept matching
- **Rate Limiting**: Upstash Redis sliding window (5 requests/10s)

### Key Technologies
- OpenAI GPT-4/GPT-4 Turbo models
- Pinecone vector database for embeddings
- Inngest for event-driven workflows
- PartyKit for real-time updates
- Liquid templating for dynamic prompts

---

## 1. General Chat API Flow

Basic chat endpoint for simple AI interactions without resource context.

```mermaid
sequenceDiagram
    participant Client
    participant ChatAPI as /api/chat
    participant Redis as Upstash Redis
    participant OpenAI as OpenAI API

    Client->>ChatAPI: POST /api/chat<br/>{messages}
    ChatAPI->>Redis: Check rate limit<br/>(5 req/10s per IP)

    alt Rate limit exceeded
        Redis-->>ChatAPI: Deny
        ChatAPI-->>Client: 429 Too Many Requests<br/>X-RateLimit-* headers
    else Rate limit OK
        Redis-->>ChatAPI: Allow
        ChatAPI->>OpenAI: streamText()<br/>model: gpt-4o
        OpenAI-->>ChatAPI: Stream response
        ChatAPI-->>Client: Data stream response
    end
```

**Key Files:**
- `/src/app/api/chat/route.ts` - Chat endpoint with rate limiting
- `/src/server/redis-client.ts` - Redis client configuration

---

## 2. Resource-Based AI Chat Flow

Advanced chat workflow with resource context (transcripts, content) using Inngest for orchestration.

```mermaid
sequenceDiagram
    participant Client
    participant ServerAction as sendResourceChatMessage
    participant Inngest
    participant Worker as resource-chat Handler
    participant DB as Database
    participant Liquid as Liquid Engine
    participant OpenAI
    participant PartyKit

    Client->>ServerAction: sendResourceChatMessage()<br/>{resourceId, messages, workflow}
    ServerAction->>ServerAction: Check auth & ability
    ServerAction->>Inngest: Send RESOURCE_CHAT_REQUEST_EVENT

    Inngest->>Worker: Trigger handler
    Worker->>PartyKit: Broadcast user prompt
    PartyKit-->>Client: Real-time update

    Worker->>DB: getContentResource(resourceId)
    DB-->>Worker: Resource (title, body, etc)

    Worker->>DB: getVideoResource(videoId)
    DB-->>Worker: Video (transcript, wordLevelSrt)

    Worker->>DB: Load prompt/workflow
    DB-->>Worker: Prompt template

    Worker->>Liquid: Parse prompt with resource data
    Liquid-->>Worker: Rendered system prompt

    Worker->>OpenAI: streamingChatPromptExecutor()<br/>messages + system prompt
    OpenAI-->>Worker: Stream response
    Worker->>Worker: Collect messages

    Worker->>PartyKit: Broadcast completed response
    PartyKit-->>Client: Real-time AI response
    Worker-->>Inngest: Return messages
```

**Key Features:**
- **Authentication**: Requires `create` ability on `Content`
- **Rate Limiting**: Inngest rate limit (5/min per user)
- **Dynamic Prompts**: Liquid templates inject resource data
- **Real-time Updates**: PartyKit broadcasts progress
- **Context Awareness**: Includes transcript, title, body in prompt

**Key Files:**
- `/src/lib/ai-chat-query.ts` - Server action & DB query
- `/packages/core/src/inngest/co-gardener/resource-chat.ts` - Inngest handler
- `/src/coursebuilder/openai-provider.ts` - OpenAI config

---

## 3. Concept Extraction Flow

Semantic concept detection using Pinecone vector embeddings for tagging content.

```mermaid
flowchart TD
    A[Concept Extraction Request] --> B[CONCEPT_TAGS_REQUESTED Event]
    B --> C[getOrCreateConcept Handler]

    C --> D[Get embedding for concept text]
    D --> E[Query Pinecone index]
    E --> F{Similar concepts found?<br/>score < 0.2}

    F -->|Yes| G[Return related concepts<br/>for user selection]
    F -->|No| H[Create new concept vector]

    H --> I[Upsert to Pinecone]
    I --> J[Return new concept]

    G --> K[User selects or merges]
    K --> L[Add alias to existing concept]

    style D fill:#e1f5ff
    style E fill:#e1f5ff
    style I fill:#e1f5ff
```

**Process:**
1. **Embedding Generation**: OpenAI text-embedding model converts text → vector
2. **Similarity Search**: Pinecone cosine similarity (threshold: 0.2)
3. **Deduplication**: Find existing concepts before creating new ones
4. **Alias Management**: Related terms linked to canonical concept

**Key Files:**
- `/src/inngest/functions/concepts/get-or-create-tag.ts` - Inngest function
- `/src/utils/vector-utils/concepts.ts` - Pinecone operations
- `/src/utils/openai.ts` - Embedding generation (re-export)

---

## 4. Transcript AI Processing Flow

AI-powered transcript analysis to identify split points and concepts for video segmentation.

```mermaid
sequenceDiagram
    participant Trigger as Video Upload
    participant Function as determineSplitPoints
    participant OpenAI

    Trigger->>Function: Pass full transcript
    Function->>Function: Build structured prompt<br/>(JSON schema)

    Function->>OpenAI: GPT-4 completion<br/>system: JSON structure
    Note over Function,OpenAI: Prompt includes:<br/>- subsections schema<br/>- proposed_concepts array<br/>- key_points per section

    OpenAI-->>Function: JSON response
    Function->>Function: Parse response

    rect rgb(240, 248, 255)
        Note over Function: Response structure:<br/>{<br/>  proposed_concepts: ["React", "Hooks"],<br/>  subsections: [<br/>    {start: 0, end: 100, title: "...", key_points: [...]},<br/>    {start: 101, end: 200, title: "...", key_points: [...]}<br/>  ]<br/>}
    end

    Function-->>Trigger: Split points + concepts
```

**Key Features:**
- **Structured Output**: Enforces JSON schema for subsections
- **Timestamp Precision**: Start/end times in seconds
- **Concept Identification**: Extracts normalized concept names
- **Key Points**: Captures nuanced details per section

**Prompt Engineering:**
- Instructs AI to identify "schelling points" (canonical terms)
- Sequential sections with minimal overlap
- Focus on nuance and detail in key points

**Key Files:**
- `/src/transcript-processing/determine-split-points.ts`

---

## 5. OCR + Code Extraction Flow

AI-assisted code extraction from video screenshots using OCR and GPT-4 for reformatting.

```mermaid
sequenceDiagram
    participant Webhook as OCR Webhook
    participant Inngest
    participant Function as performCodeExtraction
    participant AWS as AWS Textract
    participant OpenAI as GPT-4
    participant PartyKit

    Webhook->>Inngest: OCR_WEBHOOK_EVENT<br/>{screenshotUrl, resourceId}
    Inngest->>Function: Trigger handler

    Function->>Function: Download screenshot
    Function->>AWS: Upload to S3
    AWS-->>Function: S3 URL

    Function->>AWS: performOCR()<br/>AWS Textract
    AWS-->>Function: Raw OCR text

    Function->>OpenAI: GPT-4 completion<br/>Reformat OCR'd code
    Note over Function,OpenAI: System: Code formatting specialist<br/>Task: Fix formatting, no refactoring<br/>Output: Markdown code fence with language

    OpenAI-->>Function: Formatted code
    Function->>PartyKit: Broadcast code.extraction.completed
    PartyKit-->>Webhook: Real-time update to client

    Function-->>Inngest: Return formatted code
```

**System Prompt Strategy:**
- Role: "Code formatting specialist"
- Constraint: No refactoring, only format fixes
- Output: Markdown code fence with detected language
- Filter: Exclude non-code text from frame

**Key Files:**
- `/src/inngest/functions/ocr/ocr-code-extractor.ts` - Inngest handler
- `/src/transcript-processing/extract-code-from-screenshot.ts` - OpenAI integration
- `/src/utils/aws.ts` - S3 + Textract operations

---

## 6. Prompt & Chat Resource Class Diagram

```mermaid
classDiagram
    class Prompt {
        +string id
        +string type = "prompt"
        +fields: PromptFields
    }

    class PromptFields {
        +string title
        +string body
        +string? description
        +string slug
        +PromptState state = "draft"
        +PromptVisibility visibility = "unlisted"
        +string model = "gpt-4o"
        +string provider = "openai"
    }

    class ChatResource {
        +string id
        +string type
        +string? updatedAt
        +string? createdAt
        +string? title
        +string? body
        +string? transcript
        +string? wordLevelSrt
        +array? resources
    }

    class ResourceChatWorkflow {
        +string workflowTrigger
        +string resourceId
        +array messages
        +ChatResource resource
        +execute()
    }

    class LiquidEngine {
        +parseAndRender(template, context)
    }

    Prompt --> PromptFields : contains
    ChatResource --> ResourceChatWorkflow : input to
    ResourceChatWorkflow --> LiquidEngine : uses
    ResourceChatWorkflow --> Prompt : loads

    note for PromptFields "Default model: gpt-4o\nDefault state: draft\nDefault visibility: unlisted"
    note for ChatResource "Joined from contentResource\nand videoResource tables"
```

**Schema Design:**
- **Prompt**: Reusable AI instruction templates
- **ChatResource**: Aggregated view of content + video data
- **Workflow**: Orchestrates prompt rendering + execution
- **Liquid**: Dynamic variable substitution (transcript, title, etc.)

---

## Configuration

### OpenAI Provider Setup
```typescript
// src/coursebuilder/openai-provider.ts
import OpenAIProvider from '@coursebuilder/core/providers/openai'

export const openaiProvider = OpenAIProvider({
  apiKey: env.OPENAI_API_KEY,
  partyUrlBase: env.NEXT_PUBLIC_PARTY_KIT_URL,
})
```

### Rate Limiting
```typescript
// Upstash Redis sliding window
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '10s'),
})
```

### Pinecone Index
```typescript
// Concepts index configuration
{
  name: 'concepts',
  dimension: 1536,  // OpenAI text-embedding-ada-002
  metric: 'cosine',
  spec: {
    serverless: { cloud: 'aws', region: 'us-west-2' }
  }
}
```

---

## Environment Variables

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Upstash Redis (rate limiting)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# PartyKit (real-time)
NEXT_PUBLIC_PARTY_KIT_URL=https://...

# Pinecone (concept vectors)
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=...

# AWS (OCR/S3)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_BUCKET_NAME=coursebuilderimages
```

---

## Future Enhancements (TODOs in code)

1. **Concept Similarity Tuning**: Current threshold (0.2) needs calibration
2. **Cancellation Conditions**: Resource chat lacks cancellation logic
3. **Concept Selection UI**: Implement user flow for merging similar concepts
4. **Error Recovery**: Better handling of OpenAI API failures
5. **Model Configuration**: Per-workflow model selection (currently hardcoded)
