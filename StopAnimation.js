// StopAnimations
// Thjmze
// Stops all animations running on one selected token
(() => {
    const selected = d20.engine.selected();
    
    if (!selected.length) {
        d20plus.ut.chatLog("No tokens selected. Please select tokens with active animations.");
        return;
    }
    
    let stoppedCount = 0;
    
    selected.forEach(token => {
        if (token.model) {
            const tokenId = token.model.id;
            const tracker = d20plus.anim.animator._tracker[tokenId];
            
            if (tracker && Object.keys(tracker.active).length) {
                // End all active animations for this token
                Object.keys(tracker.active).forEach(animUid => {
                    d20plus.anim.animator.endAnimation(token.model, animUid);
                });
                
                stoppedCount++;
            }
        }
    });
    
    if (stoppedCount) {
        d20plus.ut.chatLog(`Stopped animations for ${stoppedCount} token(s).`);
    } else {
        d20plus.ut.chatLog("No active animations found on selected tokens.");
    }
})();
