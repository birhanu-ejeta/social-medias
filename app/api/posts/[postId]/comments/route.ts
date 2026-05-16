// app/api/posts/[postId]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { pool } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { pusherServer } from '@/lib/pusher';
import { moderateContent } from '@/lib/moderation';

export async function GET(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const result = await pool.query(
      `SELECT 
        c.*,
        u.username,
        u.full_name,
        u.avatar_url,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'id', r.id,
              'content', r.content,
              'user_id', r.user_id,
              'created_at', r.created_at,
              'username', ru.username,
              'full_name', ru.full_name,
              'avatar_url', ru.avatar_url
            ) ORDER BY r.created_at ASC
          )
          FROM comments r
          JOIN users ru ON r.user_id = ru.id
          WHERE r.parent_id = c.id
          ), '[]'::json) as replies
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = $1 AND c.parent_id IS NULL
      ORDER BY c.created_at DESC`,
      [params.postId]
    );
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  console.log('\n========== NEW COMMENT REQUEST ==========');
  
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('❌ No session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, parentId } = await req.json();
    console.log('📝 Content:', content);
    console.log('🔗 ParentId:', parentId);
    
    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content required' }, { status: 400 });
    }

    // 🛡️ MODERATION CHECK
    console.log('🛡️ Running moderation...');
    const moderation = await moderateContent(content.trim());
    console.log(`🛡️ Result: ${moderation.allowed ? 'ALLOWED' : 'BLOCKED'} | Score: ${moderation.score}`);

    if (!moderation.allowed) {
      console.log('🚫 BLOCKED by moderation');
      return NextResponse.json({
        error: moderation.message || "⚠️ Your comment contains hate speech and cannot be posted.",
        blocked: true,
        toxicity_score: moderation.score,
        toxic_categories: moderation.categories
      }, { status: 403 });
    }

    console.log('✅ Moderation passed');

    // Generate ID
    const commentId = uuidv4();
    console.log('🆔 Comment ID:', commentId);

    // 💾 INSERT COMMENT
    console.log('💾 Inserting comment...');
    const insertResult = await pool.query(
      `INSERT INTO comments (id, post_id, user_id, content, parent_id, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [commentId, params.postId, session.user.id, content.trim(), parentId || null]
    );
    
    console.log('✅ Comment inserted');

    // Update post comment count
    await pool.query(
      `UPDATE posts SET comments_count = comments_count + 1 WHERE id = $1`,
      [params.postId]
    );

    // Get user info
    const userResult = await pool.query(
      `SELECT username, full_name, avatar_url FROM users WHERE id = $1`,
      [session.user.id]
    );

    const comment = {
      ...insertResult.rows[0],
      username: userResult.rows[0]?.username || 'unknown',
      full_name: userResult.rows[0]?.full_name || 'Unknown User',
      avatar_url: userResult.rows[0]?.avatar_url || null,
      replies: [],
      warning: moderation.flagged ? moderation.message : null,
    };

    console.log('✅ Comment object created');

    // 📡 NOTIFICATIONS
    if (pusherServer) {
      console.log('📡 Sending notifications...');
      
      try {
        const post = await pool.query(`SELECT user_id FROM posts WHERE id = $1`, [params.postId]);
        const postOwnerId = post.rows[0]?.user_id;

        const usersRes = await pool.query('SELECT id FROM users WHERE id != $1', [session.user.id]);
        
        for (const row of usersRes.rows) {
          const isOwner = row.id === postOwnerId;
          const notificationContent = isOwner 
            ? `commented on your post`
            : `commented on a post`;

          try {
            const notifRes = await pool.query(
              `INSERT INTO notifications (user_id, type, actor_id, post_id, comment_id, content)
               VALUES ($1, 'comment', $2, $3, $4, $5) RETURNING *`,
              [row.id, session.user.id, params.postId, commentId, notificationContent]
            );

            if (notifRes.rows.length > 0) {
              await pusherServer.trigger(
                `user-notifications-${row.id}`, 
                'new-notification', 
                {
                  ...notifRes.rows[0],
                  actor: {
                    id: session.user.id,
                    username: userResult.rows[0]?.username || session.user.username,
                    full_name: userResult.rows[0]?.full_name || session.user.name,
                    avatar_url: userResult.rows[0]?.avatar_url || null,
                  },
                  post: { id: params.postId },
                }
              );
            }
          } catch (notifErr) {
            console.error(`⚠️ Failed to notify user ${row.id}:`, notifErr);
          }
        }
        
        console.log('✅ Notifications sent');
      } catch (notifErr) {
        console.error('⚠️ Notification error (non-critical):', notifErr);
      }
    }

    console.log('========== COMMENT CREATED SUCCESSFULLY ==========\n');
    return NextResponse.json(comment, { status: 201 });

  } catch (error: any) {
    console.error('❌❌❌ CRITICAL ERROR:', error);
    console.error('Stack:', error.stack);
    return NextResponse.json({ 
      error: 'Failed to create comment',
      details: error.message 
    }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  console.log('\n========== EDIT COMMENT REQUEST ==========');
  
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('❌ No session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { commentId, content } = await req.json();
    console.log('🆔 Comment ID:', commentId);
    console.log('📝 New content:', content);
    
    if (!commentId || !content?.trim()) {
      return NextResponse.json({ error: 'Comment ID and content required' }, { status: 400 });
    }

    // 🛡️ MODERATION CHECK FOR EDITED COMMENTS
    console.log('🛡️ Running moderation...');
    const moderation = await moderateContent(content.trim());
    console.log(`🛡️ Result: ${moderation.allowed ? 'ALLOWED' : 'BLOCKED'} | Score: ${moderation.score}`);

    if (!moderation.allowed) {
      console.log('🚫 EDIT BLOCKED by moderation');
      return NextResponse.json({
        error: moderation.message || "⚠️ Your edited comment contains hate speech and cannot be saved.",
        blocked: true,
        toxicity_score: moderation.score,
        toxic_categories: moderation.categories
      }, { status: 403 });
    }

    console.log('✅ Moderation passed');
    
    // Check if user is the author
    const check = await pool.query(
      `SELECT user_id FROM comments WHERE id = $1 AND post_id = $2`,
      [commentId, params.postId]
    );
    
    if (!check.rows.length || check.rows[0].user_id !== session.user.id) {
      console.log('❌ User is not the author');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Update the comment
    const update = await pool.query(
      `UPDATE comments SET content = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [content.trim(), commentId]
    );
    
    const updatedComment = {
      ...update.rows[0],
      warning: moderation.flagged ? moderation.message : null,
    };

    console.log('========== COMMENT UPDATED SUCCESSFULLY ==========\n');
    return NextResponse.json(updatedComment);
    
  } catch (error: any) {
    console.error('❌ Error editing comment:', error);
    return NextResponse.json({ 
      error: 'Failed to edit comment',
      details: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  console.log('\n========== DELETE COMMENT REQUEST ==========');
  
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('❌ No session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { commentId } = await req.json();
    console.log('🆔 Comment ID:', commentId);
    
    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID required' }, { status: 400 });
    }
    
    // Check if user is the author
    const check = await pool.query(
      `SELECT user_id FROM comments WHERE id = $1 AND post_id = $2`,
      [commentId, params.postId]
    );
    
    if (!check.rows.length || check.rows[0].user_id !== session.user.id) {
      console.log('❌ User is not the author');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Delete comment and all its replies
    await pool.query(`DELETE FROM comments WHERE id = $1 OR parent_id = $1`, [commentId]);
    console.log('✅ Comment deleted');
    
    // Update comment count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM comments WHERE post_id = $1`,
      [params.postId]
    );
    
    await pool.query(
      `UPDATE posts SET comments_count = $1 WHERE id = $2`,
      [countResult.rows[0].count, params.postId]
    );
    
    console.log('========== COMMENT DELETED SUCCESSFULLY ==========\n');
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error('❌ Error deleting comment:', error);
    return NextResponse.json({ 
      error: 'Failed to delete comment',
      details: error.message 
    }, { status: 500 });
  }
}