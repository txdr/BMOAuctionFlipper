const axios = require("axios");
const miscUtils = require("./miscUtils.js");

const getLore = (item) => {
    if (item?.nbt?.value?.display?.value?.Lore?.value?.value) {
        return item.nbt.value.display.value.Lore.value.value;
    }
    return [];
};

const stripColorCodes = (input) => {
    return input.replace(/§[0-9a-fk-or]/gi, "");
};

module.exports = {
    getLore,
    getLoreStripped: (item) => {
        let replaced = [];
        for (const p of getLore(item)) {
            replaced.push(stripColorCodes(p));
        }
        return replaced;
    },
    getClientToken: async (accessToken) => {
        return axios.get("https://api.minecraftservices.com/minecraft/profile", {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }).then((response) => response.data).catch(console.log);
    },
    findItemByCustomName: async (window, name) => {
        return new Promise((resolve) => {
            let item = null;
            for (const i of window.containerItems()) {
                if (i.customName === name) {
                    item = i;
                    break;
                }
            }
            resolve(item);
        });
    },
    stripColorCodes,
    getItemPrice: (item) => {
        if (!item) {
            return -1;
        }
        const lore = getLore(item);
        if (lore.length < 3) {
            return -1;
        }
        let currentPrice = lore[lore.length - 3];
        if (!currentPrice) {
            return -1;
        }
        currentPrice = currentPrice.replace(/§[0-9a-f]/g, '').match(/\$([\d,]+)/);
        if (currentPrice) {
            return parseInt(currentPrice[1].replace(/,/g, ''));
        }
        return -1;
    },
    parseEnchantments: (inputArray) => {
        const enchantmentMap = new Map();
        const enchantmentRegex = /^([\w\s]+?)\s+([IVXLCDM]+)$/;
        for (const line of inputArray) {
            const trimmedLine = line.trim();
            const match = enchantmentRegex.exec(trimmedLine);
            if (match) {
                const enchantName = match[1].trim();
                enchantmentMap.set(enchantName, miscUtils.romanToInt(match[2]));
            }
        }
        return enchantmentMap;
    }
};