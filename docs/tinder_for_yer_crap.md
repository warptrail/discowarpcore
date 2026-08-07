# Disco Warp Core: **Joint Declutter**

A collaborative decision system for household belongings: two people review the same inventory independently, then the app converts agreement, disagreement, and indecision into an actionable cleanup queue.

The tone should be: **“shared mission control,” not “judge your possessions.”**

## 1. Product concept

### Core promise

> Make individual decisions quickly, surface only the items that need discussion, and turn agreement into real-world action.

The experience has three connected layers:

1. **Inventory context**  
   Every decision remains attached to the actual item, box, location, quantity, owner, tags, and notes.

2. **Independent review**  
   Discofish and Laserfox each make a private first-pass decision without being influenced by the other person.

3. **Convergence**  
   Agreements resolve automatically. Disagreements become a smaller, focused discussion queue.

This is not merely a swipe interface placed over inventory records. It is a **two-person resolution engine**.

---

# 2. Shared-decision model

Each item has two separate partner votes. The database stores a binary household decision plus an optional routing preference:

```text
decision:       pending | keep | release | unsure
exitPreference: discard | donate | sell | gift | null
```

The six visible buttons normalize into that model:

| Visible choice | Stored decision | Exit preference |
|---|---|---|
| Keep | `keep` | `null` |
| Toss | `release` | `discard` |
| Donate | `release` | `donate` |
| Sell | `release` | `sell` |
| Gift | `release` | `gift` |
| Unsure | `unsure` | `null` |

The app derives a shared result from the two normalized decisions:

| Partner state | Shared result |
|---|---|
| Any pending vote | `pending` |
| Keep + Keep | `kept` |
| Any two Release-family choices | `release_approved` |
| Keep + any Release-family choice | `conflict` |
| Either completed choice is Unsure | `review_later` |

Toss plus any specific destination is an agreement using that destination. Two
different named destinations—Donate, Sell, or Gift—approve Release with a
`needs_routing` staging route.

### Formal glossary

- **Release decision** — agreement that the household should stop keeping the item.
- **Exit preference** — a player’s suggested method: discard, donate, sell, or gift.
- **Staging route** — the destination derived from both exit preferences for the future physical workflow.
- **Declutter readiness** — inventory planning state: not considered, in the deck, kept, or ready to declutter.
- **Disposition** — what physically happened after the item actually left the household.

Release never means already gone. Voting does not change `item_status`, disposition, disposition date, or disposition notes.

### Release migration

The migration is explicit and idempotent; it is never part of server startup:

```text
npm run migrate:declutter-release-decisions
npm run migrate:declutter-release-decisions -- --apply
```

The first command is a report-only dry run. The second applies the reviewed conversion. Legacy session collections remain archival data.

---

# 3. Decision semantics

The five buttons have explicit presentation meaning:

- **Keep** — Remains active inventory.
- **Toss** — Release, with discard as the preferred staging route.
- **Donate** — Release, with donation as the preferred staging route.
- **Sell** — Release, with selling as the preferred staging route.
- **Unsure** — Deferred to discussion or a later review round.

At the democratic decision level, Toss, Donate, and Sell all mean:

> We agree that this item should no longer remain in our household.

The dedicated Actions interface will later handle boxes, staging, delivery, sale, and final disposition. It is deliberately separate from Review.

Avoid language such as “failure,” “bad choice,” “hoarding,” or “you kept too much.”

Use neutral system language:

- “Needs discussion”
- “Waiting for Laserfox”
- “Both chose Donate”
- “Review again later”
- “Decision changed”

---

# 4. Queue prioritization

The queue should not be a simple alphabetical list.

A practical priority score could combine:

```text
partner_waiting_priority
+ unresolved_age
+ declutter_priority
+ physical_proximity
+ campaign_scope
- recent_skip_penalty
```

Recommended order:

1. Items where the current user is the **only undecided partner**
2. Items in the active room, box, or declutter session
3. Older unresolved disagreements
4. Unsure items scheduled for review
5. Fully undecided items
6. Recently skipped items

This gives the system its convergence behavior: once Discofish decides, the item rises in Laserfox’s queue.

### Avoid exposing the other decision too early

During independent review, display:

> Discofish has reviewed this item.

Do **not** initially display:

> Discofish chose Toss.

Showing the choice before the second person decides creates anchoring pressure and weakens the independent-review model.

After both decide, reveal both results.

