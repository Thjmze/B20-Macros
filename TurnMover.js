// Better20 
// Uses info from RecordPath.js in GM notes to selectively move tokens per round. Each line = 1 round
// Thjmze

(() => {
  const NAMESPACE = 'TurnMover';
  // Prevent double activation
  if (window[NAMESPACE]?.isActive) return;
  window[NAMESPACE] = { isActive: true };
  d20plus.ut.chatLog('Turn Mover activated.');

  // — Helpers —
  function decodeNotes(raw) {
    let s = raw || '';
    try { s = decodeURIComponent(s); } catch {}
    s = s.replace(/<br\s*\/?>/gi, '\n');
    s = s.replace(/<[^>]+>/g, '');
    return s.trim();
  }

  /**
   * Parse lines in the GM notes matching:
   * movecmd start:<ms> dur:<ms> x:<left> y:<top> rot:<deg>
   * Ignores any id field; commands apply to the note-owner token.
   */
  function parseMoveCmds(notes) {
    return notes.split('\n')
      .map(line => line.trim())
      .filter(line => line.toLowerCase().startsWith('movecmd '))
      .map(line => {
        const parts = line.split(/\s+/).slice(1);
        const cmd = {};
        parts.forEach(part => {
          const [key, rawVal] = part.split(':');
          if (!key || rawVal == null) return;
          const num = Number(rawVal);
          cmd[key] = isNaN(num) ? rawVal : num;
        });
        return cmd;
      });
  }

  // — Execute for the token whose notes were read —
  function executeCommands(triggerToken) {
    const rawNotes = triggerToken.get('gmnotes') || '';
    const notes = decodeNotes(rawNotes);
    const cmds = parseMoveCmds(notes);
    if (!cmds.length) return;

    cmds.forEach(cmd => {
      const delay = (cmd.start || 0);
      setTimeout(() => {
        const updates = {};
        if (cmd.x != null && cmd.y != null) {
          updates.left = cmd.x;
          updates.top = cmd.y;
        }
        if (cmd.rot != null) updates.rotation = cmd.rot;
        triggerToken.set(updates);
      }, delay);
    });
  }

  // — Hook into initiative changes —
  d20.Campaign.initiativewindow.model.on('change:turnorder', () => {
    try {
      const raw = d20.Campaign.initiativewindow.model.get('turnorder');
      if (!raw || raw === '[]') return;
      const first = JSON.parse(raw)[0];
      if (!first?.id) return;
      const pg = d20.Campaign.pages.get(d20.Campaign.activePage());
      const triggerToken = pg?.thegraphics?.get(first.id);
      if (triggerToken) executeCommands(triggerToken);
    } catch (e) {
      console.error(`${NAMESPACE} initiative error:`, e);
    }
  });

  // Optional manual deactivate
  window[NAMESPACE].deactivate = () => {
    window[NAMESPACE].isActive = false;
    d20plus.ut.chatLog('⛔ Turn Command Macro v10 deactivated.');
  };
})();
