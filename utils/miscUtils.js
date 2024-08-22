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
        const thresholds = [1_000, 1_000_000, 1_000_000_000, 1_000_000_000_000, 1_000_000_000_000_000, 1_000_000_000_000_000_000];

        for (let i = suffixes.length - 1; i >= 0; i--) {
            if (number >= thresholds[i]) {
                return (number / thresholds[i]).toFixed(1) + suffixes[i];
            }
        }
        return number.toString();
    },
    configPath: process.cwd() + "\\configs\\",
    fileExists: (file) => fs.access(file, fs.constants.F_OK)
        .then(() => true)
        .catch(() => false),
    romanToInt: (roman) => {
        const romanNumeralMap = {
            "I": 1, "V": 5,
            "X": 10, "L": 50, "C": 100,
            "D": 500, "M": 1000
        };
        let intValue = 0;
        for (let i = 0; i < roman.length; i++) {
            const current = romanNumeralMap[roman[i]];
            const next = romanNumeralMap[roman[i + 1]];
            if (next && current < next) {
                intValue -= current;
            } else {
                intValue += current;
            }
        }
        return intValue;
    }
};