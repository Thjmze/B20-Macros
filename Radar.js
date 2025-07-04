// Better20 Radar
// Put down a token named RadarPing or change it in Map of character name => color
// Running this whilst selecting a token will detect all RadarPings in a location. I suggest using an invisible token for Radar Ping
// Useful for running traps that you want the players to detect something or if someone has detect trap


(async () => {
  // ==============================
  //      CONFIGURATION SECTION
  // ==============================

  // Range to scan (feet)
  const SCAN_RADIUS_FT = 30;  // Try 30, 60, 90, etc

  // Map of NPC type => color (css color or hex)
  const NPC_TYPE_COLORS = [
    "celestial#yellow",
    "fiend#red",
    "undead#blue"
  ];

  // Map of character name => color
  const REPRESENTS_COLORS = [
    "RadarPing#purple"
  ];

  // Show NPCs of types NOT in NPC_TYPE_COLORS? (1=show as green, 0=hide)
  const NPCDefaultVisibility = 1;

  // Show tokens that match REPRESENTS_COLORS? (1=show as colored blip, 0=hide)
  const RepresentsVisibility = 1;

  // Fallback color for default NPCs (if NPCDefaultVisibility is on)
  const DEFAULT_NPC_COLOR = "#19ff20"; // Green

  // Radar visual size in px (diameter for the whole table, ~300 is nice)
  const RADAR_DIAM_PX = 308;

  // Blip size (px)
  const BLIP_SIZE = 14;

  // ==============================
  //     END CONFIGURATION
  // ==============================

  // Radar grid config
  const N = 14;
  const radius = 7;
  // Dynamically calculate cell size to fill the visual diameter
  const cellSize = Math.floor(RADAR_DIAM_PX / N);
  const cx = (N - 1) / 2;
  const cy = (N - 1) / 2;
  const PX_PER_5FT = 70;

  // Radar style colors
  const outer = "#002900";
  const center = "#073f0a";
  const inside = "#064412";
  const bg = "#002900";

  // Parse config arrays into usable lists
  function parseConfig(arr) {
    return arr.map(e => {
      const [type, color] = e.split("#");
      return { type: type.trim().toLowerCase(), color: (color || "").trim() };
    });
  }
  const npcTypeFilters = parseConfig(NPC_TYPE_COLORS);
  const representsFilters = parseConfig(REPRESENTS_COLORS);

  // Find source token
  const sel = d20.engine.selected();
  if (!sel.length) return d20plus.ut.sendHackerChat("Select a token as your radar source.");
  const srcToken = sel[0].model;

  // Get character attribute from character sheet
  function getCharAttr(token, attrName) {
    if (token.attributes.represents) {
      const charId = token.attributes.represents;
      const character = d20.Campaign.characters.get(charId);
      if (character) {
        const attrObj = character.attribs.models.find(
          a => (a.attributes.name || "").toLowerCase() === attrName.toLowerCase()
        );
        if (attrObj) return attrObj.attributes.current;
      }
    }
    return undefined;
  }

  // Find character ID by name (case-insensitive)
  function getCharIdByName(charName) {
    const c = d20.Campaign.characters.models.find(
      char => (char.attributes.name || "").toLowerCase() === charName.toLowerCase()
    );
    return c ? c.id : null;
  }
  // Map character names in filter to IDs
  const representsIdColor = {};
  for (const rcfg of representsFilters) {
    const id = getCharIdByName(rcfg.type);
    if (id) representsIdColor[id] = rcfg.color;
  }

  // Macro logic for grid mapping
  const GRID_RADIUS_FT = SCAN_RADIUS_FT;
  const FT_PER_CELL = GRID_RADIUS_FT / radius;

  // Get all tokens in range and not on GM layer (except self)
  const page = d20.Campaign.activePage();
  const tokens = page.thegraphics.models.filter(t =>
    t.attributes.type === "image" &&
    t.id !== srcToken.id &&
    t.attributes.layer !== "gmlayer"
  );

  // Map tokens to grid cells
  let blipCells = [];
  tokens.forEach(token => {
    // Represents logic (only process if RepresentsVisibility is ON)
    if (RepresentsVisibility === 1 && token.attributes.represents && representsIdColor[token.attributes.represents]) {
      const dx = token.attributes.left - srcToken.attributes.left;
      const dy = token.attributes.top - srcToken.attributes.top;
      const distFt = Math.sqrt(dx * dx + dy * dy) / PX_PER_5FT * 5;
      if (distFt <= GRID_RADIUS_FT + FT_PER_CELL/2) {
        const cellDx = dx / PX_PER_5FT * 5 / FT_PER_CELL;
        const cellDy = dy / PX_PER_5FT * 5 / FT_PER_CELL;
        const gridX = Math.round(cx + cellDx);
        const gridY = Math.round(cy + cellDy);
        if (
          gridX >= 0 && gridX < N &&
          gridY >= 0 && gridY < N
        ) {
          blipCells.push({
            x: gridX,
            y: gridY,
            name: token.attributes.name || "",
            color: representsIdColor[token.attributes.represents],
            shadow: representsIdColor[token.attributes.represents]
          });
        }
      }
      return; // Do NOT also show as NPC blip
    }

    // Only process NPCs below
    const npcAttr = getCharAttr(token, "npc");
    if (!(npcAttr == 1 || npcAttr === "1")) return;

    // 2. By npc type (from character sheet attribute "npc_type" or "type" for monster manual sheets)
    const npcType = getCharAttr(token, "npc_type") || getCharAttr(token, "type") || "";
    const typeMatch = npcTypeFilters.find(f =>
      npcType.toLowerCase().includes(f.type)
    );
    if (typeMatch) {
      // Matched a listed type
      const dx = token.attributes.left - srcToken.attributes.left;
      const dy = token.attributes.top - srcToken.attributes.top;
      const distFt = Math.sqrt(dx * dx + dy * dy) / PX_PER_5FT * 5;
      if (distFt <= GRID_RADIUS_FT + FT_PER_CELL/2) {
        const cellDx = dx / PX_PER_5FT * 5 / FT_PER_CELL;
        const cellDy = dy / PX_PER_5FT * 5 / FT_PER_CELL;
        const gridX = Math.round(cx + cellDx);
        const gridY = Math.round(cy + cellDy);
        if (
          gridX >= 0 && gridX < N &&
          gridY >= 0 && gridY < N
        ) {
          blipCells.push({
            x: gridX,
            y: gridY,
            name: token.attributes.name || "",
            color: typeMatch.color,
            shadow: typeMatch.color
          });
        }
      }
      return; // Do not also do default
    }
    // 3. Default NPC logic (if enabled and no type match)
    if (NPCDefaultVisibility === 1) {
      const dx = token.attributes.left - srcToken.attributes.left;
      const dy = token.attributes.top - srcToken.attributes.top;
      const distFt = Math.sqrt(dx * dx + dy * dy) / PX_PER_5FT * 5;
      if (distFt <= GRID_RADIUS_FT + FT_PER_CELL/2) {
        const cellDx = dx / PX_PER_5FT * 5 / FT_PER_CELL;
        const cellDy = dy / PX_PER_5FT * 5 / FT_PER_CELL;
        const gridX = Math.round(cx + cellDx);
        const gridY = Math.round(cy + cellDy);
        if (
          gridX >= 0 && gridX < N &&
          gridY >= 0 && gridY < N
        ) {
          blipCells.push({
            x: gridX,
            y: gridY,
            name: token.attributes.name || "",
            color: DEFAULT_NPC_COLOR,
            shadow: DEFAULT_NPC_COLOR
          });
        }
      }
    }
  });

  // --- Build table ---
  let table = `<table style="border-collapse:collapse; margin:0 auto; background:${bg}; border-radius:50%; box-shadow:0 0 28px #002900 inset; table-layout:fixed; width:${N * cellSize}px; height:${N * cellSize}px;">`;
  for (let r = 0; r < N; ++r) {
    table += `<tr>`;
    for (let c = 0; c < N; ++c) {
      const dx = c - cx;
      const dy = r - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let color = '';
      if (dist > radius + 0.5) {
        color = bg;
      } else if (dist >= radius - 0.5 && dist <= radius + 0.5) {
        color = outer;
      } else if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
        color = center;
      } else {
        color = inside;
      }

      // Source blip: at center cell
      if (c === Math.round(cx) && r === Math.round(cy)) {
        table += `<td style="width:${cellSize}px;height:${cellSize}px;padding:0; background:${color};text-align:center;vertical-align:middle;">
          <div style="width:${BLIP_SIZE+2}px;height:${BLIP_SIZE+2}px;margin:auto;background:#00ffe8;border-radius:5px;transform:rotate(45deg);border:2px solid #fff;box-shadow:0 0 12px #0ff, 0 0 8px #00f inset;"></div>
        </td>`;
        continue;
      }

      // Place a blip if this cell matches any blip's x/y
      const blip = blipCells.find(b => b.x === c && b.y === r);

      if (blip) {
        table += `<td style="width:${cellSize}px;height:${cellSize}px;padding:0; background:${color};text-align:center;vertical-align:middle;">
          <div title="${blip.name}" style="width:${BLIP_SIZE}px;height:${BLIP_SIZE}px;margin:auto;background:${blip.color};border-radius:50%;box-shadow:0 0 8px ${blip.shadow};border:2px solid #fff;"></div>
        </td>`;
      } else if (color === center) {
        // If not the source, show the normal faint center diamond
        table += `<td style="width:${cellSize}px;height:${cellSize}px;padding:0; background:${color};text-align:center;vertical-align:middle;">
          <div style="width:12px;height:12px;margin:auto;background:#00ffe899;border-radius:3px;transform:rotate(45deg);border:2px solid #99ffff;"></div>
        </td>`;
      } else {
        table += `<td style="width:${cellSize}px;height:${cellSize}px;padding:0; background:${color};"></td>`;
      }
    }
    table += `</tr>`;
  }
  table += `</table>`;

  // Output to chat
  if (window.d20plus && d20plus.ut && d20plus.ut.sendHackerChat) {
    d20plus.ut.sendHackerChat(table);
  } else if (window.d20plus && d20plus.ut && d20plus.ut.chatLog) {
    d20plus.ut.chatLog(table);
  } else {
    sendChat('Radar', '/w gm ' + table);
  }
})();
