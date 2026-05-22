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

The hosted GitHub Pages game uses the deployed room server:

```text
https://velvet-chess-room-server.onrender.com
```

Choose `Online room`, enter a username and room code, then create or join a room. The generated room link can be sent directly to another player.

## GitHub Pages

GitHub Pages hosts the static chess app. Online rooms use the included Python server hosted separately on Render, because GitHub Pages cannot run backend code.

## Files

- `index.html` - app layout
- `styles.css` - visual design
- `game.js` - chess engine, AI, UI, and room client
- `server.py` - no-login multiplayer room server
