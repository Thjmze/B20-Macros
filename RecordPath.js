// b20-JS: Path Recorder
// Create a path or patrol to be executed by other macros 
// Put tokens in whatever path you want them to follow
// Number these tokens by modifying their bar 3
// Select all tokens and execute macro
// Copy output to whatever macro
// If the last token intersects the first token, this creates a loop command outputted to chat
(async () => {
  // — CONFIGURATION —
  const durationInput = "500/70"; // either "1000" or "500/70"
  const startTimeBase = 0;        // initial delay in ms

  // — HELPERS —
  const delay = ms => d20plus.ut.promiseDelay(ms);
  const tokens = d20.engine.selected().map(w => w.model);
  if (!tokens.length) return alert("Select at least one token to record.");

  // parse the “n/70” style
  const isDistanceMode = durationInput.includes("/");
  const [nStr] = durationInput.split("/");
  const nValue = isDistanceMode ? Number(nStr) : null;

  // get Bar3 value or 0
  const getBar3 = t => Number(t.attributes.bar3_value) || 0;

  // — BUILD THE LIST —
  const entries = tokens
    .map(t => ({
      id:   t.id,
      x:    Math.round(t.attributes.left),
      y:    Math.round(t.attributes.top),
      rot:  Math.round(t.attributes.rotation || 0),
      val:  getBar3(t),
      model: t
    }))
    .sort((a, b) => a.val - b.val);

  // — COMPUTE TIMINGS / LOOPING —
  let currentStart = startTimeBase;
  const lines = [];
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    let dur;
    if (isDistanceMode && i < entries.length - 1) {
      // next waypoint → manhattan distance
      const next = entries[i + 1];
      const dx = Math.abs(next.x - e.x);
      const dy = Math.abs(next.y - e.y);
      const units = Math.floor((dx + dy) / 70);
      dur = units * nValue;
    } else {
      dur = isDistanceMode ? 0 : Number(durationInput);
    }
    lines.push(`movecmd id:${e.id} start:${currentStart} dur:${dur} x:${e.x} y:${e.y} rot:${e.rot}`);
    currentStart += dur;
  }

  // detect if first and last overlap → auto-loop
  const first = entries[0], last = entries[entries.length - 1];
  const isLooping = first.x === last.x && first.y === last.y;
  if (isLooping) {
    lines.push(`movecmd loop:true`);
  }

  // — OUTPUT —
  lines.forEach(l => d20plus.ut.chatLog(l));
  d20plus.ut.chatLog(`✅ Recording complete (${entries.length} points${isLooping? ", looping" : ""}).`);
})();
