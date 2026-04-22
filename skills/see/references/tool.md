# Tool Reference

This file covers the installed CLI tools for Reddit, Twitter/X, and Xiaohongshu.
For ordinary web pages, follow the network access rules in `SKILL.md`.

## Reddit

Use `rdt-cli`.

Setup and account checks:

```bash
rdt --help
rdt login
rdt status
rdt whoami
```

Common browsing and reading:

```bash
rdt popular
rdt sub python
rdt search "python async"
rdt show 1
rdt read <post_id>
rdt read <post_id> --expand-more
```

Export:

```bash
rdt export "python tips" -n 100 -o tips.csv
```

## Twitter/X

Use `twitter-cli`.

Auth and setup notes:

```bash
twitter --help
twitter user openai
```

`twitter-cli` does not provide a dedicated `login` command. It uses local browser cookies or environment variables.

Common browsing and reading:

```bash
twitter feed
twitter search "AI agent"
twitter show 1
twitter tweet <tweet_id>
twitter article <tweet_id> --markdown
twitter user-posts openai --max 20
```

## Xiaohongshu

Use `xiaohongshu-cli`.

Setup and account checks:

```bash
xhs --help
xhs login
xhs login --qrcode
xhs status
xhs whoami
```

Common search and reading:

```bash
xhs search "美食"
xhs topics "美食"
xhs read 1
xhs read "<note_id>"
xhs hot
```

## Health Check

If tool availability is unclear, run the bundled health check:

```bash
python skills/see/scripts/health_check.py
```

If you want the script to attempt installation for missing or unavailable CLI tools:

```bash
python skills/see/scripts/health_check.py --install
```

The health check runs multiple commands for each tool and reports `pass x of x` together with the failed command names.

If a tool remains unavailable, continue the task with the next valid fallback and state the limitation plainly in the answer.

### Tool Login

If haven't logged in yet, use these commands to log in:
```bash
rdt login
xiaohongshu login --qrcode
twitter status
```
Sometimes these commands may return errors or require user interaction; please inform the user accordingly.

### Twitter-cli Login

Cookie retrieval from the upstream tool is unreliable; please instruct the user to set environment variables if setup fail.
Typical steps:
1. Open a browser and locate the "Cookies" section
2. Find the `x.com` cookies and locate the `AUTH_TOKEN` and `CT0` keys
3. Set them as environment variables `TWITTER_AUTH_TOKEN` and `TWITTER_CT0`
4. Done
