import {
    Game,
    splitNumber,
    GameContent,
    GameConfigurationItem,
    ManualButtonDetails,
    Price,
} from "./clicker";

function counter(title: string, description: string): GameConfigurationItem {
    return ["counter", title, description];
}
function button(
    name: string,
    details: {
        price?: Price;
        effects?: Price;
        requires?: Price;
    },
): GameConfigurationItem {
    return ["button", { name, ...details }];
}

const gameContent: GameContent = {
    counterConfig: {
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
    },
    gameConfig: [
        counter("achievement", "number of achievements you have recieved"),
        button("collect 100 gold", {
            requires: { gold: 100_00 },
            price: { _ach_1: 1 },
            effects: { achievement: 1 },
        }),
        button("eat apple", {
            price: { apple: 1_00, _ach_2: 1 },
            effects: { achievement: 1 },
        }),
        button("this game", {
            requires: { credit: 2020 },
            price: { _ach_3: 1 },
            effects: { achievement: 1 },
        }),
        ["separator"],
        counter("stamina", "stamina increases 0.01 per tick, max 1"),
        counter("gold", "gold lets you purchase things"),
        button("fish gold from wishing well", {
            price: { stamina: 10 },
            effects: { gold: 100 },
        }),
        counter("market", "each market adds 0.01 gold per tick"),
        button("purchase market", {
            price: { gold: 25_00 },
            effects: { market: 1 },
        }),
        ["spacer"],
        counter("apple", "an apple"),
        counter("water", "water grows trees"),
        [
            "counter",
            "tree",
            "each full tree requires 2 water each tick to live and drops 1 apple per 10 ticks.",
        ],
        counter("seed", "an apple seed. uses 1 water each tick to grow"),
        button("purchase seed from market", {
            price: { gold: 50_00 },
            requires: { market: 5 },
            effects: { seed: 1_00 },
        }),
        button("take water from wishing well", {
            price: { stamina: 1_00 },
            requires: { market: 5 },
            effects: { water: 1_00 },
        }),
        counter("bucket", "a bucket"),
        button("make bucket", {
            price: { tree: 1_00, gold: 100_00 },
            effects: { bucket: 1 },
        }),
        button("use bucket on wishing well", {
            price: { bucket: 1, stamina: 1_00 },
            effects: { water: 10_00, gold: 10_00 },
        }),
        button("sell apples", {
            requires: { market: 25 },
            price: { apple: 100 },
            effects: { gold: 1000_00, credit: 1 },
        }),
        counter("credit", "a credit"),
        button("", {}),
    ],
    gameLogic: (game: Game) => {
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
    },
};

export default gameContent;
export let { counterConfig, gameConfig, gameLogic } = gameContent;
