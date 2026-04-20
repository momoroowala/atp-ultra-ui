import type { CallRecording } from '@/hooks/useCallRecordings';

const uid = () => crypto.randomUUID();

/**
 * Return YYYY-MM-DD for the Nth-most-recent past occurrence of `weekday`
 * (0=Sun, 1=Mon ... 6=Sat). `weeksAgo=0` => most recent past occurrence.
 */
const recentWeekday = (weekday: number, weeksAgo: number = 0): string => {
  const d = new Date();
  const delta = (d.getDay() - weekday + 7) % 7 || 7;
  d.setDate(d.getDate() - delta - weeksAgo * 7);
  return d.toISOString().slice(0, 10);
};

const daysAgo = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const makeRecording = (
  title: string,
  description: string,
  date: string,
  time: string,
  duration: number,
  tags: string[],
  visible_tiers: string[] | null = ['all'],
): CallRecording => ({
  id: uid(),
  title,
  description,
  recording_url: `https://example.com/recordings/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).slice(2, 8)}`,
  thumbnail_url: null,
  duration_minutes: duration,
  recorded_date: date,
  recorded_time: time,
  tags,
  additional_links: null,
  created_by: 'demo-admin',
  is_active: true,
  visible_tiers,
  visible_tier_ids: null,
  created_at: new Date(`${date}T${time}:00`).toISOString(),
  updated_at: new Date(`${date}T${time}:00`).toISOString(),
});

// Rotating topic pools per weekday -- realistic ATP call themes.
const MONDAY_TOPICS = [
  'Owning the Week', 'Consistency Over Motivation', 'Reset After a Tough Week',
  'Momentum Playbook', 'Beating Sunday Scaries', 'Weekly Goal Setting',
  'Identity-Based Habits', 'Fear Is Information', 'Deep Work Blocks',
  'Energy Audit', 'Ruthless Prioritization', 'Ship Before Perfect',
  'Morning Routine Tear-Down', 'Compounding 1% Days', 'Saying No to Grow',
  'The Boring Middle', 'Process Over Outcome', 'Recovery Equals Performance',
  'Coaching Your Inner Critic', 'Weekly Retrospective Template',
  'Operator Mindset', 'Results vs Effort', 'Killing Perfectionism',
  'Owning Mistakes Fast', 'Rituals That Stick', 'Finding Your Edge',
  'Commitment Devices', 'From Tactics to Systems', 'The Patience Muscle',
  'Week-One Reset', 'Long-Game Wholesaler', 'The Two-List Rule',
];

const TUESDAY_TOPICS = [
  'Q2 Brand Rotation', 'PO Template Walkthrough', 'Reorder Strategy',
  'Sourcing SmartScout Filters', 'Margin Math Deep Dive', 'Working Capital Rules',
  'Category Trend Scan', 'Supplier Negotiation Scripts', 'Buying Seasonal Peaks',
  'Prep Cost Line-Item Review', 'PO Review with Wilbur', 'Velocity-Based Buying',
  'Handling Backorders', 'Private Label vs Wholesale', 'Payment Term Wins',
  'ACH vs Credit Card Math', 'First-PO Mistakes', 'Reorder Signal Playbook',
  'Bundling Strategy', 'Brand Blacklist Logic', 'Kehi Deep Dive',
  'NurturePet Case Study', 'Summer Stocking Calendar', 'Q4 Buying Prep',
  'Working With Distributors', 'Minimum Order Quantity Games', 'Cash Flow Forecasting',
  'Credit Line Strategy', 'Rush Order Playbook', 'When to Walk Away',
  'Supplier Red Flags', 'PO Approval Gate',
];

const WEDNESDAY_TOPICS = [
  'Brand Approvals & Gating', 'Cash Flow Questions', 'Prep Center Edge Cases',
  'Amazon Buy Box Tactics', 'Returns Handling', 'Tax Season Prep',
  'LLC vs S-Corp', 'Bookkeeping 101', 'Inventory Write-Offs',
  'Stranded Inventory Fixes', 'Hazmat Approvals', 'Restricted Brands Workaround',
  'IP Complaints Response', 'Account Health Dashboards', 'Storage Fees Deep Dive',
  'Removing Negative Reviews', 'Customer Service Scripts', 'A-to-Z Claims Defense',
  'Variation Listing Strategy', 'Refund Abuse Patterns', 'Invoice Requirements',
  'Feedback Manager Setup', 'Keepa Deep Dive', 'AZInsight Walkthrough',
  'BSR Decoding', 'Listing Hijacker Response', 'Brand Registry 2.0',
  'Case ID Escalation Path', 'MOQ Objection Handling', 'International Suppliers',
  'Walmart vs Amazon Economics', 'FBA Fee Changes',
];

