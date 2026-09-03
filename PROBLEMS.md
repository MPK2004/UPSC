# Problems Faced & How They Were Solved

A project is best judged by what went wrong and how it got fixed, not just
the finished feature list. This is that record — each problem below is real,
found during actual development/debugging of this repo (see `HANDOFF.md`
for the full chronological log and current architecture; this file is the
condensed "challenges" version).

---

## 1. The pipeline looked like it worked, but silently produced nothing

**Problem:** Supabase showed the book as `ready` — success, in other words —
but every single chapter under it was `failed`, with no cards, no PYQs, no
importance rating. The "success" state was a lie.

**Why it was hard:** there were two independent bugs stacked on top of each
other, and the surface symptom (a book marked `ready`) actively hid the real
one (every chapter had failed).

**Approach:** rather than trust the existing model list in the code, it was
verified live against OpenRouter's actual `/models` API. Half the configured
model slugs simply didn't exist — they were plausible-looking names a prior
session had fabricated without checking. Separately, tracing the
finalization logic showed the book-ready check only asked "is anything still
pending?", never "did anything actually succeed?"

**Solution:** replaced the model list with slugs confirmed live against the
provider, and added an explicit check — a book with zero successful chapters
is now marked `failed` with a real error message, not silently promoted to
`ready`.

**Lesson:** verify against the live system, never trust that an
already-committed config value is correct just because it's already there.

---

## 2. The frontend was a beautifully working demo of nothing real

**Problem:** the backend pipeline worked, Supabase had real data — and the
deployed app showed none of it. It ran entirely on a hardcoded mock dataset
left over from before the pipeline existed.

**Why it was hard:** the app *looked* functional. Nothing crashed, nothing
errored — it just wasn't connected to anything real, which is a much quieter
failure mode than a crash.

**Approach:** traced every data path from the UI backward and found zero
Supabase reads outside of localStorage bookmarks. Confirmed the mock data
file and its only consumer (a chapter-selector component) were both fully
replaceable, then rebuilt the navigation as a real drill-down — Library →
Book → Chapter → Cards/Quiz — backed entirely by live queries.

**Solution:** full data-layer rewrite (`utils/bookData.ts`), five new/rebuilt
screen components, and deletion of the mock data + the component that only
existed to filter it. Verified via a real headless-browser pass, not just a
build success, before calling it done.

**Lesson:** "it renders without errors" is not the same as "it's connected
to anything real" — check the actual data path, not just the UI.

---

## 3. Research had no receipts, and every chapter was rated "High importance"

**Problem:** the AI-generated content had no way to prove where it came from,
and it rated almost everything as high-priority — which isn't how a real
textbook works.

**Approach:** two rounds of direct user feedback shaped the fix. First:
*"don't cite random websites — use reputed sources."* Second: *"not every
chapter can be High — we can't treat everything equally."* Both were treated
as real design constraints, not vague notes.

**Solution:**
- A two-tier source allowlist (official government sources chosen by
  subject, plus a curated set of UPSC-analysis sites) — and critically, the
  allowlist is enforced twice: once in the search query, and again by
  checking the actual returned URL's domain in code, because a search
  engine's `site:` filter isn't guaranteed to be honored by its backend.
- The LLM can only cite research **by number** (`[1]`, `[2]`...), never by
  writing its own URL. The pipeline resolves numbers back to the real
  `{title, url}` it already fetched, and silently drops any number outside
  the known range — so a fabricated citation is structurally impossible to
  store, not just discouraged by a prompt instruction.
- A book-level recalibration pass: since each chapter is generated in
  isolation with no visibility into its siblings, it can't produce a
  realistic High/Medium/Low spread on its own. A separate step re-judges
  every chapter's importance *relative to the rest of the same book* once
  they're all done.

**Lesson:** "don't trust the model, verify structurally" applies to
citations exactly as much as to facts — never store what an LLM merely
*claims*, only what can be independently confirmed.

---

## 4. The free LLM tier ran out mid-book, and the "fix" almost repeated bug #1

**Problem:** a run processed 3 chapters fine, then every remaining chapter
failed with a generic error.

**Approach:** pulled the actual failure logs instead of guessing, and found
real `429` (rate-limited) responses across the board. Checked OpenRouter's
own documentation and confirmed: free-tier accounts are hard-capped at 50
requests/day. Not a bug — a real, documented platform limit.

**Solution:** added a second, independent-quota LLM provider (NVIDIA NIM)
tried first, falling back to OpenRouter only once NVIDIA is exhausted or
unset. The first model asked for (`deepseek-v4-flash`) 404'd repeatedly —
even though it appeared in the provider's public model catalog. That
catalog turned out to be global, not scoped to what a given account
actually has access to. The eventual fix was to find a model confirmed
working *for this specific account* (verified live via `curl` before being
hardcoded) rather than trusting the catalog listing — the same lesson as
bug #1, applied to a second provider.

**Lesson:** a provider's public catalog tells you what *exists*, not what
*your account* can actually call. Verify per-account, every time.

---

## 5. Citations were being silently thrown away by a type mismatch

