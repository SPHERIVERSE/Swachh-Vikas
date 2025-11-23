// backend/src/gemini/gemini.service.ts

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenerativeAI, ChatSession, Content } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GeminiService {
  private ai: GoogleGenerativeAI;
  private chatSessions: Map<string, ChatSession> = new Map(); 

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      throw new InternalServerErrorException('GEMINI_API_KEY is not configured.');
    }

    this.ai = new GoogleGenerativeAI(apiKey);
  }

  private getChatSession(sessionId: string): ChatSession {
    if (!this.chatSessions.has(sessionId)) {
      
      const model = this.ai.getGenerativeModel({ 
          model: "gemini-2.5-flash",
          // ✅ ASSISTANT RENAMED TO "Swavi"
          systemInstruction: "You are Swavi, a helpful chatbot for the Swachh-Vikas smart city cleanliness and waste management platform. Provide concise and informative responses related to civic reports, training, or marketplace activities only.",
      });
      
      const chat = model.startChat({});
      this.chatSessions.set(sessionId, chat);
    }
    
    return this.chatSessions.get(sessionId)!;
  }

  // NOTE: Includes optional 'context' string from frontend
  async sendMessage(sessionId: string, message: string, context?: string): Promise<string> {
    const chat = this.getChatSession(sessionId);
    try {
      let fullMessage = message;
      
      // Feature: Prepend document content as context
      if (context && context.length > 0) {
        // Appending the context string for the AI to use as primary knowledge
        fullMessage = `[CONTEXT: Use the following information as primary context for your response: ${context}]\n\nUSER QUERY: ${message}`;
      }

      const response = await chat.sendMessage(fullMessage);
      const responseObj: any = response; 

      // 1. Check for Safety Block 
      const firstCandidate = responseObj.candidates?.[0];
      if (firstCandidate?.finishReason === 'SAFETY' || responseObj.promptFeedback?.blockReason) {
          throw new InternalServerErrorException(
              'AI response was blocked by safety filters. Please try a different or less sensitive query.'
          );
      }

      // 2. Attempt Text Extraction (using the previous reliable path)
      // This part ensures compatibility with the response structure you're using.
      let text = response.response?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text || text.length === 0) {
        throw new InternalServerErrorException('No text could be extracted from the AI response. Structure may have changed.');
      }

      return text;

    } catch (error) {
      console.error('Gemini API Error:', error);
      if (error instanceof InternalServerErrorException) {
          throw error;
      }
      throw new InternalServerErrorException('Could not get a response from the AI.'); 
    }
  }

  async getChatHistory(sessionId: string): Promise<Content[]> {
    const chat = this.getChatSession(sessionId);
    return chat.getHistory();
  }
}