const THURSDAY_TOPICS = [
  'Phone Script Roleplay', 'Ungating 101', 'Decision-Maker Discovery',
  'Cold Email Subject Lines', 'Objection Handling Drills', 'Voicemail Playbook',
  'LinkedIn Touch Sequence', 'Follow-Up Cadence Math', 'Close Rate Teardown',
  'Brand Onboarding Packet', 'NDA + MSA Walkthrough', 'First Call Framework',
  'Trust-Forward Openers', 'CRM Hygiene Drill', 'Deal-Stage Checklist',
  'Contract Negotiation Live', 'AM Quarterly Business Review', 'Churn Early Warning',
  'Upsell Conversations', 'Referral Asks That Work', 'Account Mapping Exercise',
  'SmartScout → Outreach Pipe', 'Apollo Enrichment Workflow', 'Phone Warm-Up Drills',
  'Rejection Reframe', 'Brand Red Flags', 'Seasonality Pitch Angles',
  'Multi-Threaded Selling', 'Executive-Level Intros', 'Discovery Call Scripts',
  'Win/Loss Analysis', 'Email Deliverability Clinic',
];

const FRIDAY_TOPICS = [
  'End-of-Week Wrap Up', 'Inventory & Sales Velocity', 'Listing Optimization Clinic',
  'Win of the Week', 'Lost Deal Post-Mortem', 'KPIs You Actually Need',
  'Dashboard Walkthrough', 'Sunday Planning Template', 'Numbers Don\'t Lie Review',
  'Shipping Issue Triage', 'Seller Central Power Tour', 'Reviewing Last 7 Days',
  'Student Spotlight Series', 'Community Q&A Speed Round', 'Mail Bag Episode',
  'Tech Stack Discussion', 'Shortcut Keys That Save Hours', 'Pricing Algorithm Talk',
  'Repricer Showdown', 'Coaching Hot Seat', 'Money Moves of the Week',
  'Reading Your P&L', 'Why Week Matter', 'Quick Win Compilation',
  'Tools We\'re Testing', 'Ask Me Anything', 'Brand Scorecard Drill',
  'Chargeback Deep Dive', 'Amazon Policy Update', 'Spreadsheet Clinic',
  'Automation Experiments', 'Lessons From the Trenches',
];

const INNER_CIRCLE_TOPICS = [
  'Mastermind w/ Tayeb', 'Lifetime Tier Preview', 'Private Brand Review Session',
  'High-Ticket Pricing Strategy', 'Exclusive Supplier Intros', 'Behind-the-Scenes Ops',
  'Board-Level Strategy Call', 'Annual Rocks Planning', 'Legacy Mode Setup',
  'Private Deal Flow', 'ATP Roadmap Preview', 'Tax Structure Deep Dive',
  'Estate Planning 101', 'Capital Stack Review', 'Wealth Allocation Framework',
  'Exit Strategy Options', 'Franchise Opportunity Brief', 'Acquisition Targets',
  'High-Net-Worth Tactics', 'Family Office Introduction', 'International Expansion Chat',
  'Private Label Launch Lab', 'Direct-to-Brand Deals', 'Whitelabel Negotiations',
  'Off-Market Supplier Access', 'Diamond-Only AMA', 'CEO Roundtable',
  'Year-End Strategy Review', 'Q1 Kickoff Exclusive', 'Private Q&A with Mo',
  'Coaching Intensive Recording', 'Private Investor Brief',
];

