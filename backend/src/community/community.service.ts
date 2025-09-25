import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {}

  // ================= PROFILE =================
  async getProfile(viewerId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const followers = await this.prisma.communityFollow.count({ where: { followingId: userId } });
    const followings = await this.prisma.communityFollow.count({ where: { followerId: userId } });
    const isFollowing = await this.prisma.communityFollow.findUnique({
      where: { followerId_followingId: { followerId: viewerId, followingId: userId } },
    });

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      followers,
      followings,
      isFollowing: !!isFollowing,
    };
  }

  async updateProfile(userId: string, data: { username?: string; avatarUrl?: string; bio?: string }) {
    return this.prisma.user.update({ where: { id: userId }, data });
  }

  // ================= FOLLOW =================
  async follow(userId: string, targetId: string) {
    const exists = await this.prisma.communityFollow.findUnique({
      where: { followerId_followingId: { followerId: userId, followingId: targetId } },
    });
    if (exists) throw new BadRequestException('Already following this user');

    return this.prisma.communityFollow.create({ data: { followerId: userId, followingId: targetId } });
  }

  async unfollow(userId: string, targetId: string) {
    const exists = await this.prisma.communityFollow.findUnique({
      where: { followerId_followingId: { followerId: userId, followingId: targetId } },
    });
    if (!exists) throw new BadRequestException('Not following this user');

    return this.prisma.communityFollow.delete({
      where: { followerId_followingId: { followerId: userId, followingId: targetId } },
    });
  }

  // ================= POSTS =================
  async createPost(
    authorId: string,
    content: string,
    mediaUrl: string | null = null,
    mediaType: 'TEXT' | 'IMAGE' | 'VIDEO' = 'TEXT',
  ) {
    if (!content && !mediaUrl) throw new BadRequestException('Post must contain content or media');
    return this.prisma.communityPost.create({
      data: { authorId, content, mediaUrl, mediaType },
    });
  }

  async getPost(postId: string, userId: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      include: { author: true, reactions: true },
    });
    if (!post) throw new NotFoundException('Post not found');

    return {
      ...post,
      likes: post.reactions.filter(r => r.type === 'like').length,
      dislikes: post.reactions.filter(r => r.type === 'dislike').length,
      myReaction: post.reactions.find(r => r.userId === userId)?.type ?? null,
      reactions: undefined,
    };
  }

  async react(userId: string, postId: string, type: 'like' | 'dislike') {
    const post = await this.prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const existing = await this.prisma.communityReaction.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      if (existing.type === type) {
        await this.prisma.communityReaction.delete({ where: { userId_postId: { userId, postId } } });
        return { message: 'Reaction removed' };
      }
      return this.prisma.communityReaction.update({
        where: { userId_postId: { userId, postId } },
        data: { type },
      });
    }

    return this.prisma.communityReaction.create({ data: { userId, postId, type } });
  }

  // ================= FEED =================
async getFeed(userId: string) {
    // Get all posts from all users EXCEPT the current user (social media style)
    const posts = await this.prisma.communityPost.findMany({
      where: { 
        authorId: { not: userId } // Exclude current user's own posts
      },
      orderBy: { createdAt: 'desc' },
      include: { 
        author: { select: { id: true, name: true, username: true, avatarUrl: true } }, 
        reactions: true 
      },
      take: 100,
    });

    return posts.map(p => ({
      ...p,
      likes: p.reactions.filter(r => r.type === 'like').length,
      dislikes: p.reactions.filter(r => r.type === 'dislike').length,
      myReaction: p.reactions.find(r => r.userId === userId)?.type ?? null,
      reactions: undefined,
    }));
}

async getFeedPage(userId: string, cursor: string | null = null, limit = 20) {
    // Get all posts from all users EXCEPT the current user (social media style)
    const posts = await this.prisma.communityPost.findMany({
      where: { 
        authorId: { not: userId } // Exclude current user's own posts
      },
      orderBy: { createdAt: 'desc' },
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      take: limit + 1, // Fetch one extra item for pagination check
      include: { 
        author: { select: { id: true, name: true, username: true, avatarUrl: true } }, 
        reactions: true 
      },
    });

    const hasNextPage = posts.length > limit;
    const items = hasNextPage ? posts.slice(0, limit) : posts;
    const nextCursor = hasNextPage ? items[items.length - 1].id : null;

    return {
      items: items.map(p => ({
        ...p,
        likes: p.reactions.filter(r => r.type === 'like').length,
        dislikes: p.reactions.filter(r => r.type === 'dislike').length,
        myReaction: p.reactions.find(r => r.userId === userId)?.type ?? null,
        reactions: undefined,
      })),
      nextCursor
    };
}

