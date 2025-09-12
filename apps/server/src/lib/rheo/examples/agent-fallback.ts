import { z } from "zod";
import { LocalInference } from "../brain";
import { printNode, zodToTs } from "zod-to-ts";

// Example: Use LocalInference with fallback enabled to handle
// a schema that the local engine doesn't support, delegating to AgentInference.

const inference = new LocalInference({
  allowFallback: true,
  agentModel: "openai-gpt-oss-20b",
});

// Complex schema (not supported by LocalInference locally, so it will fallback)
const SentimentSchema = z.object({
  label: z.enum(['hostile', 'friendly', 'satire']).describe("What label to give this text.")
});

async function run() {
  const prompt =
      "Classify this text, taking into account the context if any:" +
      `"Experts confirm coffee is now 98% personality"` +
      `Respond only as a JSON document - do not respond with backticks or any other text, and strictly conform ` +
      `to the following typescript schema, paying attention to comments as requirements:\n\n` +
      printNode(zodToTs(SentimentSchema).node)

  const result = await inference.action(SentimentSchema, { prompt });
  // The result will be JSON matching TaskSchema.
  console.log("Agent fallback result JSON:", JSON.stringify(result));
}

run().catch((err) => {
  console.error("Agent fallback example failed:", err);
  console.error(
    "Ensure your environment is configured for the AI SDK provider and that the selected model is available."
  );
});
