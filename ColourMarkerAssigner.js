// b20-JS: Colour Marker Assigner 
// Thjmze
// Select up to 7 tokens. This will assign each token a unique colour status marker. Useful if you have 7 or less enemies that look similar so you can say "I attack the pink one" instead of having to do virtual charades

(async () => {
    const selected = d20.engine.selected().map(s => s.model).filter(t => t?.attributes?.type === "image");
    if (!selected.length) {
        return d20plus.ut.sendHackerChat("⚠️ Please select at least one token first.");
    }

    const colours = ["red", "blue", "green", "brown", "purple", "pink", "yellow"];

    if (selected.length > colours.length) {
        return d20plus.ut.sendHackerChat(`⚠️ You selected ${selected.length} tokens but only ${colours.length} colours are available.`);
    }

    for (let i = colours.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [colours[i], colours[j]] = [colours[j], colours[i]];
    }

    for (let idx = 0; idx < selected.length; idx++) {
        const token = selected[idx];

        d20.engine.unselect();
        await d20plus.ut.promiseDelay(50);

        d20plus.anim.animatorTool?.pauseTransforms?.();

        const oldMarkers = token.attributes.statusmarkers.split(",").filter(Boolean);
        const newMarkers = oldMarkers.filter(m => !colours.includes(m)).concat(colours[idx]);

        token.save({
            statusmarkers: newMarkers.join(","),
            left: token.attributes.left,
            top: token.attributes.top,
            rotation: token.attributes.rotation,
            lastmove: "" // still safe to clear this too
        });

        await d20plus.ut.promiseDelay(50);

        d20plus.anim.animatorTool?.resumeTransforms?.();
        d20.Campaign.activePage().debounced_recordZIndexes();

        await d20plus.ut.promiseDelay(50);
    }

    d20plus.ut.sendHackerChat(`Colour assignment complete (FINAL FULL SAFE - no movement).`);
})();
