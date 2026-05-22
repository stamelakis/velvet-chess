# Velvet Chess

A polished browser chess game with:

- Legal chess move generation
- Check, checkmate, stalemate, castling, en passant, and promotion
- Threefold repetition house rule: the player who creates the third repeated position loses
- AI opponent with alpha-beta search and positional evaluation
- Local two-player mode
- No-login online room mode when running the included Python server

## Play Locally

For the full game, including online rooms:

```bash
python server.py
```

Then open:

```text
http://127.0.0.1:5174/
```

For another device on the same network, use your computer's LAN IP with port `5174`.

## Online Rooms From GitHub Pages

The hosted GitHub Pages game is static. For online rooms, run or deploy the room server separately, then paste its URL into the `Room server` field in the game.

Examples:

```text
http://127.0.0.1:5174
https://your-tunnel-url.example
```

The easiest "friend can just click" setup is:

1. Deploy this repo as a web service on Render or another Python host.
2. Copy the deployed server URL.
3. Open the GitHub Pages game, choose `Online room`, paste that URL into `Room server`, and create a room.
4. Send the generated room link. It includes the server URL, so your friend can click and join.

This repo includes `render.yaml` for Render blueprint deployment.

## GitHub Pages

GitHub Pages can host the static chess app, so AI and local multiplayer work from the Pages link.

Online rooms need the included Python server because GitHub Pages cannot run backend code. To play online over the internet, host `server.py` somewhere reachable or run it locally with a tunnel.

## Files

- `index.html` - app layout
- `styles.css` - visual design
- `game.js` - chess engine, AI, UI, and room client
- `server.py` - no-login multiplayer room server
