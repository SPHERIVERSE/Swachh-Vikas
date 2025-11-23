// backend/src/gemini/gemini.controller.ts (Corrected)

import { Controller, Post, Body } from '@nestjs/common';
import { GeminiService } from './gemini.service';

// FIX: Added optional 'context' for document content
interface ChatRequestDto {
  message: string;
  sessionId: string; 
  context?: string; 
}

@Controller('gemini/chat')
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) {}

  @Post()
  async handleChat(@Body() chatRequest: ChatRequestDto) {
    // FIX: Destructure context from the request body
    const { message, sessionId, context } = chatRequest; 
    
    if (!sessionId) {
        throw new Error('A session ID (e.g., user ID) is required.');
    }

    // FIX: Pass the optional context to the service layer
    const responseText = await this.geminiService.sendMessage(sessionId, message, context);
    return { response: responseText };
  }
}
