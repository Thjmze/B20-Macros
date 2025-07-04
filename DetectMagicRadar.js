// Radar for Detect Magic
// Outputs a radar image in chat on a custom radius of choice. You might have to adjust the px a little bit for extreme changes.
// How to use: wherever you want magic detectable, put down a token named detectmagicping. Then have yourself or a player activate this macro. It'll print out an image in chat that looks like a radar
// If you want to change the name of the token, modify it in " --- PROCESS TOKENS TO FIND BLIPS ---" a couple rows down

(async () => {
  // ==============================
  //       CONFIGURATION SECTION
  // ==============================

  const SCAN_RADIUS_FT = 30; // Range of detect magic (feet)
  const RADAR_DIAM_PX = 308;
  const BLIP_COLOR = "#680868 "; // Purple
  const BLIP_SIZE = 14;

  // --- Radar grid ---
  const N = 14;
  const radius = 7;
  const cellSize = Math.floor(RADAR_DIAM_PX / N);
  const cx = (N - 1) / 2;
  const cy = (N - 1) / 2;
  const PX_PER_5FT = 70;
  const GRID_RADIUS_FT = SCAN_RADIUS_FT;
  const FT_PER_CELL = GRID_RADIUS_FT / radius;

  // Radar style colors
  const outer = "#002900";
  const center = "#073f0a";
  const inside = "#064412";
  const bg = "#002900";

  // --- MAIN LOGIC ---

  // Find source token
  const sel = d20.engine.selected();
  if (!sel.length) return d20plus.ut.sendHackerChat("Select a token as your radar source.");
  const srcToken = sel[0].model;
  const { left: srcLeft, top: srcTop } = srcToken.attributes;

  // --- GET ALL TOKENS ON PAGE (not self, not GM layer) ---
  const page = d20.Campaign.activePage();
  const tokens = page.thegraphics.models.filter(t =>
    t.attributes.type === "image" &&
    t.id !== srcToken.id &&
    t.attributes.layer !== "gmlayer"
  );

  // --- PROCESS TOKENS TO FIND BLIPS ---
  const blipCells = [];
  tokens.forEach(token => {
    const name = (token.attributes.name || "").toLowerCase();
    if (!name.includes("detectmagicping")) return;

    // Relative position and distance
    const dx = token.attributes.left - srcLeft;
    const dy = token.attributes.top - srcTop;
    const distFt = Math.sqrt(dx * dx + dy * dy) / PX_PER_5FT * 5;
    if (distFt > GRID_RADIUS_FT + FT_PER_CELL / 2) return;

    const cellDx = (dx / PX_PER_5FT * 5) / FT_PER_CELL;
    const cellDy = (dy / PX_PER_5FT * 5) / FT_PER_CELL;
    const gridX = Math.round(cx + cellDx);
    const gridY = Math.round(cy + cellDy);

    // --- SIZE SCALING ---
    let tokenWidthFt = token.attributes.width / 70 * 5;
    let tokenHeightFt = token.attributes.height / 70 * 5;
    let tokenWidthCells = Math.max(1, Math.round(tokenWidthFt / FT_PER_CELL));
    let tokenHeightCells = Math.max(1, Math.round(tokenHeightFt / FT_PER_CELL));

    // Mark all radar cells covered by this token
    for (let dxi = -Math.floor(tokenWidthCells/2); dxi <= Math.floor((tokenWidthCells-1)/2); ++dxi) {
      for (let dyi = -Math.floor(tokenHeightCells/2); dyi <= Math.floor((tokenHeightCells-1)/2); ++dyi) {
        let gx = gridX + dxi;
        let gy = gridY + dyi;
        if (gx >= 0 && gx < N && gy >= 0 && gy < N) {
          blipCells.push({
            x: gx,
            y: gy,
            name: token.attributes.name || "",
            color: BLIP_COLOR,
            shadow: BLIP_COLOR
          });
        }
      }
    }
  });

  // --- BUILD HTML TABLE ---
  const cellBaseStyle = `width:${cellSize}px;height:${cellSize}px;padding:0;text-align:center;vertical-align:middle;`;

  let table = `<table style="border-collapse:collapse; margin:0 auto; background:${bg}; border-radius:50%; box-shadow:0 0 28px #002900 inset; table-layout:fixed; width:${N * cellSize}px; height:${N * cellSize}px;">`;
  for (let r = 0; r < N; ++r) {
    table += `<tr>`;
    for (let c = 0; c < N; ++c) {
      const dx = c - cx;
      const dy = r - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let color = '';
      if (dist > radius + 0.5) color = bg;
      else if (dist >= radius - 0.5 && dist <= radius + 0.5) color = outer;
      else if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) color = center;
      else color = inside;

      const blip = blipCells.find(b => b.x === c && b.y === r);
      let content = '';

      if (c === Math.round(cx) && r === Math.round(cy)) {
        // Source blip (player) at the center
        content = `<div style="width:${BLIP_SIZE+2}px;height:${BLIP_SIZE+2}px;margin:auto;background:#00ffe8;border-radius:5px;transform:rotate(45deg);border:2px solid #fff;box-shadow:0 0 12px #0ff, 0 0 8px #00f inset;"></div>`;
      } else if (blip) {
        // Detected token blips
        content = `<div title="${blip.name}" style="width:${BLIP_SIZE}px;height:${BLIP_SIZE}px;margin:auto;background:${blip.color};border-radius:50%;box-shadow:0 0 8px ${blip.shadow};border:2px solid #fff;"></div>`;
      } else if (color === center) {
        // Faint center diamond if not the source
        content = `<div style="width:12px;height:12px;margin:auto;background:#00ffe899;border-radius:3px;transform:rotate(45deg);border:2px solid #99ffff;"></div>`;
      }

      table += `<td style="${cellBaseStyle}background:${color};">${content}</td>`;
    }
    table += `</tr>`;
  }
  table += `</table>`;

  // --- OUTPUT TO GM CHAT ONLY ---
  if (window.d20plus && d20plus.ut && d20plus.ut.sendHackerChat) {
    d20plus.ut.sendHackerChat(table);
  } else if (window.d20plus && d20plus.ut && d20plus.ut.chatLog) {
    d20plus.ut.chatLog(table);
  } else {
    sendChat('Detect Magic', '/w gm ' + table);
  }
})();
