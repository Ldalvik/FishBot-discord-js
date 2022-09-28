const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js')
const { token } = require('../config.json')
const Fish = require("./fish.js")
const Upgrades = require("./upgrades.js");
const Perks = require("./perks.js");

//Discord.js setup
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] })
client.once('ready', () => {
	console.log('Ready!')
})
client.login(token)

/* TODO
	-Add prefix
	-Branch out commands
	-Player upgrade levels
	-Player profile
	-Tutorial?
	-Help commands
	-"Store" with all purchaseable upgrades
	-"Store" with all purchaseable perks
	-"Store" with all possible boosts
*/

//client.on('interactionCreate', async interaction => { //Slash command
client.on("messageCreate", message => {
	if (message.content === '.ping') {
		message.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle('Ping!')
					.addFields({ name: 'Ping', value: `${message.createdTimestamp - Date.now()}ms` })
					.addFields({ name: 'WebSocket Ping', value: `${client.ws.ping}ms` })
			]
		})
	}

	//Main fish commmand
	if (message.content === '.fish') {
		Fish.castRod(message)
	}

	//Get player stats
	if (message.content === '.fishstats') {
		Fish.getPlayerStats(message)
	}

	//Starter perks
	//TODO: Change logic to a single if content.startsWith(".starterperk") to allow a message when a non-existent upgrade is picked
	if (message.content === ".starterperk more_fish") {
		Perks.getStarterPerk(message, "More Fish")
	}

	if (message.content === ".starterperk faster_leveling") {
		Perks.getStarterPerk(message, "Faster Leveling")
	}

	if (message.content === ".starterperk sell_multiplier") {
		Perks.getStarterPerk(message, "Sell Multiplier")
	}

	if (message.content === ".starterperk black_market_dealer") {
		Perks.getStarterPerk(message, "Black Market Dealer")
	}

	//Upgrade perks
	if(message.content === ".upgrade timer") {
		Upgrades.upgradeTimer(message)
	}

	if(message.content === ".upgrade sell_multiplier"){
		Upgrades.upgradeSellMultiplier(message)
	}

	if(message.content === ".upgrade max_fish"){
		Upgrades.upgradeMaxFish(message)
	}

	if(message.content === ".buy double_xp"){
		Upgrades.buyDoubleXp(message)
	}

	// if(message.content === ".buy double_money"){
	// 	Upgrades.buyDoubleMoney(message)
	// }
})