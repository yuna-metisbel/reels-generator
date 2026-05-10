import type { UserInput, GeneratedScript } from '@/types';
import { generateScriptMock } from './mock';
import { generateWithClaude } from './claude';

export type AIProvider = 'mock' | 'claude';

export async function generateScript(input: UserInput): Promise<GeneratedScript> {
  const provider: AIProvider = process.env.ANTHROPIC_API_KEY ? 'claude' : 'mock';

  switch (provider) {
    case 'claude':
      return generateWithClaude(input);
    case 'mock':
    default:
      return generateScriptMock(input);
  }
}
