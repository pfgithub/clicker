import { counterConfig, gameConfig, gameLogic } from "./content";
import * as μhtml from "uhtml";
import { ButtonDetails, CB, Game, GameConfigurationItem, GameCore } from "./core";

const {html} = μhtml;

export {};
declare global {
    interface Window {
        game: {
            // cheat: {
            //     money: ObjectMap<number>;
            // };
            cheat: Game,
            restart: () => void;
        };
    }
}

function spawnParticle(x: number, y: number, text: string) {
    let particle = el("div", n => n.classList.add("particle"));
    particle.appendChild(document.createTextNode(text));
    particle.style.setProperty("--x", x + "px");
    particle.style.setProperty("--y", y + "px");
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 1000);
}

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
    grid-template-columns: [start] repeat(auto-fit, minmax(300px, 1fr)) [end];
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
    grid-column: 1/end;
    height: 20px;
}
/*.spacer {
    grid-column-end: end;
}*/
.button,
.counter {
    margin: 10px;
    padding: 10px;
    display: inline-block;
    border-radius: 10px;
    color: rgb(200, 200, 200);
    transition: 0.1s color ease-in-out, 0.1s box-shadow ease-in-out;
    background-color: white;
    min-height: 122px;
}
.counter {
    appearence: none;
    font-size: 100%;
    font-family: inherit;
    text-align: left;
}
.counter > div {
    width: 100%;
    height: 100%;
}
.counter.uncovered:hover{
    border-width: 2px;
    padding: 9px;
}
.counter.uncovered:active{
    border-width: 3px;
    padding: 8px;
}
.counter.showdiff .counterdescription {
    display: none;
}
.counter.showdiff .counterreason {
    display: block;
}
.counterreason {
    display: none;
}
.counterreason > ul {margin: 0; padding: 0; list-style-position: inside}
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
    | "integernocomma1k"
    | "inverse_boolean"
