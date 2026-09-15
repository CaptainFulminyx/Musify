import { ref, nextTick } from "vue";

export function useCommands() {
  const outputLines = ref([]);
  const commandInput = ref("");
  const history = ref([]);
  const historyIdx = ref(-1);

  const commandDocs = [
    { cmd: "help", desc: "show this reference" },
    { cmd: "add", desc: "open file picker" },
    { cmd: "play", desc: "resume current track" },
    { cmd: "pause", desc: "pause playback" },
    { cmd: "stop", desc: "stop and reset" },
    { cmd: "next / prev", desc: "navigate queue" },
    { cmd: "seek <mm:ss>", desc: "jump to a time" },
    { cmd: "volume <0-100>", desc: "set master volume" },
    { cmd: "search <query>", desc: "filter library by name/artist" },
    { cmd: "play <index|name>", desc: "play from library" },
    { cmd: "queue", desc: "list queue" },
    { cmd: "library / ls", desc: "list library" },
    { cmd: "shuffle", desc: "shuffle the queue" },
    { cmd: "loop", desc: "toggle loop mode" },
    { cmd: "theme [name]", desc: "cycle or set theme" },
    { cmd: "clear", desc: "clear terminal output" },
    { cmd: "about", desc: "about this project" },
  ];

  function log(text, type = "out", terminalEl = null) {
    outputLines.value.push({ text, type });
    if (outputLines.value.length > 300) outputLines.value.shift();

    if (terminalEl) {
      nextTick(() => {
        if (terminalEl.value) {
          terminalEl.value.scrollTop = terminalEl.value.scrollHeight;
        }
      });
    }
  }

  function parseTime(str) {
    if (!str) return null;
    if (/^\d+(\.\d+)?$/.test(str)) return Number(str);
    const m = str.match(/^(\d+):(\d{1,2})$/);
    if (!m) return null;
    return Number(m[1]) * 60 + Number(m[2]);
  }

  function fmtTime(s) {
    if (!s || !isFinite(s)) return "00:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  function autocomplete() {
    const partial = commandInput.value.trim().toLowerCase();
    if (!partial) return;

    const matches = commandDocs
      .map((c) => c.cmd.split(" ")[0])
      .filter((c) => c.startsWith(partial));

    if (matches.length === 1) {
      commandInput.value = matches[0] + " ";
    } else if (matches.length > 1) {
      log("did you mean: " + matches.join(", "), "out");
    }
  }

  function onInputKeydown(e) {
    if (e.key === "Enter") {
      const raw = commandInput.value.trim();
      if (!raw) return;

      log(raw, "input");
      history.value.push(raw);
      historyIdx.value = history.value.length;
      commandInput.value = "";

      return raw; // Signal to caller to run this command
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.value.length) return;
      historyIdx.value = Math.max(0, historyIdx.value - 1);
      commandInput.value = history.value[historyIdx.value] || "";
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!history.value.length) return;
      historyIdx.value = Math.min(history.value.length, historyIdx.value + 1);
      commandInput.value = history.value[historyIdx.value] || "";
    } else if (e.key === "Tab") {
      e.preventDefault();
      autocomplete();
    }
  }

  function clearTerminal() {
    outputLines.value = [];
  }

  return {
    outputLines,
    commandInput,
    history,
    historyIdx,
    commandDocs,
    log,
    parseTime,
    fmtTime,
    onInputKeydown,
    clearTerminal,
  };
}