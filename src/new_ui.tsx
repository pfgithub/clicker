import { gameConfig } from "./content";
import {Accessor, For, Index, JSX, Show, createContext, createSignal, onCleanup, onMount, untrack, useContext} from "solid-js";
import Split from "split.js";
import { Game, GameCore, ManualButtonDetails, getCounterChange, numberFormat, parseDesc, titleFormat } from "./core";
import { spawnParticle } from "./clicker";

// game.performBuy(button)

const sjs_context = createContext<Accessor<true>>();
export function App(core: GameCore): JSX.Element {
    const [ticked, setTicked] = createSignal<true>(true, {equals: false});
    const cleanupOntick = core.onTick(() => {
        setTicked(true);
    });
    onCleanup(() => cleanupOntick());

    return <sjs_context.Provider value={ticked}>
        {untrack(() => AppMain(core))}
    </sjs_context.Provider>;
}
function AppMain(core: GameCore): JSX.Element {
    const ticked = useContext(sjs_context)!;

    let split_0!: HTMLDivElement;
    let split_1!: HTMLDivElement;
    onMount(() => {
        Split([split_0, split_1], {
            sizes: [30, 70],
        });
    });
    return <div class="h-screen flex flex-row">
        <div class="h-full overflow-y-scroll p-2 pb-[50%]" ref={split_0}>
            <For each={gameConfig}>{entry => entry[0] === "counter" ? <>
                {untrack(() => Counter(core, entry[1], entry[2]))}
            </> : entry[0] === "separator" ? <>
                <hr class="my-2" />
            </> : entry[0] === "spacer" ? <>
                <div class="pb-2" />
            </> : null}</For>
        </div>
        <div class="h-full overflow-y-scroll p-2 pb-[50%]" ref={split_1}>
            <For each={gameConfig}>{entry => entry[0] === "button" ? <>
                {untrack(() => BuyButton(core, entry[1]))}
            </> : entry[0] === "separator" ? <>
                <hr class="my-2" />
            </> : entry[0] === "spacer" ? <>
                <div class="pb-2" />
            </> : null}</For>
        </div>
    </div>;
}

function Counter(core: GameCore, currency: string, counter_desc: string): JSX.Element {
    const ticked = useContext(sjs_context)!;
    const game = () => {ticked(); return core.game};

    const is_revealed = () => game().uncoveredCounters[currency] ?? false;
    const count = () => game().money[currency];

    const average_change = (): {avg: number, reasons: [string, {diff: number, frequency: number}][]} => {
        const count = game().money[currency];
        const {average_change, change_reasons} = getCounterChange(game(), currency);
        
        return {avg: average_change, reasons: change_reasons};
    };

    return <Show when={is_revealed()} fallback={<>
        <div>???</div>
    </>}>
        <details class="block">
            <summary>
                {titleFormat(game(), currency)}{": "}
                {numberFormat(game(), currency, count(), false)}
                {average_change().avg ? " ("+numberFormat(game(), currency, average_change().avg)+")" : ""}
            </summary>
            <div class="pl-4">
                <div>{parseDesc(game(), counter_desc)}</div>
                <ul class="list-disc pl-4">
                    <Index each={average_change().reasons} fallback={<>
                        <li><i>Not changing</i></li>
                    </>}>{(itm, i) => <>
                        <li>{numberFormat(game(), currency, itm()[1].diff) + "/"+(itm()[1].frequency === 1 ? "" : itm()[1].frequency)+"t: "+itm()[0]}</li>
                    </>}</Index>
                </ul>
            </div>
        </details>
    </Show>;
}

function BuyButton(core: GameCore, entry: ManualButtonDetails): JSX.Element {
    const ticked = useContext(sjs_context)!;
    
    const game = () => {ticked(); return core.game};
        
    const checkPurchasable = () => (ticked(), core.checkPurchasable(entry));
    const getUncovered = () => (ticked(), core.checkUncovered(entry));

    const requires = Object.entries(entry.requires || {});
    const justPrice = Object.entries(entry.price || {});
    const justEffects = Object.entries(entry.effects || {});

    return <Show when={getUncovered()} fallback={<>
        <div>???</div>
    </>}>
        <button class={"block disabled:opacity-50 " + (checkPurchasable() ? "hover:bg-gray-200 focus:bg-gray-200 active:bg-gray-300" : "")} disabled={!checkPurchasable()} onClick={(e) => {
            if(core.purchase(entry)) {
                if(e.clientX) spawnParticle(e.clientX, e.clientY, "+");
                else {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const cx = rect.left + (rect.right - rect.left) / 2;
                    const cy = rect.top + (rect.bottom - rect.top) / 2;
                    spawnParticle(cx, cy, "+");
                }
            }
        }}>
            <span class={"font-bold "+(checkPurchasable() ? "underline text-blue-600" : "")}>{entry.name}</span>
            <Show when={requires.length > 0}>
                {" / "}<span class="">requires:{" "}</span>
                {requires.map(([name, cost]): JSX.Element => <>
                    <span class={game().money[name] >= cost ? "text-green-600" : "text-red-600"}>
                        ({numberFormat(game(), name, cost, false)} {titleFormat(game(), name)})
                    </span>
                </>)}
            </Show>
            <Show when={justPrice.length > 0}>
                {" / "}<span class="">price:{" "}</span>
                {justPrice.map(([name, cost]): JSX.Element => <>
                    <span class={game().money[name] >= cost ? "text-green-600" : "text-red-600"}>
                        ({numberFormat(game(), name, cost, false)} {titleFormat(game(), name)})
                    </span>
                </>)}
            </Show>
            <Show when={justEffects.length > 0}>
                {" / "}<span class="">effects:{" "}</span>
                {justEffects.map(([name, cost]): JSX.Element => <>
                    <span class={checkPurchasable() ? "text-green-600" : "text-yellow-600"}>
                        ({numberFormat(game(), name, cost, false)} {titleFormat(game(), name)})
                    </span>
                </>)}
            </Show>
        </button>
    </Show>;
}