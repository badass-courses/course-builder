import { OpenAIStream, StreamingTextResponse } from "ai";
import type { AIMessage, AIOutput } from "@/types";
import {env} from "@/env.mjs";

export const STREAM_COMPLETE = `\\ok`

/**
 * This is a streaming chunk publisher that will publish a message to the partykit server
 * as a series of websocket messages that can be handled anywhere in the system to perform
 * additional work.
 */
export class OpenAIStreamingDataPartykitChunkPublisher {
  requestId: string;

  interval = 250;

  buffer: {
    contents: string;
    // signal is a blocking signal which resolves when the buffer has been written.
    signal?: Promise<unknown>;
  };

  constructor(requestId: string) {
    this.requestId = requestId;
    this.buffer = {
      contents: "",
    };
  }

  async publishMessage(message: string) {
    await publishToPartykit(message, this.requestId);
  }

  async writeResponseInChunks(streamingResponse: Response): Promise<AIOutput> {
    const applyChunk = this.appendToBufferAndPublish.bind(this);

    // https://developer.mozilla.org/en-US/docs/Web/API/TransformStream
    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        // When we receive a chunk, publish this as a new request.
        const text = new TextDecoder().decode(chunk);
        await applyChunk(text);
        // await publish(text, requestId);
        // Continue with the standard stream.
        controller.enqueue(chunk);
      },
    });
    // Publish via our writing pipe.
    const stream = OpenAIStream(streamingResponse).pipeThrough(transformStream);
    const result = await parseStreamToText(stream, this.requestId);
    await this.buffer.signal;
    return result;
  }

  async appendToBufferAndPublish(text: string) {
    let resolve = (_val?: any) => {};

    this.buffer.contents += text;

    if (this.buffer.signal) {
      // Already enqueued.
      return;
    }

    (this.buffer.signal = new Promise((r) => {
      resolve = r;
    }))
    setTimeout(() => {
      if (this.buffer.contents.length === 0) {
        // No need to write
        resolve();
        return;
      }
      publishToPartykit(this.buffer.contents, this.requestId);
      resolve();
      this.buffer = {
        contents: "",
      };
    }, this.interval);
  }
}


/**
 * 🥳 Publish a message to the party. Sends a POST request to the partykit server.
 * The server then broadcasts it to all connected clients.
 *
 * @param body
 * @param requestId
 */
export const publishToPartykit = async (body: string, requestId: string) => {
  const partyUrl = `${env.NEXT_PUBLIC_PARTY_KIT_URL}/party/${env.NEXT_PUBLIC_PARTYKIT_ROOM_NAME}`

  return await fetch(partyUrl, {
    method: "POST",
    body: JSON.stringify({
      body,
      requestId,
    }),
  }).catch((e) => {
    console.error(e);
  })
};

const parseStreamToText = async (
  stream: ReadableStream,
  requestId: string
): Promise<AIOutput> => {
  // And then pass this through the standard text response
  const text = await new StreamingTextResponse(stream).text();
  return { role: "assistant", content: text }

  // if we are function calling we want JSON!
  // try {
  //   const raw = JSON.parse(text) as Record<string, any>;
  //
  //   console.log('raw', raw)
  //   const output = {
  //     role: "assistant",
  //     content: null,
  //     ...raw,
  //   } as unknown;
  //   return output as AIMessage;
  // } catch (e) {
  //   // This may not be JSON
  //   return { role: "assistant", content: text };
  // }
};