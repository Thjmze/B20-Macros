// b20-JS: Token Mover
// Meant to be used in conjunction with RecordPath.js, this will prompt you to copy & paste the results from record path from chat.
// Selected token will follow this pre-determined path and loop if you want it to.
// Don't worry about the "better20:" when you copy and paste from chat lol
(async () => {
  const NAMESPACE = 'tokenMove';
  if (window[NAMESPACE]?.isActive) return;

  // 1) Collect your commands via a jQuery UI dialog
  const raw = await new Promise(resolve => {
    const $dlgIn = $(`
      <div>
        <p>Paste your movecmd lines here (one per row):</p>
        <textarea id="tmInput" style="width:100%;height:150px;"></textarea>
      </div>
    `).dialog({
      title: 'Token Move Executor ▶ Paste Commands',
      width: 450,
      modal: true,
      buttons: {
        Cancel() {
          resolve(null);
          $dlgIn.dialog('close').remove();
        },
        OK() {
          resolve($dlgIn.find('#tmInput').val().trim());
          $dlgIn.dialog('close').remove();
        }
      },
      close() { $dlgIn.remove(); }
    });
  });
  if (!raw) {
    return d20plus.ut.chatLog('⚠️ Executor cancelled (no input).');
  }

  // 2) Activate & show Stop button
  window[NAMESPACE] = { isActive: true };
  d20plus.ut.chatLog('✅ Token Mover');
  const $dlgStop = $(`<div style="padding:1em;"><p>Executor running…</p></div>`).dialog({
    title: 'Token Move Executor V4',
    width: 300,
    modal: false,
    buttons: {
      Stop() {
        window[NAMESPACE].deactivate();
        $dlgStop.dialog('close');
      }
    },
    close() { $dlgStop.remove(); }
  });

  // Helpers
  const delay = ms => d20plus.ut.promiseDelay(ms);
  function getTokenById(id) {
    const pg = d20.Campaign.pages.get(d20.Campaign.activePage());
    return pg?.thegraphics?.get(id) || null;
  }

  try {
    // 3) Grab selected tokens
    const wraps = d20.engine.selected();
    if (!wraps.length) throw new Error('Please select at least one token.');

    const singleModel = wraps.length === 1 ? wraps[0].model : null;
    const sortedModels = wraps.length > 1
      ? wraps.map(w => w.model)
             .sort((a,b)=> (Number(a.attributes.bar3_value)||0) - (Number(b.attributes.bar3_value)||0))
      : [];

    // 4) Parse movecmd lines
    const lines = raw.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
    const commands = [];
    let shouldLoop = false;

    for (let ln of lines) {
      ln = ln.replace(/^[^:\s]+:/, '').trim();                // strip any “tag:” prefix
      if (/^movecmd\s+loop:true$/i.test(ln)) { shouldLoop = true; continue; }
      const parts = ln.split(/\s+/);
      if (parts[0]?.toLowerCase() !== 'movecmd') continue;
      const kv = {};
      for (let i=1; i<parts.length; i++) {
        const [k,v] = parts[i].split(':');
        if (k && v!=null) kv[k] = v;
      }
      if (!kv.start||!kv.dur||!kv.x||!kv.y||!kv.rot) continue;
      commands.push({
        id:       kv.id    || null,
        start:    Number(kv.start)||0,
        duration: Number(kv.dur)  ||0,
        x:        Number(kv.x)    ||0,
        y:        Number(kv.y)    ||0,
        rot:      Number(kv.rot)  ||0,
        model:    null
      });
    }
    if (!commands.length) throw new Error('No valid movecmd lines found.');

    // 5) Ask for loop if needed
    if (!shouldLoop) {
      const ans = await new Promise(res => {
        const $q = $(`<div><p>Loop at end?</p></div>`).dialog({
          title: 'Loop?',
          modal: true,
          buttons: {
            Yes() { res(true);  $q.dialog('close').remove(); },
            No()  { res(false); $q.dialog('close').remove(); }
          },
          close() { $q.remove(); }
        });
      });
      shouldLoop = ans;
    }

    // 6) Bind commands → model
    let idx = 0;
    for (const cmd of commands) {
      if (singleModel) {
        // **single-token override**: every cmd goes to that token
        cmd.model = singleModel;
      } else if (cmd.id) {
        cmd.model = getTokenById(cmd.id);
      } else {
        cmd.model = sortedModels[idx++];
      }
      if (!cmd.model) {
        d20plus.ut.chatLog(`⚠️ Missing token for start=${cmd.start}` +
                          (cmd.id? ` (id=${cmd.id})` : ''));
      }
    }

    // 7) Execute!
    async function runSequence() {
      const t0 = Date.now();
      for (const cmd of commands) {
        if (!window[NAMESPACE].isActive) return;
        const m = cmd.model;
        if (!m) continue;

        const elapsed = Date.now() - t0;
        if (cmd.start > elapsed) await delay(cmd.start - elapsed);

        // debug
        const nm = m.attributes.name;
        const v3 = Number(m.attributes.bar3_value)||0;
        d20plus.ut.chatLog(`🔧 Moving "${nm}" (Bar3=${v3}) → (${cmd.x},${cmd.y})`);

        // ghost-delta-safe absolute move
        d20.engine.unselect();
        await delay(50);
        await m.save({
          left:     cmd.x,
          top:      cmd.y,
          rotation: cmd.rot,
          lastmove: ""
        });
        await delay(50);
        d20.Campaign.activePage().debounced_recordZIndexes();
        await delay(50);
      }
      if (shouldLoop && window[NAMESPACE].isActive) runSequence();
    }

    runSequence();
  } catch (err) {
    d20plus.ut.chatLog(`⚠️ Executor error: ${err.message}`);
    window[NAMESPACE].isActive = false;
    $dlgStop.dialog('close');
  }

  // manual stop
  window[NAMESPACE].deactivate = () => {
    window[NAMESPACE].isActive = false;
    d20plus.ut.chatLog('⛔ Token Move Executor V4 deactivated.');
  };
})();
