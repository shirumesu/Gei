# Wording

Write knowledge in the spirit of ASD-STE100 Simplified Technical English: short, literal, one meaning per term. Apply its writing rules in any language; do not enforce the English-only STE dictionary or claim STE compliance. Accurate technical terms beat simplified paraphrase.

- One fact, condition or instruction per sentence. Keep sentences short; split a sentence that carries "and" between two facts.
- Name the actor and use active voice: "Patroni promotes DB04", not "DB04 gets promoted".
- Write procedures as numbered imperative steps, one action per step.
- Put the conclusion or command first, then the reason, condition or consequence. Warnings follow "Do not X. If you do, Y occurs."
- One term, one meaning. Reuse the term the topic page defines; register project names, aliases and abbreviations there instead of inventing synonyms.
- Avoid noun chains longer than three words and vague verbs (handle, deal with, ensure, process). State the concrete action and object.
- Use lists for parallel conditions or items; keep each item a complete statement.

## Example

Before:

> 在进行备份恢复相关处理的时候，由于 WAL 归档可能会因为 S3 证书问题而被影响，所以需要先确保 CA 被正确地处理好，然后再去做 PITR 演练。

After:

> PITR 演练前，先确认 `archive_command` 能写入 Pure S3。
> 原因：S3 CA 证书缺失时，WAL 归档失败，恢复点会缺少 WAL。
> 1. 检查 Pod 已挂载 `pure-s3-ca` Secret。
> 2. 执行 `pgbackrest check`，确认 WAL 归档成功。
> 3. 开始 PITR 演练。

The rewrite states the conclusion first, names each object (`archive_command`, `pure-s3-ca`), gives one reason in one sentence, and turns the procedure into single-action steps.
