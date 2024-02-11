const axios = require('axios');
const { Client, GatewayIntentBits } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const config = require('./config.json');
const Cheerio = require('cheerio');
var clc = require("cli-color");
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

console.clear();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log(`NumeradeBot Ready on ChannelID: ${clc.blue.bold(config.channel_id)}`);
});

const regex = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/;
client.on('messageCreate', async (msg) => {
    if (msg.channelId === config.channel_id) {
        const channel = msg.channel;
        const content = msg.content.toLowerCase();
        const links = content.match(regex);
        if (links && links.length > 0) {
            for (const link of links) {
                if (link.includes('https://www.numerade.com/ask/question/') || link.includes('https://www.numerade.com/questions/')) {
                    console.log(link)
                    const videoLink = await getNumeradeAnswer(link);
                    const successEmbed = new EmbedBuilder()
                        .setThumbnail('https://images.sftcdn.net/images/t_app-icon-m/p/71073908-aeca-40de-b6db-5f8e211e4130/3105227288/numerade-logo')
                        .setColor(0x0099FF)
                        .setTitle('Success!')
                        .addFields(
                            { name: 'Click Below for your Video Answer', value: `[Video Link](${videoLink})` },
                            { name: 'Requested Link:', value: `[Click for Requested Link](${link})`, inline: false },
                        )
                        .setTimestamp()
                    await channel.send({
                        content: `${msg.author}`,
                        embeds: [successEmbed],
                    });
                    console.log(clc.yellow.bold('[+] ') + `Solution Delivered to ${msg.author.tag}`)
                    msg.delete();
                    break;
                } else {
                    const failEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('Failed!')
                        .addFields(
                            { name: 'Wrong Link Format', value: `Please enter a valid Numerade Link`, inline: false },
                        )
                        .setTimestamp()
                    await channel.send({
                        content: `${msg.author}`,
                        embeds: [failEmbed],
                    });
                    msg.delete();
                    break;
                }
            }
        }
    }
});

async function getNumeradeAnswer(link) {
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `${link}`,
        headers: {}
    };
    try {
        const response = await axios(config);
        const $ = Cheerio.load(response.data);
        const src = $('img.background-gif').attr('src');
        switch (true) {
            case src.includes('https://cdn.numerade.com/ask_previews/'):
                let videoSTRING = src.split('/')[4].split('_')[0];
                let videoLink = `https://cdn.numerade.com/ask_video/${videoSTRING}.mp4`;
                console.log(clc.green.bold(`[+] `) + clc.black.bold(`[${videoSTRING}] `) + videoLink)
                return videoLink;
            case src.includes('https://cdn.numerade.com/project-universal/previews/'):
                let videoSTRING2 = src.split('/')[5].split('_')[0];
                let videoLink2 = `https://cdn.numerade.com/project-universal/encoded/${videoSTRING2}.mp4`;
                console.log(clc.green.bold(`[+] `) + clc.black.bold(`[${videoSTRING2}] `) + videoLink2)
                return videoLink2;
            case src.includes('https://cdn.numerade.com/previews/'):
                let videoSTRING3 = (src.split('/')[4].split('_')[0]).split('.')[0];
                let videoLink3 = `https://cdn.numerade.com/encoded/${videoSTRING3}.mp4`;
                console.log(clc.green.bold(`[+] `) + clc.black.bold(`[${videoSTRING3}] `) + videoLink3)
                return videoLink3;
        }
    } catch (error) {
        console.log(error);
    }
}

client.login(config.token);