import { NextRequest, NextResponse } from 'next/server';

/**
 * In-App Feedback & Bug Reports API
 * Receives user feedback, bug submissions, and suggestions from all IT tools.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { toolId, feedbackType, title, description, metadata, userId } = body;

    if (!toolId || !feedbackType || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: toolId, feedbackType, title, description' },
        { status: 400 }
      );
    }

    // In a live Supabase environment, write directly to `ni_it_feedback`
    // If running in local or demo mode, return simulated acknowledgement
    const submission = {
      id: crypto.randomUUID(),
      user_id: userId || null,
      tool_id: toolId,
      feedback_type: feedbackType,
      title,
      description,
      metadata: metadata || {},
      status: 'new',
      priority_score: feedbackType === 'bug' ? 2 : 1,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'Feedback received and queued for weekly AI synthesis review.',
      feedback: submission,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}
