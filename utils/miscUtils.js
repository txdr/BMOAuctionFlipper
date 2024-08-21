const fs = require("fs").promises;

module.exports = {
    rand: (min, max) => {
        const minCeiled = Math.ceil(min);
        const maxFloored = Math.floor(max);
        return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
    },
    sleep: (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    formatNumberSuffix: (number) => {
        const suffixes = ["K", "M", "B", "T", "Q", "QI"];
        const thresholds = [1_000, 1_000_000, 1_000_000_000, 1_000_000_000_000, 1_000_000_000_000_000, 1_000_000_000_000_000_000]; // Corresponding thresholds

        for (let i = suffixes.length - 1; i >= 0; i--) {
            if (number >= thresholds[i]) {
                return (number / thresholds[i]).toFixed(1) + suffixes[i];
            }
        }
        return number.toString();
    },
    configPath: "./configs/",
    fileExists: (file) => fs.access(file, fs.constants.F_OK)
        .then(() => true)
        .catch(() => false)
};