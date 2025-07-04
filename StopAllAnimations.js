// Better 20 Stop All Animations
// Thjmze
// Stops all animations running on the current page

(() => {
    const animator = d20plus.anim.animator;

    // Check if there are any tracked animations
    if (!animator._hasAnyActive()) {
        d20plus.ut.chatLog("No active animations found.");
        return;
    }

    let stoppedCount = 0;

    // Iterate through all tokens in the tracker
    for (const tokenId in animator._tracker) {
        if (!animator._tracker.hasOwnProperty(tokenId)) continue;

        const tokenMeta = animator._tracker[tokenId];
        const activeAnimations = tokenMeta.active;

        if (Object.keys(activeAnimations).length > 0) {
            // Stop all active animations for this token
            for (const animUid in activeAnimations) {
                if (activeAnimations.hasOwnProperty(animUid)) {
                    animator.endAnimation(tokenMeta.token, animUid);
                }
            }

            // Clean up the tracker entry if no animations remain
            if (!Object.keys(activeAnimations).length) {
                delete animator._tracker[tokenId];
            }

            stoppedCount++;
        }
    }

    if (stoppedCount > 0) {
        d20plus.ut.chatLog(`Stopped animations for ${stoppedCount} token(s).`);
    } else {
        d20plus.ut.chatLog("No active animations were found.");
    }

    // Save state after stopping animations
    animator._saveState();
})();
