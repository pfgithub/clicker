import { counterConfig, gameConfig, gameLogic } from "./content";

export type GameCore = {
    game: Game,

    onTick(cb: () => void): () => void,

    checkPurchasable(details: ButtonDetails): boolean,
    checkUncovered(details: ButtonDetails): boolean,
    purchase(details: ButtonDetails): boolean,
};

export type CB = () => void;

export type Game = {
    tick: number;
    prev_bal_tick?: number;
    money: ObjectMap<number>;
    moneyTransfer: ObjectMap<TransferInfo>;
    uncoveredCounters: ObjectMap<boolean>;
    counterConfig: CounterConfig;
    cheatMode?: boolean;
};
export type Price = ObjectMap<number | ((game: Game) => number)>;
export type ManualButtonDetails = {
    price?: Price;
    effects?: Price;
    requires?: Price;
    name: string;
    uncover_with?: string;
    style?: "destructive",
};
export type ButtonDetails = ManualButtonDetails & {
    // id: string & { __unique: true };
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
    let tickHandlers: CB[] = [];

    let tickInterval = setInterval(() => {
        // gameTick();
        tickHandlers.forEach(th => th());
    }, 100);

    let saveID = +(localStorage.getItem("lastsave") || "0") + 1;
    localStorage.setItem("lastsave", "" + saveID);

    let game: Game = {
        tick: 0,
        money: {}, // = proxy (set v => if it's null then error)
        counterConfig: {},
        moneyTransfer: {},
        uncoveredCounters: {},
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
        cheat: game, // new Proxy( set(reflect.set, game.cheated = true) )
        restart: () => {
            localStorage.clear();
            clearInterval(tickInterval);
            console.log("Reloading...");
            location.reload();
        },
    };

    let purchased_this_tick = false;
    let before_next_tick: CB[] = [];
    tickHandlers.push(() => {
        game.tick++;
        game.prev_bal_tick = game.money.tick;

        for(const item of before_next_tick) {
            item();
        }
        before_next_tick = [];

        purchased_this_tick = false;

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

        // uncover counters
        for (let entry of gameConfig) {
            if(entry[0] === "button") {
                const purchasable = core.checkPurchasable(entry[1]);
                const uncovered = core.checkUncovered(entry[1]);

                if(purchasable && uncovered) {
                    const effects = Object.entries(entry[1].effects ?? {});
                    
                    for (let [name] of effects) {
                        game.uncoveredCounters[name] = true;
                    }
                }
            }
        }
    });

    const core: GameCore = {
        game: game,

        onTick: (cb) => {
            tickHandlers.push(cb);
            return () => {
                const cb_pos = tickHandlers.indexOf(cb);
                if(cb_pos != -1) tickHandlers.splice(cb_pos, 1);
            };
        },

        checkPurchasable(details) {
            if(details.uncover_with != null) if(!core.checkUncovered(details)) return false;

            const requires = Object.entries(details.requires || {});
            const justPrice = Object.entries(details.price || {});
            const price = [...justPrice, ...requires];

            return price.every(([k, v]) => game.money[k] >= priceget(game, v))
        },
        checkUncovered(details) {
            if(details.uncover_with != null) {
                return !!game.uncoveredCounters[details.uncover_with];
            }

            const requires = Object.entries(details.requires || {});
            const justPrice = Object.entries(details.price || {});
            const price = [...justPrice, ...requires];

            if (price.every(([k]) => game.counterConfig[k].unlockHidden ? true : game.uncoveredCounters[k])) {
                return true;
            }
            return false;
        },

        purchase(details) {
            if(purchased_this_tick) return false;
            if (!game.cheatMode && !core.checkPurchasable(details)) return false;

            before_next_tick.push(() => {
                const justPrice = Object.entries(details.price || {});
                const justEffects = Object.entries(details.effects || {});
                const effects = [
                    ...justPrice.map(([k, v]) => [k, -priceget(game, v)] as const),
                    ...justEffects.map(([k, v]) => [k, priceget(game, v)] as const),
                ];

                game.money.tick += 1; // hack; tick should be added before this is called but it isn't
                for (let [key, value] of effects) {
                    addMoney(game, key, value, 1, "purchase");
                }
                game.money.tick -= 1;
            });

            purchased_this_tick = true;
            return true;
        },
    };
    return core;
}

export function priceget(game: Game, price: number | ((game: Game) => number)) {
    return typeof price === "number" ? price : price(game);
}

let descCache: {[key: string]: string} = {};
export function parseDesc(game: Game, desc: string): string {
    descCache[desc] ??= `${desc.replace(/{([^}]+?)}/g, (_, a) => {
        const split = a.split("|");
        if(split.length === 2) {
            const [b, c] = split;
            const number = +c.split("_").join("");
            return numberFormat(game, b, number, false);
        }else{
            return titleFormat(game, split[0]);
        }
    })}`;
    return descCache[desc];
}

