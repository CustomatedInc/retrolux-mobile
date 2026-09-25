# Contributing to Retrolux Mobile

Thanks for your interest in contributing. This document explains how
contributions are licensed, how to propose changes, and the standards we hold
code to. Retrolux Mobile is an offline-first React Native app for lighting-
retrofit field audits.

## Licensing of contributions (inbound = outbound)

Retrolux Mobile is licensed under the **GNU Affero General Public License v3.0 or
later** (see [LICENSE](LICENSE)). By submitting a contribution — a pull request,
patch, or any other work — you agree that your contribution is licensed under the
same **AGPL-3.0-or-later** terms as the project. This "inbound = outbound" rule
keeps the licensing of the whole codebase consistent; we do not require a
separate CLA.

### Developer Certificate of Origin

Every commit must be signed off to certify you have the right to submit it under
the project license, per the [Developer Certificate of
Origin](https://developercertificate.org/):

```
Signed-off-by: Your Name <you@example.com>
```

`git commit -s` adds this automatically.

## Reporting security issues

**Do not open a public issue for security vulnerabilities.** Report them
privately — see [SECURITY.md](SECURITY.md).

## Secrets and signing material — never commit these

This repository is public. Treat every commit as permanently disclosed.

- **Never commit** signing or distribution secrets: iOS certificates (`.cer`,
  `.p12`, `.certSigningRequest`), provisioning profiles (`.mobileprovision`),
  release Android keystores (`*.keystore`, `*.jks`), App Store Connect / Google
  Play API keys, Slack/webhook URLs, or `.env` files. The `.gitignore` already
  excludes these — keep it that way.
- Secrets belong in **environment variables** (for example
  `RETROLUX_SLACK_WEBHOOK_URL` used by `ios/fastlane/Fastfile`) or a secrets
  manager — never hardcoded in source, config, or Fastlane files.
- The Android **debug** keystore (`android/keystores/debug.keystore.properties`)
  uses the standard public debug password and is intentionally checked in; the
  **release** keystore must never be.
- If you accidentally commit a secret, treat it as compromised: **rotate it** and
  tell a maintainer so history can be scrubbed. Removing it in a later commit is
  not enough — it remains in history.

## Development setup

Requires Node 18 and the toolchain in the [README](README.MD). Use **npm, not
yarn** (the yarn lockfile is stale).

```bash
npm install --force --no-audit --no-fund   # runs patch-package postinstall
cd ios && pod install && cd ..             # iOS native deps
npm run ios        # or: npm run android
```

## Proposing changes

1. Branch from the current mainline for your change.
2. Keep each pull request focused on one concern.
3. **Run the gate before pushing** and paste the result in your PR:
   ```bash
   npx jest                    # unit test suite must be green
   npx eslint <changed files>  # delta-lint only; the repo has many pre-existing warnings
   ```
4. Update documentation when behavior or setup changes.
5. Describe **what** changed and **why**, and sign off your commits.

## Offline-sync and Realm cautions

Field techs work offline for days, so **sync is the riskiest surface**. When you
touch sync code, database models, the Realm schema, or migrations:

- A Realm schema change requires a `schemaVersion` bump (and usually a migration)
  **in the same change**.
- Money and measurement fields are **strings by design** (floating-point
  history) — never floats.
- Watch for silent-halt and data-loss traps in the sync path; test the
  offline → online transition explicitly.

## Commit messages

Concise, imperative subject ("Add audit export", not "Added"). Explain intent in
the body when it isn't obvious. Include the `Signed-off-by` line.

## Code of conduct

Be respectful and constructive. Assume good faith and keep review welcoming.
