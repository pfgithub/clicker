import { CounterConfig, ObjectMap, TransferInfo } from "./clicker";
import { counterConfig, gameLogic } from "./content";

export type GameCore = {
    game: Game,

    emitGameUpdate(): void,
    onTick(cb: () => void): () => void,
};

export type CB = () => void;

export type Game = {
    tick: number;
    money: ObjectMap<number>;
    moneyTransfer: ObjectMap<TransferInfo>;
    uncoveredCounters: ObjectMap<boolean>;
    counterConfig: CounterConfig;
    counterState: ObjectMap<{showDiff: boolean}>;
    cheatMode?: boolean;
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

export function newCore(): GameCore {
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

    let saveID = +(localStorage.getItem("lastsave") || "0") + 1;
    localStorage.setItem("lastsave", "" + saveID);

    let game: Game = {
        tick: 0,
        money: {},
        counterConfig: {},
        counterState: {},
        moneyTransfer: {},
        uncoveredCounters: { stamina: true },
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
    // todo per-item history. eg water should show history over 10 ticks instead of the default amount

    game.counterConfig = counterConfig;

    for (let [key, value] of Object.entries(counterConfig)) {
        if (game.money[key] == null || isNaN(game.money[key])) {
            game.money[key] = value.initialValue || 0;
        }
    }

    window.game = {
        // cheat: { money: new Proxy(game.money, {
        //     set: (obj, prop, v) => {
        //         if(!(window as any).__allow_cheating) throw new Error("nah");
        //         return Reflect.set(obj, prop, v);
        //     }
        // }) },
        cheat: game,
        restart: () => {
            localStorage.clear();
            clearInterval(tickInterval);
            console.log("Reloading...");
            location.reload();
        },
    };

    tickHandlers.push(() => {
        game.tick++;

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
                alert("Currency is not an integer, " +
                    currency + " (value is " + count +
                    ")",
                );
                game.money[currency] = Math.floor(count);
            }
        }

        gameLogic(game);
    });

    return {
        game: game,

        emitGameUpdate: emitGameUpdate,
        onTick: (cb) => {
            tickHandlers.push(cb);
            return () => {
                const cb_pos = tickHandlers.indexOf(cb);
                if(cb_pos != -1) tickHandlers.splice(cb_pos, 1);
            };
        },
    };
}
