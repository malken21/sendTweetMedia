const { port, cooldown } = require("./Config.json");

const { getDatas } = require("./Twitter");
const { sendMedia } = require("./discord");

const url = require("url");

const http = require('http');

const list = [];

const server = http.createServer(async (req, res) => {
    try {
        if (req.method === 'POST') {
            let data = "";

            req.on('data', (chunk) => { data += chunk })
                .on('end', async () => {
                    res.writeHead(200, { 'Content-Type': 'text/json; charset=utf-8' });
                    res.end('{"status":"ok"}');
                    try {

                        const json = JSON.parse(decodeURIComponent(data));
                        const URLdata = url.parse(json.url);
                        const id = URLdata.pathname.split("/status/")[1];


                        if (isStart) {
                            list.push(id);
                        } else {
                            isStart = true;
                            list.push(id);
                            console.log("start");
                            start();
                        }
                    } catch (err) {
                        console.log(err);
                    }
                });
        } else {
            error(res)
        }
    } catch {
        error(res);
    }
})
function error(res) {
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end('{"status":"error"}');
}
server.listen(port, () => {
    console.log(`start port: ${port}`);
});

let isStart = false;

async function start() {
    if (list.length == 0) { isStart = false; return; }
    await delay(cooldown);
    try {
        const id = list.shift();
        const Twitter = await getDatas(id);

        console.log("\n" + Twitter.data.text);

        if (!Twitter.includes.media) {
            start(); return;
        }

        for (const media of Twitter.includes.media) {
            if (media.type == "video") {
                for (const variant of media.variants) {
                    if (variant.bit_rate) {

                        await send(Twitter.includes.users[0], variant);

                        break;
                    }
                }
            } else if (media.type == "photo") {

                await send(Twitter.includes.users[0], media);
            }
        }

    } catch (err) {
        console.log(err);
    }
    start();
}


function delay(ms) {//-----待機-----//
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
}

function send(user, media) {
    return new Promise(async (resolve) => {
        console.log(media.url)
        await sendMedia({ username: user.name, avatar_url: user.profile_image_url }, media);
        resolve(true);
    });
}