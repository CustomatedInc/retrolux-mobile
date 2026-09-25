# Security Policy

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues,
pull requests, or discussions.**

Instead, report them privately by emailing **security@retrolux.com** (or the
current maintainers). Include:

- A description of the vulnerability and its impact
- Steps to reproduce, or a proof of concept
- Affected version, platform (iOS/Android), commit, or screen
- Any suggested remediation

You should receive an acknowledgement within a few business days. We support
coordinated disclosure — please give us a reasonable window to release a fix
before any public disclosure.

## Scope

Reports are especially welcome for:

- Exposure of secrets, signing material, or API keys
- Flaws in the offline **sync** path that could corrupt or leak audit data
- Insecure local storage of sensitive data on the device (Realm database, caches)
- Authentication/session handling weaknesses
- Injection or unsafe handling of server responses

## Handling secrets and signing material

This repository is public. Never commit secrets. This includes iOS certificates
and provisioning profiles, release Android keystores, App Store Connect / Google
Play API keys, Slack or other webhook URLs, and `.env` files. These are excluded
by `.gitignore`; keep them out of the tree.

If a credential is ever committed — even in a single commit that is later
reverted — treat it as compromised: **rotate it immediately** (revoke the cert,
regenerate the keystore, roll the webhook) and notify a maintainer so the value
can be purged from git history. See the "Secrets and signing material" section of
[CONTRIBUTING.md](CONTRIBUTING.md).

Secrets belong in environment variables or a secrets manager — for example the
Fastlane build uses `RETROLUX_SLACK_WEBHOOK_URL` from the environment rather than
a hardcoded URL.

## Supported versions

Security fixes are applied to the actively developed mainline. Users on older
builds should update to the latest release to receive fixes.
