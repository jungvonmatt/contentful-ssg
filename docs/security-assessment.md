# Security assessment

Assessment date: 2026-10-23. Repository: `jungvonmatt/contentful-ssg`, based on commit `72a840af083dd2739517cd30c4a7b8277c462d81` and the maintenance changes in this working tree.

Dependency updates remove 107 of the 108 advisory records reported against the original lockfile. One high-severity Braces advisory remains because its advertised patch is not published. Source review also identifies unsafe HTML output, unrestricted asset fetching, conditional path traversal, and an unauthenticated webhook helper. These source findings remain open, with exposure conditions below.

## Scope and trust boundaries

This assessment covers the eight workspace packages, dependency graph, CLI entry points, configuration and credential handling, asset processing, generated files, cache, webhook helper, and GitHub Actions workflow. The primary product is a local Node.js CLI and library. The current CLI does not start the webhook server.

| Boundary                                                         | Assets and abuse cases                                                                                                                       |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Project configuration and plugins → Node.js process              | Plugins and JavaScript/TypeScript configuration execute with the user's permissions. Treat project authors as trusted code authors.          |
| Contentful responses and CMS authors → generated output          | Malicious content can become executable HTML or influence asset paths. Publishing permission must not implicitly grant JavaScript execution. |
| Asset URLs → build network and filesystem                        | Crafted URLs can target internal services, consume memory, or redirect writes. CMS URLs normally use Contentful's CDN.                       |
| Environment and local files → Contentful clients                 | Management and preview tokens authorize sensitive API operations. Generated credentials and caches need local access controls.               |
| HTTP callers → webhook callback                                  | If enabled by an integrator, unauthenticated calls can trigger expensive rebuilds and privileged hooks.                                      |
| npm packages and CI actions → developer and release environments | Known vulnerabilities, lifecycle scripts, and mutable action tags affect build integrity.                                                    |

STRIDE review focused on spoofed webhooks, tampered content and paths, missing rejection logs, credential/content disclosure, resource exhaustion, and execution through generated output.

## Dependency findings and maintenance changes

The pnpm advisory service reported these results. Counts are advisory records, not proven exploitable application paths.

| Severity | Original lockfile | Updated lockfile | Updated production graph |
| -------- | ----------------: | ---------------: | -----------------------: |
| Critical |                 6 |                0 |                        0 |
| High     |                46 |                1 |                        1 |
| Moderate |                50 |                0 |                        0 |
| Low      |                 6 |                0 |                        0 |
| Total    |               108 |                1 |                        1 |

Updates stay within existing dependency ranges, except the lint engine alignment required by Oxlint 1.89.0. Key changes include Contentful 11.12.10, Contentful Management 12.19.2, Express 5.3.0, SVGO 4.1.0, Vitest 4.1.12, and Oxlint 1.89.0 with oxlint-tsgolint 7.0.2004.

The changes also:

- Remove unused Faker 8 from `contentful-typings`, eliminating its code-execution advisory without changing that package's behavior.
- Select patched Tinypool through a bounded override. Oxfmt 0.47.0 otherwise pins vulnerable Tinypool 2.1.0.
- Declare Vite as a direct test dependency and override its transitive range. This replaces pnpm's stale auto-installed peer with Vite 8.3.5.
- Adapt the space pagination callback's type to the Contentful SDK's new offset/cursor overloads. Runtime pagination remains unchanged.
- Make package lint scripts check files without `--fix`. The updated lint engine otherwise removes a public Grow plugin export assertion during CI. Explicit fixes remain available through lint-staged.
- Ignore environment variants and private-key files, while retaining `.env.example` templates.

Major migrations such as TypeScript 7, Vitest 5, and the FFmpeg API migration are deferred to separate compatibility work. Existing dependency build approvals remain unchanged.

### DEP-01 — High advisory, constrained reachability: Braces stack exhaustion

`braces@3.0.3` remains through Micromatch and Globby in runtime packages and release tooling. [GHSA-vfj7-8cjw-p6xm / CVE-2026-93687](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) describes denial of service from deeply nested patterns.

