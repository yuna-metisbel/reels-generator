import { UserInput, GeneratedScript } from '@/types';
import { generateScriptMock } from './mock';

export type AIProvider = 'mock' | 'openai' | 'claude';

const provider: AIProvider = (process.env.AI_PROVIDER as AIProvider) || 'mock';

export async function generateScript(input: UserInput): Promise<GeneratedScript> {
  switch (provider) {
    case 'openai':
      // TODO: import { generateWithOpenAI } from './openai'
      throw new Error('OpenAI provider not yet implemented. Set AI_PROVIDER=mock');
    case 'claude':
      // TODO: import { generateWithClaude } from './claude'
      throw new Error('Claude provider not yet implemented. Set AI_PROVIDER=mock');
    case 'mock':
    default:
      return generateScriptMock(input);
  }
}
