// Real adapter of the AiClient port: the Workers AI binding, always through the AI Gateway (`AI_GATEWAY_ID`).
import type { AiClient } from '../ports';
import type { Env } from '../types/env.types';

const DEFAULT_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

/**
 * `undefined` without the AI binding or without AI_GATEWAY_ID: the model is never called outside the gateway (budget,
 * logs and caching live there), and callers fall back to rules or to a fixed answer.
 */
export function createAiClient(env: Env): AiClient | undefined {
  const ai = env.AI;
  const gatewayId = env.AI_GATEWAY_ID?.trim();
  if (!ai || !gatewayId) return undefined;
  return {
    async complete(request) {
      const model = request.model ?? (request.consumer === 'proposals' ? env.AI_PROPOSAL_MODEL : env.AI_ASSISTANT_MODEL) ?? DEFAULT_MODEL;
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const run = ai.run(
          model,
          {
            messages: [{ role: 'system', content: request.system }, ...request.messages],
            max_tokens: request.maxTokens,
            temperature: request.temperature,
            ...(request.jsonSchema
              ? { response_format: { type: 'json_schema' as const, json_schema: request.jsonSchema } }
              : {}),
          },
          {
            gateway: { id: gatewayId },
            extraHeaders: { 'cf-aig-metadata': JSON.stringify({ consumer: request.consumer }) },
          },
        );
        const timeout = new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error('timeout')), request.timeoutMs);
        });
        const result = await Promise.race([run, timeout]);
        // JSON mode answers with the parsed object; plain mode with a string
        return result.response;
      } catch {
        // the cause (model name, gateway id, upstream text) stays out of logs and responses
        throw new Error('ai_unavailable');
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