export type DisplayMode =
    | "percentage"
    | "numberpercentage"
    | "decimal"
    | "integer"
    | "boolean"
    | "hidden"
    | "integernocomma1k"
    | "inverse_boolean"
    | "traditional"
    | "scientific"
;//
export type ObjectMap<T> = { [key: string]: T };
export type CounterConfigurationItem = {
    displayMode: DisplayMode;
    displaySuffix?: string;
    displayPrefix?: string;
    initialValue?: number;
    autoReveal?: boolean;
    unlockHidden?: boolean;
    title?: string;
};
export type CounterConfig = ObjectMap<CounterConfigurationItem>;
export type TransferInfo = {
    [reason: string]: {diff: number, frequency: number, lastSet: number},
     // this should probably be an array of transfers that occured last frame
     // and then cleared automatically
};
export function titleFormat(game: Game, currency: string): string {
    if(!game.uncoveredCounters[currency]) return "???";
    const currencyDetails = game.counterConfig[currency];
    if(!currencyDetails) return "EROR_TITLE«"+currency+"»";
    return currencyDetails.title ?? currency;
}

export function splitNumber(
    number: number,
): { decimal: number; integer: number } {
    let numberString = number.toLocaleString("en-US", { useGrouping: false });
    let fullDecimal = numberString.slice(-2).replace("-", "");
    let fullInteger = numberString.slice(0, -2).replace("-", "");
    return { decimal: +fullDecimal, integer: +fullInteger * Math.sign(number) };
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
    // integer_e = 1.00e0 9.00e0 1.00e1 9.90e1 1.00e2 9.99e2...
    if (displayMode === "hidden") {
        return "Oops! You should never see this!";
    }
    if (displayMode === "traditional") {
        if(n < 0) {
            prefix = "-" + prefix;
            n = Math.abs(n);
        }
        let log_val = Math.floor(Math.log10(n));
        if(log_val < 0) log_val = 0;
        let log_val_div = Math.floor(log_val / 3);
        let log_val_mod = log_val % 3;
				let decimals = 2 - log_val_mod;
        if(log_val_div === 0) decimals = 0;
        const div_val = 10 ** (log_val_div * 3);
        const res_val = n / div_val;
        const numbers = ["", "k", "m", "b", "t", "q", "Q", "s", "S", "o", "n", "d", "ud", "dd", "td", "qd"];
        return prefix + res_val.toFixed(decimals) + (numbers[log_val_div] ?? "e"+(div_val * 3)) + suffix;
    }
    if(displayMode === "scientific") {
        return prefix + n.toExponential(2) + suffix;
    }
    if(displayMode === "logarithmic") {
        if(n < 0) {
            prefix = "-" + prefix;
            n = Math.abs(n);
        }
        return prefix + Math.log10(n).toFixed(2) + suffix;
    }
    if (displayMode === "error") {
        return "ERR«"+currency+"»";
    }
    throw new Error("invalid display mode: " + displayMode);
}

export function getCounterChange(game: Game, currency: string): {
    average_change: number,
    change_reasons: [string, {diff: number, frequency: number, lastSet: number}][],
} {
    const reasons = Object.entries(game.moneyTransfer[currency] ?? {}).filter(([k, v]) => game.money.tick < v.lastSet + v.frequency && v.diff !== 0);

    const average = reasons.reduce((t, [k, v]) => t + v.diff / v.frequency, 0);

    const multiply = game.money.tick - (game.prev_bal_tick ?? (game.money.tick - 1));
    if(multiply > 1 && reasons.length > 0) {
        reasons.push(["×" + multiply, {diff: average * multiply - average, frequency: 1, lastSet: game.money.tick}]);
    }

    return {
        average_change: average * multiply,
        change_reasons: reasons,
    };
}

export function addMoney(game: Game, name: string, count: number, period: number, reason: string): void {
    if(!Number.isInteger(count)) {
        alert("not integer "+count+" ("+name+" += "+count+" over " +period +" for " +reason+")");
    }
    game.money[name] += count;
    const moneytransfer = (game.moneyTransfer[name] ??= {});
    if(moneytransfer[reason]?.lastSet === game.money.tick && moneytransfer[reason]?.frequency === period) {
        moneytransfer[reason].diff += count;
    }else{
        moneytransfer[reason] = {diff: count, frequency: period, lastSet: game.money.tick};
    }
}
export function setMoney(game: Game, name: string, count: number): void {
    game.money[name] = count;
}