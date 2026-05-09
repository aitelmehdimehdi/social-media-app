import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

@Injectable()
export class ChatbotService {
  constructor(private config: ConfigService) {}

  async chat(
    message: string,
    history: { role: 'user' | 'assistant'; content: string }[],
  ): Promise<string> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    const model  = this.config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';
    const systemPrompt =
      this.config.get<string>('CHATBOT_SYSTEM_PROMPT') ??
      'You are a friendly assistant for Sharely, an Instagram-style social media app. Help users with questions about posting, stories, reels, messaging, profiles, and other app features. Keep answers short and clear.';

    if (!apiKey) {
      throw new InternalServerErrorException('OPENAI_API_KEY is not configured');
    }

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message },
    ];

    // Supports both OpenAI and OpenRouter (sk-or-v1-... keys use openrouter.ai)
    const baseUrl = apiKey.startsWith('sk-or-')
      ? 'https://openrouter.ai/api/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://sharely.app',
        'X-Title': 'Sharely',
      },
      body: JSON.stringify({ model, messages, max_tokens: 300 }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new InternalServerErrorException(`LLM error: ${error}`);
    }

    const data = await response.json() as {
      choices: { message: { content: string } }[];
    };

    return data.choices[0]?.message?.content?.trim() ?? 'Sorry, I could not generate a response.';
  }
}
