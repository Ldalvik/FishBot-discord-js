const fs = require('fs')
const { EmbedBuilder } = require('discord.js')
const XP = require("./experience.js")
const fish = require('../fish_data.json')

module.exports = {
    DEFAULTS: {
        level_multiplier: .2,
        level_cap: 100,
        base_level: 100,

        //Timer upgrade
        cast_time: 15000,
        timer_modifier: 75, //(cast_time - timer_modifier * timer_level)
        
        //Sell modifier upgrade
        sell_multiplier_modifier: .05,

        //Starter perk modifiers
        faster_leveling_perk: .85,
        sell_multiplier_perk: .2,

        //Base fish prices (NOT DONE)
        common_price: 10,
        uncommon_price: 35,

        //Base XP 
        common_xp: 10,
        uncommon_xp: 25,
        rare_xp: 50,
        ultra_rare_xp: 100,
        legendary_xp: 125,
        mythic_xp: 150,
        
        //Base min/max fish
        min_fish: 1,
        max_fish: 10,
    },

    applyPerks: function (message, DEFAULTS, data = null) {
        const userId = message.author.id
        const fishUserData = fish[userId]

        //If getting data ONLY, dont cast rod
        let fishType
        if(data === null) fishType = this.getFish()

    
        //Check if an upgrade has been purchased
        const ownsMoreFish = fishUserData.perks.includes("More Fish")
        const ownsFasterLeveling = fishUserData.perks.includes("Faster Leveling")
        const ownsSellMultiplier = fishUserData.perks.includes("Sell Multiplier")
        const ownsBlackMarketDealer = fishUserData.perks.includes("Black Market Dealer")
    
        /* 
        Checks if More Fish perk was picked. Increases the range of fish from 1-10 to 2-15, otherwise
        it will be 1-10.
        */
        let fishCaught 
        let minFish = this.DEFAULTS.min_fish, maxFish = this.DEFAULTS.max_fish + fishUserData.max_fish_level
        let ownsMoreFishBonus = [0,0]
        //Set min and max fish bonus
        if (ownsMoreFish) ownsMoreFishBonus = [1,5]

        //Calculate min and max fish
        fishCaught = (Math.floor(Math.random() * ((maxFish + ownsMoreFishBonus[1]) - (minFish + ownsMoreFishBonus[0])) + (minFish + ownsMoreFishBonus[0])))

        //Add any bonusFish that were purchased
        fishCaught += Math.floor(Math.random() * fishUserData.bonusFish)

        /*
        Checks if Faster Leveling perk was picked. Decreases the base level XP by 15%, otherwise
        it remains the default
        */
        const currentLevel = XP.parseByXP(fishUserData.exp, DEFAULTS.level_cap, DEFAULTS.base_level)
        var baseLevel
        if (ownsFasterLeveling) { //Owns upgrade
            baseLevel = Math.floor(currentLevel.deltaNext * this.DEFAULTS.faster_leveling_perk) //15%
        } else { //Does not own upgrade
            baseLevel = currentLevel.deltaNext
        }

        /*
        Checks if Sell Multiplier perk was picked. Increases the sell multiplier by 0.2, otherwise
        it will remain the default multiplier.
        */
        var multiplier
        if (ownsSellMultiplier) { //Owns upgrade
            multiplier = 
                ((fishUserData.multiplier + this.DEFAULTS.sell_multiplier_perk) + //base modifier + starter perk bonus
                (currentLevel.level * this.DEFAULTS.level_multiplier) + //Level multiplier (player level * level_multiplier)
                (fishUserData.sell_multiplier_level * this.DEFAULTS.sell_multiplier_modifier)).toFixed(2) //Upgrade multiplier (upgrade level * modifier)
        } else { //Does not own upgrade
             multiplier = (fishUserData.multiplier + //Base modifier
                (currentLevel.level * this.DEFAULTS.level_multiplier) + //Level multiplier (player level * level_multiplier)
                (fishUserData.sell_multiplier_level * this.DEFAULTS.sell_multiplier_modifier)).toFixed(2) //Upgrade multiplier (upgrade level * modifier)
        }

        /*
        Checks if Black Market Dealer perk was picked. Doubles legendary fish sell rate, otherwise
        it sells for default price.
        */
        let dealerPerk = 1
        if (ownsBlackMarketDealer) dealerPerk = 2

        //Sets the totalCash and totalExp that was earned this cast
        switch (fishType) {
            case 'common': totalCash = fishCaught * (50 * multiplier); totalExp = this.DEFAULTS.common_xp; break
            case 'uncommon': totalCash = fishCaught * (100 * multiplier); totalExp = this.DEFAULTS.uncommon_xp; break
            case 'rare': totalCash = fishCaught * (250 * multiplier); totalExp = this.DEFAULTS.rare_xp; break
            case 'ultra rare': totalCash = fishCaught * (500 * multiplier); totalExp = this.DEFAULTS.ultra_rare_xp; break
            case 'legendary': totalCash = fishCaught * ((750 * dealerPerk) * multiplier); totalExp = this.DEFAULTS.legendary_xp; break
            case 'mythic': totalCash = fishCaught * (1000 * multiplier); totalExp = this.DEFAULTS.mythic_xp; break
            default: totalCash = 0, totalExp = 0; break
        }
        //Get rid of nasty decimals
        totalCash =  Math.ceil(totalCash)

        //Add XP multiplier upgrade
        totalExp *= fishUserData.xp_multiplier

        //Add any temporary XP boost
        const hasDoubleXp = fishUserData.temp_double_xp.uses > 0
        if (hasDoubleXp) {
            totalExp *= 2
            fishUserData.temp_double_xp.uses -= 1
        }

        //Add any temporary money boost
        const hasDoubleMoney = fishUserData.temp_double_money.uses > 0
        if (hasDoubleMoney) {
            totalCash *= 2
            fishUserData.temp_double_money.uses -= 1
        }

        //Add total XP to current XP
        fishUserData.exp += totalExp

        //Write new data to fish data files
        fs.writeFile('./fish_data.json', JSON.stringify(fish), err => {
            if (err) console.log('Error writing file', err)
        })

        const newExp = fishUserData.exp
        const earnedExp = totalExp
        const nextCast =  (this.DEFAULTS.cast_time - (fishUserData.timer_level * this.DEFAULTS.timer_modifier))

        const newLevel = XP.parseByXP(newExp, DEFAULTS.level_cap, baseLevel)

        return {
            multiplier,
            minFish,
            maxFish,
            fishType,
            earnedExp,
            totalCash,
            fishCaught,
            newLevel,
            nextCast
        }
    },
    //Upgrade/Perk functions
    getStarterPerk: function (message, perkName) {
        const userId = message.author.id
        const fishUserData = fish[userId]
        //User exists in fish DB
        if (fishUserData != null) {
            //User has not picked a starter perk yet
            if (!fishUserData.starterPerk) {
                fishUserData.perks.push(perkName) //Add perk to perks array
                fishUserData.starterPerk = true   //Set starterPerk to true, so user cant pick multiple times
                fs.writeFile('./fish_data.json', JSON.stringify(fish), err => {
                    if (err) console.log('Error writing file', err)
                })

                message.reply({
                    embeds: [new EmbedBuilder().setTitle(`Starter perk Acquired: ${perkName}`)]
                })

            } else message.reply("Sorry, you've already picked a starter perk.")
        } else {
            //User shouldnt be doing this if they dont exist in the fish DB already, do something here if you want
        }
    },
    getFish: function () {
        var fishType = Math.floor(Math.random() * 100);
        if (fishType < 2) return 'mythic';
        if (fishType < 5) return 'legendary';
        if (fishType < 13) return 'ultra rare';
        if (fishType < 23) return 'rare';
        if (fishType < 39) return 'uncommon';
        return 'common';
    },
}