// ================= POSTS BY AUTHOR (NEW) =================
  async getPostsByAuthor(authorId: string, viewerId: string) {
    // The query finds all posts by the given authorId
    const posts = await this.prisma.communityPost.findMany({
      where: { authorId: authorId },
      orderBy: { createdAt: 'desc' },
      include: {
        // Select only necessary user info for the author
        author: { select: { id: true, name: true, username: true, avatarUrl: true } },
        reactions: true, // Fetch all reactions to calculate counts and viewer status
      },
      take: 100, // Hard limit for a profile view. Can be paginated later.
    });

    // Format the response to calculate likes, dislikes, and the viewer's reaction
    return posts.map(p => ({
      ...p,
      likes: p.reactions.filter(r => r.type === 'like').length,
      dislikes: p.reactions.filter(r => r.type === 'dislike').length,
      // Check if the current viewer has reacted to this post
      myReaction: p.reactions.find(r => r.userId === viewerId)?.type ?? null,
      reactions: undefined, // Remove raw reactions array from final response
    }));
  }

  // ================= COMMENTS =================
  async addComment(userId: string, postId: string, content: string) {
    const post = await this.prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    
    return this.prisma.communityComment.create({
      data: { userId, postId, content },
      include: { user: { select: { id: true, name: true, username: true, avatarUrl: true } } }
    });
  }

  async listComments(postId: string, limit = 50, cursor: string | null = null) {
    return this.prisma.communityComment.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      take: limit,
      include: { user: { select: { id: true, name: true, username: true, avatarUrl: true } } }
    });
  }

  async deleteComment(userId: string, commentId: string) {
    const comment = await this.prisma.communityComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.userId !== userId) throw new ForbiddenException('Can only delete your own comments');
    
    return this.prisma.communityComment.delete({ where: { id: commentId } });
  }

  // ================= POLLS =================
  async createPoll(postId: string, question: string, options: string[], expiresAt?: Date) {
    const post = await this.prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    return this.prisma.communityPoll.create({
      data: {
        postId,
        question,
        options,
        expiresAt,
      },
    });
  }

  async votePoll(userId: string, pollId: string, option: string) {
    const poll = await this.prisma.communityPoll.findUnique({ where: { id: pollId } });
    if (!poll) throw new NotFoundException('Poll not found');
    if (!poll.isActive) throw new BadRequestException('Poll is not active');
    if (poll.expiresAt && poll.expiresAt < new Date()) throw new BadRequestException('Poll has expired');
    if (!poll.options.includes(option)) throw new BadRequestException('Invalid option');

    // Check if user already voted
    const existingVote = await this.prisma.communityPollVote.findUnique({
      where: { userId_pollId: { userId, pollId } },
    });

    if (existingVote) {
      // Update existing vote
      return this.prisma.communityPollVote.update({
        where: { userId_pollId: { userId, pollId } },
        data: { option },
      });
    } else {
      // Create new vote
      return this.prisma.communityPollVote.create({
        data: { userId, pollId, option },
      });
    }
  }

  async getPollResults(pollId: string) {
    const poll = await this.prisma.communityPoll.findUnique({
      where: { id: pollId },
      include: { votes: true },
    });
    if (!poll) throw new NotFoundException('Poll not found');

    // Count votes for each option
    const results = poll.options.map(option => ({
      option,
      votes: poll.votes.filter(vote => vote.option === option).length,
    }));

    return {
      question: poll.question,
      options: results,
      totalVotes: poll.votes.length,
      isActive: poll.isActive,
      expiresAt: poll.expiresAt,
    };
  }

  async getUserVote(userId: string, pollId: string) {
    const vote = await this.prisma.communityPollVote.findUnique({
      where: { userId_pollId: { userId, pollId } },
    });
    return vote ? vote.option : null;
  }
}