The advisory names 3.0.4 as patched, but `pnpm view braces versions dist-tags --json` lists 3.0.3 as the newest published version. Installation of 3.0.4 fails with `ERR_PNPM_NO_MATCHING_VERSION`. No audit exclusions suppress this finding.

Reviewed application calls use patterns derived from project configuration, rather than unauthenticated HTTP parameters. Exploitation requires attacker influence over a glob pattern. Keep untrusted patterns out of configuration and do not run builds against untrusted projects with privileged credentials. Recheck the published patch by **2026-11-06**. Use process isolation and a build timeout where untrusted projects must be processed.

## Source findings

The following findings describe remaining behavior after dependency updates. Severity depends on the stated consumer or configuration prerequisites.

### SEC-01 — High when untrusted rich text is rendered: executable link schemes

Location: `packages/contentful-ssg/src/mapper/map-rich-text-field.ts:94`.

The default renderer returns HTML without a URL-scheme policy. A local probe passed a rich-text hyperlink containing `javascript:alert(1)` and received:

```html
<p><a href="javascript:alert(1)">click</a></p>
```

A site that inserts this generated HTML can execute the link on activation, subject to browser and Content Security Policy controls. The HTML attribute is escaped, but its scheme remains executable. Exploitation requires control of the rich-text document and a consumer that renders the HTML.

Remediation: allowlist hyperlink schemes, including explicitly supported relative URLs, before rendering. Sanitize the final HTML at the output boundary. Preserve equivalent checks for custom renderers. Add malicious-scheme regression tests. Mapping: OWASP A05:2025 and API10:2023.

### SEC-02 — High when uploaded SVGs are inlined: active SVG content survives optimization

Location: `packages/cssg-plugin-assets/src/helper/svg.ts:37` and `packages/cssg-plugin-assets/src/index.ts:34`.

The plugin returns optimized SVG in `ProcessedSvg.source`. With the configured default plugins, a probe retained both an `onload` handler and a `<script>` element. SVGO optimization is not sanitization.

An author who can upload an SVG can inject script into a downstream site that inserts `source` as trusted inline markup. Rendering the file through an ordinary image element has a different exposure. No downstream site or browser execution was tested.

Remediation: sanitize SVG with an SVG-aware allowlist before exposing inline source. Remove event handlers, scripts, executable links, and unsupported active content. Alternatively, expose only an image URL and document that inline source requires sanitization. Mapping: A05:2025, A08:2025, and API10:2023.

### SEC-03 — Medium, conditional on URL control: unrestricted asset fetches

Location: `packages/cssg-plugin-assets/src/helper/asset.ts:63`.

`got(url).buffer()` accepts an arbitrary HTTP or HTTPS destination, follows redirects, and has no explicit request timeout or response-size cap. A controlled loopback server received a request and its response was copied into the temporary asset output. The probe did not contact metadata endpoints or other internal services.

Normal Contentful responses provide CDN URLs. Remote exploitation therefore requires influence over an accepted asset URL, an imported response, or a redirect target. A hostile or compromised source can reach the build network or exhaust memory through large responses. SVG processing fetches source even when `download` is false.

Remediation: allowlist the required HTTPS CDN hosts, validate all resolved addresses, and reject private/reserved addresses. Disable redirects or validate every hop. Bound response bytes, duration, retries, and concurrency. Mapping: A01:2025, A06:2025, API4:2023, API7:2023, and API10:2023.

### SEC-04 — Medium, conditional on path input: asset paths can escape their intended subtree

Location: `packages/cssg-plugin-assets/src/helper/asset.ts:29` and `packages/cssg-plugin-assets/src/helper/image.ts:128`.

URL query values `w`, `h`, `f`, and `fm` become filename components without validation. A path-only probe using `fm=../../../../../../escape.txt` produced `/escape.txt` for the default `/assets/cf` base. That loses the intended asset subtree, but Node's `join` keeps this case inside the configured static root.

With the supported relative base `assets/cf`, the same input produced `../escape.txt`, outside the static/cache root. CMS focus-area values also enter query strings without encoding, which can introduce additional query parameters. A complete file-overwrite exploit requires the source URL to return usable data. Contentful's normal image API may reject malformed transformations.

