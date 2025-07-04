// b20-JS: Clock Hands Macro
// Thjmze
// Used with these images for a working clock that can tick forward or backward
// https://i.postimg.cc/bSfj2Rdh/Clock-Hand-Minute-Final-For-Sure.png
// https://i.postimg.cc/sQhrXLjm/Clock-Hour-Hands-Final1.png
// https://i.postimg.cc/JD5WZkXH/Clock-with-no-hands-removebg-preview.png

(async () => {
    const page = d20.Campaign.activePage();
    const tokens = page.thegraphics.models.filter(t => t.attributes.layer === "objects");

    const hourHand = tokens.find(t => t.attributes.name === "HourHand");
    const minuteHand = tokens.find(t => t.attributes.name === "MinuteHand");

    if (!hourHand || !minuteHand) {
        return d20plus.ut.sendHackerChat("Could not find both HourHand and MinuteHand tokens on the page.", true);
    }

    // Normalize rotation
    const normalizeRotation = (rotation) => {
        while (rotation < 0) rotation += 360;
        while (rotation >= 360) rotation -= 360;
        return rotation;
    };

    let hourRotation = normalizeRotation(hourHand.attributes.rotation);
    let minuteRotation = normalizeRotation(minuteHand.attributes.rotation);

    hourHand.save({ rotation: hourRotation });
    minuteHand.save({ rotation: minuteRotation });

    d20plus.ut.sendHackerChat(`HourHand set to ${hourRotation}°.\nMinuteHand set to ${minuteRotation}°.`);

    // Dropdown Template Style
    const OPTIONS = {
        "Tick Forward": { action: "tick" },
        "Set Time": { action: "set" },
        "Auto-clock": { action: "auto" },
        "Stop Auto-clock": { action: "stop" },
    };

    const optionHtml = Object.keys(OPTIONS).map(k => `<option value="${k}">${k}</option>`).join("");

    const $dialog = $(`
        <div>
            Please select a clock action:<br>
            <select id="custom-selector" style="width: 100%; margin-top: 5px;">
                ${optionHtml}
            </select>
        </div>
    `).dialog({
        modal: true,
        title: "Clock Control Menu",
        buttons: {
            "Cancel": {
                text: "Cancel",
                click: () => $dialog.dialog("close")
            },
            "Confirm": {
                text: "Confirm",
                click: async () => {
                    const selectedKey = $("#custom-selector").val();
                    const selectedData = OPTIONS[selectedKey];
                    $dialog.dialog("close");

                    // Action Handlers:
                    if (selectedData.action === "tick") {
                        const minStr = prompt("Enter number of minutes to tick forward:", "15");
                        const mins = Number(minStr);
                        if (isNaN(mins) || mins < 0) return d20plus.ut.sendHackerChat("Invalid number of minutes.", true);

                        let minuteAdvance = mins * 6;
                        minuteRotation += minuteAdvance;
                        while (minuteRotation >= 360) {
                            minuteRotation -= 360;
                            hourRotation += 30;
                        }

                        hourRotation = normalizeRotation(hourRotation);

                        hourHand.save({ rotation: hourRotation });
                        minuteHand.save({ rotation: minuteRotation });
                        d20plus.ut.sendHackerChat(`Clock ticked forward ${mins} minutes.\nHourHand: ${hourRotation}°.\nMinuteHand: ${minuteRotation}°.`);

                    } else if (selectedData.action === "set") {
                        const timeStr = prompt("Enter time in HH:MM format (12-hour clock):", "1:30");
                        const [hoursStr, minsStr] = timeStr.split(":");
                        const hours = Number(hoursStr);
                        const mins = Number(minsStr);
                        if (isNaN(hours) || isNaN(mins) || hours < 1 || hours > 12 || mins < 0 || mins >= 60) {
                            return d20plus.ut.sendHackerChat("Invalid time format.", true);
                        }

                        hourRotation = normalizeRotation((hours % 12) * 30 + (mins / 60) * 30);
                        minuteRotation = normalizeRotation(mins * 6);

                        hourHand.save({ rotation: hourRotation });
                        minuteHand.save({ rotation: minuteRotation });
                        d20plus.ut.sendHackerChat(`Clock set to ${hours}:${mins.toString().padStart(2, '0')}.\nHourHand: ${hourRotation}°.\nMinuteHand: ${minuteRotation}°.`);

                    } else if (selectedData.action === "auto") {
                        if (window._autoClockRunning) {
                            d20plus.ut.sendHackerChat("Auto-clock is already running.");
                            return;
                        }

                        d20plus.ut.sendHackerChat("Starting auto-clock. It will tick every 1 minute. Use 'Stop Auto-clock' to stop.");

                        window._autoClockRunning = true;
                        window._autoClockStop = () => {
                            window._autoClockRunning = false;
                            d20plus.ut.sendHackerChat("Auto-clock stopped.");
                        };

                        const loop = async () => {
                            while (window._autoClockRunning) {
                                await d20plus.ut.promiseDelay(60000); // 1 minute
                                minuteRotation += 6;
                                if (minuteRotation >= 360) {
                                    minuteRotation -= 360;
                                    hourRotation += 30;
                                }
                                hourRotation = normalizeRotation(hourRotation);
                                minuteRotation = normalizeRotation(minuteRotation);

                                hourHand.save({ rotation: hourRotation });
                                minuteHand.save({ rotation: minuteRotation });

                                // Optional: Show current time (HH:MM)
                                const totalHours = Math.floor(hourRotation / 30);
                                const totalMinutes = Math.floor(minuteRotation / 6);
                                const timeStr = `${(totalHours === 0 ? 12 : totalHours)}:${totalMinutes.toString().padStart(2, '0')}`;
                                d20plus.ut.sendHackerChat(`🕒 Auto-clock tick: ${timeStr}`);
                            }
                        };

                        loop();

                    } else if (selectedData.action === "stop") {
                        if (window._autoClockRunning) {
                            window._autoClockStop();
                        } else {
                            d20plus.ut.sendHackerChat("Auto-clock is not running.");
                        }
                    }
                }
            }
        },
        close: () => $dialog.remove()
    });
})();
