import {AgentInference, LocalInference, type AgentInferenceOptions, type LocalInferenceOptions} from './brain'
import {z} from 'zod'
import {printNode, zodToTs} from 'zod-to-ts'
import debug from 'debug'
import Baozi from '../events'
import {HowlResponse} from '@/models/defs'
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

const notes = [
    '"friendly" is also neutral.',
    'Making fun of pronouns, LGBTQ+, or other protected classes is hostile.',
    '"Fake" pronouns like "nick/her" (sounds like a racial slur) are hostile.',
]

export default class Rheo {
    brain: LocalInference
    agent: AgentInference

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
            String.raw({raw: strings}, ...values) +
            `"\n- ${notes.join('\n- ')}\nRespond only as a JSON document - do not respond with backticks or any other text, and strictly conform to the following` +
            'typescript schema, paying attention to comments as requirements: ' +
            classifySchemaTs
        )
    }

    constructor(opts?: { brain: LocalInferenceOptions; agent: AgentInferenceOptions }) {
        this.brain = new LocalInference(opts?.brain)
        this.agent = new AgentInference(opts?.agent)
        this.brain.trainTextClassifier(SafetyTrainingData)
    }

    async classify(text: string) {
        // @TODO - we currently run both as Rheo isn't in the position to confidently classify text.
        log.info('classifying text', text)
        const rheoLabel = await this.brain.action(classifySchema, {prompt: text})
        const agentLabel = await this.agent.action(classifySchema, {
            prompt: this.prompt`${text}`,
        })

        console.log('rheoLabel', rheoLabel)
        console.log('agentLabel', agentLabel)
        console.log('text', text)

        const rheoAgrees = rheoLabel.label === agentLabel.label

        return {
            label: `${rheoLabel.label} (ReMod: "${agentLabel.label}"${rheoAgrees ? '' : ' - RLHF'})`,
            rheoAgrees,
        }
    }
}

// On startup, assign to Baozi manager
const rheo = new Rheo()
Baozi.on('HOWL_CREATE', async (data: typeof HowlResponse) => {
    const classification = await rheo.classify(data.body)
    return {
        ...data,
        classification
    }
})
