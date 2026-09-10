# M9 resilience and accessibility evidence

> Date: 2026-09-03
> Runtime: Node.js 22.15.1, Playwright 1.62.1
> Scope: local production preview against the existing isolated compatibility Supabase stack
> Milestone status: GREEN WITH ACCEPTED EXCEPTION. Automated evidence is GREEN; mandatory manual AT checks remain NOT RUN and are covered only for progression to M10 by the time-bounded waiver below.

## Automated gate results

| Gate                            | Result | Evidence                                                                                                                                                                      |
| ------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Strict build/typecheck          | PASS   | npm run build; 205 modules, initial JS 139.19 KiB gzip and CSS 7.85 KiB gzip; route chunks remain lazy.                                                                       |
| Lint                            | PASS   | npm run lint, zero warnings/errors.                                                                                                                                           |
| Format                          | PASS   | npm run format:check.                                                                                                                                                         |
| Unit/integration                | PASS   | Full Vitest run: 24 files / 71 tests. After the final catalog cache change, its focused integration suite passed 5/5.                                                         |
| Dependency scan                 | PASS   | npm audit --omit=dev: 0 vulnerabilities.                                                                                                                                      |
| Secret/privacy scan             | PASS   | No concrete service-role/sb_secret credential in dist; no runtime card field or receipt-to-localStorage/URL match.                                                            |
| Chromium M9 suite               | PASS   | Full run 13/13, then the added slow-response case 1/1 and final recovery recheck 1/1.                                                                                         |
| Firefox + WebKit critical flows | PASS   | Keyboard-only commerce journey and mobile dialog journey passed in each engine: 4/4 total. Engine-neutral resilience/viewports/visual checks are intentionally Chromium-only. |
| Axe                             | PASS   | Zero violations on the critical catalog/PDP/checkout/confirmation journey and after opening cart, filter and navigation dialogs in Chromium, Firefox and WebKit.              |
| Visual regression               | PASS   | Reviewed Chromium baselines: m9-home-mobile-chromium-win32.png and m9-catalog-desktop-chromium-win32.png; a repeat run matched both.                                          |

The successful critical journey also fails the test on unexpected console errors, uncaught page errors or HTTP responses with status 400+.

## State and recovery matrix

| Surface               |       Loading |              Empty/not found |                                                                          Error/recovery | M9 evidence                                                                              |
| --------------------- | ------------: | ---------------------------: | --------------------------------------------------------------------------------------: | ---------------------------------------------------------------------------------------- |
| Home/shell            |    N/A static |                          N/A |                                                                          route boundary | Visual baseline; responsive/landmark/keyboard checks.                                    |
| Catalog/discovery     |           Yes |                          Yes | initial error, retry, failed URL/background refresh with last successful cards retained | Vitest catalog states 5/5; browser slow response, 503 and recovery.                      |
| PDP/gallery/inventory |           Yes |   not found/unavailable size |                                          repository retry and accessible image fallback | Existing GREEN M4 states plus M9 broken-media browser check.                             |
| Guest/owner cart      |           Yes |                          Yes |                   reconciliation error, retry, unavailable line, rollback/live feedback | Existing GREEN M5/M6 tests plus M9 503/retry and broken-media browser check.             |
| Wishlist/auth/account |           Yes | guest/auth/stale saved items |                                                     retry; session failure fails closed | M9 route changes and exact SIGNED_OUT/failed-session integration tests.                  |
| Checkout              | guarded steps |             empty-cart guard |           linked error summary, inline relationships, conflict/decline/timeout recovery | Existing GREEN M7 failure-path evidence plus M9 field relationship and axe check.        |
| Guest confirmation    |           Yes |           missing capability |                          distinct network retry versus missing/wrong/expired capability | Existing GREEN M7/M8 evidence plus M9 route hardening.                                   |
| Order history/detail  |           Yes |              empty/not found |                                                      retry; anon/other-user fail closed | Existing GREEN M8 integration/RLS/browser evidence plus M9 session fail-closed handling. |

## Accessibility and responsive matrix

- Keyboard-only critical flow: catalog search → PDP → exact size → cart dialog → checkout → guest confirmation.
- Cart, mobile filter and mobile navigation dialogs have accessible names, focus containment, Escape close and trigger focus return.
- Global polite live region covers guest/owner cart and wishlist actions, rollback errors and guest-to-user merge failures.
- Checkout errors expose aria-invalid, field descriptions and an error-summary link to the invalid control.
- Viewports without horizontal overflow: 320×568, 360×800, 390×844, 768×1024, 1024×768 and 1440×900.
- 200% and 400%-equivalent reflow checks retain primary content and controls.
- Forced-colors mode preserves controls/meaning; reduced-motion mode reduces sampled transition durations to at most 0.01 ms.
- Mobile navigation now exposes working wishlist and auth/account destinations.

## Resilience details

- Supabase requests use an 8-second client timeout and compose the caller cancellation signal; automatic query retry is bounded to one retry.
- The catalog keeps the latest successful Query cache page during a failed new URL query and offers an explicit retry without losing URL state.
- Broken PDP and cart images retain a textual accessible fallback.
- Auth session expiry clears owner-scoped Query cache and the checkout draft while preserving public catalog cache; a failed session check hides private content until retry.
- Guest receipt errors distinguish a recoverable network failure from a missing, wrong or expired capability.
- Slow catalog response exposes its loading state before content recovery.

## Manual evidence not performed

| Required check                                                                                  | Status                           | Exact limitation                                                                                                                                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Desktop NVDA + Firefox critical journey, including the deferred catalog grid/discovery evidence | NOT RUN — WAIVED FOR PROGRESSION | NVDA and native Firefox are not installed. Bundled Playwright Firefox is not equivalent to NVDA interaction evidence. No installation was attempted.                                                                                                                                                                                                          |
| Mobile TalkBack + Chrome critical journey                                                       | NOT RUN — WAIVED FOR PROGRESSION | No Android device/runtime and no ADB/TalkBack environment are available. Installed Windows Chrome is not a TalkBack substitute. No installation was attempted.                                                                                                                                                                                                |
| Native browser-wide offline toggle                                                              | OPEN ENVIRONMENT LIMITATION      | Playwright offline mode left localhost Supabase requests pending instead of producing a deterministic application error. Per the one-workaround rule, coverage uses a browser 503/network-unavailable response plus request-timeout unit and rejected-network integration tests. A native offline pass remains to be recorded with the manual release matrix. |
| Touch-only/orientation pass                                                                     | BLOCKED WITH MOBILE AT           | Desktop Playwright viewport interaction does not substitute for a real TalkBack/touch device.                                                                                                                                                                                                                                                                 |

The in-app Browser could not initialize because its Windows sandbox failed while applying deny-read ACLs. All available browser evidence therefore ran against the real repo-local Vite preview with Playwright. This tooling limitation does not convert the missing manual AT evidence into a pass.

## Accepted exception

- owner: project owner;
- scope: only the remaining M9 manual AT checks — desktop NVDA + native Firefox and Android TalkBack + Chrome, including touch/orientation;
- reason: unavailable manual AT environment;
- expiry/revalidation trigger: before public release;
- compensating evidence: existing axe, Playwright, Firefox, WebKit, responsive, forced-colors and reduced-motion checks;
- recorded: 2026-09-03 by explicit project-owner authorization.

This exception permits progression to M10 but does not claim that either manual journey ran. It expires before public release; at that trigger, record the actual manual evidence or obtain a new explicit release exception.
