import debug from 'debug'
import fs from 'node:fs'
import path from 'node:path'
import {z} from 'zod'
import {printNode, zodToTs} from 'zod-to-ts'
import {AgentInference, type AgentInferenceOptions, LocalInference, type LocalInferenceOptions} from './brain'
import {SafetyTrainingData} from './dataset/safety-classification'

const log = {
    info: debug('vg:rheo'),
    error: debug('vg:rheo:error'),
}

const classifySchema = z.object({
    label: z.enum(['hostile', 'friendly', 'satire', 'illegal', 'spam']).describe('What label to give this text.'),
})

// Break heavy generic inference from zod-to-ts to avoid TS deep instantiation errors
const classifySchemaTs: string = printNode(zodToTs(classifySchema).node)

export default class Rheo {
    brain: LocalInference
    agent: AgentInference

    constructor(opts?: { brain: LocalInferenceOptions; agent: AgentInferenceOptions }) {
        this.brain = new LocalInference(opts?.brain)
        this.agent = new AgentInference(opts?.agent)
        this.brain.trainTextClassifier(SafetyTrainingData)
    }

    /**
     * Creates a prompt string for text classification that enforces JSON response format.
     *
     * @returns A formatted prompt string that requests JSON classification response
     *
     * @example
     * const text = "This is great!";
     * const prompt = prompt`${text}`;
     * // Returns:
     * // "Classify this text, taking into account the context if any: This is great!
     * //  Respond only as a JSON document - do not respond with backticks or any other text..."
     * @param string
     */
    prompt(string) {
        return 'Classify this text, taking into account the context if any:\n"' + string + '"'
    }

    async classify(text: string) {
        // @TODO - we currently run both as Rheo isn't in the position to confidently classify text.
        log.info('classifying text', this.prompt(text))
        const rheoLabel = await this.brain.action(classifySchema, {prompt: text})
        const agentLabel = await this.agent.action(
            z.object({
                label: z.enum(['hostile', 'friendly', 'satire', 'illegal', 'spam']).describe('What label to give this text.'),
                rationale: z.string().describe('Why you chose this label.'),
            }),
            {
                prompt: this.prompt(text),
            },
        )

        console.log('rheoLabel', rheoLabel)
        console.log('agentLabel', agentLabel)
        console.log('text', text)

        const rheoAgrees = rheoLabel.label === agentLabel.label

        if (!rheoAgrees) {
            // Check if safety training data already has this text
            if (!SafetyTrainingData.some((item) => item.text === text)) {
                // Add to safety-classification.ts
                SafetyTrainingData.push({text: text, label: agentLabel.label, reasoning: agentLabel.rationale})
                fs.writeFileSync(
                    path.join(__dirname, 'dataset/safety-classification.ts'),
                    // Pretty print with newlines
                    `import type { TextExample } from '../brain';

export const SafetyTrainingData: TextExample[] = [
${SafetyTrainingData.map((item) => `    { text: ${JSON.stringify(item.text)}, label: ${JSON.stringify(item.label)}, reasoning: ${JSON.stringify(item.reasoning)} },`).join('\n')}
];
`,
                )
            }
        }

        return {
            label: `${rheoLabel.label} (ReMod: "${agentLabel.label}")`,
            rationale: agentLabel.rationale,
            rheoAgrees,
        }
    }
}

// On startup, assign to Baozi manager
// const rheo = new Rheo();
// Baozi.on('HOWL_CREATE', async (data: typeof HowlResponse) => {
//     const classification = await rheo.classify(data.body);
//     return {
//         ...data,
//         classification,
//     };
// });
