# DNA Manual Online Module — Design Implementation Plan

**For:** Claude Code  
**Project:** DNA Discipleship Dashboard — Multiplication Manual Module  
**Goal:** Restyle the online manual to use all DNA brand colors with distinct visual block types, eliminating the flat single-color feel without rebuilding the layout.

---

## Brand Color Reference

```css
--navy:      #1C2B3A;   /* Primary base — page background, lesson cards */
--gold:      #D2A854;   /* Accents, labels, borders, active states */
--green:     #2E7D5E;   /* Discussion/Warm Up blocks, completion states */
--white:     #FFFFFF;   /* Body text on dark, card backgrounds where needed */
--cream:     #F5F0E8;   /* Scripture blocks, reflection panels */
--cream2:    #EDE8DE;   /* Secondary soft panels, formula/callout bars */
--gray:      #6B7280;   /* Meta text, read-time, secondary labels */
--lgray:     #E0DBD1;   /* Dividers, subtle borders */
--black:     #0D0D0D;   /* Body text on light backgrounds */
```

---

## The Problem Being Solved

The current module uses a single dark navy background throughout with gold as the only accent. Scripture blocks, Warm Up prompts, key quote callouts, and body teaching all look nearly identical. There is no visual rhythm — everything reads at the same weight.

The fix is not a redesign. It is **purposeful color assignment** so each content type has a distinct visual voice. The navy base stays dominant. Other colors are punctuation.

---

## Block Type System

Five distinct block types. Every piece of content in the manual maps to one.

---

### Block 1: Teaching Content (Default)
**Purpose:** Core instructional text — the majority of the content.  
**Treatment:** Keep existing dark navy base with white/light body text. This is the default reading state — no changes needed here. Other blocks create contrast against this.

---

### Block 2: Scripture Blocks
**Purpose:** Bible verses and references — set apart from teaching content.  
**Current state:** Dark navy card, gold left border, italic text. Works but blends into the page.  
**New treatment:** Cream background (`#F5F0E8`) with navy text. Keep the gold left border. This is the most important visual change — cream on a dark page creates immediate stop-and-read contrast.

```css
.scripture-block {
  background-color: #F5F0E8;
  border-left: 3px solid #D2A854;
  border-radius: 6px;
  padding: 16px 20px;
  margin: 20px 0;
}

.scripture-block .verse-text {
  color: #0D0D0D;
  font-style: italic;
  font-size: 0.95rem;
  line-height: 1.65;
  margin-bottom: 8px;
}

.scripture-block .verse-ref {
  color: #D2A854;
  font-weight: 700;
  font-size: 0.8rem;
  letter-spacing: 0.03em;
}
```

**Note:** For sessions with 3+ consecutive scripture blocks (like Session 1, Lesson 2), add `margin-top: 8px` between consecutive blocks to keep them visually grouped but slightly separated.

---

### Block 3: Warm Up / Discussion Blocks
**Purpose:** Engagement prompts — signals a shift from receiving to participating.  
**Current state:** Same dark navy card as scripture. No visual distinction.  
**New treatment:** DNA green background (`#2E7D5E`) with white text and a gold label.

```css
.warmup-block,
.discussion-block {
  background-color: #2E7D5E;
  border-radius: 8px;
  padding: 20px 24px;
  margin: 24px 0;
}

.warmup-block .block-label,
.discussion-block .block-label {
  color: #D2A854;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 10px;
  display: block;
}

.warmup-block p,
.discussion-block p {
  color: #FFFFFF;
  font-size: 1rem;
  line-height: 1.6;
  margin: 0 0 8px 0;
}

.warmup-block p:last-child,
.discussion-block p:last-child {
  margin-bottom: 0;
}
```

The gold "WARM UP" or "DISCUSSION" label above the prompt text is required — it signals the mode shift explicitly.

---

### Block 4: Key Quote / Callout Blocks
**Purpose:** Core definition statements and thesis-level takeaways — used sparingly (once per lesson maximum).  
**Current state:** Dark navy with gold text. Close to right, but lacks visual weight and bleeds into body text.  
**New treatment:** Keep navy background. Add gold rule top AND bottom (not just left border). This frames the quote and gives it ceremonial weight.

```css
.callout-block {
  background-color: #1C2B3A;
  border-top: 2px solid #D2A854;
  border-bottom: 2px solid #D2A854;
  border-radius: 4px;
  padding: 18px 20px;
  margin: 24px 0;
}

.callout-block p {
  color: #D2A854;
  font-weight: 600;
  font-size: 1.05rem;
  line-height: 1.55;
  margin: 0;
}
```

**Usage rule:** This block is for single thesis statements only — "Discipleship is a deliberate apprenticeship which results in fully formed, living copies of the master." Not for multi-sentence content. If more than 2 sentences, use a cream2 reflection block instead.

