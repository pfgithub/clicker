type CB = () => void;

export {};
declare global {
    interface Window {
        game: {
            cheat: {
                money: ObjectMap<number>;
            };
            restart: () => void;
        };
    }
}

let gameUpdateHandlers: CB[] = [];
let tickHandlers: CB[] = [];

let tickInterval = setInterval(() => {
    // gameTick();
    tickHandlers.forEach(th => th());
    emitGameUpdate();
}, 100);

function emitGameUpdate() {
    gameUpdateHandlers.forEach(h => h());
}

function onGameUpdate(cb: CB) {
    gameUpdateHandlers.push(cb);
    cb();
}

function spawnParticle(x: number, y: number, text: string) {
    let particle = el("div", n => n.classList.add("particle"));
    particle.appendChild(document.createTextNode(text));
    particle.style.setProperty("--x", x + "px");
    particle.style.setProperty("--y", y + "px");
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 1000);
}

let main = document.getElementById("main") || document.body;
let el = <K extends keyof HTMLElementTagNameMap>(
    name: K,
    cb?: (node: HTMLElementTagNameMap[K]) => void,
) => {
    let element = document.createElement(name);
    cb && cb(element);
    return element;
};

function $scss(arg: TemplateStringsArray) {
    return arg[0];
}

let css = $scss`
html {
    margin: 0;
    height: 100vh;
    touch-action: manipulation;
}
body {
    margin: 0;
    height: 100vh;
}
.gameroot {
    height: 100vh;
    padding: 10px;
    justify-content: center;
    display: grid;
    grid-template-columns: [start] repeat(auto-fill, minmax(0, 300px)) [end];
    grid-auto-rows: max-content;
    grid-auto-flow: row;
}
.line {
    margin: 10px;
    margin-left: 0;
    margin-right: 0;
    border-bottom: 3px solid #ccc;
    border-radius: 1000px;
    grid-column: 1 / end; /*blink workaround*/
}
.spacer {
    grid-column-end: end;
}
.button,
.counter {
    margin: 10px;
    padding: 10px;
    display: inline-block;
    border-radius: 10px;
    color: rgb(200, 200, 200);
    transition: 0.1s color ease-in-out, 0.1s box-shadow ease-in-out;
    background-color: white;
    min-height: 100px;
}
.counter {
    border: 1px solid rgb(200, 200, 200);
}
.button {
    border: none;
    box-shadow: 0 0 25px -10px rgba(0, 0, 0, 0.3);
}
.button:disabled {
    opacity: 0.7;
}
.button:not(:disabled):hover,
.button:not(:disabled):focus {
    box-shadow: 0 0 20px 5px rgba(0, 128, 0, 0.6);
}
.button.uncovered:disabled {
    box-shadow: 0 0 25px -10px rgba(0, 0, 0, 0.3);
}
.buyable {
    color: green;
}
.tooexpensive {
    color: red;
}
.counter.uncovered {
    border: 1px solid black;
}
.uncovered {
    color: black;
}
.button.uncovered {
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
}
.counterheader {
    font-weight: bold;
}
.buttonpurchase {
    font-weight: bold;
}
@keyframes particle {
    from {
        transform: translate(-50%, -50%);
        opacity: 1;
    }
    to {
        transform: translate(-50%, -150%);
        opacity: 0;
    }
}
.particle {
    z-index: 1000;
    position: fixed;
    pointer-events: none;
    top: var(--y);
    left: var(--x);
    color: black;
    font-size: 16pt;
    animation: particle 1s;
    animation-fill-mode: both;
}
`;

document.head.appendChild(
    el("style", n => n.appendChild(document.createTextNode(css))),
);

type DisplayMode =
    | "percentage"
    | "numberpercentage"
    | "decimal"
    | "integer"
    | "boolean"
    | "hidden"
    | "integernocomma";
