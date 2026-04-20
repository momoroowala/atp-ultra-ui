import { supabase } from "@/integrations/supabase/client";

// Data to import
const promptCatalogData = [
  {
    handle: 'tilt-recovery-drill',
    title: 'Tilt‑Recovery Drill',
    archetypes: ['emotional_trader'],
    mission: 'Stop revenge trading before it snowballs.',
    tooltip: 'A 3‑step breathing + journaling routine that clears fight‑or‑flight chemistry in < 2 minutes so you can re‑enter the market rationally.'
  },
  {
    handle: 'emotion-reset-blueprint',
    title: 'Emotion Reset Blueprint',
    archetypes: ['emotional_trader'],
    mission: 'Re‑wire fear‑and‑greed triggers for steady execution.',
    tooltip: 'Pinpoint your emotional trip‑wires, anchor them to calming cues, and install a "trading self‑talk" script to keep draw‑downs from turning into meltdowns.'
  },
  {
    handle: 'stress-pretrade-protocol',
    title: 'Pre‑Trade Calm Protocol',
    archetypes: ['emotional_trader', 'reckless_trader'],
    mission: 'Enter each session with a low‑stress baseline.',
    tooltip: 'A six‑minute routine—HRV breath + intention statement + checklist—that research shows can cut cortisol spikes by 25 %.'
  },
  {
    handle: 'bounce-back-framework',
    title: 'Bounce‑Back Framework',
    archetypes: ['emotional_trader'],
    mission: 'Turn a three‑loss spiral into a disciplined reset.',
    tooltip: 'Quantify streak damage, insert a mandatory pause, and deploy a micro‑goal ladder that rebuilds confidence without revenge size.'
  },
  {
    handle: 'urge-surfing-challenge',
    title: 'Impulse Control Challenge',
    archetypes: ['emotional_trader', 'gambler'],
    mission: 'Master the moment you want to double‑down.',
    tooltip: 'Urge‑surfing (90‑sec mindfulness) dampens dopamine spikes, giving you a window to apply the pre‑set sizing rule.'
  },
  {
    handle: 'prop-firm-drawdown',
    title: 'Trailing‑Drawdown Optimizer',
    archetypes: ['gambler'],
    mission: 'Stretch your prop‑firm cushion with math‑based sizing.',
    tooltip: 'Uses Kelly‑fraction logic to scale position size as equity nears the trailing limit—simulations show Kelly maximises median wealth while keeping risk of ruin near 0 %.'
  },
  {
    handle: 'risk-psychology-reboot',
    title: 'Risk‑Psychology Reboot',
    archetypes: ['gambler'],
    mission: 'Re‑wire the thrill‑seeking brain that fuels oversizing.',
    tooltip: 'Elevated cortisol shifts traders toward higher risk‑taking; this drill swaps adrenaline goals for edge‑aligned pay‑offs.'
  },
  {
    handle: 'gambling-trigger-detox',
    title: 'Gambling‑Trigger Detox',
    archetypes: ['gambler'],
    mission: 'Eliminate FOMO cues that spark all‑in bets.',
    tooltip: 'Identifies the environmental triggers flagged by 40 % of prospects and installs a 60‑sec de‑sensitisation loop.'
  },
  {
    handle: 'capital-shield-ladder',
    title: 'Capital‑Shield Ladder',
    archetypes: ['gambler'],
    mission: 'Protect equity first, scale only after profit steps.',
    tooltip: 'Tiered exposure—risk 0.25 % until +5 R, then step up; sub‑Kelly sizing keeps drawdowns shallow.'
  },
  {
    handle: 'strategy-rebuild-blueprint',
    title: 'Strategy Rebuild Blueprint',
    archetypes: ['strategy_hopper'],
    mission: 'Strip trading down to one high‑expectancy setup.',
    tooltip: 'Taiwan day‑trader study (Barber et al.) shows the tiny winning cohort stuck to one strategy.'
  },
  {
    handle: 'commit-to-one-protocol',
    title: 'Commit‑to‑One Protocol',
    archetypes: ['strategy_hopper'],
    mission: 'End the shiny‑system loop in 7 days.',
    tooltip: 'A 7‑day public commitment contract boosts adherence 63 % (behaviour‑change research).'
  },
  {
    handle: 'focus-edge-deep-dive',
    title: 'Focus & Edge Deep‑Dive',
    archetypes: ['strategy_hopper'],
    mission: 'Master every variable of your chosen play.',
    tooltip: 'Mapping time‑of‑day & regime filters lifted expectancy 0.4 R in a TradeFundrr audit.'
  },
  {
    handle: 'boredom-proof-routine',
    title: 'Boredom‑Proof Routine',
    archetypes: ['strategy_hopper'],
    mission: 'Block shiny‑object syndrome on slow days.',
    tooltip: 'Short non‑trading tasks cut impulse mistakes 30 % in cognitive‑load studies.'
  },
  {
    handle: 'high-probability-filter',
    title: 'High‑Probability Setup Filter',
    archetypes: ['strategy_hopper', 'fearful_hesitator'],
    mission: 'Replace FOMO with an A‑grade checklist.',
    tooltip: 'Transcript data: FOMO trades ‑1.1 R vs A‑grade +1.4 R; build a binary filter.'
  },
  {
    handle: 'one-page-plan',
    title: 'One‑Page Trading Plan',
    archetypes: ['unstructured_trader'],
    mission: 'Craft a written roadmap you can read in 60 sec.',
    tooltip: 'IG Markets survey: 76 % of winning traders kept a written plan.'
  },
  {
    handle: 'daily-weekly-routine',
    title: 'Daily / Weekly Routine',
    archetypes: ['unstructured_trader'],
    mission: 'Install a repeatable prep & review cycle.',
    tooltip: 'Futures.io poll: daily routine raised consistency 25 %.'
  },
  {
    handle: 'journal-review',
    title: 'Trade Journal & Review',
    archetypes: ['unstructured_trader'],
    mission: 'Turn raw trades into data‑backed feedback.',
    tooltip: '2022 meta‑analysis: journaling improved self‑regulation 23 %.'
  },
  {
    handle: 'a-plus-playbook',
    title: 'A‑Grade Setup Playbook',
    archetypes: ['unstructured_trader'],
    mission: 'Build (or update) your visual edge library.',
    tooltip: 'Pattern‑library recall lifts correct decision‑rate 30 %.'
  },
  {
    handle: 'simplify-your-screen',
    title: 'Reduce Chart Clutter',
    archetypes: ['unstructured_trader'],
    mission: 'Reduce levels on your chart to focus on price.',
    tooltip: 'Each extra chart element adds 80 ms reaction time (cognitive‑load research).'
  },
  {
    handle: 'fearless-execution-plan',
    title: 'Fearless Execution Plan',
    archetypes: ['fearful_hesitator'],
    mission: 'Turn analysis into decisive entries in three reps.',
    tooltip: 'Implementation‑intention scripts cut decision latency 28 % (Columbia study).'
  },
  {
    handle: 'single-trigger-checklist',
    title: 'Single‑Trigger Checklist',
    archetypes: ['fearful_hesitator'],
    mission: 'Reduce entry rules to one binary yes/no signal.',
    tooltip: 'NASA cockpit research: binary checklists drop error rate 35 %.'
  },
  {
    handle: 'decision-drill-2min',
    title: '2‑Minute Decision Drill',
    archetypes: ['fearful_hesitator'],
    mission: 'Kill analysis‑paralysis with a timed choice loop.',
    tooltip: '120‑sec constraint improved pick‑rate confidence 22 %.'
  },
  {
    handle: 'time-pressure-reset',
    title: 'Time‑Pressure Reset',
    archetypes: ['fearful_hesitator'],
    mission: 'Re‑align expectations when the clock feels hostile.',
    tooltip: 'Kent study: quick scenario planning dropped stress markers 18 %.'
  },
  {
    handle: 'if-then-lab',
    title: 'IF‑THEN Discipline Lab',
    archetypes: ['reckless_trader'],
    mission: 'Turn broken rules into automatic habits.',
    tooltip: 'Meta‑analysis of 94 studies: IF‑THEN plans doubled follow‑through.'
  },
  {
    handle: 'accountability-loop',
    title: 'Accountability Loop',
    archetypes: ['reckless_trader'],
    mission: 'Leverage outside eyes to keep rules intact.',
    tooltip: 'Daily peer reporting raised goal adherence 55 %.'
  },
  {
    handle: 'five-rule-framework',
    title: 'Five‑Rule Framework',
    archetypes: ['reckless_trader'],
    mission: 'Slim your plan to the five rules you will follow.',
    tooltip: 'Keeping ≤ 5 core rules added 9 p.p. net returns (TradeFundrr).'
  },
  {
    handle: 'consistency-streak-builder',
    title: 'Consistency‑Streak Builder',
    archetypes: ['reckless_trader'],
    mission: 'Gamify discipline into an unbroken chain.',
    tooltip: 'Streak length > 7 days cut missed tasks 40 % in habit apps.'
  },
  {
    handle: 'stress-discipline-playbook',
    title: 'Stress‑Test Playbook',
    archetypes: ['reckless_trader', 'emotional_trader'],
    mission: 'Keep cortisol spikes from breaking discipline.',
    tooltip: '2024 trading‑floor study: 6‑min breath + scan reduced mistake rate 23 %.'
  }
];

export async function runPromptCatalogImport() {
  try {
    console.log('Starting prompt catalog import...');
    
    const { data, error } = await supabase
      .from('prompt_catalog')
      .upsert(promptCatalogData, { 
        onConflict: 'handle',
        ignoreDuplicates: true 
      });
    
    if (error) {
      console.error('Error importing prompt catalog:', error);
      throw error;
    }
    
    console.log('Successfully imported prompt catalog:', data);
    return { success: true, count: promptCatalogData.length };
  } catch (error) {
    console.error('Import failed:', error);
    return { success: false, error };
  }
}

// Auto-run the import
runPromptCatalogImport().then(result => {
  if (result.success) {
    console.log(`✅ Successfully imported ${result.count} prompt catalog entries`);
  } else {
    console.error('❌ Import failed:', result.error);
  }
});