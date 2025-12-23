/**
 * Manages neural function & linking with Rheo.
 *
 * This module provides:
 * - LocalInference: a simple, local ML-powered inference engine with optional training and schema-constrained actions.
 * - AgentInference: a fallback that uses the Vercel AI SDK to generate structured JSON against a Zod schema.
 *
 * The action() method in both classes accepts a Zod schema and returns only JSON that conforms to it.
 */

import {createOpenAICompatible} from '@ai-sdk/openai-compatible'
import {generateObject} from 'ai'
import fs from 'node:fs'
import path from 'node:path'
import {z} from 'zod'

/**
 * Basic text tokenization utilities.
 */
function tokenize(text: string): string[] {
    return text.toLowerCase().split(/\s+/g).filter(Boolean)
}

function overlapScore(aTokens: string[], bTokens: string[]): number {
    if (!aTokens.length || !bTokens.length) return 0
    const aset = new Set(aTokens)
    const bset = new Set(bTokens)
    let shared = 0
    for (const t of aset) {
        if (bset.has(t)) shared++
    }
    // Jaccard similarity
    return shared / (aset.size + bset.size - shared || 1)
}

/**
 * A tiny multinomial Naive Bayes text classifier for basic local ML.
 */
class NaiveBayesTextClassifier {
    private labelDocCounts = new Map<string, number>()
    private labelTokenCounts = new Map<string, Map<string, number>>()
    private labelTotalTokens = new Map<string, number>()
    private vocabulary = new Set<string>()
    private totalDocs = 0
    private alpha = 1 // Laplace smoothing

    train(examples: Array<{ text: string; label: string }>): void {
        const startDate = Date.now()
        for (let i = 0; i < examples.length; i++) {
            const {text, label} = examples[i]
            const tokens = tokenize(text)
            this.totalDocs++
            this.labelDocCounts.set(label, (this.labelDocCounts.get(label) || 0) + 1)
            if (!this.labelTokenCounts.has(label)) {
                this.labelTokenCounts.set(label, new Map<string, number>())
            }
            const tokMap = this.labelTokenCounts.get(label)!
            for (const tok of tokens) {
                tokMap.set(tok, (tokMap.get(tok) || 0) + 1)
                this.vocabulary.add(tok)
                this.labelTotalTokens.set(label, (this.labelTotalTokens.get(label) || 0) + 1)
            }
        }
        const endDate = Date.now()
        console.log('Training time:', endDate - startDate, 'ms')

        // Save to `rheo-weights.json`
        // fs.writeFileSync(
        //     path.join(__dirname, 'rheo-weights.json'),
        //     JSON.stringify(
        //         {
        //             // map to json
        //             labelDocCounts: Object.fromEntries(this.labelDocCounts.entries()),
        //             labelTokenCounts: Object.fromEntries(this.labelTokenCounts.entries()),
        //             labelTotalTokens: Object.fromEntries(this.labelTotalTokens.entries()),
        //             vocabulary: Array.from(this.vocabulary),
        //             totalDocs: this.totalDocs,
        //             alpha: this.alpha,
        //         },
        //         null,
        //         2,
        //     ),
        // );
    }

    /**
     * Returns a log-score for how compatible the text is with the given label.
     * If the label hasn't been seen during training, returns a very low score.
     */
    scoreTextAgainstLabel(text: string, label: string): number {
        if (!this.labelDocCounts.has(label)) {
            // Unseen label: discourage selection if not trained
            return -1e9
        }
        const tokens = tokenize(text)
        let score = this.logPrior(label)
        for (const tok of tokens) {
            score += this.logLikelihoodToken(label, tok)
        }
        return score
    }

    predict(text: string, options?: string[]): { label: string; score: number } | null {
        const labels = this.labels()
        if (!labels.length && !options?.length) return null
        let best = options?.[0] || labels[0]
        let bestScore = -Infinity
        let bestContrib: Array<{ token: string; inputCount: number; labelCount: number; logLikelihood: number }> = []
        for (const label of labels) {
            const score = this.scoreTextAgainstLabel(text, label)
            if (score > bestScore) {
                bestScore = score
                best = label
                bestContrib = this.contributingTokens(text, label)
            }
        }
        if (bestContrib.length) {
            const tokenSummary = bestContrib.map((c) => `${c.token} x${c.inputCount} (label:${c.labelCount}, ll:${c.logLikelihood.toFixed(3)})`).join(', ')
            console.log(`rheo tokens for ${best}: ${tokenSummary}`)
        } else {
            console.log(`rheo tokens for ${best}: (no trained token overlap)`)
        }
        return {label: best || 'RHEO_CANNOT_CLASSIFY', score: bestScore}
    }

    private labels(): string[] {
        return Array.from(this.labelDocCounts.keys())
    }

    private logPrior(label: string): number {
        const count = this.labelDocCounts.get(label) || 0
        return Math.log((count + this.alpha) / (this.totalDocs + this.alpha * this.labels().length))
    }

    private logLikelihoodToken(label: string, token: string): number {
        const tokCounts = this.labelTokenCounts.get(label) || new Map<string, number>()
        const tokenCount = tokCounts.get(token) || 0
        const total = this.labelTotalTokens.get(label) || 0
        const V = this.vocabulary.size || 1
        return Math.log((tokenCount + this.alpha) / (total + this.alpha * V))
    }