**Problem:** even after the citation system above shipped, most chapters
still came back with zero sources — despite completing successfully with
real cards and PYQs.

**Approach:** added structured logging (how many research findings were
gathered vs. how many actually got cited) instead of continuing to guess.
The logs showed research succeeding but citations still failing to attach.

**Solution:** the citation-matching code compared numbers by exact type.
Weaker free-tier models sometimes emit `"sources": ["1", "2"]` (strings)
instead of `[1, 2]` (integers) — a subtle, model-dependent quirk that
silently failed every lookup. Fixed by coercing to `int` before matching.

**Lesson:** when working with LLM-generated structured output, never assume
the type is what the schema says it should be — coerce and validate
defensively, especially across different models with different JSON habits.

---

## 6. A search engine was quietly lying to the CI pipeline

**Problem:** after fixing #5, chapters *still* mostly came back with no
official/analysis-tier sources — logged as "no results found" for queries
that plainly should have had results.

**Approach:** the exact query strings that failed in the GitHub Actions log
were re-run, verbatim, from a different machine — and returned real results
instantly. Same query, same search engine, different outcome. That isolated
the variable: not the query, not the code — the *origin* of the request.

**Root cause:** the free search backend silently rate-limits/blocks shared
CI datacenter IP ranges (which GitHub-hosted runners are), returning an
empty result set instead of an error. Indistinguishable from "genuinely
nothing found" unless you know to suspect it.

**Solution:** this can't be "fixed" in the traditional sense — there's no
error to catch. Mitigated by cutting total request volume per chapter and
spacing requests out generously, trading run speed for a lower chance of
being throttled, since the pipeline runs unattended on a schedule with no
real urgency.

**Lesson:** when local behavior and CI behavior genuinely diverge on
identical code, suspect the environment (network, IP reputation, sandboxing)
before suspecting the logic.

---

## 7. A config value was raised, confirmed via SQL, and still didn't work

**Problem:** raised a file upload limit from 50MB to 100MB, the SQL ran
successfully, and a 58MB file was still rejected as "exceeded max upload
limit."

**Approach:** rather than assume the SQL silently failed, checked whether
the platform had a *second*, independent constraint. It did: a project-wide
global Storage limit, separate from and overriding any individual bucket's
own setting — and on the platform's free tier, that global ceiling cannot
be raised past 50MB at all, no matter what the bucket says.

**Solution:** reverted the just-raised limit back down to 50MB — the only
number that was ever actually going to be honored. The bucket-level setting
was left at the higher value since it's harmless, but the real, enforced
number was documented clearly so nobody re-discovers this the hard way.

**Lesson:** a successful config change is not the same as an effective one.
When a setting "doesn't work" despite being applied correctly, look for a
higher-level constraint before assuming the change itself was wrong. This
is the one explicit **rollback** in this project's history.

---

## 8. A working PDF parser completely failed on a different real-world book

**Problem:** a newly uploaded book failed immediately: "Could not extract
any chapters from this PDF." The extraction logic had already been proven
to work — on a different file.

**Approach:** installed the PDF library locally and inspected the *actual*
failing file directly — page by page, not from the error message alone.
(One early misstep here: a similarly-named file already in the repo was
diagnosed first, before the user pointed out it wasn't the right one — the
correction mattered, and diagnosing the actual file from then on was the
right call.) This surfaced two distinct, real problems:

- **A second valid Contents-page layout existed.** The book's real table of
  contents spread each entry across several lines (number, then title, then
  page number, each on its own line) instead of one single dot-leader line
  — a format the existing parser had simply never been built to recognize.
  Not corrupted, not garbled — just a different, legitimate layout.
- **A much bigger, silent bug:** a book's table of contents lists its own
  *printed* page numbers, not the PDF file's actual page positions. The
  code had been using them interchangeably. For this book, chapter 1's real
  content started 10 PDF pages after where the printed "page 1" would
  naively suggest — meaning, if left uncorrected, *every chapter of every
  book with meaningful front matter* would have had its text pulled from
  the wrong pages, silently, the whole time.

**Solution:** added a second Contents-page parsing strategy for the
alternate layout, and a page-offset detector that cross-references a book's
own running page-number headers to compute the correct printed-to-PDF-page
conversion automatically — falling back safely rather than hard-failing if
no reliable signal is found. Both fixes were validated against the actual
real file end-to-end (chapter boundaries checked against real page content)
before being shipped, not just unit-tested in the abstract.

**Lesson:** a fix validated against one real file is not validated against
"PDFs" in general. And a silent, structural bug (wrong page numbers, no
error thrown) is far more dangerous than a loud one — it had likely been
quietly corrupting the *already-processed* book's content this whole time,
and nobody would have known without this investigation.

---

## What these problems have in common

Almost none of them were caused by writing wrong code in isolation. They
were caused by **trusting an assumption without verifying it against the
real system**: a model that supposedly existed, a config that supposedly
took effect, a search result that supposedly meant "nothing found," a page
number that supposedly matched the PDF. The fix in every case was the same
discipline — go check the actual system (a live API call, the real file, the
real logs) instead of reasoning from what the code *should* do.
