import { execFileSync } from "node:child_process";
import { fail } from "./io.mjs";

export class GitHub {
  constructor({ env = process.env, fetcher = fetch, timeout = 15000, authTimeout = 3000 } = {}) {
    this.env = env; this.fetcher = fetcher; this.timeout = timeout; this.authTimeout = authTimeout;
  }
  token() {
    if (this.cachedToken) return this.cachedToken;
    if (this.env.GEI_GITHUB_TOKEN || this.env.GH_TOKEN || this.env.GITHUB_TOKEN) return this.env.GEI_GITHUB_TOKEN || this.env.GH_TOKEN || this.env.GITHUB_TOKEN;
    try { this.cachedToken = execFileSync("gh", ["auth", "token", "--hostname", "github.com"], { encoding: "utf8", timeout: this.authTimeout, windowsHide: true, stdio: ["ignore", "pipe", "ignore"] }).trim(); return this.cachedToken; }
    catch {
      try {
        const credential = execFileSync("git", ["credential", "fill"], { input: "protocol=https\nhost=github.com\n\n", encoding: "utf8", timeout: this.authTimeout,
          env: { ...this.env, GIT_TERMINAL_PROMPT: "0", GCM_INTERACTIVE: "never" }, windowsHide: true, stdio: ["pipe", "pipe", "ignore"] });
        const password = credential.split(/\r?\n/u).find(line => line.startsWith("password="))?.slice(9);
        if (password) { this.cachedToken = password; return password; }
      } catch { /* Authentication setup remains an explicit user action. */ }
      fail("AUTH", "Sign in with gh auth login, use an existing Git credential helper, or provide GEI_GITHUB_TOKEN. Credentials are never stored in Spec.");
    }
  }
  async request(route, { method = "GET", body, timeout = this.timeout } = {}) {
    let response;
    try {
      response = await this.fetcher(`https://api.github.com${route}`, { method,
        headers: { Authorization: `Bearer ${this.token()}`, Accept: "application/vnd.github+json", "Content-Type": "application/json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "gei-spec" },
        body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(timeout) });
    } catch (error) {
      if (error.code === "AUTH") throw error;
      fail("NETWORK", "GitHub is unavailable or timed out. No local fallback write was made.");
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) fail(response.status === 401 ? "AUTH" : response.status === 409 ? "CONFLICT" : "GITHUB",
      `GitHub returned ${response.status}: ${data.message || "request failed"}`, { status: response.status });
    if (data.errors) fail("GITHUB", data.errors.map(error => error.message).join("; "));
    return data;
  }
  async info(repo) {
    if (!/^[\w.-]+\/[\w.-]+$/u.test(repo || "")) fail("CONFIG", "Repository must be owner/name.");
    return this.request(`/repos/${repo}`);
  }
  async create(repo) {
    if (!/^[\w.-]+\/[\w.-]+$/u.test(repo || "")) fail("CONFIG", "Repository must be owner/name.");
    const user = await this.request("/user");
    const [owner, name] = repo.split("/");
    if (owner.toLowerCase() !== user.login.toLowerCase()) fail("CONFIG", "Automatic creation supports your personal account; connect an existing organization repository instead.");
    return this.request("/user/repos", { method: "POST", body: { name, private: true, auto_init: true, description: "Private project knowledge" } });
  }
  async head(binding, options) {
    return (await this.request(`/repos/${binding.repo}/git/ref/heads/${encodeURIComponent(binding.branch)}`, options)).object.sha;
  }
  async tree(binding, revision, options) {
    const result = await this.request(`/repos/${binding.repo}/git/trees/${revision}?recursive=1`, options);
    if (result.truncated) fail("TOO_LARGE", "GitHub returned a truncated tree; use a dedicated knowledge repository.");
    return result.tree.filter(item => /^(projects\/[^/]+\/|context\/).+\.md$/u.test(item.path) || item.path.startsWith("metadata/") && item.type !== "tree");
  }
  async content(binding, sha, options) {
    const blob = await this.request(`/repos/${binding.repo}/git/blobs/${sha}`, options);
    if (blob.encoding !== "base64" || blob.size > 1024 * 1024) fail("TOO_LARGE", "Expected a Markdown blob of at most 1 MiB.");
    return Buffer.from(blob.content, "base64").toString("utf8");
  }
  async commit(binding, expected, changes, message) {
    const additions = Object.entries(changes).filter(([, value]) => value !== null).map(([name, value]) => ({ path: name, contents: Buffer.from(value).toString("base64") }));
    const deletions = Object.entries(changes).filter(([, value]) => value === null).map(([name]) => ({ path: name }));
    const result = await this.request("/graphql", { method: "POST", body: {
      query: "mutation($input:CreateCommitOnBranchInput!){createCommitOnBranch(input:$input){commit{oid url}}}",
      variables: { input: { branch: { repositoryNameWithOwner: binding.repo, branchName: binding.branch }, expectedHeadOid: expected,
        message: { headline: message }, fileChanges: { additions, deletions } } },
    } });
    return result.data.createCommitOnBranch.commit;
  }
}