Remediation: allowlist image parameter values, use `URLSearchParams`, and derive filenames from safe identifiers or a URL hash. Check canonical output paths against both configured roots, including symlinks, before directory creation, writes, and copies. Mapping: A01:2025, A05:2025, and API10:2023.

### SEC-05 — High if enabled publicly: webhook helper accepts unauthenticated rebuild requests

Location: `packages/contentful-ssg/src/server/index.ts:55` and `packages/contentful-ssg/src/lib/watch-webhook.ts:58`.

`GET /` invokes the callback without credentials. `POST /` only checks for a truthy `body.sys`, so `{"sys":{}}` passes. There is no shared-secret/signature verification, replay control, topic/space/environment validation, or callback concurrency guard. Express's default parsers impose body limits, but these do not bound repeated rebuilds.

The current CLI's server startup is commented out at `packages/contentful-ssg/src/cli.ts:313`. This is a latent integration risk, rather than an active listener in the reviewed CLI. The existing server tests confirm the unauthenticated behavior.

Before activation, require authenticated POST requests, validate event fields, coalesce rebuilds, bound concurrency, return generic errors, and log rejected requests without credentials. Create one Express app per `getApp` call to avoid retaining earlier callbacks. Mapping: A01:2025, A02:2025, A07:2025, A09:2025, A10:2025, API2:2023, API4:2023, API5:2023, API6:2023, and API8:2023.

### SEC-06 — Medium on shared machines: generated credential files use default permissions

Location: `packages/contentful-config/src/cli.ts:138` and `packages/contentful-ssg/src/cli.ts:126`.

The configuration commands write delivery/preview credentials without an explicit restrictive file mode. With umask `022`, new regular files normally receive mode `0644`, readable by other local users. CLI stdout can also contain credentials by design, so captured logs require protection. Management tokens are excluded from `contentful-config` output.

Remediation: create credential files with mode `0600`, handle existing files deliberately, and reject symlink targets where appropriate. Keep credentials out of logs and generated public assets. The expanded ignore rules reduce accidental commits but do not enforce filesystem permissions. Mapping: A02:2025 and A04:2025.

## OWASP coverage