---

# 5. Main navigation model

The existing **Declutter** section can become a small subsystem:

```text
Declutter
├── Review
├── Discuss
├── Progress
└── Actions (future)
```

On mobile, this could be a segmented control below a compact header rather than another persistent navigation bar.

### Review
Fast individual decisions.

### Discuss
Disagreements and shared Unsure items.

### Actions (future)
Release-approved physical work:

- Toss pile
- Donation pile
- Sell queue
- Relocate / re-box
- Completed

### Progress
Household and partner-level status.

This future workflow closes the loop between digital choices and actual cleanup without confusing approval with physical removal.

---

# 6. Identity model

Discofish and Laserfox should feel like lightweight operational personas, not full social profiles.

Each identity includes:

- Creature avatar
- Display name
- Accent color
- Tiny status indicator
- Optional short call sign
- Local progress count

Example:

```text
🐟 DISCOFISH
42 reviewed · 8 waiting

🦊 LASERFOX
39 reviewed · 11 waiting
```

Use the identities in useful contexts:

- “Waiting for Discofish”
- “Laserfox has reviewed this”
- “Match: both chose Keep”
- “Split decision”
- “Discofish changed Donate → Keep”

Avoid competitive rankings by default. Progress can be visible without framing one partner as winning.

---

# 7. Review Queue screen

This is the central experience.

## Recommended vertical structure

```text
[Compact Declutter Header]
[Discofish avatar] Review Queue          18 / 74

[Shared-state strip]
Laserfox has reviewed this item
Your decision remains private until you choose

[Large item image]
or useful No Image state

Vintage Wool Coat
Warm charcoal overcoat with minor cuff wear

Box 117 · Coat Closet
Clothing · Qty 1
Owner: Shared

[tag chips]

[Keep] [Toss]
[Donate] [Sell] [Unsure]

[Undo]              [Skip]

[Progress rail]
```

## Item photo

The image should dominate the middle of the screen but not consume the whole viewport.

Recommended image region:

- Roughly 280–330 px tall when present
- Rounded console frame
- Pinch or tap to inspect
- Small image count if multiple photos exist

### No-image state

Do not show a dead gray rectangle.

Use a meaningful state:

```text
NO IMAGE
Box 117 · Coat Closet

[Add Photo]
```

The item name and physical location become visually prominent when no image exists.

---

# 8. Decision controls

Swipe gestures may accelerate use, but visible controls remain primary.

## Button hierarchy

Two large primary actions:

- Keep
- Toss

Three slightly smaller secondary actions:

- Donate
- Sell
- Unsure

This reflects the likely frequency and makes left/right swipe mapping intuitive.

### Suggested color roles

- Keep — teal
- Toss — coral
- Donate — violet
- Sell — amber
- Unsure — cyan or neutral blue

Do not rely on color alone. Every button needs:

- Text label
- Distinct icon
- Clear pressed state

Example icons:

- Keep: shield or inventory cube
- Toss: disposal bin
- Donate: gift or heart-box
- Sell: price tag
- Unsure: orbiting question mark

## Gesture model

- Swipe right: Keep
- Swipe left: Toss
- Swipe up: Open extended choices
- Tap: Always available
- Long press: Quick item details

A gesture action should show a reversible confirmation:

> KEEP selected  
> Undo · 4s

Never immediately hide the item without feedback.

---

# 9. Shared-state feedback

After the second partner decides, show a result transition.

## Agreement

```text
MATCH CONFIRMED
Both chose Donate

Added to Donation Actions
[Next Item]
```

Keep the celebration compact: subtle avatar animation, brief glow, no giant modal.

## Disagreement

```text
SPLIT DECISION

Discofish: Keep
Laserfox: Donate

This item has moved to Discuss.
[Add Note] [Next Item]
```

Do not force immediate resolution. Rapid review should continue.

## Unsure

```text
REVIEW LATER

Laserfox: Unsure
Discofish: Keep

Scheduled for the next discussion round.
```

---

# 10. Discussion Queue

The discussion screen should be different from the swipe interface. It is not another binary review queue.

Each card should show:

- Item image
- Both identities and decisions
- Relevant item context
- Notes from each person
- Time since disagreement
- A shared resolution control

Example:

```text
Vintage Wool Coat

🐟 Discofish: Keep
“Still useful for formal events.”

🦊 Laserfox: Donate
“Has not been worn in two years.”

Box 117 · Coat Closet

Resolve as:
[Keep] [Toss] [Donate] [Sell] [Gift] [Unsure]
```

