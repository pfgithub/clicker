import { gameConfig } from "./content";
import * as μhtml from "uhtml";
import { ButtonDetails, Game, GameConfigurationItem, GameCore, ObjectMap, getCounterChange, numberFormat, parseDesc, priceget, titleFormat } from "./core";

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

export function spawnParticle(x: number, y: number, text: string) {
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

function BuyButton(core: GameCore, details: ButtonDetails) {
    const game = core.game;

    let checkPrice = () => core.checkPurchasable(details);
    let getUncovered = () =>  core.checkUncovered(details);
    
    let requires = Object.entries(details.requires || {});
    let justPrice = Object.entries(details.price || {});
    let justEffects = Object.entries(details.effects || {});
    
    let isUncovered = getUncovered();
    
    let requiresDisplay = () => {
        if(requires.length === 0) return "";
    return html`
        <div>requires: ${requires.map(([name, cost]) => {
        return html`
            <span class=${game.money[name] >= priceget(game, cost) ? "buyable" : "tooexpensive"}>
                (${numberFormat(game, name, priceget(game, cost), false)} ${titleFormat(game, name)})
            </span>`;
        })}</div>
    `};
    let priceDisplay = () => {
        if(justPrice.length === 0) return "";
    return html`
        <div>price: ${justPrice.map(([name, cost]) => {
        return html`
            <span class=${game.money[name] >= priceget(game, cost) ? "buyable" : "tooexpensive"}>
                (${numberFormat(game, name, priceget(game, cost), false)} ${titleFormat(game, name)})
            </span>`;
        })}</div>
    `};
    let effectsDisplay = () => {
        if(justEffects.length === 0) return "";
    return html`
        <div>effects: ${isUncovered ? justEffects.map(([name, cost]) => {
        return html`
            <span>
                (${numberFormat(game, name, priceget(game, cost))} ${titleFormat(game, name)})
            </span>`;
        }) : "???"}</div>
    `};
    
    const purchasable = checkPrice();
    
    let ref = {current: undefined as any as HTMLElement};
    let onclick = (e: MouseEvent) => {
        if(core.purchase(details)) {
            if(e.clientX) spawnParticle(e.clientX, e.clientY, "+");
            else {
                const rect = ref.current.getBoundingClientRect();
                const cx = rect.left + (rect.right - rect.left) / 2;
                const cy = rect.top + (rect.bottom - rect.top) / 2;
                spawnParticle(cx, cy, "+");
            }
        }
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

type CounterStateMap = ObjectMap<{showDiff: boolean}>;
function Counter(core: GameCore, counterState: CounterStateMap, currency: string, description: string) {
    const game = core.game;

    const isRevealed = game.uncoveredCounters[currency];
    const state = (counterState[currency] ??= {showDiff: false});

    let displayTitle = html`???`;
    let displayDescription = html`This counter has not been discovered yet.`;
    let displayReason = html`<ul><li>This counter has not been discovered yet.</li></ul>`;
    if (isRevealed) {
        displayDescription = html`${parseDesc(game, description)}`;

        const count = game.money[currency];
        const {average_change, change_reasons} = getCounterChange(game, currency);
        const avgfmt = numberFormat(game, currency, average_change);
        const titleText = titleFormat(game, currency) + ": " + numberFormat(game, currency, count, false) + (average_change && !state.showDiff ? " ("+avgfmt+")" : "");
        

        const reasonsContent = change_reasons.map(([k, v]) => {
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

export function GameUI(core: GameCore) {
    let gameroot = el("div");
    gameroot.classList.add("gameroot");

    const counter_state_map: CounterStateMap = {};

    let renderItem = (confit: GameConfigurationItem) => {
        if (confit[0] === "counter") {
            return Counter(core, counter_state_map, confit[1], confit[2]);
        } else if (confit[0] === "button") {
            let withID = confit[1] as ButtonDetails;
            return BuyButton(core, withID);
        } else if (confit[0] === "separator") {
            return html`<div class="line"></div>`;
        } else if (confit[0] === "spacer") {
            return html`<div class="spacer"></div>`;
        }
        return html`<div>error: ${confit[0]}</div>`;
    };

    gameConfig.forEach(gcfgitm => {
        if(gcfgitm[0] === "button") {
            let withID = gcfgitm[1];
            (withID as any).id = uniq(
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

