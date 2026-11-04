<template>
  <section>
    <div class="terminal">
      <div class="terminal-header">
        <h1>$ssh app@BashTune~</h1>
      </div>
      <!-- 1. History Log: Renders previous entries as read-only static text -->
      <div v-for="(line, index) in history" :key="index" class="terminal-line">
        <span class="prompt">~/app: $</span> {{ line }}
      </div>

      <!-- 2. Active Line: Where the user types -->
      <div class="active-line">
        <span class="prompt">~/app: $</span>
        <input
          ref="terminalInput"
          v-model="currentInput"
          type="text"
          class="terminal-field"
          autofocus
          @keydown.enter="submitCommand"
        />
      </div>
    </div>

    <div class="tools"></div>
  </section>

  <section>
    <div class="sidebar"></div>
  </section>
</template>

<script setup>
import { ref } from "vue";

// State management
const currentInput = ref("");
const history = ref([]);
const terminalInput = ref(null);

// Pushes the active line to immutable history on Enter key press
const submitCommand = () => {
  if (currentInput.value.trim() !== "") {
    history.value.push(currentInput.value);
    currentInput.value = ""; // Clear line for new input
  }
};

// Keeps the input focused when clicking anywhere inside the terminal area
const focusTerminal = () => {
  if (terminalInput.value) {
    terminalInput.value.focus();
  }
};
</script>

<style scoped>
/* Terminal container styling */
.terminal {
  background-color: #121212;
  color: #ffffff;
  font-family: "Courier New", Courier, monospace;
  padding: 15px;
  border-radius: 5px;
  min-height: 300px;
  cursor: text;
}

/* Prompt and line configurations */
.terminal-line,
.active-line {
  display: flex;
  align-items: center;
  line-height: 1.5;
}

.prompt {
  color: #4af626; /* Classic green terminal prompt */
  margin-right: 10px;
  white-space: nowrap;
}

/* Invisible text input styling */
.terminal-field {
  background: transparent;
  border: none;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  outline: none;
  flex-grow: 1;
  padding: 0;
}
</style>
