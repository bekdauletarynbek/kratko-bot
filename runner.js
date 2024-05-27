// import extractAudio from 'ffmpeg-extract-audio'

import  {spawn, exec} from 'child_process';

// const extractAudio = require('')

import {main as ollamaRunner} from './ollama.js'
import fs from 'fs'
// ./main -m ./models/ggml-medium.bin -l ru output.wav

function execShellCommand(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.warn(error);
            }
            resolve(stdout);
        });
    });
}
export async function main(fileName) {
    const files = fs.readdirSync('./audios')
    const filesMeeting = files.filter(k=> k.includes(`${fileName}_`)).filter(k=> k.includes('wav'))
    const whisperPromises = filesMeeting.map(k=> {
        const saveFileName = k.split('.')[0]
         execShellCommand(`cd whisper.cpp && ./main -m models/ggml-large-v3.bin -oved GPU -l ru ../audios/${k}`).then(async (result) => {
             console.log(saveFileName)
             return fs.writeFileSync(`${saveFileName}.txt`, result)
         })
    })
    await Promise.all(whisperPromises)
    await setTimeout(()=> console.log('heeee'), 3000)
    return await ollamaRunner(fileName)
}
