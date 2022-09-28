const fs = require('fs')
const { EmbedBuilder } = require('discord.js')
const Perks = require("./perks.js");
const users = require('../users.json')
const fish = require('../fish_data.json')

module.exports = {
    TIMER: {
        base: 1000,
        modifier: 2.3
    },
    SELL_MULTIPLIER: {
        base: 5000,
        modifier: 2.8
    },
    MAX_FISH: {
        base: 7500,
        modifier: 2.5
    },
    DOUBLE_XP: {
        price: 50000
    },
    upgradeTimer: function (message) {
        const userId = message.author.id
        const fishUserData = fish[userId]
        const userData = users[userId]
        const upgradePrice = fishUserData.timer_level * this.TIMER.base * this.TIMER.modifier
        const nextUpgradePrice = (fishUserData.timer_level + 1) * this.TIMER.base * this.TIMER.modifier
        //User exists in both DBs
        if (fishUserData != null && userData != null) {
            if (userData.cash >= upgradePrice) {
                userData.cash -= upgradePrice
                fishUserData.timer_level += 1

                fs.writeFile('./fish_data.json', JSON.stringify(fish), err => {
                    if (err) console.log('Error writing file', err)
                })
                fs.writeFile('./users.json', JSON.stringify(users), err => {
                    if (err) console.log('Error writing file', err)
                })

                let newCastTimer = (Perks.DEFAULTS.cast_time - (fishUserData.timer_level * Perks.DEFAULTS.timer_modifier))
                message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`Cast time decreased to ${newCastTimer / 1000} seconds!`)
                            .setDescription(`You upgraded to level ${fishUserData.timer_level} for $${upgradePrice}.`)
                            .addFields({ name: `Level ${fishUserData.timer_level + 1} cost`, value: `$${nextUpgradePrice}` })
                            .addFields({ name: 'Total Cash', value: `$${userData.cash}` })
                    ]
                })
            } else {
                message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`You need another $${upgradePrice - userData.cash} to upgrade. :(`)
                            .addFields({ name: `Level ${fishUserData.timer_level + 1} cost`, value: `$${upgradePrice}` })
                            .addFields({ name: 'Total Cash', value: `$${userData.cash}` })
                    ]
                })
            }
        }
    },
    upgradeSellMultiplier: function (message) {
        const userId = message.author.id
        const fishUserData = fish[userId]
        const userData = users[userId]
        const upgradePrice = fishUserData.sell_multiplier_level * this.SELL_MULTIPLIER.base * this.SELL_MULTIPLIER.modifier
        const nextUpgradePrice = (fishUserData.sell_multiplier_level + 1) * this.SELL_MULTIPLIER.base * this.SELL_MULTIPLIER.modifier
        //User exists in both DBs
        if (fishUserData != null && userData != null) {
            if (userData.cash >= upgradePrice) {
                userData.cash -= upgradePrice
                fishUserData.sell_multiplier_level += 1

                fs.writeFile('./fish_data.json', JSON.stringify(fish), err => {
                    if (err) console.log('Error writing file', err)
                })
                fs.writeFile('./users.json', JSON.stringify(users), err => {
                    if (err) console.log('Error writing file', err)
                })

                message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`Modifier upgraded to +${(fishUserData.sell_multiplier_level * Perks.DEFAULTS.sell_multiplier_modifier).toFixed(2)}x!`)
                            .setDescription(`You upgraded to level ${fishUserData.sell_multiplier_level} for $${upgradePrice}.`)
                            .addFields({ name: `Level ${fishUserData.sell_multiplier_level + 1} cost`, value: `$${nextUpgradePrice}` })
                            .addFields({ name: 'Total Cash', value: `$${userData.cash}` })
                    ]
                })
            } else {
                message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`You need another $${upgradePrice - userData.cash} to upgrade. :(`)
                            .addFields({ name: `Level ${fishUserData.sell_multiplier_level + 1} cost`, value: `$${upgradePrice}` })
                            .addFields({ name: 'Total Cash', value: `$${userData.cash}` })
                    ]
                })
            }
        }
    },
    upgradeMaxFish: function (message) {
        const userId = message.author.id
        const fishUserData = fish[userId]
        const userData = users[userId]
        const upgradePrice = Math.floor(fishUserData.max_fish_level * this.MAX_FISH.base * this.MAX_FISH.modifier)
        const nextUpgradePrice = Math.floor((fishUserData.max_fish_level + 1) * this.MAX_FISH.base * this.MAX_FISH.modifier)
        //User exists in both DBs
        if (fishUserData != null && userData != null) {
            if (userData.cash >= upgradePrice) {
                userData.cash -= upgradePrice
                fishUserData.max_fish_level += 1

                fs.writeFile('./fish_data.json', JSON.stringify(fish), err => {
                    if (err) console.log('Error writing file', err)
                })
                fs.writeFile('./users.json', JSON.stringify(users), err => {
                    if (err) console.log('Error writing file', err)
                })

                message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`Max fish upgraded to +${fishUserData.max_fish_level}!`)
                            .setDescription(`You upgraded to level ${fishUserData.max_fish_level} for $${upgradePrice}.`)
                            .addFields({ name: `Level ${fishUserData.max_fish_level + 1} cost`, value: `$${nextUpgradePrice}` })
                            .addFields({ name: 'Total Cash', value: `$${userData.cash}` })
                    ]
                })
            } else {
                message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`You need another $${upgradePrice - userData.cash} to upgrade. :(`)
                            .addFields({ name: `Level ${fishUserData.max_fish_level + 1} cost`, value: `$${upgradePrice}` })
                            .addFields({ name: 'Total Cash', value: `$${userData.cash}` })
                    ]
                })
            }
        }
    },
    buyDoubleXp: function(message) {
        const userId = message.author.id
        const fishUserData = fish[userId]
        const userData = users[userId]
        //User exists in both DBs
        if (fishUserData != null && userData != null) {
            if (userData.cash >= this.DOUBLE_XP.price) {
                userData.cash -= this.DOUBLE_XP.price
                fishUserData.temp_double_xp.uses += 25

                fs.writeFile('./fish_data.json', JSON.stringify(fish), err => {
                    if (err) console.log('Error writing file', err)
                })
                fs.writeFile('./users.json', JSON.stringify(users), err => {
                    if (err) console.log('Error writing file', err)
                })

                message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`You purchased a 25x double XP boost`)
                            .setDescription(`These will automatically be applied to your next 25 casts.`)
                            .addFields({ name: `Double XP boosts`, value: `${fishUserData.temp_double_xp.uses}` })
                            .addFields({ name: 'Current Balance', value: `$${userData.cash}` })
                    ]
                })
            } else {
                message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`You need another $${this.DOUBLE_XP.price - userData.cash} to buy this. :(`)
                            .addFields({ name: `25x double XP boost cost`, value: `$${this.DOUBLE_XP.price}` })
                            .addFields({ name: 'Total Cash', value: `$${userData.cash}` })
                    ]
                })
            }
        }
    }
}