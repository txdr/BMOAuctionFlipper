const gradient = require("gradient-string");
const Box = require("cli-box");
const setTitle = require("console-title");
const mUtils = require("./utils/miscUtils.js");
const chalk = require("chalk");
const fs = require("fs").promises;
const readline = require("readline/promises");
const authPath = (require("appdata-path"))() + "\\BMOAuth";
const FlipperManager = require("./bot/flipperManager.js");

let rlp;

(async () => {
    setTitle("Auction Flipper v1.0.0");
    let current = 1;
    let loops = 0;
    let amount = mUtils.rand(2, 4);
    while(loops < amount) {
        if (loops > amount) {
            break;
        }
        console.clear();
        console.log(Box({fullscreen: true, marks: {}}, gradient.vice.multiline([
            "██████╗ ███╗   ███╗ ██████╗     ████████╗██████╗  █████╗ ██████╗ ██╗███╗   ██╗ ██████╗ ███████╗",
            "██╔══██╗████╗ ████║██╔═══██╗    ╚══██╔══╝██╔══██╗██╔══██╗██╔══██╗██║████╗  ██║██╔════╝ ██╔════╝",
            "██████╔╝██╔████╔██║██║   ██║       ██║   ██████╔╝███████║██║  ██║██║██╔██╗ ██║██║  ███╗███████╗",
            "██╔══██╗██║╚██╔╝██║██║   ██║       ██║   ██╔══██╗██╔══██║██║  ██║██║██║╚██╗██║██║   ██║╚════██║",
            "██████╔╝██║ ╚═╝ ██║╚██████╔╝       ██║   ██║  ██║██║  ██║██████╔╝██║██║ ╚████║╚██████╔╝███████║",
            "╚═════╝ ╚═╝     ╚═╝ ╚═════╝        ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝", "",
            " █████╗ ██╗  ██╗    ███████╗██╗     ██╗██████╗ ██████╗ ███████╗██████╗ ",
            "██╔══██╗██║  ██║    ██╔════╝██║     ██║██╔══██╗██╔══██╗██╔════╝██╔══██╗",
            "███████║███████║    █████╗  ██║     ██║██████╔╝██████╔╝█████╗  ██████╔╝",
            "██╔══██║██╔══██║    ██╔══╝  ██║     ██║██╔═══╝ ██╔═══╝ ██╔══╝  ██╔══██╗",
            "██║  ██║██║  ██║    ██║     ███████╗██║██║     ██║     ███████╗██║  ██║",
            "╚═╝  ╚═╝╚═╝  ╚═╝    ╚═╝     ╚══════╝╚═╝╚═╝     ╚═╝     ╚══════╝╚═╝  ╚═╝", "",
            "By Shayen777 in collaboration with BMO Trading",
            "Version 1.0.0",
            "..".repeat(current * 2)
        ].join("\n"))));
        current++;
        if (current >= 8) {
            current = 1;
            loops++;
        }
        await mUtils.sleep(250);
    }

    console.clear();
    try {
        await fs.access(authPath);
    } catch (e) {
        console.log(chalk.red("Please add a account in the authentication manager prior to using the auction flipper. Closing in 10 seconds."));
        await mUtils.sleep(10000);
        process.exit(0);
    }
    const accounts = new Map();
    let dir = await fs.readdir(authPath);
    dir.forEach((fileName) => {
        const data = require(`${authPath}\\${fileName}`);
        accounts.set(data.username, data.token);
    });
    const accountNames = Array.from(accounts.keys());


    try {
        await fs.access(mUtils.configPath);
    } catch (e) {
        await fs.mkdir(mUtils.configPath);
    }
    const configurations = new Map();
    dir = await fs.readdir(mUtils.configPath);
    dir.forEach((fileName) => {
        configurations.set(fileName, require(`${mUtils.configPath}\\${fileName}`))
    });
    const configurationNames = Array.from(configurations.keys());

    const printInfoBox = () => {
        console.clear();
        console.log(Box({w: 60, h: 20, stretch: true}, [
            gradient.fruit("Auction Flipper v1.0.0"), "",
            gradient.fruit("Loaded accounts [") + chalk.green(accountNames.length) + chalk.rgb(249,212,3).visible("]"),
            chalk.gray(`Account Names: ${accountNames.join(", ")}`),
            gradient.fruit("Loaded configurations [") + chalk.green(configurationNames.length) + chalk.rgb(249,212,3).visible("]"),
            chalk.gray(`Configuration Names: ${configurationNames.join(", ")}`)
        ].join("\n")));
    };
    rlp = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true
    });
    let rlpAccount, rlpConfiguration;

    const secondQuestion = async () => {
        printInfoBox();
        rlpConfiguration = await rlp.question("Which Configuration File? > ");
        if (!configurations.has(rlpConfiguration)) {
            console.clear();
            console.log(chalk.red("Invalid configuration file."));
            await mUtils.sleep(2500);
            await secondQuestion();
            return;
        }
        rlp.close();
        // All information is passed to bot here.
        console.clear();
        const fm = new FlipperManager();
        fm.addFlipper(rlpAccount, accounts.get(rlpAccount), configurations.get(rlpConfiguration));
        await fm.cosmeticLoop();
    };

    let canReRun = true;
    const firstQuestion = async () => {
        printInfoBox();
        rlpAccount = await rlp.question("Which account? > ");
        if (!accounts.has(rlpAccount)) {
            console.clear();
            console.log(chalk.red("Invalid account name."))
            await mUtils.sleep(2500);
            await firstQuestion();
            return;
        }
        canReRun = false;
        await secondQuestion();
    };
    if (canReRun) { // Possibly (most likely) redundant.
        await firstQuestion();
    }
})();