---

### Block 5: Reflection / Next Step Blocks
**Purpose:** Personal introspection prompts, Flow Assessment callouts, next step assignments between sessions.  
**Current state:** Does not exist as a distinct type — currently flows as body text.  
**New treatment:** Cream2 background (`#EDE8DE`) with navy text and a green label. Quieter than cream, warmer than the page. Feels like a journal page.

```css
.reflection-block {
  background-color: #EDE8DE;
  border-radius: 8px;
  padding: 20px 24px;
  margin: 24px 0;
}

.reflection-block .block-label {
  color: #2E7D5E;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 10px;
  display: block;
}

.reflection-block p {
  color: #0D0D0D;
  font-size: 0.95rem;
  line-height: 1.65;
  margin: 0 0 8px 0;
}

.reflection-block p:last-child {
  margin-bottom: 0;
}
```

**Where to apply this:** The "Take the Flow Assessment before Session Two" section, the "Before you go any further" prompts, the "Cost of Multiplication" personal reflection questions, and the next step callout at the end of each session.

---

## Progress Bar Update

**Current state:** Gray fill bar.  
**New treatment:** Gold fill while in progress, transitions to green at 100%.

```css
.progress-bar-fill {
  background-color: #D2A854;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.progress-bar-fill.complete {
  background-color: #2E7D5E;
}
```

---

## Lesson Number Badge States

**Current state:** Completed lessons go green with checkmark (keep this — it works). Incomplete badges are a dark square.  
**Update incomplete/active state only:**

```css
/* Incomplete */
.lesson-badge {
  background-color: #1C2B3A;
  color: #D2A854;
  border: 1px solid #D2A854;
  border-radius: 6px;
}

/* Complete — keep existing green/checkmark treatment */
.lesson-badge.complete {
  background-color: #2E7D5E;
  color: #FFFFFF;
  border: none;
}
```

---

## Visual Rhythm Rule

**Do not alternate block types every paragraph.** The navy teaching content is the base — other block types are punctuation within it. A session should feel like:

```
Teaching → Scripture → Teaching → Teaching → Discussion →
Teaching → Scripture → Scripture → Callout → Teaching →
Reflection → Next Step
```

Never: `Scripture → Discussion → Reflection → Scripture → Callout` back to back without teaching content in between. The navy base needs to breathe between colored blocks or the page becomes visually chaotic.

---

## Session-Specific Notes

### Session 1 (What is Discipleship?)
- The Teleios definition block → Callout block (gold top/bottom rule)
- The exponential math sequence (2→4→8...65536) → Style as a centered gold-text display block on navy, not a body list
- All scripture verses → Cream scripture blocks
- Warm Up at top → Green block

### Session 2 (Mission to Multiply)
- "1 Leader + 1 Co-leader + 2 Disciples = DNA Group" formula → Callout block
- Hebrews 10:24-25 and 2 Timothy 2:2 → Cream scripture blocks
- Discussion prompts → Green blocks

### Session 3 (The 7 C's)
- Mark 2 passage (long) → Cream scripture block — the length actually works well on cream
- The fill-in 7 C's list → Consider cream2 reflection block with numbered input areas
- Discussion questions → Green blocks

### Session 4 (Discipleship Toolkit)
- Each tool description (3D Journal, 4D Prayer, Creed Cards, etc.) → Consider a card grid layout with navy background + gold label per tool, rather than continuous body text. This is a feature showcase, not prose.

### Session 5 (Cost of Multiplication)
- Time / Emotional Energy / Reputation / Control cost breakdown → Cream2 reflection blocks (4 separate panels) or a 2-column grid. These should feel weighty and personal.
- "The Reward" section → Green block — tone shift from cost to payoff

### Session 6 (Commission)
- "You Are Called. You Are Equipped. Now Go." → Full-width callout block
- Exponential math countdown → Same gold display treatment as Session 1
- Closing prayer → Cream scripture block treatment (same visual language as scripture — it's spoken to God)
- Final CTA to Launch Guide → Green block

---

## What NOT to Change
- Overall page background color
- Navigation and header chrome
- Typography scale and font choices
- Spacing and layout grid
- Session card treatment on the dashboard overview
- The green completion checkmark on finished lessons

---

## Implementation Priority Order

1. **Scripture blocks → cream** — biggest visual impact, most frequent element
2. **Warm Up / Discussion blocks → green** — immediately differentiates engagement vs. teaching
3. **Progress bar → gold fill** — small but signals the brand properly
4. **Callout blocks → gold top/bottom rule** — refines existing element
5. **Reflection blocks → cream2** — new block type, add to Flow Assessment and next step sections
6. **Lesson badge states → gold border on incomplete** — polish pass
7. **Session-specific content upgrades** (exponential math display, toolkit card grid) — do last after base system is confirmed
