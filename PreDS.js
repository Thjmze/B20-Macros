// Pre Divine Sense Macro
// If your player with Divine Sense wants to use their macro, run this beforehand. Otherwise DS won't detect anything. 
(async () => {
  // ======= CONFIGURE YOUR TAGS HERE =======
  // List of {tag, keyword} pairs
  const TAGS = [
    { tag: "Fiend", keyword: "fiend" },
    { tag: "Celestial", keyword: "celestial" },
    { tag: "Undead", keyword: "undead" },
    { tag: "Elemental", keyword: "elemental" }
  ];

  // --------- MAIN LOGIC -----------
  const page = d20.Campaign.activePage();
  let changed = 0;
  for (const token of page.thegraphics.models) {
    if (token.attributes.type !== "image" || token.attributes.layer === "gmlayer") continue;
    const name = token.attributes.name || "";
    const represents = token.attributes.represents;
    if (!represents) continue; // skip if not linked to a character
    const character = d20.Campaign.characters.get(represents);
    if (!character) continue;

    // Try to get npc_type or type attribute
    let typeVal = "";
    for (const attrName of ["npc_type", "type"]) {
      const attrObj = character.attribs.models.find(
        a => (a.attributes.name || "").toLowerCase() === attrName
      );
      if (attrObj && attrObj.attributes.current) {
        typeVal = (attrObj.attributes.current || "").toLowerCase();
        break;
      }
    }
    if (!typeVal) continue; // skip if no type

    // Look for matching tag
    const match = TAGS.find(tagobj => typeVal.includes(tagobj.keyword));
    if (!match) continue;

    // If token name already ends with tag, skip
    if (name.toLowerCase().endsWith(match.tag.toLowerCase())) continue;

    // Rename token
    const newName = name + match.tag;
    await token.save({ name: newName });
    changed++;
  }

  d20plus.ut.sendHackerChat(`/w gm 🏷️ Updated names of ${changed} tokens with their NPC tags!`);
})();