    private contributingTokens(text: string, label: string): Array<{ token: string; inputCount: number; labelCount: number; logLikelihood: number }> {
        const tokens = tokenize(text)
        const labelTokCounts = this.labelTokenCounts.get(label) || new Map<string, number>()
        const seen = new Map<string, number>()
        for (const t of tokens) {
            seen.set(t, (seen.get(t) || 0) + 1)
        }
        const contributions: Array<{ token: string; inputCount: number; labelCount: number; logLikelihood: number }> = []
        for (const [token, inputCount] of seen.entries()) {
            const labelCount = labelTokCounts.get(token) || 0
            if (labelCount > 0) {
                contributions.push({
                    token,
                    inputCount,
                    labelCount,
                    logLikelihood: this.logLikelihoodToken(label, token),
                })
            }
        }
        // Sort by absolute contribution (descending) for readability
        contributions.sort((a, b) => Math.abs(b.logLikelihood) - Math.abs(a.logLikelihood))
        return contributions
    }
}

export type TextExample = { text: string; label: string; reasoning?: string };

export interface InferenceActionOptions {
    // Freeform text prompt or content to classify/interpret.
    prompt: string;
}

export interface LocalInferenceOptions {
    allowFallback?: boolean;
    agentModel?: string; // used by AgentInference when fallback is enabled
}

/**
 * Local inference with basic training.
 * - Train a text classifier via trainTextClassifier().
 * - Call action() with a Zod schema to obtain JSON that conforms to the schema.
 *   Supported locally:
 *     - ZodEnum (string) -> returns enum value
 *     - ZodObject with single key 'label' of ZodEnum -> returns { label: enum }
 *   For unsupported schemas or errors: if allowFallback, uses AgentInference.
 */
export class LocalInference {
    classifier: NaiveBayesTextClassifier | null = null
    private readonly allowFallback: boolean = false
    private readonly agent: AgentInference | null = null

    constructor(opts?: LocalInferenceOptions) {
        this.allowFallback = !!opts?.allowFallback
        if (this.allowFallback) {
            this.agent = new AgentInference({model: opts?.agentModel})
        }
    }

    /**
     * Train the internal Naive Bayes text classifier.
     */
    trainTextClassifier(examples: TextExample[]): void {
        const nb = new NaiveBayesTextClassifier()
        nb.train(examples)
        this.classifier = nb
    }

    /**
     * Runs an action: generate a JSON result conforming to the given schema.
     * For supported schemas, uses local logic; otherwise, falls back (if enabled).
     */
    async action<S extends z.ZodTypeAny>(schema: S, opts: InferenceActionOptions): Promise<z.infer<S>> {
        const prompt = opts.prompt || ''
        try {
            const candidate = this.generateLocally(schema, prompt)
            // Validate strictly against the provided schema
            return schema.parse(candidate)
        } catch (err) {
            if (this.allowFallback && this.agent) {
                // Delegate to AgentInference (schema-validated JSON)
                return await this.agent.action(schema, opts)
            }
            throw err
        }
    }

    /**
     * Local generator that only returns values we can confidently support.
     */
    private generateLocally<S extends z.ZodTypeAny>(schema: S, prompt: string): unknown {
        // Handle ZodEnum directly (classification)
        const def: any = (schema as any)._def
        const enumTypeName = (z as any).ZodFirstPartyTypeKind?.ZodEnum ?? 'ZodEnum'
        const objTypeName = (z as any).ZodFirstPartyTypeKind?.ZodObject ?? 'ZodObject'

        if (def?.typeName === enumTypeName) {
            const options: string[] = def.values as string[]
            return this.predictFromOptions(prompt, options)
        }

        // Handle { label: z.enum([...]) }
        if (def?.typeName === objTypeName) {
            const shape = typeof def.shape === 'function' ? def.shape() : def.shape
            if (shape && typeof shape === 'object') {
                const keys = Object.keys(shape)
                if (keys.length === 1 && keys[0] === 'label') {
                    const innerDef: any = shape['label']?._def
                    if (innerDef?.typeName === enumTypeName) {
                        const options: string[] = innerDef.values as string[]
                        const label = this.predictFromOptions(prompt, options)
                        return {label}
                    }
                }
            }
        }

        // Unsupported schema locally
        throw new Error('LocalInference cannot handle this schema. Enable fallback or use a supported enum/label schema.')
    }

    private predictFromOptions(text: string, options: string[]): string | undefined {
        if (this.classifier) {
            const prediction = this.classifier.predict(text, options)
            return prediction?.label || 'RHEO_CANNOT_CLASSIFY'
        }

        return undefined
    }
}

export interface AgentInferenceOptions {
    model?: string;
}

/**
 * Agent-based inference using the Vercel AI SDK to strictly produce schema-validated JSON.
 * @TODO Remove when LocalInference is at an acceptable performance.
 */
export class AgentInference {
    private readonly model: string
    private provider = createOpenAICompatible({
        name: 'do',
        apiKey: process.env.AGENT_INFERENCE_API_KEY,
        baseURL: process.env.AGENT_INFERENCE_API_ENDPOINT,
        includeUsage: true, // Include usage information in streaming responses
    })

    constructor(opts?: AgentInferenceOptions) {
        // The model string is resolved by the AI SDK provider configuration at runtime.
        this.model = 'openai-gpt-5-nano'
    }

    async action<S extends z.ZodTypeAny>(schema: S, opts: InferenceActionOptions): Promise<z.infer<S>> {
        const res = await generateObject({
            model: this.provider(this.model),
            system: fs.readFileSync(path.join(__dirname, 'prompt.txt'), 'utf8'),
            prompt: opts.prompt,
            schema: schema as any,
        })
        // Validate and narrow via Zod to avoid deep generic inference at callsite
        return schema.parse({
            label: res.object.label,
            rationale: res.object.rationale,
        })
    }
}