;
export type ObjectMap<T> = { [key: string]: T };
export type CounterConfigurationItem = {
    displayMode: DisplayMode;
    displaySuffix?: string;
    displayPrefix?: string;
    initialValue?: number;
    unlockHidden?: boolean;
    title?: string;
};
export type CounterConfig = ObjectMap<CounterConfigurationItem>;
export type TransferInfo = {
    [reason: string]: {diff: number, frequency: number, lastSet: number},
};
export function titleFormat(game: Game, currency: string): string {
    if(!game.uncoveredCounters[currency]) return "???";
    const currencyDetails = game.counterConfig[currency];
    if(!currencyDetails) return "EROR_TITLE«"+currency+"»";
    return currencyDetails.title ?? currency;
}
export function numberFormat(game: Game, currency: string, n: number, showSign: boolean = true): string {
    let currencyDetails = game.counterConfig[currency] || {};

    let displayMode = currencyDetails.displayMode || "error";
    let suffix = currencyDetails.displaySuffix || "";
    let prefix = currencyDetails.displayPrefix || "";

    if (displayMode === "percentage") {
        let resStr = Math.abs(n / 100).toLocaleString(undefined, {
            style: "percent",
        });
        let sign = Math.sign(n);

        return (
            (showSign ? (sign === 1 ? "+" : sign === -1 ? "-" : "") : "") +
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
        let resV = Math.abs(n / 100).toLocaleString(undefined, {
            minimumFractionDigits: 2,
        });
        const sign = Math.sign(n);
        return (
            (showSign ? (sign === 1 ? "+" : sign === -1 ? "-" : "") : "") +
            prefix +
            resV +
            suffix
        );
    }
    if (displayMode === "integer") {
        let resV = Math.abs(n).toLocaleString(undefined, {});
        const sign = Math.sign(n);
        return (
            (showSign ? (sign === 1 ? "+" : sign === -1 ? "-" : "") : "") +
            prefix +
            resV +
            suffix
        );
    }
    if (displayMode === "integernocomma1k") {
        let resV = Math.abs(n).toLocaleString(undefined, { });
        if(n >= 1000 && n < 10_000) {
            resV = Math.abs(n).toLocaleString(undefined, { useGrouping: false });
        }
        const sign = Math.sign(n);
        return (
            (showSign ? (sign === 1 ? "+" : sign === -1 ? "-" : "") : "") +
            prefix +
            resV +
            suffix
        );
    }
    if (displayMode === "boolean") {
        return n === 0 ? "doesn't have" : (n > 1 ? n+"×" : "") + "has";
    }
    if (displayMode === "inverse_boolean") {
        return n === 0 ? "has" : "doesn't have";
    }
    if (displayMode === "hidden") {
        return "Oops! You should never see this!";
    }
    if (displayMode === "error") {
        return "ERR«"+currency+"»";
    }
    throw new Error("invalid display mode: " + displayMode);
}

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

let descCache: {[key: string]: μhtml.Hole} = {};
function parseDesc(game: Game, desc: string) {
    descCache[desc] ??= html`${desc.replace(/{([^}]+?)}/g, (_, a) => {
        const split = a.split("|");
        if(split.length === 2) {
            const [b, c] = split;
            const number = +c.split("_").join("");
            return numberFormat(game, b, number, false);
        }else{
            return titleFormat(game, split[0]);
        }
    })} `;
    return descCache[desc];
}

function BuyButton(game: Game, details: ButtonDetails, emit: () => void) {
    let checkPrice = () => price.every(([k, v]) => game.money[k] >= v);
    let getUncovered = () => {
        if (price.every(([k]) => game.counterConfig[k].unlockHidden ? true : game.uncoveredCounters[k])) {
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
            <span class=${game.money[name] >= cost ? "buyable" : "tooexpensive"}>
                (${numberFormat(game, name, cost, false)} ${titleFormat(game, name)})
            </span>`;
        })}</div>
    `};
    let priceDisplay = () => {
        if(justPrice.length === 0) return "";
    return html`
        <div>price: ${justPrice.map(([name, cost]) => {
        return html`
            <span class=${game.money[name] >= cost ? "buyable" : "tooexpensive"}>
                (${numberFormat(game, name, cost, false)} ${titleFormat(game, name)})
            </span>`;
        })}</div>
    `};
    let effectsDisplay = () => {
        if(justEffects.length === 0) return "";
    return html`
        <div>effects: ${isUncovered ? justEffects.map(([name, cost]) => {
        return html`
            <span>
                (${numberFormat(game, name, cost)} ${titleFormat(game, name)})
            </span>`;
        }) : "???"}</div>
    `};
    
    const purchasable = checkPrice();
    if(purchasable && isUncovered) {
        for (let [name] of justEffects) {
            game.uncoveredCounters[name] = true;
        }
    }
    
    let ref = {current: undefined as any as HTMLElement};
    let lastClicked = -1; // this fn is re-called every update 
    let onclick = (e: MouseEvent) => {
        console.log(game.tick, lastClicked);
        if(game.tick == lastClicked) return;
        lastClicked = game.tick;
        // TODO allow click and hold to buy at max speed
        if (!checkPrice() && !game.cheatMode) return;

        for (let [key, value] of effects) {
            game.money[key] += value;
            (game.moneyTransfer[key] ??= {})["purchase"] = {diff: value, frequency: 1, lastSet: game.tick};
        }

        if(e.clientX) spawnParticle(e.clientX, e.clientY, "+");
        else {
            const rect = ref.current.getBoundingClientRect();
            const cx = rect.left + (rect.right - rect.left) / 2;
            const cy = rect.top + (rect.bottom - rect.top) / 2;
            spawnParticle(cx, cy, "+");
        }
        // else spawn particle in the center
        emit();
    };

return html`
    <button ref=${ref} class=${`button ${isUncovered && "uncovered"}`} disabled=${purchasable || game.cheatMode ? undefined : true} onclick=${onclick}>
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
    const state = (game.counterState[currency] ??= {showDiff: false});

    let displayTitle = html`???`;
    let displayDescription = html`This counter has not been discovered yet.`;
    let displayReason = html`<ul><li>This counter has not been discovered yet.</li></ul>`;
    if (isRevealed) {
        displayDescription = parseDesc(game, description);
        
        let count = game.money[currency];
        const reasons = Object.entries(game.moneyTransfer[currency] ?? {}).filter(([k, v]) => game.tick < v.lastSet + v.frequency && v.diff !== 0);

        const average = reasons.reduce((t, [k, v]) => t + v.diff / v.frequency, 0);
        const avgfmt = numberFormat(game, currency, average);
        const titleText = titleFormat(game, currency) + ": " + numberFormat(game, currency, count, false) + (average && !state.showDiff ? " ("+avgfmt+")" : "");

        const reasonsContent = reasons.map(([k, v]) => {
            return html`
                <li>${numberFormat(game, currency, v.diff) + "/"+(v.frequency === 1 ? "" : v.frequency)+"t: "+k}</li>
            `;
        });
        if(reasonsContent.length === 0) reasonsContent.push(html`<li><i>Not changing</i></li>`);
        displayReason = html`<div>Change: ${avgfmt}/t</div><ul>${reasonsContent}</ul>`;
        
        displayTitle = html`${titleText}`;
    }
    const onclick = () => {
        state.showDiff = !state.showDiff;
    }
return html`
    <button class=${`counter`+(isRevealed ? " uncovered" : "")+(state.showDiff ? " showdiff" : "")} onclick=${onclick}>
        <div>
            <div class="counterheader">${displayTitle}</div>
            <div class="counterdescription">${displayDescription}</div>
            <div class="counterreason">${displayReason}</div>
        </div>
    </button>
`}

export function splitNumber(
    number: number,
): { decimal: number; integer: number } {
    let numberString = number.toLocaleString("en-US", { useGrouping: false });
    let fullDecimal = numberString.slice(-2).replace("-", "");
    let fullInteger = numberString.slice(0, -2).replace("-", "");
    return { decimal: +fullDecimal, integer: +fullInteger * Math.sign(number) };
}

export function GameUI(core: GameCore) {
    let gameroot = el("div");
    gameroot.classList.add("gameroot");

    let renderItem = (confit: GameConfigurationItem) => {
        if (confit[0] === "counter") {
            return Counter(core.game, confit[1], confit[2]);
        } else if (confit[0] === "button") {
            let withID = confit[1] as ButtonDetails;
            return BuyButton(core.game, withID, () => core.emitGameUpdate());
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
    const tickhandler_cleanup = core.onTick(() => rerender());

    return gameroot;
}

