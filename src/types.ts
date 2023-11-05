import type {ChatCompletionRequestMessage} from "openai-edge";
import type { JSONSchema4 } from "json-schema";

/**
 * Functions represents functions which are callable by OpenAI.  These are added in
 * to each LLM call via the `functions` parameter.
 *
 */
export type Functions = Record<string, FunctionDefinition>;

export type FunctionDefinition = {
  invoke: (f: FunctionCall, m: ChatCompletionRequestMessage[]) => Promise<any>;

  docs: APIDocs;
  /**
   * confirm indicates whether this function call requires confirmation from the
   * user to be executed.
   */
  confirm?: boolean;
};

export type APIDocs = {
  name: string;
  description: string;
  parameters: JSONSchema4;
};

export type FunctionCall = {
  arguments: Record<string, any>;
  name: string; // function name.
};

export type AIMessage = ChatCompletionRequestMessage & {
  content: null | string;
  createdAt?: Date;
  id?: string;
};

export type AIError = { error: string };

export type AIOutput = AIMessage | AIError;

export interface ProgressWriter {
  writeResponseInChunks(streamingResponse: Response): Promise<AIOutput>;
  publishMessage(message: string): Promise<void>;
}