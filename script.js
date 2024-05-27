import fs from 'fs'

const main = async ()=> {
    const text = await fs.readFileSync('./5.txt');
    const data = text.toString()
    console.log(data.length)
}

main()