const SPECIAL_TOPICS = [
  'Walmart Workshop — WFS Getting Started', 'Guest Speaker — SmartScout Deep Dive',
  'Tax Season Q&A with CPA', 'Helium 10 Training Session', 'Keepa Power User Workshop',
  'eBay Cross-Listing Workshop', 'TikTok Shop Strategy Session', 'Shopify Side-Hustle Intro',
  'Legal Clinic — Contracts & IP', 'Insurance 101 for Sellers', 'LLC + Banking Setup',
  'Walmart Seller Summit Replay', 'Amazon Accelerate Highlights', 'Prosper Show Takeaways',
  'Guest — FBA Prep Center Founder', 'Aggregator Panel Discussion', 'Inventory Financing Panel',
  'Credit Card Stacking Workshop', 'International Shipping Clinic', 'Customs Broker Workshop',
  'Private Label Launch Intensive', 'Influencer Marketing for Brands', 'PPC for Wholesale Sellers',
  'Brand Building Workshop', 'Content Marketing Crash Course', 'Email Deliverability Masterclass',
  'Saturday Live Build — Sourcing Together', 'Saturday Seller Central Tour',
  'Saturday Deep Dive — Keepa Charts', 'Saturday Brand Research Jam',
  'Saturday Q&A Special Edition', 'Saturday Tax Office Hours',
  'New Year Goal-Setting Special', 'Q4 Kickoff — Holiday Strategy',
];

const SAFE_TIMES = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '19:00'];

function buildWeeklySeries(
  weekday: number,
  topics: string[],
  weeksBack: number,
  timeFn: () => string,
  tagBase: string[],
  tierRestriction: string[] | null = ['all'],
): CallRecording[] {
  const out: CallRecording[] = [];
  for (let i = 0; i < weeksBack && i < topics.length; i++) {
    const topic = topics[i];
    const dayLabel = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][weekday];
    const title =
      weekday === 1 ? `Monday Mindset — ${topic}`
      : weekday === 2 ? `Tuesday Purchasing — ${topic}`
      : weekday === 3 ? `Wednesday Q&A — ${topic}`
      : weekday === 4 ? `Thursday Brand Outreach — ${topic}`
      : weekday === 5 ? `Friday Q&A — ${topic}`
      : `${dayLabel} — ${topic}`;
    out.push(
      makeRecording(
        title,
        `${topic} session from a past ${dayLabel} call.`,
        recentWeekday(weekday, i),
        timeFn(),
        rand(28, 70),
        [...tagBase],
        tierRestriction,
      ),
    );
  }
  return out;
}

function buildInnerCircle(count: number): CallRecording[] {
  const out: CallRecording[] = [];
  for (let i = 0; i < count && i < INNER_CIRCLE_TOPICS.length; i++) {
    const topic = INNER_CIRCLE_TOPICS[i];
    out.push(
      makeRecording(
        `Inner Circle — ${topic}`,
        `Private Inner Circle session for Platinum and Diamond members.`,
        daysAgo(3 + i * 10 + rand(0, 4)),
        '19:00',
        rand(55, 95),
        ['inner circle', 'exclusive'],
        ['platinum', 'diamond'],
      ),
    );
  }
  return out;
}

function buildSpecial(count: number): CallRecording[] {
  const out: CallRecording[] = [];
  for (let i = 0; i < count && i < SPECIAL_TOPICS.length; i++) {
    const topic = SPECIAL_TOPICS[i];
    const isWorkshop = topic.toLowerCase().includes('workshop') || topic.toLowerCase().includes('masterclass');
    const isSaturday = topic.toLowerCase().startsWith('saturday');
    // Saturday flavored topics pin to an actual Saturday date so they still feel like weekend specials.
    const date = isSaturday
      ? recentWeekday(6, i)
      : daysAgo(5 + i * 8 + rand(0, 5));
    out.push(
      makeRecording(
        topic,
        `${topic} — special workshop or guest session.`,
        date,
        SAFE_TIMES[i % SAFE_TIMES.length],
        rand(45, 110),
        isWorkshop ? ['special', 'workshop'] : ['special'],
      ),
    );
  }
  return out;
}

const pickTime = (pool: string[]) => () => pool[rand(0, pool.length - 1)];

export const DEMO_RECORDINGS: CallRecording[] = [
  ...buildInnerCircle(32),
  ...buildWeeklySeries(1, MONDAY_TOPICS,    32, pickTime(['09:00']), ['mindset', 'monday']),
  ...buildWeeklySeries(2, TUESDAY_TOPICS,   32, pickTime(['14:00']), ['purchasing', 'tuesday']),
  ...buildWeeklySeries(3, WEDNESDAY_TOPICS, 32, pickTime(['15:00']), ['qa', 'wednesday']),
  ...buildWeeklySeries(4, THURSDAY_TOPICS,  32, pickTime(['14:00']), ['brand-outreach', 'thursday']),
  ...buildWeeklySeries(5, FRIDAY_TOPICS,    32, pickTime(['15:00']), ['qa', 'friday']),
  ...buildSpecial(34),
];
