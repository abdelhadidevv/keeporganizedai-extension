# ADR-0001: Batch AI Processing for Bookmark Categorization

**Status**: Superseded by Step 2 hard-fail requirement (see Amending note below)  
**Date**: 2026-05-17  

## Context

The extension sends all unlocked bookmarks to the AI provider in a single API call for both category generation (Step 2) and bookmark assignment (Step 3). The current `MAX_BOOKMARKS_PER_REQUEST = 130` silently discards bookmarks beyond that limit, causing data loss for users with large bookmark collections. Processing hundreds of bookmarks in one request also degrades categorization accuracy as the model loses focus over long inputs, and can exceed token limits on smaller-context models (e.g., Gemini 2.5 Flash Lite, Claude Haiku).

Alternatives considered before this ADR: none — the single-request model was the initial implementation.

## Decision

Split unlocked bookmarks into configurable batches and process each batch separately through the AI provider.

### Batch Size

Default: **50**. Configurable range: **10–200**. The user adjusts this in Settings → AI Provider section.

### Generation (Step 2) — Sequential Batches

Category generation is **sequential**: each batch receives the accumulated categories from all previous batches as `{existingCategories}` in the system prompt. The AI is instructed to create *additional* non-overlapping categories rather than repeating existing ones. This avoids a separate merge/ deduplication pass.

- First batch: prompt says "Create 6-15 categories"
- Subsequent batches: prompt says "Create 1-5 ADDITIONAL categories that are clearly different from existing ones"

### Assignment (Step 3) — Parallel Batches

Bookmark assignment is **parallel** (up to a configurable concurrency limit, default **3**). All batches share the same pre-baked category list, so there are no cross-batch dependencies. This minimizes wall-clock time for large collections.

### Error Handling

Each batch is retried once on failure. If the retry also fails, the batch is skipped and its bookmarks are reported in the final summary under "Skipped (errors)". This favours partial progress over total failure.

### Architecture

Batching logic lives in the `ai.ts` service layer, not in the wizard components. The service methods accept an optional `onBatchProgress` callback so the UI can update progress without knowing about batching internals.

### Progress

- **Step 2**: Shows "Processing batch 2 of 7" with a `<Progress>` bar under the message
- **Step 3**: Progress bar reallocated — assign phase now covers 10–70% (was 20-30%), with sub-progress reflecting completed batches

## Consequences

### Positive

- No more silent data loss for users with >130 bookmarks
- Improved categorization accuracy per-batch (model focuses on fewer items)
- Graceful degradation — a single batch failure doesn't abort the entire operation
- Transparent progress for large operations
- Settings-based configuration keeps the wizard uncluttered

### Negative

- **More API calls** — 500 bookmarks at batch size 50 = 10 generate calls + 10 assign calls (20 total vs 2 today)
- **Higher latency potential** — sequential generation means batch 3 can't start until batch 2 finishes; parallel assignment mitigates this for Step 3
- **Rate limit exposure** — parallel assignment batches increase risk of 429 errors; the concurrency cap limits this
- **Generation quality depends on order** — the first batch seen by the AI shapes the category space; bookmarks in later batches that share themes with earlier ones are actively discouraged from creating parallel categories

### Amending note (2026-05-17) — Step 2 hard-fail on batch failure

The original ADR treated **generation** (Step 2) and **assignment** (Step 3) symmetrically: both retried once then skipped. This was changed because:

- **Step 3 (assignment)** can tolerate skipped bookmarks — `processAssignments` falls them back to "Uncategorized"
- **Step 2 (generation)** cannot — if a batch fails, its bookmarks are never represented in the category list, and those bookmarks are invisible to Step 3 entirely (they are never assigned)

Now, Step 2 throws an error immediately when a batch fails after retry, aborting all remaining batches. The user sees the error and retries from scratch. Step 3 retains the original skip-on-retry-failure behaviour.

**Files changed:**
- `src/services/ai.ts` — `generateCategories` throws `CATEGORY_GENERATION_FAILED` with batch context
- `src/components/StepWizard/Step2CategoryGeneration.tsx` — removed dead `console.warn` for skipped count
- `CONTEXT.md` — split Batch Retry into generation vs assignment sections

### Mitigations

- Sequential generation with accumulated `{existingCategories}` prevents category explosion
- Concurrency cap (default 3) avoids overwhelming most provider rate limits
- Retry-once handles transient failures without redundant retries of failed operations
- The "Uncategorized" fallback in `processAssignments` already handles skipped bookmarks cleanly
