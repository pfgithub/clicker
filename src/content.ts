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
        stamina: { initialValue: 100, displayMode: "percentage" }, // 100%, 50%
        tree: { displayMode: "numberpercentage" }, // 1
        seed: { displayMode: "numberpercentage" }, // 2 and 10%
        gold: { displayMode: "decimal", displaySuffix: "ᵹ" }, // 1.00, 2.50
        market: { displayMode: "integer" },
        achievement: { displayMode: "integer" },
        apple: { displayMode: "integer" },
        water: { displayMode: "decimal" },
        bucket: { displayMode: "integer" },
        credit: { displayPrefix: "©", displayMode: "integernocomma1k" }, // TODO maybe only disable commas for 1000-9999 but turn them on past that?
        merchant: { displayMode: "integer" },
        "ceo apples": { displayMode: "decimal" },
        sprinkler: {displayMode: "integer"},
        mosh: {displayMode: "decimal"},
        goop: {displayMode: "decimal"},
        mosh_spore: {initialValue: 10, displayMode: "integer", unlockHidden: true, title: "ဪ"},
        mosh_spore_0: {displayMode: "decimal", title: "ဩ"},
        // ဪ⎩25⎫
        // ဩ (spore stage1) → ဪ (spore)

        // next steps:
        // - converting spore0 → spore
        //   - this process should use up all 1,000_00 goop and be gated behind having enough spore seeds
        //   - this process must produce at least 11 spore seeds
        //   - what should it be?
        //   - let's plant the spore seeds in mosh and have them eat bacteria
        //   - then do something else to use up the entirety of the goop supply
        //   - uuh and how do you make sure you don't plant too many spore seeds and be unable to make any bacteria feed
        //   - I'll do something else I guess
        // - mixing mud without stamina, perhaps we need a mixing machine? producing any large quantities of swamp is not fun with that stamina req.
        // - ok this is a terrible idea but what if rot started rotting your apple supply and you have to destroy the rot to make
        //   sure it doesn't destroy all your apples. that's a terrible idea because it wouldn't rot fast enough and you'd end up with
        //   an increasing rot supply for free. actually, it'd rot faster over time. idk maybe that'd work. 

        mud: {displayMode: "decimal"},
        bacteria: {displayMode: "decimal"},
        swamp: {displayMode: "decimal"},
        rot: {displayMode: "integer"}, // passively produces spore0
        mash: {displayMode: "decimal"},
        mish: {displayMode: "decimal"},
        spore_catalyst: {displayMode: "integer", title: "⏺"},

        mosh_shop_access: {displayMode: "boolean", title: "mosh shop access"},
        bunsen_burner: {displayMode: "integer", title: "bunsen burner"},

        _ach_1: { initialValue: 1, displayMode: "inverse_boolean", unlockHidden: true },
        _ach_2: { initialValue: 1, displayMode: "inverse_boolean", unlockHidden: true },
        _ach_3: { initialValue: 1, displayMode: "inverse_boolean", unlockHidden: true },
        _ach_4: { initialValue: 1, displayMode: "inverse_boolean", unlockHidden: true },
    },
    gameConfig: [
        counter("achievement", "number of achievements you have recieved"),
        button("collect 100 gold", {
            requires: { gold: 100_00 },
            price: { _ach_1: 1 }, // _ach_1: [1, {unavailable: "hide"}]
            effects: { achievement: 1 },
        }),
        button("eat apples", {
            price: { apple: 1_00, _ach_2: 1 },
            effects: { achievement: 1 },
        }),
        button("this game", {
            requires: { credit: new Date().getFullYear() }, // hmm
            price: { _ach_3: 1 },
            effects: { achievement: 1 },
        }),
        button("goop maker", {
            requires: { goop: 2000_00 }, // requires you to produce your own mosh spores past the original 10
            price: { _ach_4: 1 },
            effects: { achievement: 1 },
        }),
        ["separator"],
        counter("stamina", "stamina increases {stamina|1} per tick, max {stamina|100}"), // revealcondition: stamina < 10% (don't show stamina until you run out)
        // later I could have a "relax" thing that increases your max stamina
        counter("gold", "gold lets you purchase things"),
        button("fish gold from wishing well", {
            price: { stamina: 2 },
            effects: { gold: 100 },
        }),
        counter("market", "each market generates {gold|1} gold per tick"),
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
            "each full tree requires {water|2} water each tick to live and drops {apple|1} apple per {apple|10} ticks.",
        ], // use template string? tag`each full tree requires ${["water", 2]} water each tick to live`
        counter("seed", "an apple seed. uses 1 water each tick to grow"),
        button("purchase seed from market", {
            price: { gold: 50_00 },
            requires: { market: 5 },
            effects: { seed: 1_00 },
        }),
        button("take water from wishing well", {
            price: { stamina: 80 },
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
            effects: { water: 11_00, gold: 10_00 },
        }),
        button("sell apples", {
            requires: { market: 25 },
            price: { apple: 100 },
            effects: { gold: 1000_00, credit: 1 },
        }),
        ["spacer"],
        counter("credit", "a credit"),
        button("purchase water with credit", {
            price: { credit: 5 },
            effects: { water: 100_00 },
        }),
        ["spacer"],
        counter("merchant", "each merchant automatically sells {apple|80} apples for {credit|1} credit every 10 ticks."),
        button("hire merchant", {
            price: {credit: 15},
            effects: {merchant: 1},
        }),
        button("fire merchant", {
            price: {merchant: 1, gold: 10_000},
        }),
        counter("sprinkler", "each sprinkler automatically buys {water|20_000} water for {credit|1} credit every 10 ticks."),
        button("buy sprinkler", {
            price: {credit: 100},
            effects: {sprinkler: 1},
        }),
        button("sell sprinkler", {
            price: {sprinkler: 1},
            effects: {credit: 80},
        }),
        ["spacer"],
        button("buy seed bundle", {
            price: {credit: 100},
            effects: {seed: 100_00},
        }),
        button("buy large seed bundle", {
            price: {credit: 1_000},
            effects: {seed: 2_000_00},
        }),
        button("buy mega seed bundle", {
            price: {credit: 500_000},
            effects: {seed: 1_000_000_00},
        }),
        button("buy markets in bulk", {
            price: {credit: 10_000, gold: 100 * 25_00},
            effects: {market: 100},
        }),
        ["spacer"],
        counter("mosh", "has a half life of 700 ticks, decaying into goop"),
        counter("goop", "goop"), // you can get a maximum of 1,000 goop until you unlock mosh spores. make sure it's not possible to lose goop.
        button("mosh seeds", { // TODO reveal button title once seed is reveaed, even if mosh spore isn't revealed
            price: {seed: 1_000_00, mosh_spore: 1},
            effects: {mosh: 100_00},
        }),
        button("make goop", {
            price: {mosh: 10_00},
            effects: {goop: 10_00},
        }),
        ["spacer"],
        counter("mosh_spore", "spores to produce mosh"),
        counter("mosh_spore_0", "spore seeds"),
        counter("rot", "substrate that passively produces {mosh_spore_0}"),
        ["spacer"],
        counter("mud", "decays into mosh with a half life of 70 ticks"),
        button("mix mud", {
            price: {goop: 100_00, water: 20_000, stamina: 100},
            effects: {mud: 100_00},
        }),
        counter("bacteria", "decays into mosh with a half life of 70 ticks"),
        button("grow bacteria", {
            price: {goop: 100_00, apple: 100},
            effects: {bacteria: 100_00},
        }),
        ["spacer"],
        counter("swamp", "decays into mosh with a half life of 700 ticks"),
        button("lay swamp", {
            price: {mud: 100_00, bacteria: 100_00},
            effects: {swamp: 200_00},
        }),
        button("rot apples", {
            requires: {swamp: 300_00},
            price: {apple: 100_000},
            effects: {rot: 1},
        }),
        // I should do some stuff using stamina to convert goop into materials or something
        ["spacer"],
        counter("mish", "mished goop"),
        counter("mash", "mashed mosh"),
        button("mash mosh", {
            requires: {mosh_spore_0: 10_000_00},
            price: {mosh: 100_00, stamina: 100},
            effects: {mash: 10_00},
        }), // max. 90_00
        button("mish goop", {
            requires: {mash: 90_00},
            price: {goop: 100_00},
            effects: {mish: 10_00},
        }),
        ["spacer"],
        counter("spore_catalyst", "catalyst"),
        button("create catalyst", {
            price: {mish: 1_00, mash: 9_00},
            effects: {spore_catalyst: 10},
        }),
        // each spore catalyst must produce 11-100 spore seeds or something
        button("apply catalyst", {
            price: {spore_catalyst: 1, mosh_spore_0: 1_00, stamina: 10},
            effects: {mosh_spore: 1},
        }),
        // you can buy a heater in the future to auto convert catalyst + spore0 to spores
        ["spacer"],
        // make a "refill stamina" button idk
        // it can just do effects: {stamina: 100%}
        // should I have a button to add like 10% stamina from the start? that'd
        // make the water section a bit easier but idk it makes you more in control
        counter("mosh_shop_access", "shop access pass"),
        button("get shop access", {
            price: {goop: 2_000_00, gold: 100_000_00},
            effects: {mosh_shop_access: 1},
        }),
        button("sell shop access", {
            price: {mosh_shop_access: 1},
            effects: {goop: 1_000_00}, // if you *really* mess up you can get back your 1,000 goop you started with
        }),

        // ok let's gate everything past here on having at least 1,000 goop b/c as long as you
        // have at least 1k goop you can repeat the above process and increase how much goop you have
        ["spacer"],
        counter("bunsen_burner", "catalyzes {mosh_spore} automatically. +{mosh_spore|1} each tick, costing {spore_catalyst|1} {spore_catalyst}, {mosh_spore_0|100} {mosh_spore_0}"),
        button("purchase bunsen burner", {
            requires: {mosh_shop_access: 1},
            price: {gold: 10_000_00},
            effects: {bunsen_burner: 1},
        }),
        // oh actually
        // let's make a mosh shop access pass
        // you purchase it for 2,000 goop and 100,000 gold and you can sell it at any time for 2,000 goop

        // ok now that you're in the shop you should probably been given new methods of gold accumulation
    ],
    gameLogic: (game: Game) => {
        // logic
        let bal = game.money as Readonly<{[key: string]: number}>;
        const up1t = (name: string, count: number, reason: string) => {
            game.money[name] += count;
            (game.moneyTransfer[name] ??= {})[reason] = {diff: count, frequency: 1, lastSet: game.tick};
        };
        // TODO post up10t regardless of if it's the 10t mark or not
        const up10t = (name: string, count: number, reason: string) => {
            game.money[name] += count;
            (game.moneyTransfer[name] ??= {})[reason] = {diff: count, frequency: 10, lastSet: game.tick};
        };
        const set1t = (name: string, count: number) => {
            game.money[name] = count;
        };
        up1t("tick", 1, "advance");
        up1t("gold", bal.market, "markets");
        if (bal.stamina < 100) up1t("stamina", 1, "rest");
        if (bal.stamina > 100) set1t("stamina", 100);
        
        if(bal.sprinkler > 0 && bal.tick % 10 === 0) {
            const buycount =  Math.min(Math.floor(bal.credit / 1), bal.sprinkler);
            up10t("water", 20_000 * buycount, "sprinkler");
            up10t("credit", -1 * buycount, "sprinkler");
        }

        if (bal.tree < 0) set1t("tree", 0);
        let treeWaterCost = 2;
        let tsplit = splitNumber(bal.tree);
        let liveTreeCount = tsplit.integer;
        let requiredWater = liveTreeCount;
        let availableWater = bal.water / treeWaterCost;
        if(bal.tick % 10 === 0) up10t("apple", liveTreeCount, "trees");
        let deadTrees = requiredWater - availableWater;
        if(deadTrees > 0) up1t("tree", -2 * deadTrees, "dehydration");
        if (bal.water < 2 && deadTrees <= 0 && bal.tree > 0) {
            up1t("tree", -1, "dehydration");
        }
        up1t("water",
            -(availableWater < requiredWater ? availableWater : requiredWater) *
            treeWaterCost,
            "trees",
        );

        if (bal.seed > 0) {
            game.uncoveredCounters.tree = true;
            game.uncoveredCounters.apple = true;

            let availableWater = bal.water;
            let availableSeed = bal.seed;
            let used = Math.min(availableWater, Math.ceil(availableSeed / 100));
            if (used >= 1) {
                up1t("seed", -used, "growth");
                up1t("tree", used, "growth");
                up1t("water", -used, "growth");
            }
        } else {
            set1t("seed", 0);
        }
        
        if(bal.merchant >= 1 && bal.tick % 10 == 5) {
            const buycount = Math.min(bal.apple / 80 |0, bal.merchant);
            up10t("apple", -buycount * 80, "merchant");
            up10t("credit", buycount * 1, "merchant");
            up10t("ceo apples", buycount * 2, "merchant"); // ceo takes 2 apples from every merchant sell
        }

        const hlc = (num: number, hl: number) => Math.ceil(num * hl);
        const halflife700 = (num: number): number => {
            return hlc(num, 1 / 1000);
        };
        const halflife70 = (num: number): number => {
            return hlc(num, 1 / 100);
        };

        if(bal.mud > 0) {
            const diff = halflife70(bal.mud);
            up1t("mud", -diff, "mud decay");
            up1t("mosh", diff, "mud decay");
        }
        if(bal.bacteria > 0) {
            const diff = halflife70(bal.bacteria);
            up1t("bacteria", -diff, "bacteria decay");
            up1t("mosh", diff, "bacteria decay");
        }
        if(bal.swamp > 0) {
            const diff = halflife700(bal.swamp);
            up1t("swamp", -diff, "swamp decay");
            up1t("mosh", diff, "swamp decay");
        }

        up1t("mosh_spore_0", bal.rot, "rot");
        if(bal.mosh_spore_0 > 0) {
            game.uncoveredCounters.mosh_spore_0 = true;
        }

        if(bal.mosh > 0) {
            const diff = halflife700(bal.mosh);
            up1t("mosh", -diff, "mosh decay");
            up1t("goop", diff, "mosh decay");
        }

        {
            const buycount = Math.min(bal.spore_catalyst / 1 |0, bal.mosh_spore_0 / 100 |0);
            up1t("spore_catalyst", -buycount, "bunsen burner");
            up1t("mosh_spore_0", -buycount * 100, "bunsen burner");
            up1t("mosh_spore", buycount, "bunsen burner");
        }
    },
};

export default gameContent;
export let { counterConfig, gameConfig, gameLogic } = gameContent;
