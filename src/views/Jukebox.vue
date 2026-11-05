<template>
  <section>
    <div class="terminal" @click="focusTerminal">
      <div class="terminal-header prompt">
        <h2>$app@BashTune~</h2>
      </div>

      <!-- 1. History: read-only, prompt on every line -->
      <div v-for="(line, index) in history" :key="index" class="terminal-line">
        <span class="prompt">~/app: $</span>{{ " " }}<span>{{ line }}</span>
      </div>

      <!-- 2. Active line: prompt + typed text flow inline, so long input wraps -->
      <div class="terminal-line active-line">
        <span class="prompt">~/app: $</span>{{ " " }}<span>{{ before }}</span
        ><span class="cursor">{{ atCursor }}</span
        ><span>{{ after }}</span>

        <!-- Hidden input only captures keystrokes -->
        <input
          ref="terminalInput"
          v-model="currentInput"
          type="text"
          class="hidden-input"
          autofocus
          autocomplete="off"
          autocapitalize="off"
          autocorrect="off"
          spellcheck="false"
          @keydown.enter="submitCommand"
          @input="syncCursor"
          @keyup="syncCursor"
          @click="syncCursor"
          @select="syncCursor"
        />
      </div>
      <div ref="bottom"></div>
    </div>

    <div class="tools"></div>
  </section>

  <section>
    <div class="sidebar"></div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from "vue";

const currentInput = ref("");
const cursorPos = ref(0);
const history = ref([]);
const terminalInput = ref(null);
const bottom = ref(null);

// Split the text around the caret so the cursor renders in the right place
const before = computed(() => currentInput.value.slice(0, cursorPos.value));
const atCursor = computed(
  () => currentInput.value.charAt(cursorPos.value) || "▮",
);
const after = computed(() => currentInput.value.slice(cursorPos.value + 1));

const syncCursor = () => {
  // Wait a tick so selectionStart reflects the latest key/input
  nextTick(() => {
    cursorPos.value =
      terminalInput.value?.selectionStart ?? currentInput.value.length;
  });
};

const submitCommand = () => {
  if (currentInput.value.trim() !== "") {
    history.value.push(currentInput.value);
  }
  currentInput.value = "";
  cursorPos.value = 0;
  nextTick(() => bottom.value?.scrollIntoView({ block: "end" }));
};

const focusTerminal = () => {
  terminalInput.value?.focus();
};

onMounted(focusTerminal);
</script>

<style scoped>
.terminal {
  position: relative;
  background-color: #121212;
  color: #ffffff;
  font-family: "Courier New", ui-monospace, monospace;
  padding: 15px;
  border-radius: 5px;
  min-height: 300px;
  cursor: text;
  overflow: hidden;
}

/* Each line is one block of inline text: prompt + content wrap together,
   and wrapped text returns to the left edge like a real terminal */
.terminal-line {
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-all;
  user-select: text;
}

.prompt {
  color: #4af626;
  user-select: none; /* prompt can't be selected/copied or edited */
}

.cursor {
  color: var(--accent);
  animation: blink 1s steps(1) infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

/* Invisible, but still focusable (also brings up the keyboard on mobile) */
.hidden-input {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
  left: 0;
  bottom: 0;
  padding: 0;
  border: none;
  pointer-events: none;
  font-size: 16px; /* prevents iOS zoom on focus */
}
</style>
