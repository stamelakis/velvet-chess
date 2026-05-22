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

## GitHub Pages

GitHub Pages can host the static chess app, so AI and local multiplayer work from the Pages link.

Online rooms need the Python server because GitHub Pages cannot run backend code. To play online over the internet, host `server.py` somewhere reachable or run it locally with a tunnel.

## Files

- `index.html` - app layout
- `styles.css` - visual design
- `game.js` - chess engine, AI, UI, and room client
- `server.py` - no-login multiplayer room server
