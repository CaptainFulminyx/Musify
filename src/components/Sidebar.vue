<template>
  <aside class="side-pane">
    <!-- Queue Section -->
    <div class="pane-header">
      <span>QUEUE</span>
      <span class="dim">{{ queue.length }}</span>
    </div>
    <ul class="queue-list">
      <li
        v-for="(track, idx) in queue"
        :key="track.id"
        :class="{ active: currentTrack && track.id === currentTrack.id }"
        @click="$emit('play-from-queue', idx)"
      >
        <span class="q-idx">{{ String(idx + 1).padStart(2, "0") }}</span>
        <span class="q-name" :title="track.name">{{ track.name }}</span>
        <span class="q-artist">{{ track.artist }}</span>
        <span class="q-dur">{{ fmtTime(track.duration) }}</span>
      </li>
      <li v-if="!queue.length" class="empty">queue is empty</li>
    </ul>

    <!-- Library Section -->
    <div class="pane-header library-header">
      <span>LIBRARY</span>
      <span class="dim">{{ library.length }}</span>
      <button class="mini-btn" @click="$emit('add-files')" title="Add files">
        + add
      </button>
    </div>
    <ul class="queue-list library-list">
      <li
        v-for="track in library"
        :key="'lib-' + track.id"
        @click="$emit('play-track', track)"
        :class="{ active: currentTrack && track.id === currentTrack.id }"
      >
        <span class="q-name" :title="track.name">
          <span v-if="track.source === 'builtin'" class="badge">♪</span>
          {{ track.name }}
        </span>
        <span class="q-artist">{{ track.artist }}</span>
      </li>
      <li v-if="!library.length" class="empty">library is empty</li>
    </ul>

    <!-- Footer -->
    <div class="side-footer">
      <button
        class="mini-btn danger"
        @click="$emit('clear-library')"
        v-if="library.some((t) => t.source === 'user')"
      >
        clear user files
      </button>
    </div>
  </aside>
</template>

<script setup>
defineProps({
  queue: Array,
  library: Array,
  currentTrack: Object,
  fmtTime: Function,
});

defineEmits(["play-from-queue", "play-track", "add-files", "clear-library"]);
</script>

<style scoped>
.side-pane {
  width: 280px;
  border-left: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.pane-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.75rem;
  background: rgba(0, 0, 0, 0.4);
  border-bottom: 1px solid var(--border);
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  color: var(--accent);
  flex-shrink: 0;
}

.library-header {
  border-top: 1px solid var(--border);
}

.mini-btn {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--dim);
  font-family: inherit;
  font-size: 0.65rem;
  padding: 0.15rem 0.45rem;
  cursor: pointer;
  transition: all 0.15s;
}

.mini-btn:hover {
  color: var(--fg);
  border-color: var(--fg);
}

.mini-btn.danger:hover {
  color: #ff6b6b;
  border-color: #ff6b6b;
}

.queue-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
}

.queue-list.library-list {
  flex: 1;
}

.queue-list li {
  display: grid;
  grid-template-columns: 28px 1fr 32px;
  gap: 0.5rem;
  padding: 0.45rem 0.75rem;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.05);
  cursor: pointer;
  font-size: 0.8rem;
  transition: background 0.15s;
  align-items: center;
}

.library-list li {
  grid-template-columns: 1fr auto;
}

.queue-list li:hover {
  background: rgba(255, 255, 255, 0.04);
}

.queue-list li.active {
  background: rgba(255, 255, 255, 0.08);
  box-shadow: inset 3px 0 0 var(--accent);
}

.queue-list li.empty {
  grid-template-columns: 1fr;
  color: var(--dim);
  font-style: italic;
  cursor: default;
  padding: 1rem 0.75rem;
}

.q-idx {
  color: var(--dim);
  font-size: 0.7rem;
}

.q-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--fg);
}

.q-artist {
  color: var(--dim);
  font-size: 0.72rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.q-dur {
  color: var(--dim);
  font-size: 0.72rem;
  text-align: right;
}

.badge {
  color: var(--accent);
  margin-right: 0.25rem;
}

.side-footer {
  border-top: 1px solid var(--border);
  padding: 0.5rem 0.75rem;
  flex-shrink: 0;
}

@media (max-width: 900px) {
  .side-pane {
    width: 100%;
    max-height: 200px;
    border-left: none;
    border-top: 1px solid var(--border);
  }
}
</style>
