from os import environ
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from json import dumps, loads
from pathlib import Path
from time import time
from urllib.parse import parse_qs, urlparse
from uuid import uuid4

ROOT = Path(__file__).resolve().parent
ROOMS = {}
FINISHED_ROOMS = {}
RESULT_TTL_SECONDS = 120


def clean_room(value):
    return "".join(ch for ch in value.upper() if ch.isalnum() or ch == "-")[:12]


def public_room(room):
    return {
        "room": room["code"],
        "moves": room["moves"],
        "players": {
            color: {"name": player["name"]}
            for color, player in room["players"].items()
            if player
        },
        "resetId": room["resetId"],
        "updated": room["updated"],
    }


def public_room_summary(room):
    players = {
        color: player["name"] if player else None
        for color, player in room["players"].items()
    }
    return {
        "room": room["code"],
        "players": players,
        "moves": len(room["moves"]),
        "turn": "w" if len(room["moves"]) % 2 == 0 else "b",
        "openSeats": [color for color, player in room["players"].items() if player is None],
        "updated": room["updated"],
    }


def cleanup_finished():
    now = time()
    expired = [code for code, result in FINISHED_ROOMS.items() if result["expires"] <= now]
    for code in expired:
        del FINISHED_ROOMS[code]


class ChessHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def json_response(self, status, payload):
        body = dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def read_json(self):
        length = int(self.headers.get("Content-Length", "0"))
        if not length:
            return {}
        return loads(self.rfile.read(length).decode("utf-8"))

    def do_GET(self):
        cleanup_finished()
        parsed = urlparse(self.path)
        if parsed.path == "/api/room":
            code = clean_room(parse_qs(parsed.query).get("room", [""])[0])
            room = ROOMS.get(code)
            if not room:
                finished = FINISHED_ROOMS.get(code)
                if finished:
                    payload = finished["room"]
                    payload["finished"] = True
                    payload["result"] = finished["result"]
                    self.json_response(200, payload)
                    return
                self.json_response(404, {"error": "Room not found."})
                return
            self.json_response(200, public_room(room))
            return
        if parsed.path == "/api/rooms":
            rooms = sorted(ROOMS.values(), key=lambda room: room["updated"], reverse=True)
            self.json_response(200, {"rooms": [public_room_summary(room) for room in rooms]})
            return
        super().do_GET()

    def do_POST(self):
        cleanup_finished()
        parsed = urlparse(self.path)
        try:
            data = self.read_json()
            if parsed.path == "/api/create":
                self.create_room(data)
            elif parsed.path == "/api/join":
                self.join_room(data)
            elif parsed.path == "/api/move":
                self.add_move(data)
            elif parsed.path == "/api/reset":
                self.reset_room(data)
            elif parsed.path == "/api/end":
                self.end_room(data)
            else:
                self.json_response(404, {"error": "Unknown endpoint."})
        except Exception as exc:
            self.json_response(400, {"error": str(exc)})

    def create_room(self, data):
        code = clean_room(data.get("room", ""))
        if not code:
            raise ValueError("Room code is required.")
        if code in ROOMS:
            raise ValueError("That room already exists. Join it or choose another code.")
        FINISHED_ROOMS.pop(code, None)
        room = {
            "code": code,
            "players": {"w": None, "b": None},
            "moves": [],
            "resetId": 0,
            "updated": time(),
        }
        ROOMS[code] = room
        self.seat_player(room, data, "w")

    def join_room(self, data):
        code = clean_room(data.get("room", ""))
        if not code:
            raise ValueError("Room code is required.")
        room = ROOMS.get(code)
        if not room:
            raise ValueError("Room not found. Ask the host to create it first.")
        self.seat_player(room, data)

    def seat_player(self, room, data, preferred_color=None):
        code = room["code"]
        name = str(data.get("name") or "Player").strip()[:20] or "Player"
        requested_id = str(data.get("playerId") or "")
        for color, player in room["players"].items():
            if player and requested_id and player["id"] == requested_id:
                player["name"] = name
                room["updated"] = time()
                self.json_response(200, {
                    "room": code,
                    "playerId": requested_id,
                    "name": name,
                    "color": color,
                    "resetId": room["resetId"],
                })
                return

        player_id = uuid4().hex
        color = preferred_color if preferred_color and room["players"][preferred_color] is None else None
        if color is None:
            color = "w" if room["players"]["w"] is None else "b" if room["players"]["b"] is None else None
        if color is None:
            raise ValueError("Room is full.")
        if any(player and player["name"].lower() == name.lower() for player in room["players"].values()):
            raise ValueError("That username is already in this room.")
        room["players"][color] = {"id": player_id, "name": name}
        room["updated"] = time()
        self.json_response(200, {
            "room": code,
            "playerId": player_id,
            "name": name,
            "color": color,
            "resetId": room["resetId"],
        })

    def require_player(self, data):
        code = clean_room(data.get("room", ""))
        player_id = data.get("playerId", "")
        room = ROOMS.get(code)
        if not room:
            raise ValueError("Room not found.")
        for color, player in room["players"].items():
            if player and player["id"] == player_id:
                return room, color
        raise ValueError("Player not found in this room.")

    def add_move(self, data):
        room, color = self.require_player(data)
        expected = "w" if len(room["moves"]) % 2 == 0 else "b"
        if color != expected:
            raise ValueError("It is not your turn.")
        move = data.get("move") or {}
        from_square = int(move.get("from", -1))
        to_square = int(move.get("to", -1))
        promotion = move.get("promotion")
        if from_square < 0 or from_square > 63 or to_square < 0 or to_square > 63:
            raise ValueError("Invalid move.")
        if promotion not in (None, "q", "r", "b", "n"):
            raise ValueError("Invalid promotion.")
        room["moves"].append({
            "from": from_square,
            "to": to_square,
            "promotion": promotion,
        })
        room["updated"] = time()
        self.json_response(200, public_room(room))

    def reset_room(self, data):
        room, _ = self.require_player(data)
        room["moves"] = []
        room["resetId"] += 1
        room["updated"] = time()
        self.json_response(200, public_room(room))

    def end_room(self, data):
        room, _ = self.require_player(data)
        result = str(data.get("result") or "Game over.").strip()[:120] or "Game over."
        code = room["code"]
        snapshot = public_room(room)
        del ROOMS[code]
        FINISHED_ROOMS[code] = {
            "room": snapshot,
            "result": result,
            "expires": time() + RESULT_TTL_SECONDS,
        }
        self.json_response(200, {
            "room": code,
            "finished": True,
            "result": result,
        })


if __name__ == "__main__":
    port = int(environ.get("PORT", "5174"))
    server = ThreadingHTTPServer(("0.0.0.0", port), ChessHandler)
    print(f"Velvet Chess multiplayer server: http://127.0.0.1:{port}/")
    print("For another device on your network, use this computer's LAN IP with port 5174.")
    server.serve_forever()