type ObjectMap<T> = { [key: string]: T };
type CounterConfigurationItem = {
    displayMode: DisplayMode;
    displaySuffix?: string;
    displayPrefix?: string;
    initialValue?: number;
};
type CounterConfig = ObjectMap<CounterConfigurationItem>;
type Game = {
    tick: number;
    money: ObjectMap<number>;
    moneyHistory: ObjectMap<number>[];
    uncoveredCounters: ObjectMap<boolean>;
    counterConfig: CounterConfig;
    numberFormat: (
        currency: string,
        number: number,
        usePlus?: boolean,
    ) => string;
};
type Price = ObjectMap<number>;
type ButtonDetails = {
    price?: Price;
    effects?: Price;
    requires?: Price;
    name: string;
};

function BuyButton(game: Game, details: ButtonDetails) {
    let node = el("button");
    node.classList.add("button");
    let button = el("div");
    button.classList.add("buttonpurchase");

    let buttonText = document.createTextNode("");
    button.appendChild(buttonText);

    let uncoverStatusChanged: CB[] = [];
    let onUncover = (cb: CB) => (uncoverStatusChanged.push(cb), cb());

    let uncovered = false; // todo save this somehow
    let uncoveredThisTick = { tick: -1, uncovered: false };
    let checkPrice = () => price.every(([k, v]) => game.money[k] >= v);
    let getUncovered = () => {
        if (uncovered) return true;
        if (game.tick === uncoveredThisTick.tick) {
            return uncoveredThisTick.uncovered;
        }
        if (
            price.every(([k, v]) =>
                k.startsWith("_") ? true : game.money[k] >= v,
            )
        ) {
            uncovered = true;
            uncoverStatusChanged.forEach(m => m());
            node.classList.add("uncovered");
        }
        uncoveredThisTick = { tick: game.tick, uncovered };
        return uncovered;
    };

    onUncover(() => (buttonText.nodeValue = uncovered ? details.name : "???"));

    let requires = Object.entries(details.requires || {});
    let justPrice = Object.entries(details.price || {});
    let price = [...justPrice, ...requires];
    let justEffects = Object.entries(details.effects || {});
    let effects = [
        ...justEffects,
        ...justPrice.map(([k, v]) => [k, -v] as const),
    ];

    let priceElem = el("div");
    let effectsElem = el("div");
    let reqsElem = el("div");
    reqsElem.appendChild(document.createTextNode("requires: "));
    priceElem.appendChild(document.createTextNode("price: "));
    effectsElem.appendChild(document.createTextNode("effects: "));
    let qqqElem = document.createTextNode("???");
    effectsElem.appendChild(qqqElem);

    for (let [name, cost] of requires) {
        let n = el("span");
        let tn = document.createTextNode("");
        onGameUpdate(() => {
            tn.nodeValue =
                "(" +
                game.numberFormat(name, cost, false) +
                " " +
                (game.uncoveredCounters[name] ? name : "???") +
                ")";
            if (game.money[name] >= cost) {
                n.setAttribute("class", "buyable");
            } else {
                n.setAttribute("class", "tooexpensive");
            }
        });
        n.appendChild(tn);
        reqsElem.appendChild(n);
    }

    for (let [name, cost] of justPrice) {
        let n = el("span");
        let tn = document.createTextNode("");
        onGameUpdate(() => {
            tn.nodeValue =
                "(" +
                game.numberFormat(name, cost, false) +
                " " +
                (game.uncoveredCounters[name] ? name : "???") +
                ")";
            if (game.money[name] >= cost) {
                n.setAttribute("class", "buyable");
            } else {
                n.setAttribute("class", "tooexpensive");
            }
        });
        n.appendChild(tn);
        priceElem.appendChild(n);
    }

    onUncover(() => {
        if (uncovered) {
            qqqElem.remove();

            for (let [name, cost] of justEffects) {
                game.uncoveredCounters[name] = true;
                let n = el("span");
                let tn = document.createTextNode("");
                onGameUpdate(() => {
                    tn.nodeValue =
                        "(" + game.numberFormat(name, cost) + " " + name + ")";
                });
                n.appendChild(tn);
                effectsElem.appendChild(n);
            }
            emitGameUpdate();
        }
    });

    onGameUpdate(() => {
        let purchaseable = checkPrice();
        node.disabled = !purchaseable;
        getUncovered();
    });

    node.addEventListener("click", e => {
        if (!checkPrice()) return;

        for (let [key, value] of effects) {
            game.money[key] += value;
        }

        spawnParticle(e.clientX, e.clientY, "+");
        emitGameUpdate();
    });

    node.appendChild(button);
    requires.length && node.appendChild(reqsElem);
    justPrice.length && node.appendChild(priceElem);
    justEffects.length && node.appendChild(effectsElem);
    return node;
}

