const mineflayer = require("mineflayer");
const mineUtils = require("../utils/minecraftUtils.js");
const miscUtils = require("../utils/miscUtils.js");
const menus = require("./menuTypes.js");
const { setIntervalAsync, clearIntervalAsync } = require("set-interval-async");
const fs = require("fs").promises;

class Flipper {

    constructor(username, token, config) {
        this.username = username;
        this.token = token;
        this.config = config;
        this.timesSpawned = 0;
        this.waitingMenu = menus.hold;
        this.waitingMenuClose = menus.hold;
        this.lastRefresh = (new Date()).getTime();
        this.lastItemName = "N/A";
        this.lastItemPrice = 0;
        this.lastPricePerItem = 0;
        this.purchasing = false;
        this.mode = this.config.mode;
        this.flipping = this.mode !== "sniping";
        this.timesRefreshed = 0;
        this.debug = this.config["debug"];
        this.lastPurchasedItem = null;
        this.lastPurchasedItemSellingPrice = -1;
        this.selling = false;
        this.lastPurchaseCount = -1;
        this.dStatus = 0;
        this.lastItemCustomName = "";

        (async () => {
            await this.initialize();
        })();
    }

    async initialize() {
        const clientToken  = await mineUtils.getClientToken(this.token);
        this.bot = mineflayer.createBot({
            host: "play.minecadia.com",
            username: this.username,
            auth: "mojang", // skipValidation only registers under mojang authentication. (mineflayer sucks ass imo)
            skipValidation: true,
            version: "1.8.9",
            session: {
                accessToken: this.token,
                clientToken: clientToken.id,
                selectedProfile: {
                    id: clientToken.id,
                    name: this.username
                },
            }
        });
        this.bot.on("spawn", async () => await this.onSpawn());
        this.bot.on("windowOpen", async (window) => await this.windowOpen(window));
        this.bot.on("windowClose", async (window) => await this.windowClose(window));
        this.bot.on("kicked", console.log);
        this.bot.on("error", console.log);
    }

    async windowClose(window) {
        if (this.waitingMenuClose === menus.hold) {
            // to-do: track which windows are open and handle random closing here.
            // note: this can change in certain conditions bruh (note: nevermind)
            // idek what i was talkin bout here
            return;
        }
        switch (this.waitingMenuClose) {
            case menus.waitingAuctionConfirm:
                this.waitingMenuClose = menus.hold;
                await this.bot.closeWindow(window);

                if (this.flipping && this.lastPurchasedItemSellingPrice > 1) {
                    this.selling = true;
                    await miscUtils.sleep(250);
                    await this.bot.chat(`/ah sell ${this.lastPurchasedItemSellingPrice * this.lastPurchaseCount}`);
                    this.waitingMenu = menus.waitingAuctionHouse;
                    this.selling = false;
                    await miscUtils.sleep(500);
                }

                this.waitingMenu = menus.waitingAuctionHouse;
                await miscUtils.sleep(250);
                await this.bot.chat("/ah");
                break;
        }
    }

