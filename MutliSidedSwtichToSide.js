// Better 20 Macro
// Switches to 1-X sides for  multi-sided token(s)

(() => {
  // Grab the selected tokens
  const sel = d20.engine.selected();
  if (!sel.length) {
    return d20plus.ut.sendHackerChat("⚠ Please select at least one token.", true);
  }

  // Look at the first token to get its available sides
  const m0 = sel[0].model;
  const sidesAttr = m0.get("sides");
  if (!sidesAttr) {
    return d20plus.ut.sendHackerChat("⚠ The selected token is not multi-sided.", true);
  }
  const imgs = sidesAttr.split("|");
  const maxSide = imgs.length;

  // Ask the user which side to show (1-based)
  const input = prompt(`Enter side number (1–${maxSide}):`, "1");
  if (input === null) return;  // user cancelled

  const num = parseInt(input, 10);
  if (isNaN(num) || num < 1 || num > maxSide) {
    return d20plus.ut.sendHackerChat(`⚠ Invalid side number: ${input}`, true);
  }
  const idx = num - 1;

  // Apply to every selected token
  sel.forEach(obj => {
    const m = obj.model;
    m.save({
      currentSide: idx,
      imgsrc:      unescape(imgs[idx])
    });
  });
})();
