const Flipper = require("./flipper");
const chalk = require("chalk");
const mUtils = require("../utils/miscUtils.js");

class FlipperManager {

    constructor() {
        /*** @type {Map<string, Flipper>}*/
        this.flippers = new Map();
    }

    async cosmeticLoop() {
        while(true) {
            console.clear();

            let current = 0;
            this.flippers.forEach((flipper, name) => {
                current++;
                console.log([
                    chalk.green(`Bot #${current} - ${name}${flipper.purchasing ? chalk.greenBright(" [PURCHASING]") : ""}`),
                    chalk.gray("Last refresh: ") + chalk.white((new Date()).getTime() - flipper.lastRefresh + "ms"),
                    chalk.gray("Respawns: ") + chalk.white(flipper.timesSpawned),
                    chalk.gray("Last Item: ") + chalk.white(flipper.lastItemName),
                    chalk.gray("Last Item Price: ") + chalk.white(mUtils.formatNumberSuffix(flipper.lastItemPrice)) + chalk.gray("(") + chalk.white(mUtils.formatNumberSuffix(flipper.lastPricePerItem) + "/per") + chalk.gray(")")
                ].join("\n"));
            });

            await mUtils.sleep(25);
        }
    }

    addFlipper(accountName, accountToken, config) {
        const flipper = new Flipper(accountName, accountToken, config);
        this.flippers.set(accountName, flipper);
        return flipper;
    }

}

module.exports = FlipperManager;