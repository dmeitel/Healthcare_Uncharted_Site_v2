# Game night #1 · the hospital table
### A one-page runbook for the host. Written 2026-09-20 for the plan's month 2; the postmortem goes at the bottom afterwards.

## Before the night

- Push and deploy first. Guests join through the live site, not through the dev server.
- Three humans plus the host is the target; two works (fold Finance into the CEO), five works (split the CEO's job).
- Everyone brings a laptop or a tablet. Phones join fine but the board is dense.
- The host opens the game, scrolls the start menu to MULTIPLAYER · THE TABLE, types a name, taps Host a table, and sends the four letters to the group.
- Each guest opens the same page, types a name, taps Join a table, types the letters, and claims a seat: CEO · Operations, CFO · Finance, or CCO · Clinical. Observer is fine for a fifth person.
- The host sets the table (difficulty, ownership, hospital, run length) BEFORE Start. Guests see the settings change live. Hit Start when everyone is seated; the hospital appears on every screen.

## The quarterly ritual

1. **Briefing.** The host reads The Situation out loud: the objective, the event, the forecast. If the GM console (the panel under the table bar, host only) has a card worth playing, put it on the table now. There are three: the payer's rate deal, the state's money with strings, the community's promise. One at a time.
2. **Planning.** Each seat proposes within its verbs. Money is Finance's. People are Clinical's. Direction is the CEO's. Anything outside your seat gives you a hint naming whose call it is; make the case to them out loud.
3. **The offer, if one is up.** The CEO accepts or declines. A contract also needs Finance to countersign. If nobody decides before the quarter runs, it lapses, and the briefing says so next quarter.
4. **Commit.** The host taps RUN THE QUARTER. Nobody else can.
5. **Post-mortem.** Read the result out loud. The Deals block in the briefing says what each deal did.

## If something breaks

- **A guest's screen reloads.** They tap Rejoin table XXXX on the start menu. Their seat is still theirs.
- **The host's screen reloads.** The host taps Resume table XXXX on the start menu. Guests need to do nothing; their screens pick the table back up.
- **A move seems to do nothing.** After 2.5 seconds the guest gets "The host did not hear that. Try it again." Try it again.
- **Nobody can connect.** The backend may be asleep. Claude checks with `npm run backend:check`; a paused project needs one click in the dashboard.

## Write down afterwards (five lines, in the host's words)

1. Did the join work first try for everyone?
2. Did anyone reload, and did resume or rejoin work?
3. What did the seats argue about? Name one argument.
4. Did an offer card produce a conversation, or did the CEO just click?
5. Did the host having to stay online hurt at any point (a backgrounded tab, a dropped socket)? This is the trigger for moving the table to a server; it goes on DECISIONS if yes.

## Postmortem

(empty until the night)
