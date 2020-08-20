import { counterConfig, gameConfig, gameLogic } from "./content";
import * as μhtml from "uhtml";

const {html, svg} = μhtml;

export type CB = () => void;

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
    touch-action: manipulation;
}
body {
    margin: 0;
}
.gameroot {
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

export type DisplayMode =
    | "percentage"
    | "numberpercentage"
    | "decimal"
    | "integer"
    | "boolean"
    | "hidden"
    | "integernocomma";
export type ObjectMap<T> = { [key: string]: T };
export type CounterConfigurationItem = {
    displayMode: DisplayMode;
    displaySuffix?: string;
    displayPrefix?: string;
    initialValue?: number;
};
export type CounterConfig = ObjectMap<CounterConfigurationItem>;
export type Game = {
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
export type Price = ObjectMap<number>;
export type ManualButtonDetails = {
    price?: Price;
    effects?: Price;
    requires?: Price;
    name: string;
};
export type ButtonDetails = ManualButtonDetails & {
    id: string & { __unique: true };
};
export type GameConfigurationItem =
    | ["counter", string, string]
    | ["button", ManualButtonDetails]
    | ["separator"]
    | ["spacer"];

export type GameContent = {
    counterConfig: CounterConfig;
    gameConfig: GameConfigurationItem[];
    gameLogic: (game: Game) => void;
};

let uniqMap = new Map<any, boolean>();
function uniq<T>(item: T): T & { __unique: true } {
    if (uniqMap.has(item)) {
        console.log("Not unique", item);
        alert("Not unique: " + item);
        throw new Error("Not unique: " + item);
    }
    uniqMap.set(item, true);
    return item as T & { __unique: true };
}

function BuyButton(game: Game, details: ButtonDetails) {
    let checkPrice = () => price.every(([k, v]) => game.money[k] >= v);
    let getUncovered = () => {
        if (price.every(([k]) => k.startsWith("_") ? true : game.uncoveredCounters[k])) {
            return true;
        }
        return false;
    };
    
    let requires = Object.entries(details.requires || {});
    let justPrice = Object.entries(details.price || {});
    let price = [...justPrice, ...requires];
    let justEffects = Object.entries(details.effects || {});
    let effects = [
        ...justEffects,
        ...justPrice.map(([k, v]) => [k, -v] as const),
    ];
    
    let isUncovered = getUncovered();
    
    let requiresDisplay = () => {
        if(requires.length === 0) return "";
    return html`
        <div>requires: ${requires.map(([name, cost]) => {
        return html`
            <span class=${game.money[name] >= cost ? "buyable" : "toexpensive"}>
                (${game.numberFormat(name, cost, false)} ${game.uncoveredCounters[name] ? name : "???"})
            </span>`;
        })}</div>
    `};
    let priceDisplay = () => {
        if(justPrice.length === 0) return "";
    return html`
        <div>price: ${justPrice.map(([name, cost]) => {
        return html`
            <span class=${game.money[name] >= cost ? "buyable" : "tooexpensive"}>
                (${game.numberFormat(name, cost, false)} ${game.uncoveredCounters[name] ? name : "???"})
            </span>`;
        })}</div>
    `};
    let effectsDisplay = () => {
        if(justEffects.length === 0) return "";
        if(!isUncovered) return html`<div>effects: ???</div>`;
    return html`
        <div>effects: ${justEffects.map(([name, cost]) => {
        return html`
            <span>
                (${game.numberFormat(name, cost)} ${game.uncoveredCounters[name] ? name : "???"})
            </span>`;
        })}</div>
    `};
    
    const purchasable = checkPrice();
    if(purchasable && isUncovered) {
        for (let [name] of justEffects) {
            game.uncoveredCounters[name] = true;
        }
    }
    
    let ref = {current: undefined as any as HTMLElement};
    let onclick = (e: MouseEvent) => {
        // TODO only allow one click per tick
        if (!checkPrice()) return;

        for (let [key, value] of effects) {
            game.money[key] += value;
        }

        if(e.clientX) spawnParticle(e.clientX, e.clientY, "+");
        else {
            let cx = ref.current.offsetLeft + ref.current.offsetWidth / 2;
            let cy = ref.current.offsetTop + ref.current.offsetHeight / 2;
            spawnParticle(cx, cy, "+");
        }
        // else spawn particle in the center
        emitGameUpdate();
    };
    
return html`
    <button ref=${ref} class=${`button ${isUncovered && "uncovered"}`} disabled=${purchasable ? undefined : true} onclick=${onclick}>
        <div class="buttonpurchase">
            ${isUncovered ? details.name : "???"}
        </div>
        ${requiresDisplay()}
        ${priceDisplay()}
        ${effectsDisplay()}
    </button>
`;
}

function Counter(game: Game, currency: string, description: string) {
    const isRevealed = game.uncoveredCounters[currency];
    
    let displayTitle = "???";
    let displayDescription = "This counter has not been discovered yet.";
    if (isRevealed) {
        displayDescription = description;
        
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
        
        displayTitle = currency + ": " +
            game.numberFormat(currency, count, false) +
            (average ? " (" + game.numberFormat(currency, average) + ")" : "");
    }
return html`
    <div class=${`counter `+(isRevealed ? "uncovered" : "")}>
        <div class="counterheader">${displayTitle}</div>
        <div class="counterdescription">${displayDescription}</div>
    </div>
`}

export function splitNumber(
    number: number,
): { decimal: number; integer: number } {
    let numberString = number.toLocaleString("en-US", { useGrouping: false });
    let fullDecimal = numberString.slice(-2).replace("-", "");
    let fullInteger = numberString.slice(0, -2).replace("-", "");
    return { decimal: +fullDecimal, integer: +fullInteger * Math.sign(number) };
}

function Game() {
    let gameroot = el("div");
    gameroot.classList.add("gameroot");

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
            localStorage.setItem("corrupted_save", savedGame);
            console.log("Error loading savegame:", e, savedGame);
        }
        if (parsed) {
            game.money = { ...game.money, ...parsed.money };
            game.uncoveredCounters = {
                ...game.uncoveredCounters,
                ...parsed.uncoveredCounters,
            };
        }
    }

    // todo usages history so if you hoveer over (+0.1) it shows you where it's coming from

    game.counterConfig = counterConfig;

    for (let [key, value] of Object.entries(counterConfig)) {
        if (game.money[key] == null || isNaN(game.money[key])) {
            game.money[key] = value.initialValue || 0;
        }
    }

    let renderItem = (confit: GameConfigurationItem) => {
        if (confit[0] === "counter") {
            return Counter(game, confit[1], confit[2]);
        } else if (confit[0] === "button") {
            let withID = confit[1] as ButtonDetails;
            return BuyButton(game, withID);
        } else if (confit[0] === "separator") {
            return html`<div class="line"></div>`;
        } else if (confit[0] === "spacer") {
            return html`<div class="spacer"></div>`;
        }
        return html`<div>error: ${confit[0]}</div>`;
    };

    gameConfig.forEach(gcfgitm => {
        if(gcfgitm[0] === "button") {
            let withID = gcfgitm[1] as ButtonDetails;
            withID.id = uniq(
                "ingr:" +
                    JSON.stringify([
                        withID.requires,
                        withID.price,
                        withID.effects,
                    ]),
            );
        }
    });

    let render = () => html`${
        gameConfig.map(cfgitm => html.for(cfgitm)`${renderItem(cfgitm)}`)
    } `;

    let rerender = () => μhtml.render(gameroot, render());
    tickHandlers.push(() => rerender());

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

        gameLogic(game);
    });

    return gameroot;
}

main.appendChild(Game());
