// app/api/messages/conversations/[conversationId]/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { messageQueries } from '@/lib/db/messages';
import { pusherServer } from '@/lib/pusher';
import { moderateContent, ModerationResult } from '@/lib/moderation';

// 🆕 GET endpoint - Fetch messages
export async function GET(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before') || undefined;

    const messages = await messageQueries.getMessages(
      params.conversationId,
      session.user.id,
      limit,
      before
    );

    return NextResponse.json(messages);
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch messages',
      details: error.message 
    }, { status: 500 });
  }
}

// POST endpoint - Send message with moderation
export async function POST(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      content, 
      messageType = 'text', 
      mediaUrl, 
      fileName, 
      fileSize, 
      mimeType, 
      metadata, 
      replyToId 
    } = body;

    // Validate content
    if (!content && !mediaUrl) {
      return NextResponse.json({ error: 'Message content required' }, { status: 400 });
    }

    // MODERATION CHECK (only for text messages)
    let moderation: ModerationResult = { 
      allowed: true, 
      message: null, 
      score: 0, 
      categories: [], 
      flagged: false,
      language: ''
    };

    if (content && messageType === 'text') {
      try {
        moderation = await moderateContent(content.trim());
      } catch (modError) {
        console.error('[MODERATION] Error:', modError);
        // Fail-open: allow message if moderation service is down
        moderation = { 
          allowed: true, 
          message: null, 
          score: 0, 
          categories: [], 
          flagged: false,
          language: ''
        };
      }
    }

    // Block toxic messages
    if (!moderation.allowed) {
      return NextResponse.json({
        error: moderation.message || "Your message contains inappropriate content and cannot be sent.",
        blocked: true,
        toxicity_score: moderation.score,
        toxic_categories: moderation.categories
      }, { status: 403 });
    }

    // SAVE MESSAGE
    const message = await messageQueries.sendMessage(
      params.conversationId,
      session.user.id,
      content,
      messageType,
      mediaUrl,
      fileName,
      fileSize,
      mimeType,
      metadata,
      replyToId
    );

    if (!message) {
      return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
    }

    // Add warning flag if message was flagged but allowed
    const messageWithWarning = {
      ...message,
      warning: moderation.flagged ? moderation.message : null,
    };

    // PUSHER NOTIFICATIONS
    if (pusherServer) {
      try {
        // Broadcast to conversation channel
        await pusherServer.trigger(
          `conversation-${params.conversationId}`,
          'new-message',
          messageWithWarning
        );

        // Notify individual participants
        const conversation = await messageQueries.getConversationWithDetails(params.conversationId);
        if (conversation) {
          for (const participant of conversation.participants) {
            if (participant.user_id !== session.user.id) {
              await pusherServer.trigger(
                `user-${participant.user_id}`,
                'new-conversation-message',
                {
                  conversationId: params.conversationId,
                  message: messageWithWarning,
                }
              );
            }
          }
        }
      } catch (pusherError) {
        console.error('[Pusher] Error sending notifications:', pusherError);
        // Don't fail the request if Pusher fails
      }
    }

    return NextResponse.json(messageWithWarning);

  } catch (error: any) {
    console.error('[Messages API] Error:', error.message);
    return NextResponse.json({ 
      error: 'Failed to send message'
    }, { status: 500 });
  }
}