The categories follow [OWASP Top 10:2025](https://top10.owasp.org/2025/en/) and [OWASP API Security Top 10:2023](https://api-security.owasp.org/editions/2023/en/0x00-header/). Category coverage is a review map, not a compliance certification.

| Web category                               | Review result                                                                                                                                              |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A01 Broken access control                  | Asset destination/path boundaries and latent webhook access: SEC-03 to SEC-05.                                                                             |
| A02 Security misconfiguration              | Credential permissions and latent webhook defaults: SEC-05, SEC-06. CI actions use mutable major tags and have no explicit workflow permissions block.     |
| A03 Software supply chain failures         | Native audits and registry signatures checked. DEP-01 remains. Build-script allowlist retained and tested.                                                 |
| A04 Cryptographic failures                 | SDK requests use HTTPS by default. SEC-06 covers local credential disclosure. SHA-1 in webhook code identifies a URL and is not an authentication control. |
| A05 Injection                              | SEC-01, SEC-02, and SEC-04. No application SQL/NoSQL database layer found. The login subprocess uses `execFileSync` with fixed arguments.                  |
| A06 Insecure design                        | Implicit trust in CMS output, asset URLs, and build-resource consumption: SEC-01 to SEC-04.                                                                |
| A07 Authentication failures                | Contentful authentication is delegated to its SDK. SEC-05 applies if the webhook helper is enabled. No local password/session store found.                 |
| A08 Software or data integrity failures    | Active CMS output: SEC-01, SEC-02. Plugins/configuration intentionally execute trusted project code. Cache files must remain trusted local state.          |
| A09 Security logging and alerting failures | SEC-05 lacks authentication rejection logs. CLI logs are operational output, not a security event trail.                                                   |
| A10 Mishandling of exceptional conditions  | SEC-03 buffers unrestricted responses. Webhook errors use Express defaults, and malformed bodies can reach unsafe assumptions: SEC-05.                     |

| API category                                         | Review result                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| API1 Broken object level authorization               | No user-facing object retrieval API found. Contentful permissions remain external. Validate space/environment if webhook handling is restored. |
| API2 Broken authentication                           | SEC-05.                                                                                                                                        |
| API3 Broken object property level authorization      | No public object mutation API found. No mass-assignment route identified.                                                                      |
| API4 Unrestricted resource consumption               | SEC-03 and SEC-05.                                                                                                                             |
| API5 Broken function level authorization             | Unauthenticated rebuild function if enabled: SEC-05.                                                                                           |
| API6 Unrestricted access to sensitive business flows | Repeated rebuilds and hooks if enabled: SEC-05. No payment or account-creation flow found.                                                     |
| API7 Server side request forgery                     | SEC-03.                                                                                                                                        |
| API8 Security misconfiguration                       | SEC-05. Deployment TLS, proxy settings, and response headers require the consuming service's configuration.                                    |
| API9 Improper inventory management                   | One dormant Express helper found. No active public API deployment or API version inventory is defined here.                                    |
| API10 Unsafe consumption of APIs                     | CMS data crosses HTML, SVG, URL, and filesystem boundaries: SEC-01 to SEC-04.                                                                  |

## Secrets and repository health

Gitleaks v8.30.1 found **zero leaks** in the current tracked-file snapshot and **zero leaks across 514 commits** from all local Git refs. Reports used full redaction. No tracked environment or private-key files were found. This does not cover remote-only refs, ignored local files, hosted CI secrets, or provider-side credential validity.

Git diagnostics identify package manifests and the lockfile as the main recent churn hotspots. `packages/contentful-ssg/package.json` also appears frequently in bug-fix commits. One author accounts for 332 of 353 non-merge commits and all nine commits in the last six months. Activity is intermittent, with release/maintenance bursts. The single crisis-keyword match was the test migration, whose message mentions a revert. These signals do not establish an incident history.

Fallow 3.35.0 reported 31 potentially unused exports, 11 dependency candidates, six unused class members, two duplicate exports, and two unused catalog entries. Published library exports require manual triage before removal. It found no circular dependency chains. Duplication was about 3.67%. There were 17 functions above configured complexity/size thresholds. Production review targets include the Hugo plugin factory, the SSG orchestration function, and the config CLI. The tool skipped eight package-script entry hints containing `../..`, which limits entry-point inference.

The first security-focused reads are `packages/cssg-plugin-assets/src/helper/asset.ts` for URL/path boundaries and `packages/contentful-ssg/src/mapper/map-rich-text-field.ts` for executable output. The config CLI is also a complexity/churn hotspot that handles credentials.

## Validation and limits

The assessment used pnpm 11.3.0 and Node 24.22.1. Validation included:

- Baseline, updated working tree, and clean frozen-install `pnpm run test:ci`: 40 test files and 343 tests pass. The updated linter reports warnings on existing code, with no errors.
- A clean `pnpm install --frozen-lockfile` in a temporary source snapshot succeeds with the existing build-script allowlist. Workspace CLI links become available after compilation.
- TypeScript compilation of all workspace packages through the quality pipeline, plus isolated checks for the SDK adaptation and Grow plugin interface.
- `pnpm audit --json` and `pnpm audit --prod --json`: only DEP-01 remains.
- `pnpm peers check`: no peer dependency issues.
- `pnpm audit signatures`: all 929 packages have verified registry signatures. Signatures do not establish that package code is safe.
- Gitleaks scans of tracked files and all local Git refs, with redacted reports.
- Local HTML/SVG output probes, an isolated loopback HTTP probe, and path-only traversal probes. No live Contentful account or internal service was targeted.

Reproduce the dependency checks at the workspace root with `pnpm audit`, `pnpm audit --prod`, `pnpm audit signatures`, and `pnpm peers check`. Reproduce the history scan with `go run github.com/zricethezav/gitleaks/v8@v8.30.1 git . --log-opts=--all --redact --no-banner`.

This review does not assess deployed consuming websites, Contentful roles/webhook settings, external CI settings, ignored credential files, browser execution, or a production network perimeter. Address SEC-01 and SEC-02 before rendering untrusted CMS content. Resolve SEC-03 and SEC-04 before accepting arbitrary asset sources. Complete SEC-05 before exposing the webhook helper.
