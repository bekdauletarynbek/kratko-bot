// const { Client, GatewayIntentBits, IntentsBitField  } = require('discord.js');
import pkg from 'discord.js';
const {Client, GatewayIntentBits, IntentsBitField} = pkg;

import {joinVoiceChannel, getVoiceConnection, EndBehaviorType} from "@discordjs/voice";
import {opus} from 'prism-media'
import {exec} from "child_process";
import {main as runner} from './runner.js'
import { PassThrough } from 'stream'


// const {getVoiceConnection} = require('@discordjs/voice')
import fs from 'fs'
// const fs = require('fs');
// const { PassThrough } = require('stream');
// import {PassThrough} from 'stream'

const myIntents = new IntentsBitField();
myIntents.add(IntentsBitField.Flags.GuildPresences, IntentsBitField.Flags.GuildMembers, IntentsBitField.Flags.GuildMessages);

const client = new Client({ intents: [GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates] });

const prefix = '!';

client.once('ready', () => {
    console.log('Bot is ready');
});
const execShellCommand =  (cmd) => {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.warn(error);
            }
            resolve(stdout);
        });
    });
}

const concatStreams = (streamArray, streamCounter = streamArray.length) => streamArray
    .reduce((mergedStream, stream) => {
        mergedStream = stream.pipe(mergedStream, { end: false });
        stream.once('end', () => --streamCounter === 0 && mergedStream.emit('end'));
        return mergedStream;
    }, new PassThrough());
var stream;
var audioStreams = [];


client.on('messageCreate', async (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'join') {
        if (message.channelId) {
            message.channel.send('Hello i just joined to voice channel')
        } else {
            message.channel.send('You need to join a voice channel first!');
        }
    } else if (command === 'leave') {
        const connection = getVoiceConnection(message.guildId);
        if (connection) {
            connection.destroy();
            message.channel.send('Left voice channel!');
        } else {
            message.channel.send('I\'m not in a voice channel!');
        }
    }
    else if(command === 'record') {
        const recordName = message.content.split(' ')[1]
        const connection = joinVoiceChannel({guildId: message.guildId,
            channelId: message.channelId,
            adapterCreator: message.guild.voiceAdapterCreator,
            selfDeaf: false});
        message.channel.send('Joined voice channel!');
        const user = message.author;
        console.log()
        const members = [...message.channel.members].map(([userId, value])=> {
            console.log(value?.user?.globalName)
            const nameUser = value?.user?.globalName?.split(' ')[0]
            return [userId, nameUser]
        }).filter(k=> k && k[0] && k[1])
        console.log(members, 'members')
        const audioStream = members.map((member)=> {
            console.log(member, 'it is member item')
            const connectionItem  =  connection.receiver.subscribe(member[0])
            console.log(connectionItem, 'connection item')
            return connectionItem;
        });
        const decoder = new opus.Decoder({ frameSize: 960, channels: 2, rate: 48000 });
        audioStream.pipe(decoder).pipe(fs.createWriteStream(`./audios/${recordName}}.pcm`))
        message.channel.send('Запись собрания началась !');
        console.log(audioStream)
        stream =  concatStreams(audioStream)

        stream.on("close", async () => {
            const files = fs.readdirSync('./audios')
            console.log(files)
            const filesMeeting = files.filter(k=> k.includes(`${recordName}_`))
            const PromisesFiles = []
            filesMeeting.forEach(k=> {
                console.log(`ffmpeg -y -f s16le -ar 44.1k -ac 2 -i audios/${k} audios/${k}.mp3 && ffmpeg -y -i audios/${k}.mp3 -ar 16000 audios/${k}.wav`)
                PromisesFiles.push(execShellCommand(`ffmpeg -y -f s16le -ar 44.1k -ac 2 -i audios/${k} audios/${k}.mp3 && ffmpeg -y -i audios/${k}.mp3 -ar 16000 audios/${k}.wav`))
            })
            await Promise.all(PromisesFiles)
            const dataFromMeeting = await runner(recordName)
            message.channel.send(dataFromMeeting)
        })
    }
    else if(command === 'stop') {
        console.log(stream)
        stream.destroy()
        console.log('stream is stopped')
        message.channel.send('Запись собрания остановилась, данные по собранию будут отправлены в ближайшее время')
    }
});

client.login(process.env.DISCORD_TOKEN);