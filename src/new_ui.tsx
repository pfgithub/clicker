import { gameConfig } from "./content";
import {Accessor, For, Index, JSX, Show, createContext, createSignal, onCleanup, onMount, untrack, useContext} from "solid-js";
import Split from "split.js";
import { Game, GameConfigurationItem, GameCore, ManualButtonDetails, getCounterChange, numberFormat, parseDesc, titleFormat } from "./core";
import { spawnParticle } from "./clicker";
import { signalFromMatchMedia } from "./util";

const pointer_coarse = signalFromMatchMedia("(pointer: coarse)", true, false);
// setting: "padding": "normal" | "increased" | "default (pointer: fine) ? normal : increased"
// this can be: padding: normal | increased (reset)

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

    type Section = {
        left: GameConfigurationItem[],
        right: GameConfigurationItem[],
        single?: boolean,
    };
    const sections: Section[] = [];
    let uncommitted_section: Section = {left: [], right: []};
    let commitSection = () => {
        if(uncommitted_section.left.length > 0 || uncommitted_section.right.length > 0) {
            sections.push(uncommitted_section);
            uncommitted_section = {left: [], right: []};
        }
    };
    for(const segment of gameConfig) {
        if(segment[0] === "separator") {
            commitSection();
            sections.push({
                left: [segment],
                right: [],
                single: true,
            });
        }else if(segment[0] === "spacer") {
            commitSection();
            sections.push({
                left: [segment],
                right: [],
                single: true,
            });
        }else if(segment[0] === "counter") {
            // if(uncommitted_section.right.length > 0) commitSection();
            uncommitted_section.left.push(segment);
        }else if(segment[0] === "button") {
            uncommitted_section.right.push(segment);
        }
    }
    commitSection();

    if(false) {
        let split_0!: HTMLDivElement;
        let split_1!: HTMLDivElement;
        onMount(() => {
            Split([split_0, split_1], {
                sizes: [30, 70],
            });
        });
        return <div class="h-screen flex flex-row">
            <div class="h-full overflow-y-scroll p-2 pb-[50%]" ref={split_0}>
                {sections.map(segment => (
                    segment.left.map(item => untrack(() => Segment(core, item)))
                ))}
            </div>
            <div class="h-full overflow-y-scroll p-2 pb-[50%]" ref={split_1}>
                {sections.map(segment => (
                    segment.right.map(item => untrack(() => Segment(core, item)))
                ))}
            </div>
        </div>;
    }else{
        return <div class="py-2">
            {sections.map(segment => <div class={
                "flex flex-col md:grid " + (segment.single ? "grid-cols-[1fr]" : "grid-cols-[30fr_max-content_70fr]")
            }>
                <div class={"md:text-right flex flex-col"}>
                    {segment.left.map(item => untrack(() => Segment(core, item)))}
                </div>
                <Show when={!segment.single}>
                    <div class="border-l border-zinc-400 h-full" />
                     <div class={"md:text-right flex flex-col"}>
                        {segment.right.map(item => untrack(() => Segment(core, item)))}
                    </div>
                </Show>
            </div>)}
        </div>;
    }
}

function Segment(core: GameCore, segment: GameConfigurationItem): JSX.Element {
    if(segment[0] === "counter") {
        return Counter(core, segment[1], segment[2]);
    }else if(segment[0] === "button") {
        return BuyButton(core, segment[1]);
    }else if(segment[0] === "separator") {
        return <div class={"px-2" + (pointer_coarse() ? " py-8" : "")}><hr class="my-2 border-zinc-400" /></div>;
    }else if(segment[0] === "spacer") {
        return <div class={(pointer_coarse() ? "pb-16" : "pb-4")} />;
    }
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

    const [is_open, setOpen] = createSignal(false);

    // consider counter descriptions on hover rather than click

    return <>
        <details aria-disabled={!is_revealed()} tabindex={!is_revealed() ? -1 : 0} class={"block "+(!is_revealed() ? "pointer-events-none opacity-40 select-none" : "")} open={is_revealed() && is_open()} onToggle={v => {
            if(!is_revealed()) {
                setOpen(false);
                v.currentTarget.open = false;
                return;
            }
            setOpen(v.currentTarget.open);
        }}>
            <summary class={(pointer_coarse() ? "py-2" : "") + " hover:bg-gray-200 user-select-none px-2 user-select-none "+(is_open() ? "bg-gray-100" : "")}>
                <Show when={is_revealed()} fallback={"???"}>
                    {titleFormat(game(), currency)}{": "}
                    {numberFormat(game(), currency, count(), false)}
                    {average_change().avg ? " ("+numberFormat(game(), currency, average_change().avg)+")" : ""}
                </Show>
            </summary>
            <div class={(pointer_coarse() ? "py-2 " : "") + "px-2 text-left bg-gray-50"}>
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
    </>;
}

function BuyButton(core: GameCore, entry: ManualButtonDetails): JSX.Element {
    const ticked = useContext(sjs_context)!;
    
    const game = () => {ticked(); return core.game};
        
    const checkPurchasable = () => (ticked(), core.checkPurchasable(entry));
    const getUncovered = () => (ticked(), core.checkUncovered(entry));

    const requires = Object.entries(entry.requires || {});
    const justPrice = Object.entries(entry.price || {});
    const justEffects = Object.entries(entry.effects || {});

    return <>
        <button class={(pointer_coarse() ? "py-2" : "" )+ " px-2 block w-full text-left "+(getUncovered() ? "disabled:opacity-100 " : "disabled:opacity-50 ") + (checkPurchasable() ? "hover:bg-gray-200 focus:bg-gray-200 active:bg-gray-300" : "")} disabled={!checkPurchasable()} onClick={(e) => {
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
            <span class={(getUncovered() ? "font-bold " : "")+(checkPurchasable() ? "underline text-blue-600" : "")}>
                {!getUncovered() ? "locked" : entry.name}
            </span>
            <Show when={requires.length > 0}>
                {pointer_coarse() ? <div /> : " / "}<span class="">requires:{" "}</span>
                {requires.map(([name, cost]): JSX.Element => <>
                    <span class={game().money[name] >= cost ? "text-green-600" : "text-red-600"}>
                        ({numberFormat(game(), name, cost, false)} {titleFormat(game(), name)})
                    </span>
                </>)}
            </Show>
            <Show when={justPrice.length > 0}>
                {pointer_coarse() ? <div /> : " / "}<span class="">price:{" "}</span>
                {justPrice.map(([name, cost]): JSX.Element => <>
                    <span class={game().money[name] >= cost ? "text-green-600" : "text-red-600"}>
                        ({numberFormat(game(), name, cost, false)} {titleFormat(game(), name)})
                    </span>
                </>)}
            </Show>
            <Show when={justEffects.length > 0}>
                {pointer_coarse() ? <div /> : " / "}<span class="">effects:{" "}</span>
                {!getUncovered() ? "???" : justEffects.map(([name, cost]): JSX.Element => <>
                    <span class={checkPurchasable() ? "text-green-600" : "text-yellow-600"}>
                        ({numberFormat(game(), name, cost, false)} {titleFormat(game(), name)})
                    </span>
                </>)}
            </Show>
        </button>
    </>;
}