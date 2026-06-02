# Tool Reference

This file covers Jina Reader usage for known URLs. Jina is a network reader, not an installed tool, search backend, or platform-specific integration.

For source discovery and ordinary search, return to the network access rules in `SKILL.md` and use the installed search or web backend first. Jina is a second-pass reader for URLs that are already known.

## Usage

Prefix the original full URL with `https://r.jina.ai/`.

```text
https://r.jina.ai/https://example.com/page
```

For JavaScript-heavy pages, request browser-rendered mode:

```bash
curl "https://r.jina.ai/https://example.com/page" \
  -H "X-Engine: browser" \
  -H "X-Respond-Timing: mutation-idle"
```

- `X-Engine: browser`: asks Jina to use a browser-rendered path.
- `X-Respond-Timing: mutation-idle`: waits until DOM mutations quiet down before returning content.

The output is usually Markdown-like text with a title, source URL, optional published time, extracted links, images, and page text.

## When To Use

Use Jina when:

- the URL is already known
- normal fetch returns an empty page, JavaScript shell, or crawler-hostile result
- extracted text, timestamps, links, images, or page metadata would be useful evidence

Do not use Jina as:

- the first step for general search or source discovery
- a replacement for ordinary fetch/search on pages that are already readable
- proof that login-gated or blocked content is available

## Result Validation

HTTP success is not enough. Jina may return a wrapper response while the target page inside the content failed, redirected, or rendered only a login/block page.

Before using a Jina result as evidence, check:

- the title and body are specific to the target page
- the needed text, timestamp, author, link, image, or metadata is present
- warnings such as `Warning: Target URL returned error` are absent or explicitly handled
- login prompts, sidebars, footers, and navigation are not being mistaken for the target content

If the result is mostly login text, footer/legal text, category navigation, or a generic title, treat it as unusable and state the limitation.

## Reddit Limit

Do not rely on Jina for Reddit by default. Current observed behavior is that Reddit public pages can return network-security blocks, including old Reddit URLs.

If Jina returns Reddit text, verify that it is actual thread or comment content rather than a block page.
