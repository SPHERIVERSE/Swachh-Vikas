import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser } from '../auth/auth-user.decorator';
import { CommunityService } from './community.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Express } from 'express';

interface CreatePostDto {
  content?: string;
  mediaUrl?: string | null;
  mediaType?: 'TEXT' | 'IMAGE' | 'VIDEO';
}

@Controller('community')
@UseGuards(JwtAuthGuard)
export class CommunityController {
  constructor(private service: CommunityService) {}

  // ===== FEED =====
  @Get('feed')
  async getFeed(@AuthUser('sub') userId: string) {
    return this.service.getFeed(userId);
  }

  @Get('feed/page/:cursor')
  async getFeedPage(@AuthUser('sub') userId: string, @Param('cursor') cursor: string) {
    return this.service.getFeedPage(userId, cursor, 20);
  }

  // ===== PROFILE =====
  @Get('profile/:userId')
  async getProfile(@Param('userId') userId: string, @AuthUser('sub') viewerId: string) {
    return this.service.getProfile(viewerId, userId);
  }

  @Post('profile/update')
  async updateProfile(@AuthUser('sub') userId: string, @Body() body: { username?: string; avatarUrl?: string; bio?: string }) {
    return this.service.updateProfile(userId, body);
  }

  // ===== FOLLOW =====
  @Post('follow/:targetId')
  async follow(@AuthUser('sub') userId: string, @Param('targetId') targetId: string) {
    return this.service.follow(userId, targetId);
  }

  @Post('unfollow/:targetId')
  async unfollow(@AuthUser('sub') userId: string, @Param('targetId') targetId: string) {
    return this.service.unfollow(userId, targetId);
  }

  // ===== POSTS =====
  @Post('post/file')
  @UseInterceptors(
    FileInterceptor('media', {
      storage: diskStorage({
        destination: '../frontend/public/community-uploads',
        filename: (_, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
    }),
  )
  async createPostWithFile(
    @AuthUser('sub') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreatePostDto,
  ) {
    const finalMediaUrl = file ? `/community-uploads/${file.filename}` : body.mediaUrl;
    const finalMediaType = file ? (file.mimetype.startsWith('image') ? 'IMAGE' : 'VIDEO') : body.mediaType;
    
    if (!body.content && !finalMediaUrl) {
      throw new BadRequestException('Post must contain content or media');
    }

    return this.service.createPost(userId, body.content || '', finalMediaUrl, finalMediaType);
  }
  
  // This is the simplified route for URL-based or text-only posts
  @Post('post')
  async createPost(
    @AuthUser('sub') userId: string,
    @Body() body: CreatePostDto,
  ) {
    if (!body.content && !body.mediaUrl) {
        throw new BadRequestException('Post must contain content or media');
    }
    return this.service.createPost(userId, body.content || '', body.mediaUrl, body.mediaType);
  }

  // ===== REACTIONS =====
  @Post('react/:postId')
  async react(
    @AuthUser('sub') userId: string,
    @Param('postId') postId: string,
    @Body('type') type: 'like' | 'dislike',
  ) {
    if (type !== 'like' && type !== 'dislike') {
      throw new BadRequestException('Invalid reaction type');
    }
    return this.service.react(userId, postId, type);
  }

  @Post('post/:postId/like')
  async like(@AuthUser('sub') userId: string, @Param('postId') postId: string) {
    return this.service.react(userId, postId, 'like');
  }

  @Post('post/:postId/dislike')
  async dislike(@AuthUser('sub') userId: string, @Param('postId') postId: string) {
    return this.service.react(userId, postId, 'dislike');
  }

  // ===== POST DETAILS =====
  @Get('post/:postId')
  async getPost(@Param('postId') postId: string, @AuthUser('sub') userId: string) {
    return this.service.getPost(postId, userId);
  }
  
  // ✅ NEW: Endpoint to fetch all posts by a specific user (used for profiles)
  @Get('posts/user/:userId')
  async getPostsByAuthor(@Param('userId') userId: string, @AuthUser('sub') viewerId: string) {
    return this.service.getPostsByAuthor(userId, viewerId);
  }

  // ===== COMMENTS =====
  @Get('post/:postId/comments')
  async listComments(@Param('postId') postId: string) {
    return this.service.listComments(postId, 50, null);
  }
  
  @Get('post/:postId/comments/page/:cursor')
  async listCommentsPage(@Param('postId') postId: string, @Param('cursor') cursor: string) {
    return this.service.listComments(postId, 50, cursor);
  }

  @Post('post/:postId/comment')
  async addComment(
    @AuthUser('sub') userId: string,
    @Param('postId') postId: string,
    @Body('content') content: string,
  ) {
    return this.service.addComment(userId, postId, content);
  }

  @Post('comment/:commentId/delete')
  async deleteComment(
    @AuthUser('sub') userId: string,
    @Param('commentId') commentId: string,
  ) {
    return this.service.deleteComment(userId, commentId);
  }

  // ===== POLLS =====
  @Post('post/:postId/poll')
  async createPoll(
    @AuthUser('sub') userId: string,
    @Param('postId') postId: string,
    @Body() body: { question: string; options: string[]; expiresAt?: string },
  ) {
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined;
    return this.service.createPoll(postId, body.question, body.options, expiresAt);
  }

  @Post('poll/:pollId/vote')
  async votePoll(
    @AuthUser('sub') userId: string,
    @Param('pollId') pollId: string,
    @Body('option') option: string,
  ) {
    return this.service.votePoll(userId, pollId, option);
  }

  @Get('poll/:pollId/results')
  async getPollResults(@Param('pollId') pollId: string) {
    return this.service.getPollResults(pollId);
  }

  @Get('poll/:pollId/my-vote')
  async getUserVote(@AuthUser('sub') userId: string, @Param('pollId') pollId: string) {
    return { vote: await this.service.getUserVote(userId, pollId) };
  }
}
