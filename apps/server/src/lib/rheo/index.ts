import { AgentInference, type AgentInferenceOptions, type LocalInference, type LocalInferenceOptions } from './brain.ts';
import { z } from 'zod/index';
import { printNode, zodToTs } from 'zod-to-ts';

export default class Rheo {
    brain: LocalInference;
    agent: AgentInference;

    classifySchema = z.object({
        label: z.enum(['hostile', 'friendly', 'satire']).describe('What label to give this text.'),
    });

    /**
     * Creates a prompt string for text classification that enforces JSON response format.
     *
     * @param strings - Template strings array containing the text to classify
     * @param values - Values to interpolate into the template strings
     * @returns A formatted prompt string that requests JSON classification response
     *
     * @example
     * const text = "This is great!";
     * const prompt = prompt`${text}`;
     * // Returns:
     * // "Classify this text, taking into account the context if any: This is great!
     * //  Respond only as a JSON document - do not respond with backticks or any other text..."
     */
    prompt(strings: TemplateStringsArray, ...values: any[]) {
        return (
            'Classify this text, taking into account the context if any:\n"' +
            String.raw({ raw: strings }, ...values) +
            '"\nRespond only as a JSON document - do not respond with backticks or any other text, and strictly conform to the following' +
            'typescript schema, paying attention to comments as requirements: ' +
            printNode(zodToTs(this.classifySchema).node)
        );
    }

    constructor(opts?: { brain: LocalInferenceOptions; agent: AgentInferenceOptions }) {
        this.brain = new LocalInference(opts?.brain);
        this.agent = new AgentInference(opts?.agent);
    }

    classify(text: string, context: { body: string; [x: string]: any }[]) {
        // @TODO - we currently run both as Rheo isn't in the position to confidently classify text.
        const rheoLabel = this.brain.action(this.classifySchema, { prompt: text });
        const agentLabel = this.agent.action(this.classifySchema, {
            prompt: this.prompt`${text}`,
        });
    }
}
