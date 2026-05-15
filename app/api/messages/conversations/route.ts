// app/api/messages/conversations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { messageQueries } from '@/lib/db/messages';

// ⭐️ GET: Fetch all conversations for current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.id) {
      console.error('❌ No session or user ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('👤 Fetching conversations for user:', session.user.id);

    // ✅ FIXED: Use the correct function name - getUserConversations
    const conversations = await messageQueries.getUserConversations(session.user.id);

    console.log('✅ Found conversations:', conversations?.length || 0);

    return NextResponse.json(conversations || []);

  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch conversations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ⭐️ POST: Create new conversation
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('📨 Creating conversation - Request body:', body);
    console.log('👤 Current user:', session.user.id);

    const { type, participantIds, name, avatarUrl } = body;

    // Validate input
    if (!type || !['direct', 'group'].includes(type)) {
      console.error('❌ Invalid type:', type);
      return NextResponse.json({ error: 'Invalid conversation type' }, { status: 400 });
    }

    if (!participantIds || !Array.isArray(participantIds)) {
      console.error('❌ Invalid participantIds:', participantIds);
      return NextResponse.json({ error: 'Participant IDs required' }, { status: 400 });
    }

    if (type === 'group' && participantIds.length < 2) {
      console.error('❌ Not enough participants for group:', participantIds.length);
      return NextResponse.json({ error: 'Group requires at least 2 participants' }, { status: 400 });
    }

    if (type === 'direct' && participantIds.length !== 1) {
      console.error('❌ Direct message must have exactly 1 participant:', participantIds.length);
      return NextResponse.json({ error: 'Direct message requires exactly 1 participant' }, { status: 400 });
    }

    console.log('✅ Validation passed, calling createConversation...');

    // Create conversation
    const conversation = await messageQueries.createConversation(
      type,
      participantIds,
      session.user.id,
      name,
      avatarUrl
    );

    console.log('✅ Conversation created:', conversation?.id);

    if (!conversation) {
      console.error('❌ createConversation returned null');
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('❌ Error creating conversation:', error);
    return NextResponse.json({ 
      error: 'Failed to create conversation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}









// import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth/auth';
// import { messageQueries } from '@/lib/db/messages';

// // ⭐️ POST: Send new message with hate speech detection
// export async function POST(req: NextRequest) {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const body = await req.json();
//     console.log('📨 Creating conversation - Request body:', body);
//     console.log('👤 Current user:', session.user.id);

//     const { type, participantIds, name, avatarUrl } = body;

//     // Validate input
//     if (!type || !['direct', 'group'].includes(type)) {
//       console.error('❌ Invalid type:', type);
//       return NextResponse.json({ error: 'Invalid conversation type' }, { status: 400 });
//     }

//     if (!participantIds || !Array.isArray(participantIds)) {
//       console.error('❌ Invalid participantIds:', participantIds);
//       return NextResponse.json({ error: 'Participant IDs required' }, { status: 400 });
//     }

//     if (type === 'group' && participantIds.length < 2) {
//       console.error('❌ Not enough participants for group:', participantIds.length);
//       return NextResponse.json({ error: 'Group requires at least 2 participants' }, { status: 400 });
//     }

//     if (type === 'direct' && participantIds.length !== 1) {
//       console.error('❌ Direct message must have exactly 1 participant:', participantIds.length);
//       return NextResponse.json({ error: 'Direct message requires exactly 1 participant' }, { status: 400 });
//     }

//     console.log('✅ Validation passed, calling createConversation...');

//     // Create conversation
//     const conversation = await messageQueries.createConversation(
//       type,
//       participantIds,
//       session.user.id,
//       name,
//       avatarUrl
//     );

//     console.log('✅ Conversation created:', conversation?.id);

//     if (!conversation) {
//       console.error('❌ createConversation returned null');
//       return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
//     }

//     return NextResponse.json(conversation);
//   } catch (error) {
//     console.error('❌ Error creating conversation:', error);
//     return NextResponse.json({ 
//       error: 'Failed to create conversation',
//       details: error instanceof Error ? error.message : 'Unknown error'
//     }, { status: 500 });
//   }
// }

// // ⭐️ GET: Fetch messages in a conversation
// export async function GET(
//   req: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session?.user?.id) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const messages = await messageQueries.getConversationMessages(params.id);
    
//     return NextResponse.json(messages);

//   } catch (error) {
//     console.error('Error fetching messages:', error);
//     return NextResponse.json(
//       { error: 'Failed to fetch messages' },
//       { status: 500 }
//     );
//   }
// }