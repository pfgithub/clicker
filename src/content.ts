import { Game, GameConfigurationItem, GameContent, Price, addMoney, setMoney, splitNumber } from "./core";

function counter(title: string, description: string): GameConfigurationItem {
    return ["counter", title, description];
}
function button(
    name: string,
    details: {
        price?: Price;
        effects?: Price;
        requires?: Price;
        uncover_with?: string,
        action?: "destructive",
    },
): GameConfigurationItem {
    return ["button", { name, ...details }];
}

function exponential(initial_value: number, multiply: number, balance: number): number {
    const res = initial_value * multiply ** balance;
    if(multiply > 1) return Math.ceil(res)
    return Math.floor(res);
}

/*
ideas:
- tick. a button that lets you purchase a tick (1× tick)
- causes two ticks to be executed next tick
*/
const gameContent: GameContent = {
    counterConfig: {
        tick: { displayMode: "hidden" },
        tick_add: { displayMode: "integer", title: "tick" },
        _prev_stamina: {displayMode: "hidden"},
        stamina: { initialValue: 100, displayMode: "percentage", unlockHidden: true }, // 100%, 50%
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

        mosh_shop_access: {displayMode: "integer", title: "shop access pass", displaySuffix: "×"},
        bunsen_burner: {displayMode: "integer", title: "bunsen burner"},
        composter: {displayMode: "integer"},
        water_wheel: {displayMode: "integer", title: "water wheel"},

        air_pollution: {displayMode: "hidden"},

        // potential future things to make:
        // - beats
        // - seasons (fall, summer, winter, spring)
        // - weather (rain, clouds, ...)
        // - units (12μ)
        // - count for every pixel scrolled on the page
        // - count number of clicks
        // - ice : earlygame cheaper than water but it takes a really long time to melt (realllyyyy long like hours long)

        spice: {displayMode: "traditional", title: "spice", displaySuffix: "味"},
        spice_bush: {displayMode: "traditional", title: "spice bush"},

        _ach_1: { initialValue: 1, displayMode: "inverse_boolean", unlockHidden: true },
        _ach_2: { initialValue: 1, displayMode: "inverse_boolean", unlockHidden: true },
        _ach_3: { initialValue: 1, displayMode: "inverse_boolean", unlockHidden: true },
        _ach_4: { initialValue: 1, displayMode: "inverse_boolean", unlockHidden: true },
        _ach_5: { initialValue: 1, displayMode: "inverse_boolean", unlockHidden: true },
        _ach_6: { initialValue: 1, displayMode: "inverse_boolean", unlockHidden: true },
        _ach_7: { initialValue: 1, displayMode: "inverse_boolean", unlockHidden: true },
        _ach_8: { initialValue: 1, displayMode: "inverse_boolean", unlockHidden: true },
    },
    gameConfig: [
        counter("achievement", "number of achievements you have recieved. each achievement makes work stronger."),
        button("collect 100 gold", {
            requires: { gold: 100_00 },
            price: { _ach_1: 1 }, // _ach_1: [1, {unavailable: "hide"}]
            effects: { achievement: 1 },
        }),
        button("midas", {
            price: { gold: 1_000_000_000_00, _ach_6: 1 },
            effects: { achievement: 1 },
        }),
        button("an apple a day", {
            requires: { apple: 365 },
            price: { _ach_2: 1 },
            effects: { achievement: 1 },
        }),
        button("eat apples", {
            price: { apple: 1_000_000_000_000, _ach_5: 1 },
            effects: { achievement: 1 },
        }),
        button("this game", {
            requires: { credit: new Date().getFullYear() }, // hmm
            price: { _ach_3: 1 },
            effects: { achievement: 1 },
        }),
        button("intergalactic empire", {
            requires: { credit: 1_000_000_000 },
            price: { _ach_7: 1 },
            effects: { achievement: 1 },
        }),
        button("goop maker", {
            requires: { goop: 2_000_00 }, // requires you to produce your own mosh spores past the original 10
            price: { _ach_4: 1 },
            effects: { achievement: 1 },
        }),
        button("goop eater", {
            price: { goop: 1_000_000_000_00, _ach_8: 1 },
            effects: { achievement: 1, goop: 1_000_00 },
        }),
        ["separator"],
        counter("stamina", "stamina increases {stamina|1} per {tick}, max {stamina|100}"), // revealcondition: stamina < 10% (don't show stamina until you run out)
        button("work", {
            requires: {achievement: 1},
            effects: {tick_add: game => (game.money.achievement ?? 0)}, // CONSIDER: effects: (game => {tick_add: game.bal.achievement}), uncover_with: "achievement"
        }),
        ["spacer"],
        // later I could have a "relax" thing that increases your max stamina
        counter("gold", "gold lets you purchase things"),
        button("fish gold from wishing well", {
            price: { stamina: 1 },
            effects: { gold: 100 },
        }),
        counter("market", "each market generates {gold|1} gold per tick"),
        button("purchase market", {
            price: { gold: 25_00 },
            effects: { market: 1 },
        }),
        ["spacer"],
        counter("seed", "an apple seed. uses 1 water each tick to grow"),
        counter("water", "water grows trees"),
        [
            "counter",
            "tree",
            "each full tree requires {water|2} water each tick to live and drops {apple|1} apple per {apple|10} ticks.",
        ], // use template string? tag`each full tree requires ${["water", 2]} water each tick to live`
        counter("bucket", "a bucket"),
        counter("apple", "an apple"),
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
            action: "destructive",
        }),
        counter("sprinkler", "each sprinkler automatically buys {water|20_000} water for {credit|1} credit every 10 ticks."),
        button("buy sprinkler", {
            price: {credit: 100},
            effects: {sprinkler: 1},
        }),
        button("sell sprinkler", {
            price: {sprinkler: 1},
            effects: {credit: 80},
            action: "destructive",
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
        counter("mash", "mashed mosh"),
        counter("mish", "mished goop"),
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
            price: {mosh_spore_0: 1_000_00, spore_catalyst: 1, stamina: 10},
            effects: {mosh_spore: 1},
        }),
        // you can buy a heater in the future to auto convert catalyst + spore0 to spores
        ["spacer"],
        // make a "refill stamina" button idk
        // it can just do effects: {stamina: 100%}
        // should I have a button to add like 10% stamina from the start? that'd
        // make the water section a bit easier but idk it makes you more in control
        counter("mosh_shop_access", "shop access pass"),
        button("buy shop access pass", {
            requires: {goop: 3_000_00}, // make sure you can never go below 1_000_00
            price: {goop: 2_000_00, gold: 100_000_00},
            effects: {mosh_shop_access: 1},
        }),

        // ok let's gate everything past here on having at least 1,000 goop b/c as long as you
        // have at least 1k goop you can repeat the above process and increase how much goop you have
        ["spacer"],
        counter("bunsen_burner", "catalyzes {mosh_spore} automatically. +{mosh_spore|1} each tick, costing {mosh_spore_0|1_000_00} {mosh_spore_0}, {spore_catalyst|1} {spore_catalyst}"),
        counter("composter", "rots {apple} automatically. +{rot|1} {rot} each tick, requiring {swamp|300_00} {swamp} and costing {apple|100_000} {apple}"),
        counter("water_wheel", "produces {stamina|1} {stamina} up to {stamina|200} automatically every 10 ticks"),
        button("purchase bunsen burner", {
            price: {mosh_shop_access: 1, gold: 10_000_00},
            effects: {bunsen_burner: 1},
        }),
        button("sell bunsen burner", {
            price: {bunsen_burner: 1},
            action: "destructive",
        }),
        button("purchase composter", {
            price: {mosh_shop_access: 1, gold: 10_000_00},
            effects: {composter: 1},
        }),
        button("sell composter", {
            price: {composter: 1},
            action: "destructive",
        }),
        button("purchase water wheel", {
            price: {mosh_shop_access: 1, apple: 100_000},
            effects: {water_wheel: 1},
        }),
        button("purchase farmer's market", {
            price: {mosh_shop_access: 1, credit: 1_000_000},
            effects: {merchant: 100_000},
        }),
        button("sell farmer's market", {
            price: {merchant: 50_000},
            action: "destructive",
        }),

        ["spacer"],
        counter("spice", "amount of spice you have"),
        counter("spice_bush", "number of spice bushes you have. each spice bush uses {water|20_00} {water} and {mosh_spore_0|1} {mosh_spore_0} each {tick} to stay alive. each bush increases the number of spices recieved when picking spices"),

        // 1. picking from the spice bush
        button("pick spices", {
            requires: {spice_bush: 1},
            price: {stamina: 2},
            effects: {spice: game => game.money.spice_bush},
        }),
        button("transplant bush", {
            price: {mosh_shop_access: 1, mosh_spore_0: game => exponential(200_000_00, 1.1, game.money.spice_bush), stamina: 120},
            effects: {spice_bush: 1},
        }),

        // 2. growing farms
        // 3. invading countries (little mini-loop, you have to produce war materials or something to invade countries)
        // 4. synthesizing chemicals
    ],
    gameLogic: (game: Game) => {
        return mainLogic(game);
    },
};
function mainLogic(game: Game) {
    let bal = game.money as Readonly<{[key: string]: number}>;
    const up1t = (name: string, count: number, reason: string) => {
        addMoney(game, name, count, 1, reason);
    };
    // TODO post up10t regardless of if it's the 10t mark or not
    const up10t = (name: string, count: number, reason: string) => {
        addMoney(game, name, count, 10, reason);
    };
    const set1t = (name: string, count: number) => {
        setMoney(game, name, count);
    };

    const repeat_count = bal.tick_add + 1;
    if(bal.tick_add > 0) up1t("tick_add", -bal.tick_add, "use");

    if(bal.stamina < 80) { // first purchase that costs lots of stamina costs 80
        game.uncoveredCounters.stamina = true;
    }

    for(let i = 0; i < repeat_count; i++) {
        up1t("tick", 1, "advance");

        if(bal.stamina >= bal._prev_stamina && bal.stamina < 100) {
            up1t("stamina", 1, "rest");
        }
        set1t("_prev_stamina", bal.stamina);

        up1t("gold", bal.market, "markets");
        
        if(bal.sprinkler > 0 && bal.tick % 10 === 0) {
            const buycount =  Math.min(Math.floor(bal.credit / 1), bal.sprinkler);
            up10t("water", 200_00 * buycount, "sprinkler");
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
        if(bal.water > 0 && bal.seed === 0 && tsplit.decimal > 0) {
            up1t("tree", 1, "incomplete tree");
            up1t("water", -1, "regrowth");
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
            const buycount = Math.min(Math.floor(bal.apple / 80), bal.merchant);
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

        if(bal.bunsen_burner > 0) {
            const buycount = Math.min(
                Math.floor(bal.spore_catalyst / 1),
                Math.floor(bal.mosh_spore_0 / 1_000_00),
                Math.floor(bal.bunsen_burner / 1),
            );
            up1t("spore_catalyst", -buycount, "bunsen burner");
            up1t("mosh_spore_0", -buycount * 100, "bunsen burner");
            up1t("mosh_spore", buycount, "bunsen burner");
            up1t("air_pollution", 1, "bunsen burner");
        }
        if(bal.composter > 0 && bal.swamp > 300_00) {
            const buycount = Math.min(
                Math.floor(bal.apple / 100_000),
                Math.floor(bal.composter / 1),
            );
            up1t("apple", -buycount, "composter");
            up1t("rot", buycount, "composter");
            up1t("air_pollution", 1, "composter");
        }
        if(bal.water_wheel > 0 && bal.tick % 10 === 0 && bal.stamina < 200) {
            const buycount = Math.min(
                Math.floor(bal.water_wheel / 1),
                200 - bal.stamina,
            );
            up10t("stamina", buycount, "water wheel");
        }

        const live_bush_count = bal.spice_bush;
        const required_water = live_bush_count;
        const required_mosh_spore_0 = live_bush_count;
        const available_water = Math.floor(bal.water / 20_00);
        const available_mosh_spore_0 = bal.mosh_spore_0;
        const dead_bushes = Math.min(
            available_water - required_water, // 100 - 
            available_mosh_spore_0 - required_mosh_spore_0,
            0,
        );
        const paid_bushes = live_bush_count - dead_bushes;
        up1t("spice_bush", -halflife70(dead_bushes), "died");
        up1t("mosh_spore_0", -paid_bushes, "spice bushes");
        up1t("water", -(paid_bushes * 20_00), "spice bushes");
    }
}

export default gameContent;
export let { counterConfig, gameConfig, gameLogic } = gameContent;