function Counter(game: Game, currency: string, description: string) {
    let node = el("div");
    node.classList.add("counter");

    let heading = document.createElement("div");
    let p = document.createElement("div");
    p.classList.add("counterdescription");
    let descriptionNode = document.createTextNode(
        "This counter has not been discovered yet.",
    );
    p.appendChild(descriptionNode);
    let tn = document.createTextNode("");
    heading.classList.add("counterheader");

    let isRevealed = false;
    onGameUpdate(() => {
        if (!isRevealed && game.uncoveredCounters[currency]) {
            descriptionNode.nodeValue = description;
            node.classList.add("uncovered");
            isRevealed = true;
        }
        if (!isRevealed) {
            tn.nodeValue = "???";
            return;
        }

        let count = game.money[currency];
        let history = [...game.moneyHistory.map(h => h[currency]), count];
        let average = 0;
        let prevItem;
        for (let item of history) {
            if (prevItem !== undefined) {
                average += Number(item - prevItem);
            }
            prevItem = item;
        }
        average /= history.length - 1;
        average = Math.round(average);

        tn.nodeValue =
            currency +
            ": " +
            game.numberFormat(currency, count, false) +
            (average ? " (" + game.numberFormat(currency, average) + ")" : "");
    });

    heading.appendChild(tn);
    node.appendChild(heading);
    description && node.appendChild(p);

    return node;
}

function splitNumber(number: number): { decimal: number; integer: number } {
    let numberString = number.toLocaleString("en-US", { useGrouping: false });
    let fullDecimal = numberString.slice(-2).replace("-", "");
    let fullInteger = numberString.slice(0, -2).replace("-", "");
    return { decimal: +fullDecimal, integer: +fullInteger * Math.sign(number) };
}

