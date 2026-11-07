import { computed, unref } from "vue";

export const commands = [
  { cmd: "vol", arg: "<num 0-100>" },
  { cmd: "nxt", arg: "" },
  { cmd: "prev", arg: "" },
  { cmd: "stop", arg: "" },
  { cmd: "start", arg: "" },
  { cmd: "shfl", arg: "" },
  { cmd: "list", arg: "" },
  { cmd: "add", arg: "" },
  { cmd: "del", arg: "<index | name>" },
];

const none = { ghost: "", completion: "" };

export function useAutotype(input) {
  return computed(() => {
    const value = unref(input).toLowerCase();
    if (!value) return none;

    const space = value.indexOf(" ");

    // Still typing the command name: complete it, then show the arg hint
    if (space === -1) {
      const match = commands.find((c) => c.cmd.startsWith(value));
      if (!match) return none;
      return {
        ghost: match.cmd.slice(value.length) + (match.arg ? " " + match.arg : ""),
        completion: match.cmd + (match.arg ? " " : ""),
      };
    }

    // "vol " typed, nothing after the space yet: show only the arg hint
    const match = commands.find((c) => c.cmd === value.slice(0, space));
    if (!match || !match.arg || value.slice(space + 1) !== "") return none;
    return { ghost: match.arg, completion: "" };
  });
}