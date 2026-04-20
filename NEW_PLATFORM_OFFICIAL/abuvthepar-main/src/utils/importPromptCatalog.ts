import { supabase } from "@/integrations/supabase/client";

const csvData = `handle,title,archetypes,mission,tooltip
tilt-recovery-drill,Tilt‑Recovery Drill,"{emotional_trader}",Stop revenge trading before it snowballs.,A 3‑step breathing + journaling routine that clears fight‑or‑flight chemistry in < 2 minutes so you can re‑enter the market rationally.
emotion-reset-blueprint,Emotion Reset Blueprint,"{emotional_trader}",Re‑wire fear‑and‑greed triggers for steady execution.,Pinpoint your emotional trip‑wires, anchor them to calming cues, and install a "trading self‑talk" script to keep draw‑downs from turning into meltdowns.
stress-pretrade-protocol,Pre‑Trade Calm Protocol,"{emotional_trader,reckless_trader}",Enter each session with a low‑stress baseline.,A six‑minute routine—HRV breath + intention statement + checklist—that research shows can cut cortisol spikes by 25 %.
bounce-back-framework,Bounce‑Back Framework,"{emotional_trader}",Turn a three‑loss spiral into a disciplined reset.,Quantify streak damage, insert a mandatory pause, and deploy a micro‑goal ladder that rebuilds confidence without revenge size.
urge-surfing-challenge,Impulse Control Challenge,"{emotional_trader,gambler}",Master the moment you want to double‑down.,"Urge‑surfing" (90‑sec mindfulness) dampens dopamine spikes, giving you a window to apply the pre‑set sizing rule.
prop-firm-drawdown,Trailing‑Drawdown Optimizer,"{gambler}",Stretch your prop‑firm cushion with math‑based sizing.,Uses Kelly‑fraction logic to scale position size as equity nears the trailing limit—simulations show Kelly maximises median wealth while keeping risk of ruin near 0 %.
risk-psychology-reboot,Risk‑Psychology Reboot,"{gambler}",Re‑wire the thrill‑seeking brain that fuels oversizing.,Elevated cortisol shifts traders toward higher risk‑taking; this drill swaps adrenaline goals for edge‑aligned pay‑offs.
gambling-trigger-detox,Gambling‑Trigger Detox,"{gambler}",Eliminate FOMO cues that spark all‑in bets.,Identifies the environmental triggers flagged by 40 % of prospects and installs a 60‑sec de‑sensitisation loop.
capital-shield-ladder,Capital‑Shield Ladder,"{gambler}",Protect equity first, scale only after profit steps.,Tiered exposure—risk 0.25 % until +5 R, then step up; sub‑Kelly sizing keeps drawdowns shallow.
strategy-rebuild-blueprint,Strategy Rebuild Blueprint,"{strategy_hopper}",Strip trading down to one high‑expectancy setup.,Taiwan day‑trader study (Barber et al.) shows the tiny winning cohort stuck to one strategy.
commit-to-one-protocol,Commit‑to‑One Protocol,"{strategy_hopper}",End the shiny‑system loop in 7 days.,A 7‑day public commitment contract boosts adherence 63 % (behaviour‑change research).
focus-edge-deep-dive,Focus & Edge Deep‑Dive,"{strategy_hopper}",Master every variable of your chosen play.,Mapping time‑of‑day & regime filters lifted expectancy 0.4 R in a TradeFundrr audit.
boredom-proof-routine,Boredom‑Proof Routine,"{strategy_hopper}",Block shiny‑object syndrome on slow days.,Short non‑trading tasks cut impulse mistakes 30 % in cognitive‑load studies.
high-probability-filter,High‑Probability Setup Filter,"{strategy_hopper,fearful_hesitator}",Replace FOMO with an A‑grade checklist.,Transcript data: FOMO trades ‑1.1 R vs A‑grade +1.4 R; build a binary filter.
one-page-plan,One‑Page Trading Plan,"{unstructured_trader}",Craft a written roadmap you can read in 60 sec.,IG Markets survey: 76 % of winning traders kept a written plan.
daily-weekly-routine,Daily / Weekly Routine,"{unstructured_trader}",Install a repeatable prep & review cycle.,Futures.io poll: daily routine raised consistency 25 %.
journal-review,Trade Journal & Review,"{unstructured_trader}",Turn raw trades into data‑backed feedback.,2022 meta‑analysis: journaling improved self‑regulation 23 %.
a-plus-playbook,A‑Grade Setup Playbook,"{unstructured_trader}",Build (or update) your visual edge library.,Pattern‑library recall lifts correct decision‑rate 30 %.
simplify-your-screen,Reduce Chart Clutter,"{unstructured_trader}",Reduce levels on your chart to focus on price.,Each extra chart element adds 80 ms reaction time (cognitive‑load research).
fearless-execution-plan,Fearless Execution Plan,"{fearful_hesitator}",Turn analysis into decisive entries in three reps.,Implementation‑intention scripts cut decision latency 28 % (Columbia study).
single-trigger-checklist,Single‑Trigger Checklist,"{fearful_hesitator}",Reduce entry rules to one binary yes/no signal.,NASA cockpit research: binary checklists drop error rate 35 %.
decision-drill-2min,2‑Minute Decision Drill,"{fearful_hesitator}",Kill analysis‑paralysis with a timed choice loop.,120‑sec constraint improved pick‑rate confidence 22 %.
time-pressure-reset,Time‑Pressure Reset,"{fearful_hesitator}",Re‑align expectations when the clock feels hostile.,Kent study: quick scenario planning dropped stress markers 18 %.
if-then-lab,IF‑THEN Discipline Lab,"{reckless_trader}",Turn broken rules into automatic habits.,Meta‑analysis of 94 studies: IF‑THEN plans doubled follow‑through.
accountability-loop,Accountability Loop,"{reckless_trader}",Leverage outside eyes to keep rules intact.,Daily peer reporting raised goal adherence 55 %.
five-rule-framework,Five‑Rule Framework,"{reckless_trader}",Slim your plan to the five rules you'll follow.,Keeping ≤ 5 core rules added 9 p.p. net returns (TradeFundrr).
consistency-streak-builder,Consistency‑Streak Builder,"{reckless_trader}",Gamify discipline into an unbroken chain.,Streak length > 7 days cut missed tasks 40 % in habit apps.
stress-discipline-playbook,Stress‑Test Playbook,"{reckless_trader,emotional_trader}",Keep cortisol spikes from breaking discipline.,2024 trading‑floor study: 6‑min breath + scan reduced mistake rate 23 %.`;

function parseCSV(csvText: string) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    // Handle CSV parsing with quoted strings containing commas
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim()); // Add the last value
    
    const row: any = {};
    headers.forEach((header, index) => {
      let value = values[index] || '';
      
      // Clean up quoted values
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      
      // Parse archetypes array
      if (header === 'archetypes') {
        // Remove curly braces and split by comma
        const cleanValue = value.replace(/[{}]/g, '');
        row[header] = cleanValue.split(',').map(s => s.trim()).filter(s => s);
      } else {
        row[header] = value;
      }
    });
    
    return row;
  });
}

export async function importPromptCatalog() {
  try {
    const parsedData = parseCSV(csvData);
    
    console.log('Parsed data:', parsedData);
    
    // Use upsert with onConflict to skip rows that conflict on handle
    const { data, error } = await supabase
      .from('prompt_catalog')
      .upsert(parsedData, { 
        onConflict: 'handle',
        ignoreDuplicates: true 
      });
    
    if (error) {
      console.error('Error importing prompt catalog:', error);
      throw error;
    }
    
    console.log('Successfully imported prompt catalog:', data);
    return { success: true, count: parsedData.length };
  } catch (error) {
    console.error('Import failed:', error);
    return { success: false, error };
  }
}