    async windowOpen(window) {
        if (this.waitingMenu === menus.hold) {
            return;
        }
        switch(this.waitingMenu) {
            case menus.waitingServerSelector:
                this.waitingMenu = menus.hold;
                await miscUtils.sleep(miscUtils.rand(450, 650));
                const item = await mineUtils.findItemByCustomName(window, "§6Factions§7: §ePirate §7(1.8.9)");
                await this.bot.clickWindow(item.slot, 0, 0);
                break;
            case menus.waitingAuctionHouse:
                this.waitingMenu = menus.hold;
                let passEnchants;
                const refreshLoop = setIntervalAsync(async () => {
                    passEnchants = true;
                    const item = await mineUtils.findItemByCustomName(window, "§6§lRefresh Auction");
                    if (!item || !item.slot) {
                        await clearIntervalAsync(refreshLoop);
                        await this.bot.closeWindow(window);
                        await miscUtils.sleep(200);
                        this.waitingMenu = menus.waitingAuctionHouse;
                        await this.bot.chat("/ah");
                        return;
                    }
                    await this.bot.clickWindow(item.slot, 0, 0);
                    this.lastRefresh = (new Date()).getTime();
                    this.timesRefreshed++;
                    if (this.debug && this.timesRefreshed < 2) {
                        let items = [];
                        for (const i of window.containerItems()) {
                            items.push({
                                normalName: i.name,
                                customName: i.customName,
                                customNameStripped: mineUtils.stripColorCodes(i.customName),
                                parsedEnchants: mineUtils.parseEnchantments(mineUtils.getLoreStripped(i)),
                                loreStripped: mineUtils.getLoreStripped(i)
                            });
                        }
                        await fs.writeFile("./log.json", JSON.stringify(items));
                    }

                    await miscUtils.sleep(250);
                    const newItem = window.containerItems()[0];
                    this.lastItemName = mineUtils.stripColorCodes(newItem.customName);
                    this.lastItemPrice = mineUtils.getItemPrice(newItem);
                    this.lastPricePerItem = this.lastItemPrice / newItem.count;
                    if (this.config.items[this.lastItemName] || this.config.items[newItem.name]) {
                        let data = this.config.items[this.lastItemName];
                        if (!data) {
                            data = this.config.items[newItem.name];
                        }
                        if (data.hasOwnProperty("ensureItemIs")) {
                            if (newItem.name !== data.ensureItemIs) {
                                return;
                            }
                        }
                        if (data.hasOwnProperty("ensureEnchants")) {
                            const enchantsHas = mineUtils.parseEnchantments(mineUtils.getLoreStripped(newItem));
                            Object.keys(data.ensureEnchants).forEach((enchantName) => {
                                 const levelNeeded = data.ensureEnchants[enchantName];
                                 if (!enchantsHas.has(enchantName)) {
                                     passEnchants = false;
                                     return;
                                 }
                                 if (enchantsHas.get(enchantName) < levelNeeded) {
                                     passEnchants = false;
                                 }
                            });
                        }
                        if (!passEnchants) {
                            return;
                        }
                        if (this.lastPricePerItem >= data.maxPrice) {
                            return;
                        }
                        if (data.hasOwnProperty("resellPrice")) {
                            this.lastPurchasedItemSellingPrice = data.resellPrice;
                        }
                        this.lastPurchasedItem = newItem;
                        this.lastItemCustomName = newItem.customName;
                        this.lastPurchaseCount = newItem.count;
                        this.purchasing = true;
                        this.waitingMenu = menus.waitingAuctionConfirm;
                        while(this.waitingMenu !== menus.hold) { // Just assert everything gets clicked, this part of the process is weird idk why.
                            await this.bot.clickWindow(newItem.slot, 0, 0);
                            await this.bot.simpleClick.leftMouse(newItem.slot);
                            await miscUtils.sleep(50);
                        }
                        await clearIntervalAsync(refreshLoop);
                    }
                }, miscUtils.rand(this.config.auctionRefreshMin, this.config.auctionRefreshMax));
                break;
            case menus.waitingAuctionConfirm:
                this.waitingMenu = menus.hold;
                this.waitingMenuClose = menus.waitingAuctionConfirm;
                while(this.waitingMenuClose !== menus.hold) { // Just assert everything gets clicked, this part of the process is weird idk why.
                    await this.bot.clickWindow(1, 0, 0);
                    await this.bot.simpleClick.leftMouse(1);
                    await miscUtils.sleep(50);
                }
                this.purchasing = false;
                break;
        }
    }

    async onSpawn() {
        if ((this.timesSpawned % 2) === 0) {
            await miscUtils.sleep(miscUtils.rand(400, 1000));
            this.waitingMenu = menus.waitingServerSelector;
            await this.bot.activateItem();
        } else {
            await miscUtils.sleep(miscUtils.rand(400, 1000));
            this.waitingMenu = menus.waitingAuctionHouse;
            await this.bot.chat("/ah");
        }
        this.timesSpawned++;
    }

}

module.exports = Flipper;