import { ref } from "vue";
import { get, set, del } from "idb-keyval";


const BUILTIN_TRACKS=[
  
];

export function useTrackLibrary() {
  const queue  = ref([]);
  const library = ref([]);
  const loopMode = ref(false);

  async function initializeLibrary() {
    // Load built-ins
    library.value.push(...BUILTIN_TRACKS);
    queue.value.push(...BUILTIN_TRACKS);

    // Restore user files
    await restoreLibrary();
  }

  async function onFilesSelected(files) {
    if (!files.length) return;
    const added = [];

    for (const file of files) {
      const id = `user-${file.name}-${file.size}-${file.lastModified}`;
      if (library.value.find((t) => t.id === id)) continue;

      const track = {
        id,
        name: file.name.replace(/\.[^.]+$/, ""),
        artist: "local file",
        blob: file,
        source: "user",
        duration: 0,
      };

      library.value.push(track);
      queue.value.push(track);
      added.push(track);

      try {
        await set(id, file);
      } catch (err) {
        /* quota exceeded */
      }
    }

    // Save metadata
    await set(
      "ts_library_meta",
      library.value
        .filter((t) => t.source === "user")
        .map(({ id, name, artist }) => ({ id, name, artist })),
    );

    return added;
  }

  async function restoreLibrary() {
    try {
      const meta = await get("ts_library_meta");
      if (!meta || !meta.length) return;

      for (const m of meta) {
        const file = await get(m.id);
        if (file) {
          library.value.push({
            id: m.id,
            name: m.name,
            artist: m.artist,
            blob: file,
            source: "user",
            duration: 0,
          });
        }
      }
    } catch (e) {
      /* ignore */
    }
  }

  async function clearLibrary() {
    const userTracks = library.value.filter((t) => t.source === "user");
    for (const t of userTracks) await del(t.id);
    await del("ts_library_meta");

    library.value = library.value.filter((t) => t.source !== "user");
    queue.value = queue.value.filter((t) => t.source !== "user");
  }

  function shuffleQueue() {
    for (let i = queue.value.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [queue.value[i], queue.value[j]] = [queue.value[j], queue.value[i]];
    }
  }

  function getNextTrack(currentTrack) {
    if (!queue.value.length) return null;
    if (!currentTrack) return queue.value[0];

    const i = queue.value.findIndex((t) => t.id === currentTrack.id);
    if (loopMode.value && i === queue.value.length - 1) return queue.value[0];
    return queue.value[(i + 1) % queue.value.length] || null;
  }

  function findTrackByNameOrIndex(arg) {
    const n = Number(arg);
    if (!isNaN(n) && library.value[n]) return library.value[n];

    const q = arg.toLowerCase();
    return library.value.find((t) => t.name.toLowerCase().includes(q));
  }

  function searchLibrary(query) {
    const q = query.toLowerCase();
    return library.value.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q),
    );
  }

  return {
    queue,
    library,
    loopMode,
    initializeLibrary,
    onFilesSelected,
    clearLibrary,
    shuffleQueue,
    getNextTrack,
    findTrackByNameOrIndex,
    searchLibrary,
  };
}
