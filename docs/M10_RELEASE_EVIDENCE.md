# M10 performance, CI and release evidence

## 2026-09-11 generated-media addendum

- Legacy shoe raster assets удалены из current public tree и заменены десятью
  оригинальными fictional ImageGen-моделями в responsive WebP 600/1200 px.
- Исправлены canonical home recommendations: Signal 01 и Rain 2 больше не ведут на
  несуществующие product slugs; добавлен browser regression test.
- PASS: format, strict TypeScript, ESLint, 30 test files / 84 tests, Vite production
  build, bundle budget (JS 119.15 KiB; CSS 6.48 KiB) и npm audit (0 vulnerabilities).
- Installed Chrome production preview: smoke 15/15; resilience/a11y 13/13 применимых,
  один reviewed visual-snapshot test оставлен только для bundled Chromium.
- Новые reviewed screenshots сохранены в `docs/screenshots/`.
- Supabase dashboard подтверждает production Site URL
  `https://solecraft-two.vercel.app` и единственный exact redirect
  `https://solecraft-two.vercel.app/auth/callback`; custom SMTP не настроен.
- Текущий Lighthouse rerun дважды заблокирован Windows lock временного Chrome-профиля
  (`EBUSY Account Web Data`) до появления отчёта; процессы/порты других проектов не
  изменялись. Последнее валидное измерение ниже относится к предыдущему artifact.

> Historical evidence below is dated 2026-09-03. Current ports, rebrand, checks and
> remaining release gates: [RELEASE_PREPARATION.md](RELEASE_PREPARATION.md), 2026-09-08.

> Status: **BLOCKED AT EXTERNAL/PUBLIC-RELEASE GATE**
> Date: 2026-09-03
> Production/remote mutations: **NOT RUN**

## Completed local evidence

| Gate                          | Result                                                                             |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| Production build              | PASS, Vite 8, route-level lazy chunks preserved                                    |
| Initial bundle                | PASS — JS 114.21 KiB gzip / 200; CSS 6.34 KiB gzip / 40                            |
| Controlled mobile Lighthouse  | PASS — median of 3: Performance 99, Accessibility 100, Best Practices 100, SEO 100 |
| Core Web Vitals lab targets   | PASS — median LCP 1.654 s, CLS 0.012; INP/CLS/LCP field hooks installed            |
| Focused unit/Auth checks      | PASS — Auth/Supabase 4/4; observability 2/2                                        |
| Changed-surface browser suite | PASS — 48 passed / 3 explicit skips, Chromium + Firefox + WebKit                   |
| Dependency audit              | PASS — `npm audit`, 0 vulnerabilities                                              |
| Social asset                  | PASS — 1200×630 PNG visually checked; source SVG retained                          |

Raw Lighthouse JSON and bundle summary are written to ignored
`test-results/m10/` by the repeatable scripts; CI uploads the same reports as artifacts.

## Performance decisions

- `/catalog` is route-lazy and home owns a small deterministic featured product rather
  than importing the full catalog fixture.
- Supabase SDK/repositories moved to a deferred singleton runtime. Auth still resolves
  the same persisted session and repository contracts remain async/typed.
- Entry CSS is inlined during production build; route CSS remains lazy. A meaningful
  no-JS shell is rendered immediately and becomes inert/aria-hidden when the React
  application starts, while branded self-hosted typography keeps `font-display: swap`.
- Trace inspection, not score-only tuning, drove the changes: initial JS fell from
  175.49 to 114.21 KiB gzip while Supabase moved out of the critical request chain.

Latest three Lighthouse runs:

| Run | Performance | Accessibility |     LCP |   CLS |
| --: | ----------: | ------------: | ------: | ----: |
|   1 |          99 |           100 | 1.657 s | 0.012 |
|   2 |          99 |           100 | 1.654 s | 0.012 |
|   3 |          99 |           100 | 1.655 s | 0.016 |

## CI/security coverage added

- quality job: clean install, lint, format, typecheck, unit tests, build, bundle budget,
  dependency audit;
- browser/performance job: isolated local Supabase reset/pgTAP, Chromium E2E and
  Lighthouse artifact;
- weekly/manual scheduled suite: Chromium, Firefox and WebKit;
- workflow permissions are read-only and test env contains only the loopback sentinel;
- observability emits sanitized route families/error kinds/request IDs and Web Vitals to
  a local custom event; no external analytics or PII transport is enabled.

## Explicit skips/limitations in local automation

- two-user magic-link merge runs once in Chromium; the shared shell/Auth form remains
  covered in Firefox/WebKit;
- headless Playwright WebKit does not expose system Full Keyboard Access for links, so
  the single Tab-to-skip-link assertion is skipped there. It passes Chromium/Firefox;
  WebKit still passes navigation, dialog focus return, axe and responsive checks;
- the in-app Browser kernel was unavailable because of a Windows sandbox ACL startup
  error. Repo-local Playwright against the real production preview supplied browser
  evidence; this tooling issue does not substitute manual AT evidence.

## Open hard gates

1. **M9 waiver revalidation:** manual NVDA + native Firefox and TalkBack + Chrome were
   NOT RUN. The accepted exception expires before public release.
2. **Live deploy:** no provider/domain/production Supabase project or permission to
   mutate remote infrastructure was supplied. Therefore real URL deep-link, cache,
   security-header, auth redirect and deployed privacy smoke are NOT RUN.
3. **Clean hosted CI:** workflow is defined locally, but a hosted run from a clean
   checkout cannot exist without commit/push, which were explicitly forbidden.
4. **Media rights (closed locally 2026-09-11):** legacy raster assets were removed from
   the current public tree and replaced by a documented original fictional ImageGen set.
   Hosted visual/performance revalidation remains pending until the updated artifact is
   deployed.

M10 cannot be marked GREEN and the Release exit gate cannot be crossed until these
items are resolved. No waiver beyond the explicitly accepted M9 manual-AT scope has
been inferred.
