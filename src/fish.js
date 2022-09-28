
const { EmbedBuilder } = require('discord.js')

const users = require('../users.json')
const fish = require('../fish_data.json')
const fs = require('fs')
const Perks = require("./perks.js");

module.exports = {
    /*
    Base level of 100 with multiplier of .2
            level 1: 0-100 xp
            level 2: 100-180 xp
            level 3: 180- xp

    Base level of 80 with multiplier of .2 (Simulation of owning "Faster Leveling" perk)
            level 1: 0-80 xp
            level 2: 80- xp
            level 3: - xp

     Base level of 100 with multiplier of .3
            level 1: 0-100 xp
            level 2: 100- xp

    Base level of 80 with multiplier of .3 (Simulation of owning "Faster Leveling" perk if multiplier was .3)
            level 1: 0-80 xp
            level 2: 80- xp
            level 3: - xp
    */
    DEFAULTS: {
        level_multiplier: .2,
        level_cap: 100,
        base_level: 100,
    },
    castRod: function (message) {
        const userId = message.author.id
        const userData = users[userId]
        const fishUserData = fish[userId]

        //Users first time playing fish
        if (fishUserData == null) {
            this.isNewPlayer(message)
            //User has played fish
        } else {
            //User exists in DB
            if (userData != null) {
                this.getRewards(message)
                //Not existing in user DB, completely new to server?
            } else {
                const userId = message.author.id
                //Create new profile object and save it to the user DB
                users[userId] = { cash: 0 }
                fs.writeFile('./users.json', JSON.stringify(users), err => {
                    if (err) console.log('Error writing file', err)
                })
                message.reply("You must be new here, and the first thing you did was play fish?? New profile created.")
            }
        }
    },
    getRewards: function (message) {
        const userId = message.author.id
        const userData = users[userId]
        const fishUserData = fish[userId]

        if (fishUserData.next_cast > Date.now()) {
            message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`You're still fishing!`)
                        .setDescription(`You can collect your fish in ${((fishUserData.next_cast - Date.now()) / 1000)} seconds.`)
                ]
            })
        } else {
            //Get the total bonuses from the players active perks.
            const result = Perks.applyPerks(message, this.DEFAULTS)

            //Add totalCash to current cash
            userData.cash += result.totalCash

            //Set next time that user can collect their fish
            fishUserData.next_cast = Date.now() + result.nextCast

            //Write new cash value and next cast to db
            fs.writeFile('./users.json', JSON.stringify(users), err => {
                if (err) console.log('Error writing file', err)
            })

            fs.writeFile('./fish_data.json', JSON.stringify(fish), err => {
                if (err) console.log('Error writing file', err)
            })

            //Get users active perks, return None if no perks are active. (Should at least have a starter perk)
            const activePerks = fishUserData.perks.join() ? fishUserData.perks.join() : "None"

            let fishMessage = new EmbedBuilder()
            .setTitle(`You caught ${result.fishCaught} ${result.fishType} fish, and earned ${result.earnedExp}xp.`)
            .addFields({ name: 'Sold for', value: `$${result.totalCash}` })
            .addFields({ name: 'Total Cash', value: `$${userData.cash}` })
            //.addFields({ name: 'Sell multiplier', value: `${fishUserData.multiplier}x` })
            .setFooter({ text: `Level ${result.newLevel.level} (${result.newLevel.toNext}xp until next level)` })

            if(fishUserData.temp_double_money.uses > 0)
                fishMessage.addFields({ name: 'Double Money active', value: `Remaining: ${fishUserData.temp_double_money.uses}` })
            
            if(fishUserData.temp_double_xp.uses > 0)
                fishMessage.addFields({ name: 'Double XP active', value: `Remaining: ${fishUserData.temp_double_xp.uses}` })

            message.reply({
                embeds: [fishMessage]
            })
        }
    },
    isNewPlayer: function (message) {
        const userId = message.author.id
        //Create fish game data for new user and save it to fish data DB
        fish[userId] = {
            next_cast: 0,
            multiplier: 1.0,
            xp_multiplier: 1.0,
            bonusFish: 0,
            timer_level: 1,
            max_fish_level: 0,
            sell_multiplier_level: 0,
            perks: [],
            exp: 0,
            temp_double_xp: { uses: 0 },
            temp_double_money: { uses: 0 },
            starterPerk: false
        }
        fs.writeFile('./fish_data.json', JSON.stringify(fish), err => {
            if (err) console.log('Error writing file', err)
        })
        message.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`Hey, It's your first time fishing!`)
                    .setDescription("Before you cast your first rod, read this tutorial. Make sure to read about picking a starter perk!")
                    .addFields({ name: 'Buying upgrades', value: "To purchase an upgrade, use .fishmarket upgrade_name." })
                    .addFields({ name: 'Level System', value: "Every time you cast your rod, you gain experience points. Every time you level up, you get a permanent sell multiplier. Caps out at level 100." })
                    .addFields({ name: 'Fish type', value: "Common ($50, 5xp),\nUncommon ($100. 10 xp),\nRare ($250, 15xp),\nUltra Rare ($500, 30xp),\nLegendary ($750, 75xp),\nMythic ($100, 100xp)" })
                    .addFields({ name: 'PICK A STARTER PERK!!', value: `You can choose one of four free perks.\n\`\`\`.starterperk more_fish\`\`\` will increase the range of fish from ${Perks.DEFAULTS.min_fish}-${Perks.DEFAULTS.max_fish} to ${Perks.DEFAULTS.min_fish + 1}-${Perks.DEFAULTS.max_fish + 5}.\n\`\`\`.starterperk faster_leveling\`\`\`  will reduce the base level by ${100 - (100 * Perks.DEFAULTS.faster_leveling_perk)}%\n\`\`\`.starterperk black_market_dealer\`\`\` will double the amount of money legendary fish sell for.\n\`\`\`.starterperk sell_multiplier\`\`\` will increase the base sell multiplier from ${(1 + this.DEFAULTS.level_multiplier)} to ${(1 + this.DEFAULTS.level_multiplier) + Perks.DEFAULTS.sell_multiplier_perk}.` })
            ]
        })
    },
    getPlayerStats: function(message){
        const userId = message.author.id
        const userData = users[userId]
        const fishUserData = fish[userId]

        const result = Perks.applyPerks(message, this.DEFAULTS, true)

        if(fishUserData != null){
            message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`${message.author.username}'s stats | (Level ${result.newLevel.level})`)
                        .addFields({ name: 'Experience', value: `${fishUserData.exp}/${result.newLevel.forNext}xp (${result.newLevel.toNext}xp until next level)` })
                        .addFields({ name: 'Total Cash', value: `$${userData.cash}` })
                        .addFields({ name: 'Perks', value: fishUserData.perks.join() })
                        .addFields({ name: 'Sell Multiplier',   value: `${result.multiplier}` })
                        .addFields({ name: 'XP Multiplier',   value: `${fishUserData.xp_multiplier}` })
                        .addFields({ name: 'Min possible fish', value: `${result.minFish}` })
                        .addFields({ name: 'Max possible fish', value: `${result.maxFish}` })
                        .addFields({ name: 'Fishing timer', value: `${result.nextCast / 1000} seconds` })
                ]
            })
        }
    }
}