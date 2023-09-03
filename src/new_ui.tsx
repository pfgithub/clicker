import { counterConfig, gameConfig, gameLogic } from "./content";
import {For, JSX, onMount, untrack} from "solid-js";
import Split from "split.js";
import { ManualButtonDetails } from "./clicker";

// game.performBuy(button)

export function App(): JSX.Element {
    let split_0!: HTMLDivElement;
    let split_1!: HTMLDivElement;
    onMount(() => {
        Split([split_0, split_1], {

        });
    });
    return <div class="h-full flex flex-row">
        <div class="h-full overflow-y-scroll p-2 pb-[50%]" ref={split_0}>
            <For each={gameConfig}>{entry => entry[0] === "counter" ? <>
                <details>
                    <summary>{entry[1]}</summary>
                    {entry[2]}
                </details>
            </> : entry[0] === "separator" ? <>
                <hr class="my-2" />
            </> : entry[0] === "spacer" ? <>
                <div class="pb-2" />
            </> : null}</For>
        </div>
        <div class="h-full overflow-y-scroll p-2 pb-[50%]" ref={split_1}>
            <For each={gameConfig}>{entry => entry[0] === "button" ? <>
                {untrack(() => BuyButton(entry[1]))}
            </> : entry[0] === "separator" ? <>
                <hr class="my-2" />
            </> : entry[0] === "spacer" ? <>
                <div class="pb-2" />
            </> : null}</For>
        </div>
    </div>;
}

function BuyButton(entry: ManualButtonDetails): JSX.Element {
    return <button>
        {entry.name}
    </button>;
}