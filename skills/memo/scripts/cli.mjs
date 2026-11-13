// The one command surface behind `memo <command>` (bin/memo) and `gei memo <command>` (bin/gei.mjs).
import { setup } from "./setup.mjs";

const HELP = `Usage: memo <command>   (the same as gei memo <command>)

  find <word> [word...]   Up to 3 entries for these words, from this project and the shared scope.
  keys [word]             The common keys, or the keys that match a word.
  put --keys k1,k2 --when "<situation>" --do "<what to do>" [--why "<source and reason>"]
      [--group <name>] [--pin] [--user] [--shared] [--replace <id> | --new]
                          Save an entry. --user: the user said it. --shared: it holds for every project.
                          --replace <id>: revise that entry; keeps its id, level and uses, and its why
                          and group unless given. --new: save although a similar entry exists.
  del <id>, restore <id>  Delete an entry; bring a deleted or shadowed one back.
  pin <id>, unpin <id>    A pinned entry opens every session (at most 8 per scope; do at most 160 characters).
  wrong <id>              The entry is wrong: level 0; marking it again deletes it.
  mv <id> --shared        Move an entry to the shared scope.
  show <id>               Every field, its strength and its revision history.
  review                  Entries worth a look: never used, weak, wrong, duplicates, failed searches.
  log [--session <id>]    What a session was given and what it cited (default: this or the latest session).
  sync                    Sync the store with its remote now.
  setup [<repository-url>] [--yes]
                          Clone or create ~/.agents/geispec and wire Claude Code and Codex to it.
                          Shows each change and asks first; --yes applies them all.`;

// Flags take a value unless listed as switches; --name=value also works.
function parse(args, flags, switches = []) {
  const options = Object.fromEntries([...flags.map(name => [name, null]), ...switches.map(name => [name, false])]);
  const positional = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith("--")) { positional.push(arg); continue; }
    const [name, inline] = arg.slice(2).split(/=(.*)/su);
    if (switches.includes(name)) { options[name] = true; continue; }
    if (!flags.includes(name)) throw new Error(`Unknown option --${name}.\n\n${HELP}`);
    const value = inline === undefined ? args[++index] : inline;
    if (value === undefined) throw new Error(`--${name} needs a value.`);
    options[name] = value;
  }
  return { options, positional };
}

// Accepts abc12, m:abc12 and [m:abc12].
function idOf(positional, command) {
  if (positional.length !== 1) throw new Error(`Usage: memo ${command} <id>`);
  const id = positional[0].replace(/^\[?m:|\]$/gu, "");
  if (!/^[a-z0-9]{5}$/u.test(id)) throw new Error(`"${positional[0]}" is not an entry id (five lowercase letters or digits).`);
  return id;
}

const session = () => process.env.CLAUDE_CODE_SESSION_ID || null;

export async function main(args) {
  const [command, ...rest] = args;
  if (!command || command === "--help" || command === "-h" || command === "help") { console.log(HELP); return; }
  if (command === "setup") return setup(rest);
  // The database modules load only past this point, so `setup` and `--help` work on any Node.
  const memo = await import("./memo.mjs");
  const read = await import("./read.mjs");
  const { resolveProject } = await import("./project.mjs");
  const project = () => resolveProject(process.cwd());
  const { options, positional } = parse(rest, ["keys", "when", "do", "why", "group", "replace", "session"], ["pin", "user", "shared", "new"]);
  const say = text => console.log(text);
  switch (command) {
    case "find": return say(read.find(project(), (await import("./rank.mjs")).queryWords(positional.join(" ")), { session: session() }));
    case "keys": return say(read.keys(project(), positional.length ? positional.join(" ") : null));
    case "put": {
      for (const name of ["keys", "when", "do"]) if (options[name] === null) throw new Error(`memo put needs --${name}: memo put --keys k1,k2 --when "<situation>" --do "<what to do>" [--why "<source and reason>"] (memo --help for the rest).`);
      if (positional.length) throw new Error(`Unexpected argument "${positional[0]}"; quote values that contain spaces.`);
      if (options.replace !== null && options.new) throw new Error("--replace and --new exclude each other.");
      const keys = [...new Set(options.keys.split(",").map(key => key.trim().toLowerCase()).filter(Boolean))];
      return say(memo.put({
        keys, when: options.when.trim(), do: options.do.trim(), why: options.why === null ? null : options.why.trim(), group: options.group,
        pin: options.pin, user: options.user, shared: options.shared, new: options.new,
        replace: options.replace === null ? null : idOf([options.replace], "put --replace"),
        scope: options.shared ? "context" : memo.projectScope(project()), session: session(),
      }));
    }
    case "del": return say(memo.del(idOf(positional, command)));
    case "restore": return say(memo.restore(idOf(positional, command)));
    case "pin": return say(memo.pin(idOf(positional, command)));
    case "unpin": return say(memo.unpin(idOf(positional, command)));
    case "wrong": return say(memo.wrong(idOf(positional, command)));
    case "mv":
      if (!options.shared) throw new Error("Usage: memo mv <id> --shared");
      return say(memo.mv(idOf(positional, command), "context"));
    case "show": return say(memo.show(idOf(positional, command)));
    case "review": return say(memo.review(project()));
    case "log": return say(memo.log(options.session === null ? session() : options.session));
    case "sync": {
      const { sync } = await import("./sync.mjs");
      const result = sync();
      return say(result.kind === "plain" ? "The store has no git repository; nothing to sync." : result.done.length ? result.done.join("; ") : "Already in sync.");
    }
    default: throw new Error(`Unknown command: ${command}\n\n${HELP}`);
  }
}
