// B20-Macros
// Thjmze
// Select a token and it will figure its X, Y position and rotation value

(() => {
    const selected = d20.engine.selected();

    if (selected.length !== 1) {
        return d20plus.ut.sendHackerChat("Please select exactly one token.", true);
    }

    const token = selected[0].model;

    if (!token) {
        return d20plus.ut.sendHackerChat("Could not retrieve token information.", true);
    }

    const xCoord = token.attributes.left;
    const yCoord = token.attributes.top;
    const rotation = token.attributes.rotation; // Added this line

    d20.textchat.doChatInput(`/w gm The selected token's coordinates are: X=${xCoord}, Y=${yCoord}, Rotation=${rotation}°`);
})();
