import Ollama from 'ollama'
import fs from 'fs'


function readFile(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

function combineFilesAndSave(filesToCombine) {
    let allLines = [];

    filesToCombine.forEach(file => {
        const content = readFile(file);
        const lines = content.split('\n');
        lines.forEach(line => {
            if (line.trim() !== '') {
                allLines.push({ file: file, line: line.trim() });
            }
        });
    });

    allLines.sort((a, b) => {
        const timeA = a.line.match(/\[(.*?)\]/)[1];
        const timeB = b.line.match(/\[(.*?)\]/)[1];
        return timeA.localeCompare(timeB);
    });

    const combinedContent = allLines.map(item => `[${item.file?.split('_')[1].split('.txt')[0]}]: ${item.line}`).join('\n');
    fs.writeFileSync('combined_sorted.txt', combinedContent);
    return combinedContent;
}


export const main = async  (recordName = '05_06_2024_daily')=> {
    // const filesList = fs.readdirSync(`./`)
    // const filesListMeeting = filesList.filter(k=> k.includes(`${recordName}_`)).filter(k=> k.includes('.txt'))
    // const combinedTexts = combineFilesAndSave(filesListMeeting)

    const combinedTexts = fs.readFileSync(`./${recordName}.txt`).toString()
    console.log(combinedTexts, combinedTexts.length)
    const response = await Ollama.chat({
        model: 'llama3-gradient',
        messages: [{ role: 'user', content: `Напиши о чем общались на этом собрании: '${combinedTexts}'. Игнорируй надписи "С вами был Игорь Негода". Анализируй весь текст. И ответ должен быть на русском` }],
        options: {
            num_ctx: 40000
        }

    })
    console.log(response.message.content)
    return response.message.content
}

main()