<template>
  <section class="terminal" ref="terminalEl">
    <div
      v-for="(line, i) in outputLines"
      :key="i"
      class="term-line"
      :class="line.type"
    >
      <span v-if="line.type === 'input'" class="prompt">$</span>
      <span v-else-if="line.type === 'err'" class="prompt err">!</span>
      <span v-else-if="line.type === 'ok'" class="prompt ok">✓</span>
      <span v-else class="prompt dim">&gt;</span>
      <span class="term-text" v-html="line.text"></span>
    </div>
  </section>

  <section class="input-bar">
    <span class="prompt">$</span>
    <input
      ref="inputEl"
      :value="commandInput"
      type="text"
      spellcheck="false"
      autocomplete="off"
      placeholder="type a command… (try `help`)"
      @input="$emit('update:commandInput', $event.target.value)"
      @keydown="handleKeydown"
    />
  </section>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  outputLines: Array,
  commandInput: String,
  onInputKeydown: Function,
});

const emit = defineEmits(["update:commandInput", "command"]);

const terminalEl = ref(null);
const inputEl = ref(null);

function handleKeydown(e) {
  const result = props.onInputKeydown(e);
  if (result) {
    // onInputKeydown returns the command when Enter is pressed
    emit("command", result);
    emit("update:commandInput", ""); // Clear input after command
  }
  // Note: onInputKeydown already handles arrow keys and updates the state
  // via the parent composable's history management
}

defineExpose({
  focus: () => inputEl.value?.focus(),
  terminalEl,
});
</script>

<style scoped>
.terminal {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.35);
  font-size: 0.85rem;
  line-height: 1.6;
  min-height: 0;
}

.terminal::-webkit-scrollbar {
  width: 6px;
}

.terminal::-webkit-scrollbar-track {
  background: transparent;
}

.terminal::-webkit-scrollbar-thumb {
  background: var(--border);
}

.term-line {
  white-space: pre-wrap;
  word-break: break-word;
}

.term-line .prompt {
  color: var(--accent);
  margin-right: 0.4rem;
}

.term-line .prompt.err {
  color: #ff6b6b;
}

.term-line .prompt.ok {
  color: var(--accent);
}

.term-line .prompt.dim {
  color: var(--dim);
}

.term-line.err .term-text {
  color: #ff6b6b;
}

.term-line.input .term-text {
  color: var(--fg);
}

.input-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.5);
  padding: 0.55rem 0.75rem;
  flex-shrink: 0;
}

.input-bar input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--fg);
  font-family: inherit;
  font-size: 0.9rem;
  caret-color: var(--accent);
}

.input-bar input::placeholder {
  color: var(--dim);
  opacity: 0.6;
}

.input-bar .prompt {
  color: var(--accent);
  font-size: 0.95rem;
}
</style>
