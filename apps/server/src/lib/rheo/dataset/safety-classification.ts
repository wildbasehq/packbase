import type { TextExample } from '../brain.ts';

export const SafetyTrainingData: TextExample[] = [
    { text: "Love that for you", label: "friendly", reasoning: "Default friendly example" },
    { text: "Get a life, loser.", label: "hostile", reasoning: "Default hostile example" },
    { text: "fuck you lovingly", label: "hostile", reasoning: "Default hostile example" },
    { text: "Breaking news: the sky is blue.", label: "satire", reasoning: "Default satire example" },
    { text: "bring back slaves", label: "illegal", reasoning: "Default illegal example" },
    { text: "I want a slave :(", label: "illegal", reasoning: "The statement endorses acquiring a 'slave', which implies human trafficking/exploitation, an illegal activity. This falls under the 'illegal/illicit' category and should be automatically rejected." },
    { text: "nice ass white chocolate", label: "friendly", reasoning: "The text is a sexualized compliment about someone's body but is not insulting, harassing, or targeting a protected group. It does not promote violence, illegal activity, or harm." },
    { text: "White people can say the n word", label: "hostile", reasoning: "The text endorses allowing a racial slur (the N-word) to be used by White people, which promotes harassment/discrimination toward a protected group and constitutes hate speech content." },
    { text: "yay!!", label: "friendly", reasoning: "The text 'yay!!' is a positive exclamation expressing happiness or celebration with no harassment, threats, sexual content, or illegal material. It's a benign positive sentiment." },
    { text: "sdfsadfasdffff", label: "spam", reasoning: "The text is a random, non-sensical string with no clear meaning, typical of low-quality or spam-like input; no contextual content to moderate." },
    { text: "hehewhhe\\\n\\\ni love this cat\\\n\\\nhe so :3", label: "friendly", reasoning: "The text is light, affectionate, non-violent, and contains no hate, threats, or sexual content. It expresses love for a cat." },
];
