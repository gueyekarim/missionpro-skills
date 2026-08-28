import "server-only";

import { getServerConfig } from "@/lib/config";
import {
  contextContractSchema,
  novaModes,
  novaSmokeOutputSchema,
  type ContextContract,
  type NovaMode,
  type NovaSmokeOutput
} from "./context-contract";
import { buildSystemPrompt } from "./prompts";

type NovaProvider = (input: {
  mode: NovaMode;
  context: ContextContract;
  task: string;
}) => Promise<unknown>;

const mockProvider: NovaProvider = async ({ mode, context, task }) => ({
  mode,
  message: `Smoke response for ${mode}: ${task || "continue with an observable capability practice."}`,
  nextAction:
    context.recommendedNextAction ??
    "Relier la prochaine action à une production observable et à une preuve évaluable.",
  confidence: 0.92
});

async function openAiProvider({ mode, context, task }: Parameters<NovaProvider>[0]): Promise<unknown> {
  const config = getServerConfig();
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: config.AI_MODEL,
      temperature: 0.2,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "nova_smoke_output",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              mode: { type: "string", enum: [...novaModes] },
              message: { type: "string" },
              nextAction: { type: "string" },
              confidence: { type: "number", minimum: 0, maximum: 1 }
            },
            required: ["mode", "message", "nextAction", "confidence"]
          }
        }
      },
      messages: [
        { role: "system", content: buildSystemPrompt(mode) },
        { role: "user", content: JSON.stringify({ task, context }) }
      ]
    })
  });
  if (!response.ok) throw new Error(`NOVA provider error (${response.status})`);
  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("NOVA provider returned no structured content");
  return JSON.parse(content);
}

export class NovaOrchestrator {
  private readonly provider: NovaProvider;

  constructor(provider?: NovaProvider) {
    if (provider) {
      this.provider = provider;
      return;
    }
    const config = getServerConfig();
    this.provider = config.AI_PROVIDER === "openai" ? openAiProvider : mockProvider;
  }

  async run(mode: NovaMode, context: ContextContract, task: string): Promise<NovaSmokeOutput> {
    const parsedMode = novaModes.find((candidate) => candidate === mode);
    if (!parsedMode) throw new Error(`Unsupported NOVA mode: ${mode}`);
    const parsedContext = contextContractSchema.parse(context);
    try {
      const raw = await this.provider({ mode: parsedMode, context: parsedContext, task });
      return novaSmokeOutputSchema.parse(raw);
    } catch (error) {
      console.error("[nova] orchestrator failure", error instanceof Error ? error.message : "unknown error");
      throw new Error("NOVA could not produce a valid structured response");
    }
  }
}

export { mockProvider };