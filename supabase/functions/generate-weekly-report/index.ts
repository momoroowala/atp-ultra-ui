import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:8081',
  'https://app.abuvthepar.com',
];

function getCorsOrigin(req: Request): string {
  const origin = req.headers.get('origin') || '';
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': getCorsOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const body = await req.json();
    const { userId, weekStartDate, runForAllUsers } = body;

    // If runForAllUsers is true, generate reports for all active users
    if (runForAllUsers) {
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('id');
      
      if (usersError) throw usersError;
      
      const results = [];
      for (const user of users || []) {
        try {
          const result = await generateReportForUser(user.id, weekStartDate, supabase, openAIApiKey);
          results.push({ userId: user.id, success: true, reportId: result?.id });
        } catch (error) {
          console.error(`Failed to generate report for user ${user.id}:`, error);
          results.push({ userId: user.id, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }
      
      return new Response(
        JSON.stringify({ message: 'Bulk generation complete', results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Single user report generation
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const report = await generateReportForUser(userId, weekStartDate, supabase, openAIApiKey);
    
    return new Response(
      JSON.stringify({ report }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating weekly report:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function generateReportForUser(userId: string, weekStartDate: string | undefined, supabase: any, openAIApiKey: string) {
  // Calculate week start and end dates
  const weekStart = weekStartDate ? new Date(weekStartDate) : getWeekStart();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  console.log('Generating report for user:', userId);
  console.log('Week range:', weekStart.toISOString(), 'to', weekEnd.toISOString());

  // Check if report already exists for this week
  const { data: existingReport } = await supabase
    .from('weekly_reports')
    .select('id')
    .eq('user_id', userId)
    .eq('week_start_date', weekStart.toISOString().split('T')[0])
    .maybeSingle();

  if (existingReport) {
    console.log('Report already exists for this week, skipping');
    return existingReport;
  }

  // Fetch user's AI chat sessions for the week (NEW TABLE)
  const { data: aiChatSessions, error: aiSessionsError } = await supabase
    .from('ai_chat_sessions')
    .select('id, session_title, created_at, session_type, agent_type, assessment_title')
    .eq('user_id', userId)
    .gte('created_at', weekStart.toISOString())
    .lt('created_at', weekEnd.toISOString())
    .order('created_at', { ascending: false });

  if (aiSessionsError) throw aiSessionsError;

  // Fetch messages for each session
  const sessionsWithMessages = [];
  if (aiChatSessions && aiChatSessions.length > 0) {
    for (const session of aiChatSessions) {
      const { data: messages } = await supabase
        .from('ai_chat_messages')
        .select('role, content, created_at')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true })
        .limit(10); // Limit messages per session for performance

      sessionsWithMessages.push({
        ...session,
        messages: messages || []
      });
    }
  }

  // If no activity, generate a minimal report
  if (sessionsWithMessages.length === 0) {
    const emptyReport = {
      user_id: userId,
      week_start_date: weekStart.toISOString().split('T')[0],
      report_content: generateEmptyWeekReport(weekStart),
      insights: {
        engagement_level: 'none',
        primary_focus: null,
        improvement_areas: [],
        strengths: [],
        session_count: 0,
        topics_explored: []
      }
    };

    const { data: newReport, error: insertError } = await supabase
      .from('weekly_reports')
      .insert(emptyReport)
      .select()
      .single();

    if (insertError) throw insertError;
    return newReport;
  }

  // Prepare conversation summaries for AI analysis
  const conversationSummaries = sessionsWithMessages.map((session, idx) => {
    const messageCount = session.messages.length;
    const messages = session.messages;
    
    // Extract key conversation points (first 3 and last 3 messages)
    const keyMessages = messages.length > 6 
      ? [...messages.slice(0, 3), ...messages.slice(-3)]
      : messages;
    
    const conversationSnippet = keyMessages
      .map((m: any) => `${m.role}: ${m.content.substring(0, 150)}...`)
      .join('\n');

    return `
Session ${idx + 1}: ${session.session_title || session.assessment_title || 'Untitled'}
Type: ${session.session_type} | Agent: ${session.agent_type}
Date: ${new Date(session.created_at).toLocaleDateString()}
Messages: ${messageCount}
Key Discussion:
${conversationSnippet}
`;
  }).join('\n---\n');

  // Generate AI-powered report
  const prompt = `You are analyzing a user's weekly progress based on their conversations with AI Assistant.

AI Chat Sessions This Week (${sessionsWithMessages.length} sessions):
${conversationSummaries}

Generate a comprehensive weekly report in markdown format with these sections:
1. Key Insights This Week
2. Activity Summary (number of sessions, topics explored)
3. Psychology Observations
4. Strengths Identified
5. Areas for Continued Focus
6. Recommended Actions
7. Progress Indicators

Keep the tone encouraging and specific. Reference actual conversation topics when possible.

Format the report with markdown headers (# ## ###) and bullet points.`;

  console.log('Calling OpenAI for report generation...');
  
  const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert trading psychology analyst who creates personalized, insightful progress reports for traders.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    }),
  });

  if (!openAIResponse.ok) {
    const errorText = await openAIResponse.text();
    console.error('OpenAI API error:', openAIResponse.status, errorText);
    throw new Error(`OpenAI API error: ${openAIResponse.status}`);
  }

  const aiData = await openAIResponse.json();
  const reportContent = aiData.choices[0].message.content;

  console.log('Report content generated, length:', reportContent.length);

  // Extract insights using AI
  const insightsPrompt = `Based on the following weekly report, extract structured insights in JSON format:

${reportContent}

Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks):
{
  "engagement_level": "high" | "medium" | "low",
  "primary_focus": "one primary topic as a short string",
  "improvement_areas": ["area1", "area2", "area3"],
  "strengths": ["strength1", "strength2", "strength3"],
  "session_count": ${sessionsWithMessages.length},
  "topics_explored": ["topic1", "topic2", "topic3"]
}`;

  const insightsResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You extract structured data from text. Return only valid JSON.' },
        { role: 'user', content: insightsPrompt }
      ],
      temperature: 0.3,
      max_tokens: 500
    }),
  });

  const insightsData = await insightsResponse.json();
  let insights;
  
  try {
    const insightsText = insightsData.choices[0].message.content.trim();
    // Remove markdown code blocks if present
    const cleanedText = insightsText.replace(/```json\n?|\n?```/g, '');
    insights = JSON.parse(cleanedText);
  } catch (e) {
    console.error('Failed to parse insights JSON:', e);
    // Fallback insights
    insights = {
      engagement_level: sessionsWithMessages.length >= 3 ? 'high' : sessionsWithMessages.length >= 1 ? 'medium' : 'low',
      primary_focus: 'trading_psychology',
      improvement_areas: ['consistency', 'risk_management'],
      strengths: ['engagement', 'self_awareness'],
      session_count: sessionsWithMessages.length,
      topics_explored: ['assessment']
    };
  }

  // Insert the report
  const newReport = {
    user_id: userId,
    week_start_date: weekStart.toISOString().split('T')[0],
    report_content: reportContent,
    insights: insights
  };

  const { data: insertedReport, error: insertError } = await supabase
    .from('weekly_reports')
    .insert(newReport)
    .select()
    .single();

  if (insertError) throw insertError;

  console.log('Report successfully generated and saved');
  return insertedReport;
}

function getWeekStart(date: Date = new Date()): Date {
  const weekStart = new Date(date);
  // Set to previous Monday (0 = Sunday, 1 = Monday)
  const day = weekStart.getDay();
  const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
  weekStart.setDate(diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

function generateEmptyWeekReport(weekStart: Date): string {
  return `# Your Weekly Trading Progress Report

## Week of ${weekStart.toLocaleDateString()}

### 📊 Activity Summary
No activity was recorded this week.

### 💡 Recommendation
Start engaging with AI Profit Assistant to:
- Explore your trading psychology through AI-powered assessments
- Identify your trader archetype
- Develop personalized strategies
- Build mental resilience

### 🚀 Get Started
Visit AI Profit Assistant and start a conversation or take an assessment to begin your journey toward better trading performance.

---
*This report will automatically populate with insights once you start using the platform.*`;
}