function Game() {
    let node = el("div");
    node.classList.add("gameroot");

    let saveID = +(localStorage.getItem("lastsave") || "0") + 1;
    localStorage.setItem("lastsave", "" + saveID);

    let game: Game = {
        tick: 0,
        money: {},
        counterConfig: {},
        moneyHistory: [],
        uncoveredCounters: { stamina: true },
        numberFormat: (currency, n, showSign = true) => {
            let currencyDetails = game.counterConfig[currency] || {};

            let displayMode = currencyDetails.displayMode;
            let suffix = currencyDetails.displaySuffix || "";
            let prefix = currencyDetails.displayPrefix || "";

            if (displayMode === "percentage") {
                let resStr = (n / 100).toLocaleString(undefined, {
                    style: "percent",
                });
                let sign = Math.sign(n);

                return (
                    (showSign && sign === 1 ? "+" : "") +
                    resStr +
                    (suffix || "")
                );
            }
            if (displayMode === "numberpercentage") {
                let split = splitNumber(n);
                let resPercent = (split.decimal / 100).toLocaleString(
                    undefined,
                    {
                        style: "percent",
                    },
                );
                let resNumber = Math.abs(split.integer).toLocaleString(
                    undefined,
                );

                let showsZero = n === 0;
                let sign = Math.sign(n);

                return (
                    (showSign && sign === 1 ? "+" : sign === -1 ? "-" : "") +
                    [
                        split.integer !== 0 ? resNumber + (suffix || "") : "",
                        split.decimal === 0 ? "" : resPercent,
                        showsZero ? "0" : "",
                    ]
                        .filter(m => m)
                        .join(" and ")
                );
            }
            if (displayMode === "decimal") {
                let resV = (n / 100).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                });
                return (
                    (showSign && Math.sign(+resV) === 1 ? "+" : "") +
                    resV +
                    suffix
                );
            }
            if (displayMode === "integer") {
                let resV = n.toLocaleString(undefined, {});
                return (
                    (showSign && Math.sign(+resV) === 1 ? "+" : "") +
                    prefix +
                    resV +
                    suffix
                );
            }
            if (displayMode === "integernocomma") {
                let resV = n.toLocaleString(undefined, { useGrouping: false });
                return (
                    (showSign && Math.sign(+resV) === 1 ? "+" : "") +
                    prefix +
                    resV +
                    suffix
                );
            }
            if (displayMode === "boolean") {
                return n === 0 ? "0" : "1";
            }
            if (displayMode === "hidden") {
                return "Oops! You should never see this!";
            }
            alert("invalid display mode: " + displayMode);
            throw "invalid display mode: " + displayMode;
        },
    };

    let savedGame = localStorage.getItem("save");
    if (savedGame) {
        let parsed;
        try {
            parsed = JSON.parse(savedGame);
        } catch (e) {
            console.log("Error loading savegame:", e);
        }
        if (parsed) {
            game.money = { ...game.money, ...parsed.money };
            game.uncoveredCounters = {
                ...game.uncoveredCounters,
                ...parsed.uncoveredCounters,
            };
        }
    }

    let counterConfig: CounterConfig = {
        tick: { displayMode: "hidden" },
        stamina: { displayMode: "percentage" }, // 100%, 50%
        tree: { displayMode: "numberpercentage" }, // 1
        seed: { displayMode: "numberpercentage" }, // 2 and 10%
        gold: { displayMode: "decimal", displaySuffix: "ᵹ" }, // 1.00, 2.50
        market: { displayMode: "integer" },
        achievement: { displayMode: "integer" },
        apple: { displayMode: "integer" },
        water: { displayMode: "decimal" },
        bucket: { displayMode: "integer" },
        credit: { displayPrefix: "©", displayMode: "integernocomma" },
        _ach_1: { initialValue: 1, displayMode: "boolean" },
        _ach_2: { initialValue: 1, displayMode: "boolean" },
        _ach_3: { initialValue: 1, displayMode: "boolean" },
    };

    // todo fix apples on mac safari
    // todo usages history so if you hoveer over (+0.1) it shows you where it's coming from

    type GameConfigurationItem =
        | ["counter", string, string]
        | ["button", ButtonDetails]
        | ["separator"]
        | ["spacer"];
    let gameConfig: GameConfigurationItem[] = [
        ["counter", "achievement", "number of achievements you have recieved"],
        [
            "button",
            {
                name: "collect 100 gold",
                requires: { gold: 100_00 },
                price: { _ach_1: 1 },
                effects: { achievement: 1 },
            },
        ],
        [
            "button",
            {
                name: "eat apple",
                price: { apple: 1_00, _ach_2: 1 },
                effects: { achievement: 1 },
            },
        ],
        [
            "button",
            {
                name: "this game",
                requires: { credit: 2020 },
                price: { _ach_3: 1 },
                effects: { achievement: 1 },
            },
        ],
        ["separator"],
        ["counter", "stamina", "stamina increases 0.01 per tick, max 1"],
        ["counter", "gold", "gold lets you purchase things"],
        [
            "button",
            {
                name: "fish gold from wishing well",
                price: { stamina: 10 },
                effects: { gold: 100 },
            },
        ],
        ["counter", "market", "each market adds 0.01 gold per tick"],
        [
            "button",
            {
                name: "purchase market",
                price: { gold: 25_00 },
                effects: { market: 1 },
            },
        ],
        ["spacer"],
        ["counter", "apple", "an apple"],
        ["counter", "water", "water grows trees"],
        [
            "counter",
            "tree",
            "each full tree requires 2 water each tick to live and drops 1 apple per 10 ticks.",
        ],
        ["counter", "seed", "an apple seed. uses 1 water each tick to grow"],
        [
            "button",
            {
                name: "purchase seed from market",
                price: { gold: 50_00 },
                requires: { market: 5 },
                effects: { seed: 1_00 },
            },
        ],
        [
            "button",
            {
                name: "take water from wishing well",
                price: { stamina: 1_00 },
                requires: { market: 5 },
                effects: { water: 1_00 },
            },
        ],
        ["counter", "bucket", "a bucket"],
        [
            "button",
            {
                name: "make bucket",
                price: { tree: 1_00, gold: 100_00 },
                effects: { bucket: 1 },
            },
        ],
        [
            "button",
            {
                name: "use bucket on wishing well",
                price: { bucket: 1, stamina: 1_00 },
                effects: { water: 10_00, gold: 10_00 },
            },
        ],
        [
            "button",
            {
                name: "sell apples",
                requires: { market: 25 },
                price: { apple: 100 },
                effects: { gold: 1000_00, credit: 1 },
            },
        ],
        ["counter", "credit", "a credit"],
        [
            "button",
            {
                name: "",
            },
        ],
    ];

    let gameLogic = () => {
        // logic
        game.money.tick++;
        game.money.gold += game.money.market;
        if (game.money.stamina < 100) game.money.stamina += 1;
        if (game.money.stamina > 100) game.money.stamina = 100;

        let bal = game.money;
        if (bal.tree < 0) bal.tree = 0;
        let treeWaterCost = 2;
        let tsplit = splitNumber(bal.tree);
        let liveTreeCount = tsplit.integer;
        let requiredWater = liveTreeCount;
        let availableWater = bal.water / treeWaterCost;
        if (bal.tick % 10 === 0) bal.apple += liveTreeCount;
        let deadTrees = requiredWater - availableWater;
        if (deadTrees > 0) {
            bal.tree -= 2 * deadTrees;
        }
        if (bal.water < 2 && deadTrees <= 0 && bal.tree > 0) {
            bal.tree -= 1;
        }
        bal.water -=
            (availableWater < requiredWater ? availableWater : requiredWater) *
            treeWaterCost;

        if (bal.seed > 0) {
            game.uncoveredCounters.tree = true;
            game.uncoveredCounters.apple = true;

            let availableWater = bal.water;
            let availableSeed = bal.seed;
            let used = Math.min(availableWater, Math.ceil(availableSeed / 100));
            if (used >= 1) {
                bal.seed -= used;
                bal.tree += used;
                bal.water -= used;
            }
        } else {
            bal.seed = 0;
        }
    };

    game.counterConfig = counterConfig;

    for (let [key, value] of Object.entries(counterConfig)) {
        if (game.money[key] == null || isNaN(game.money[key])) {
            game.money[key] = value.initialValue || 0;
        }
    }

    let addItem = ([action, ...spec]: GameConfigurationItem) => {
        if (action === "counter") {
            node.appendChild(Counter(game, ...(spec as [string, string])));
        } else if (action === "button") {
            node.appendChild(BuyButton(game, ...(spec as [ButtonDetails])));
        } else if (action === "separator") {
            node.appendChild(el("div", n => n.classList.add("line")));
        } else if (action === "spacer") {
            node.appendChild(el("div", n => n.classList.add("spacer")));
        } else {
            node.appendChild(document.createTextNode("error: " + action));
        }
    };

    for (let spec of gameConfig) {
        addItem(spec);
    }

    window.game = {
        cheat: { money: game.money },
        restart: () => {
            localStorage.clear();
            clearInterval(tickInterval);
            console.log("Reloading...");
            location.reload();
        },
    };

    tickHandlers.push(() => {
        game.tick++;

        game.moneyHistory.push({ ...game.money });
        if (game.moneyHistory.length >= 5) game.moneyHistory.shift();

        if (game.tick % 50 === 0) {
            let newSaveID = +localStorage.getItem("lastsave")!;
            console.log(saveID, newSaveID);
            if (newSaveID !== saveID) {
                document.body.innerHTML =
                    "Uh oh! This page was opened on another tab. This page has been closed to prevent save conflicts.";
                document.title = "closed";
                window.close();
                clearInterval(tickInterval);
                throw -1;
            }
            localStorage.setItem(
                "save",
                JSON.stringify(
                    {
                        money: game.money,
                        uncoveredCounters: game.uncoveredCounters,
                    },
                    null,
                    "\t",
                ),
            );
        }

        for (let [currency, count] of Object.entries(game.money)) {
            if (!Number.isInteger(count)) {
                alert(
                    "Currency is not an integer, " +
                        currency +
                        " (value is " +
                        count +
                        ")",
                );
                game.money[currency] = Math.floor(count);
            }
        }

        gameLogic();
    });

    return node;
}

main.appendChild(Game());