### Useful actions

- Add argument / note
- Open full inventory details
- Put aside until a date
- Move to an in-person discussion list
- Mark resolved together

A shared resolution should record that it superseded the individual choices without deleting their history.

---

# 11. Action queues

A resolved decision is not always the end of the real-world task.

## Toss queue

```text
Pending disposal
Bagged
Removed
```

## Donate queue

```text
Needs staging
Staged in donation box
Delivered
```

## Sell queue

```text
Needs listing
Listed
Offer received
Sold
Expired
Converted to Donate
```

## Keep queue

Most Keep decisions need no further action. However, the app can flag:

- Needs a box
- Wrong location
- Quantity correction
- Duplicate item
- Needs better photo

This connects decluttering to Disco Warp Core’s broader inventory model.

---

# 12. Progress model

The dashboard should answer:

1. How much have we reviewed?
2. How much is resolved?
3. What physical work remains?

## Primary metrics

```text
Total items
Pending
Awaiting partner
Needs discussion
Resolved
```

## Decision totals

```text
Keep
Toss
Donate
Sell
Unsure
```

## Physical execution

```text
12 items to donate
4 items to sell
8 items ready to toss
3 completed today
```

### Suggested visualization

A segmented horizontal progress bar is more useful than a large pie chart on mobile:

```text
[KEEP][DONATE][SELL][TOSS][UNSURE][PENDING]
```

Tapping a segment filters the inventory.

Use a smaller agreement metric:

```text
Agreement rate: 68%
```

Treat it as descriptive, not as a relationship score.

---

# 13. Intake Workbench direction

The intake screen should remain fast and clearly separate required fields from enrichment.

## Initial viewport

```text
INTAKE WORKBENCH

Capture → Choose Box → Verify

Current Box
#117 · Coat Closet
[Change Box]

Item Name
[________________]

Category          Quantity
[Clothing ▼]      [- 1 +]

[CREATE ITEM]

Additional Details
▸ Description & Notes
▸ Tags
▸ Add Photo
```

### Empty box state

```text
NO BOX SELECTED

Choose where this item physically lives.
[Choose Box]

or

[Create as Unassigned]
```

Avoid showing both a selected-box card and a contradictory “No Box Selected” state at the same time.

### After creation

Offer a rapid next action:

```text
Vintage Wool Coat created in Box 117.

[Add Another] [Review Item] [Done]
```

“Add Another” should retain the current box and optionally retain category.

---

# 14. Retrieval direction

Retrieval should remain a serious inventory interface even though Declutter is playful.

## Header

```text
RETRIEVAL

[Items] [Boxes]

[ Search inventory...             ]

[Refine 3]
Electronics ×  Garage ×  Laserfox ×
```

Search should index:

- Item name
- Description
- Notes
- Tags
- Category
- Box ID and label
- Location
- Owner
- Keep priority

## Item card

```text
[image]  USB-C Hub
         Electronics · Qty 2
         Box 042 · Office Shelf
         Owner: Shared

         [View Details]
```

The whole card may be tappable, but retain one explicit details action.

Avoid tiny arrow icons as the only affordance.

---

# 15. Visual system

## Foundation

- Background: near-black charcoal
- Panels: slightly elevated blue-black
- Borders: low-opacity cyan or neutral steel
- Text: cool off-white
- Secondary text: desaturated blue-gray

## Accent roles

Use colors consistently rather than decorating every panel:

| Accent | Role |
|---|---|
| Cyan | Navigation, focus, search |
| Teal | Keep, success, active inventory |
| Violet | Donate, partner identity |
| Amber | Sell, deferred action |
| Coral | Toss, destructive state |

## Retro-futurism constraints

Use the space-console aesthetic primarily in:

- Section labels
- Status rails
- Tiny telemetry
- Borders
- Avatar frames
- Progress indicators

Use modern typography for item names, descriptions, and controls.

A good hierarchy:

- Pixel-inspired or monospace labels: `WAITING FOR LASERFOX`
- Highly readable sans-serif: `Vintage Wool Coat`

Subtle scanlines should be nearly imperceptible. Avoid applying glow to body text.

---

# 16. Component vocabulary

A reusable mobile system could include:

