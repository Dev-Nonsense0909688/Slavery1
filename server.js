const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 8765;

let client = null;
let lastMessage = "no data";

// ---------- HTTP SERVER ----------
const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    // health check (keeps Render alive)
    if (url.pathname === "/") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("ok");
        return;
    }

    // send message to connected socket
    if (url.pathname === "/send") {
        if (!client || client.readyState !== WebSocket.OPEN) {
            res.end("no client");
            return;
        }

        const msg = url.searchParams.get("m") || "";
        client.send(msg);
        res.end("sent");
        return;
    }

    // read last message from socket
    if (url.pathname === "/recv") {
        res.end(lastMessage);
        return;
    }

    res.writeHead(404);
    res.end("not found");
});


// ---------- WEBSOCKET ----------
const wss = new WebSocket.Server({ noServer: true });

// handle upgrade manually (fixes 426 errors)
server.on("upgrade", (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
    });
});

wss.on("connection", (ws) => {
    console.log("socket connected");
    client = ws;

    ws.on("message", (data) => {
        lastMessage = data.toString();
        console.log("msg:", lastMessage.slice(0,80));
    });

    ws.on("close", () => {
        console.log("socket closed");
        if (client === ws) client = null;
    });

    ws.on("error", () => {
        if (client === ws) client = null;
    });
});


// ---------- START ----------
server.listen(PORT, "0.0.0.0", () =>
    console.log("running on port", PORT)
);