- `PartnerAvatar`
- `DecisionBadge`
- `SharedStateStrip`
- `ItemHeroCard`
- `PhysicalContextRow`
- `DecisionButtonGroup`
- `UndoToast`
- `QueueProgressRail`
- `DiscussionCard`
- `ActionQueueCard`
- `InventoryResultCard`
- `RefineSheet`
- `ExpandableFieldGroup`

This gives Intake, Retrieval, and Declutter a shared visual language without forcing them into identical layouts.

---

# 17. Recommended data model

```ts
type DeclutterDecision = "pending" | "keep" | "release" | "unsure";
type ExitPreference = "discard" | "donate" | "sell" | null;

type PartnerDecision = {
  userId: string;
  decision: DeclutterDecision;
  exitPreference: ExitPreference;
  note?: string;
  decidedAt: string;
  revisedAt?: string;
};

type SharedDeclutterState =
  | "pending"
  | "awaiting_partner"
  | "agreed"
  | "disputed"
  | "review_later"
  | "resolved";

type DeclutterRecord = {
  itemId: string;
  decisions: PartnerDecision[];
  sharedState: SharedDeclutterState;
  resolution?: "pending" | "kept" | "release_approved" | "review_later" | "conflict";
  stagingRoute?: "discard" | "donate" | "sell" | "needs_routing" | null;
  resolvedAt?: string;
  resolvedBy?: string[];
  deferredUntil?: string;
  discussionNotes?: {
    userId: string;
    body: string;
    createdAt: string;
  }[];
};
```

Do not store the shared result as the only record. Preserve each partner’s decision independently.

---

# 18. MVP scope

The first strong version needs only:

1. Discofish and Laserfox identity selection
2. Independent five-option decisions
3. Awaiting-partner prioritization
4. Automatic agreement resolution
5. Disagreement queue
6. Undo and Skip
7. Progress counts
8. Inventory metadata and image display
9. Action queues for Toss, Donate, and Sell

Defer these until later:

- Messaging
- Gamified streaks
- AI recommendations
- Automatic resale pricing
- Relationship analytics
- Public sharing
- Complex achievements

The MVP succeeds when the couple can rapidly process a large inventory and reduce hundreds of objects to a much smaller discussion set.

## Product definition

**Disco Warp Core Declutter is a two-person household decision protocol layered onto a real inventory system. It lets Discofish and Laserfox independently review belongings, automatically resolves agreement, prioritizes unfinished partner decisions, and isolates disagreements into a focused shared queue—without making the cleanup process feel punitive.**

---

# 19. Immediate decision and physical exit protocol

The Declutter Deck has two separate responsibilities:

1. **Decision** records each player’s private choice.
2. **Actions** immediately prepares unanimous Release decisions without pretending the items have already left.

These terms are deliberately not interchangeable:

- **Release decision** — agreement that the household should stop keeping the item.
- **Exit preference** — one player’s suggested method: discard, donate, sell, or gift.
- **Staging route** — the shared route derived from both exit preferences.
- **Declutter readiness** — the inventory planning summary.
- **Declutter exit state** — the current post-decision physical workflow state.
- **Disposition** — the final record of what physically happened after the item left.

Unanimous decisions are immediate. Keep resolves at once. Release-family
agreement enters Actions at once and applies the selected preparation route.
Repeating the same vote remains idempotent.

After agreement:

- Keep becomes a resolved result and does not move the item.
- Discard becomes `marked_for_destruction`, retains its physical placement until
  completion, and enters Trash Run.
- Donate and Sell move active inventory into configured staging boxes.
- Gift becomes `awaiting_gift`, sets `isIntendedGift: true`, and retains its
  current physical placement.
- Missing staging boxes produce `needs_staging`.
- Different named destinations produce `needs_routing`, resolved by Laserfox.

The Actions stage may reroute, restore Keep, or open a fresh voting round. Only
Trash, Donate, Sell, or Gift completion invokes the normal Mark Gone lifecycle.
Orphaned inventory is still owned; approved Release is still active inventory;
only Disposition means the item physically left.

`Box.isGiftBox` marks a physical container used for future gifts. Entering one
sets `Item.isIntendedGift` to true through the shared box-assignment service.
Leaving the box never clears the item flag; only an explicit item edit does.

The Review screen’s **Marked for Destruction** card is a derived system
collection, not a persisted Box. It is hidden when empty, contains confirmed
Action candidates across every Release route, and opens the Actions tab.
