const boardEl = document.querySelector("#board");
const movesEl = document.querySelector("#moves");
const headlineEl = document.querySelector("#headline");
const gameStatusEl = document.querySelector("#gameStatus");
const aiStatusEl = document.querySelector("#aiStatus");
const scoreEl = document.querySelector("#score");
const modeEl = document.querySelector("#mode");
const difficultyEl = document.querySelector("#difficulty");
const sideEl = document.querySelector("#side");
const newGameEl = document.querySelector("#newGame");
const undoEl = document.querySelector("#undo");
const onlineControlsEl = document.querySelector("#onlineControls");
const usernameEl = document.querySelector("#username");
const roomCodeEl = document.querySelector("#roomCode");
const serverUrlEl = document.querySelector("#serverUrl");
const createRoomEl = document.querySelector("#createRoom");
const joinRoomEl = document.querySelector("#joinRoom");
const roomStatusEl = document.querySelector("#roomStatus");
const shareBoxEl = document.querySelector("#shareBox");
const shareLinkEl = document.querySelector("#shareLink");
const copyLinkEl = document.querySelector("#copyLink");
const onlineGameActionsEl = document.querySelector("#onlineGameActions");
const leaveGameEl = document.querySelector("#leaveGame");
const endGameEl = document.querySelector("#endGame");
const refreshRoomsEl = document.querySelector("#refreshRooms");
const activeRoomsEl = document.querySelector("#activeRooms");
const whiteCapturedEl = document.querySelector("#whiteCaptured");
const blackCapturedEl = document.querySelector("#blackCaptured");
const whiteStatusEl = document.querySelector("#whiteStatus");
const blackStatusEl = document.querySelector("#blackStatus");

const PIECES = {
  wK: "\u2654", wQ: "\u2655", wR: "\u2656", wB: "\u2657", wN: "\u2658", wP: "\u2659",
  bK: "\u265A", bQ: "\u265B", bR: "\u265C", bB: "\u265D", bN: "\u265E", bP: "\u265F"
};

const VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
const FILES = "abcdefgh";
const INF = 1_000_000;
const PUBLIC_ROOM_SERVER = "https://velvet-chess-room-server.onrender.com";
const ONLINE_UNAVAILABLE_MESSAGE = "Online rooms are temporarily unavailable. Try again in a moment.";

const PST = {
  p: [
     0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
     5,  5, 10, 25, 25, 10,  5,  5,
     0,  0,  0, 20, 20,  0,  0,  0,
     5, -5,-10,  0,  0,-10, -5,  5,
     5, 10, 10,-20,-20, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0
  ],
  n: [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50
  ],
  b: [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -20,-10,-10,-10,-10,-10,-10,-20
  ],
  r: [
     0,  0,  5, 10, 10,  5,  0,  0,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
     5, 10, 10, 10, 10, 10, 10,  5,
     0,  0,  0,  5,  5,  0,  0,  0
  ],
  q: [
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5,  5,  5,  5,  0,-10,
     -5,  0,  5,  5,  5,  5,  0, -5,
      0,  0,  5,  5,  5,  5,  0, -5,
    -10,  5,  5,  5,  5,  5,  0,-10,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20
  ],
  k: [
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -10,-20,-20,-20,-20,-20,-20,-10,
     20, 20,  0,  0,  0,  0, 20, 20,
     20, 30, 10,  0,  0, 10, 30, 20
  ]
};

let state;
let selected = null;
let legalForSelected = [];
let player = "w";
let mode = "ai";
let thinking = false;
let online = {
  room: "",
  playerId: "",
  name: "",
  color: "",
  joined: false,
  finished: false,
  movesApplied: 0,
  resetId: 0,
  pollTimer: null,
  roomsTimer: null
};

function newState() {
  return {
    board: [
      "br","bn","bb","bq","bk","bb","bn","br",
      "bp","bp","bp","bp","bp","bp","bp","bp",
      null,null,null,null,null,null,null,null,
      null,null,null,null,null,null,null,null,
      null,null,null,null,null,null,null,null,
      null,null,null,null,null,null,null,null,
      "wp","wp","wp","wp","wp","wp","wp","wp",
      "wr","wn","wb","wq","wk","wb","wn","wr"
    ],
    turn: "w",
    castling: { wK: true, wQ: true, bK: true, bQ: true },
    ep: null,
    halfmove: 0,
    fullmove: 1,
    history: [],
    lastMove: null,
    moveText: [],
    result: null
  };
}

function color(piece) {
  return piece?.[0];
}

function type(piece) {
  return piece?.[1];
}

function opposite(side) {
  return side === "w" ? "b" : "w";
}

function row(i) {
  return Math.floor(i / 8);
}

function col(i) {
  return i % 8;
}

function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function squareName(i) {
  return FILES[col(i)] + (8 - row(i));
}

function pieceName(piece) {
  return PIECES[piece[0] + piece[1].toUpperCase()];
}

function cloneState(s) {
  return {
    board: s.board.slice(),
    turn: s.turn,
    castling: { ...s.castling },
    ep: s.ep,
    halfmove: s.halfmove,
    fullmove: s.fullmove,
    history: s.history.slice(),
    lastMove: s.lastMove ? { ...s.lastMove } : null,
    moveText: s.moveText.slice(),
    result: s.result
  };
}

function attacked(s, target, bySide) {
  const tr = row(target);
  const tc = col(target);
  const pawnDir = bySide === "w" ? -1 : 1;
  for (const dc of [-1, 1]) {
    const r = tr - pawnDir;
    const c = tc - dc;
    if (inBounds(r, c) && s.board[r * 8 + c] === bySide + "p") return true;
  }

  for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
    const r = tr + dr;
    const c = tc + dc;
    if (inBounds(r, c) && s.board[r * 8 + c] === bySide + "n") return true;
  }

  for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
    let r = tr + dr;
    let c = tc + dc;
    while (inBounds(r, c)) {
      const p = s.board[r * 8 + c];
      if (p) {
        if (color(p) === bySide && ["b", "q"].includes(type(p))) return true;
        break;
      }
      r += dr;
      c += dc;
    }
  }

  for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
    let r = tr + dr;
    let c = tc + dc;
    while (inBounds(r, c)) {
      const p = s.board[r * 8 + c];
      if (p) {
        if (color(p) === bySide && ["r", "q"].includes(type(p))) return true;
        break;
      }
      r += dr;
      c += dc;
    }
  }

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = tr + dr;
      const c = tc + dc;
      if (inBounds(r, c) && s.board[r * 8 + c] === bySide + "k") return true;
    }
  }

  return false;
}

function kingIndex(s, side) {
  return s.board.findIndex(p => p === side + "k");
}

function inCheck(s, side) {
  return attacked(s, kingIndex(s, side), opposite(side));
}

function addMove(moves, s, from, to, flags = {}) {
  const moving = s.board[from];
  const target = flags.ep ? s.board[to + (color(moving) === "w" ? 8 : -8)] : s.board[to];
  moves.push({ from, to, piece: moving, captured: target, promotion: flags.promotion || null, castle: flags.castle || null, ep: !!flags.ep });
}

function pseudoMoves(s, side) {
  const moves = [];
  for (let i = 0; i < 64; i++) {
    const p = s.board[i];
    if (!p || color(p) !== side) continue;
    const r = row(i);
    const c = col(i);
    const t = type(p);

    if (t === "p") {
      const dir = side === "w" ? -1 : 1;
      const start = side === "w" ? 6 : 1;
      const promoteRow = side === "w" ? 0 : 7;
      const oneR = r + dir;
      if (inBounds(oneR, c) && !s.board[oneR * 8 + c]) {
        const to = oneR * 8 + c;
        if (oneR === promoteRow) ["q", "r", "b", "n"].forEach(promotion => addMove(moves, s, i, to, { promotion }));
        else addMove(moves, s, i, to);
        const twoR = r + dir * 2;
        if (r === start && !s.board[twoR * 8 + c]) addMove(moves, s, i, twoR * 8 + c);
      }
      for (const dc of [-1, 1]) {
        const cr = r + dir;
        const cc = c + dc;
        if (!inBounds(cr, cc)) continue;
        const to = cr * 8 + cc;
        if (s.board[to] && color(s.board[to]) !== side) {
          if (cr === promoteRow) ["q", "r", "b", "n"].forEach(promotion => addMove(moves, s, i, to, { promotion }));
          else addMove(moves, s, i, to);
        }
        if (s.ep === to) addMove(moves, s, i, to, { ep: true });
      }
    }

    if (t === "n") {
      for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
        const nr = r + dr;
        const nc = c + dc;
        const to = nr * 8 + nc;
        if (inBounds(nr, nc) && (!s.board[to] || color(s.board[to]) !== side)) addMove(moves, s, i, to);
      }
    }

    if (["b", "r", "q"].includes(t)) {
      const dirs = [];
      if (["b", "q"].includes(t)) dirs.push([-1,-1],[-1,1],[1,-1],[1,1]);
      if (["r", "q"].includes(t)) dirs.push([-1,0],[1,0],[0,-1],[0,1]);
      for (const [dr, dc] of dirs) {
        let nr = r + dr;
        let nc = c + dc;
        while (inBounds(nr, nc)) {
          const to = nr * 8 + nc;
          if (!s.board[to]) addMove(moves, s, i, to);
          else {
            if (color(s.board[to]) !== side) addMove(moves, s, i, to);
            break;
          }
          nr += dr;
          nc += dc;
        }
      }
    }

    if (t === "k") {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const nr = r + dr;
          const nc = c + dc;
          const to = nr * 8 + nc;
          if (inBounds(nr, nc) && (!s.board[to] || color(s.board[to]) !== side)) addMove(moves, s, i, to);
        }
      }
      const home = side === "w" ? 60 : 4;
      if (i === home && !inCheck(s, side)) {
        if (s.castling[side + "K"] && !s.board[home + 1] && !s.board[home + 2] && !attacked(s, home + 1, opposite(side)) && !attacked(s, home + 2, opposite(side))) {
          addMove(moves, s, i, home + 2, { castle: "K" });
        }
        if (s.castling[side + "Q"] && !s.board[home - 1] && !s.board[home - 2] && !s.board[home - 3] && !attacked(s, home - 1, opposite(side)) && !attacked(s, home - 2, opposite(side))) {
          addMove(moves, s, i, home - 2, { castle: "Q" });
        }
      }
    }
  }
  return moves;
}

function legalMoves(s, side = s.turn) {
  if (s.result) return [];
  return pseudoMoves(s, side).filter(move => {
    const next = applyMove(s, move, false);
    return !inCheck(next, side);
  });
}

function positionKey(s) {
  const pieces = s.board.map(piece => piece || "--").join("");
  const castling = ["wK", "wQ", "bK", "bQ"].map(key => s.castling[key] ? key : "").join("");
  return `${pieces}|${s.turn}|${castling || "-"}|${s.ep ?? "-"}`;
}

function repetitionCount(s, key = positionKey(s)) {
  const positions = [...s.history, s];
  return positions.reduce((count, position) => count + (positionKey(position) === key ? 1 : 0), 0);
}

function moveCreatesThirdRepetition(s, move) {
  return repetitionCount(applyMove(s, move, false)) >= 3;
}

function repetitionResult(side) {
  return `${side === "w" ? "White" : "Black"} loses by threefold repetition.`;
}

function applyMove(s, move, track = true) {
  const next = cloneState(s);
  const movingSide = color(move.piece);
  if (track) next.history.push(cloneState(s));

  next.board[move.to] = move.promotion ? movingSide + move.promotion : move.piece;
  next.board[move.from] = null;

  if (move.ep) {
    const capturedAt = move.to + (movingSide === "w" ? 8 : -8);
    next.board[capturedAt] = null;
  }

  if (move.castle) {
    const home = movingSide === "w" ? 56 : 0;
    if (move.castle === "K") {
      next.board[home + 5] = next.board[home + 7];
      next.board[home + 7] = null;
    } else {
      next.board[home + 3] = next.board[home];
      next.board[home] = null;
    }
  }

  if (type(move.piece) === "k") {
    next.castling[movingSide + "K"] = false;
    next.castling[movingSide + "Q"] = false;
  }
  if (type(move.piece) === "r") {
    if (move.from === 63) next.castling.wK = false;
    if (move.from === 56) next.castling.wQ = false;
    if (move.from === 7) next.castling.bK = false;
    if (move.from === 0) next.castling.bQ = false;
  }
  if (move.captured && type(move.captured) === "r") {
    if (move.to === 63) next.castling.wK = false;
    if (move.to === 56) next.castling.wQ = false;
    if (move.to === 7) next.castling.bK = false;
    if (move.to === 0) next.castling.bQ = false;
  }

  next.ep = null;
  if (type(move.piece) === "p" && Math.abs(move.to - move.from) === 16) {
    next.ep = (move.to + move.from) / 2;
  }

  next.halfmove = type(move.piece) === "p" || move.captured ? 0 : next.halfmove + 1;
  if (movingSide === "b") next.fullmove++;
  next.turn = opposite(s.turn);
  next.lastMove = { from: move.from, to: move.to };
  next.result = repetitionCount(next) >= 3 ? repetitionResult(movingSide) : null;
  if (track) next.moveText.push(notation(s, move, next));
  return next;
}

function notation(before, move, after) {
  if (move.castle) return move.castle === "K" ? "O-O" : "O-O-O";
  const t = type(move.piece);
  const pieceLetter = t === "p" ? "" : t.toUpperCase();
  const capture = move.captured ? "x" : "";
  const pawnFile = t === "p" && capture ? FILES[col(move.from)] : "";
  const promo = move.promotion ? "=" + move.promotion.toUpperCase() : "";
  const suffix = inCheck(after, after.turn) ? (legalMoves(after).length ? "+" : "#") : "";
  return `${pieceLetter}${pawnFile}${capture}${squareName(move.to)}${promo}${suffix}`;
}

function evaluate(s) {
  if (s.result) return s.result.startsWith("White") ? -INF + 2 : INF - 2;
  const moves = legalMoves(s);
  if (!moves.length) return inCheck(s, s.turn) ? (s.turn === "w" ? -INF + 1 : INF - 1) : 0;
  let score = 0;
  for (let i = 0; i < 64; i++) {
    const p = s.board[i];
    if (!p) continue;
    const side = color(p);
    const t = type(p);
    const pstIndex = side === "w" ? i : 63 - i;
    const value = VALUES[t] + PST[t][pstIndex];
    score += side === "w" ? value : -value;
  }
  score += mobility(s, "w") * 3 - mobility(s, "b") * 3;
  return score;
}

function mobility(s, side) {
  return pseudoMoves(s, side).length;
}

function orderedMoves(s) {
  return legalMoves(s).sort((a, b) => moveScore(b) - moveScore(a));
}

function moveScore(move) {
  let score = 0;
  if (move.captured) score += VALUES[type(move.captured)] - VALUES[type(move.piece)] / 10;
  if (move.promotion) score += VALUES[move.promotion];
  if (move.castle) score += 40;
  return score;
}

function search(s, depth, alpha, beta) {
  const moves = orderedMoves(s);
  if (depth === 0 || !moves.length) return { score: evaluate(s), move: null };

  let best = null;
  if (s.turn === "w") {
    let value = -INF;
    for (const move of moves) {
      const result = search(applyMove(s, move, false), depth - 1, alpha, beta).score;
      if (result > value) {
        value = result;
        best = move;
      }
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }
    return { score: value, move: best };
  }

  let value = INF;
  for (const move of moves) {
    const result = search(applyMove(s, move, false), depth - 1, alpha, beta).score;
    if (result < value) {
      value = result;
      best = move;
    }
    beta = Math.min(beta, value);
    if (alpha >= beta) break;
  }
  return { score: value, move: best };
}

function chooseAiMove() {
  const depth = Number(difficultyEl.value);
  const legal = legalMoves(state);
  if (!legal.length) return null;
  let best = search(state, depth, -INF, INF).move;
  if (!best) best = legal[Math.floor(Math.random() * legal.length)];
  return best;
}

function isPlayerTurn() {
  if (state.result) return false;
  if (thinking || !legalMoves(state).length) return false;
  if (mode === "online") return online.joined && !online.finished && state.turn === online.color;
  return mode === "local" || state.turn === player;
}

function handleSquare(index) {
  if (!isPlayerTurn()) return;
  const p = state.board[index];
  if (selected !== null) {
    const move = legalForSelected.find(m => m.to === index);
    if (move) {
      const chosenMove = preferPromotion(move);
      state = applyMove(state, chosenMove, true);
      selected = null;
      legalForSelected = [];
      render();
      if (mode === "online") {
        sendOnlineMove(chosenMove);
        return;
      }
      if (state.result) return;
      if (mode === "ai") queueAi();
      return;
    }
  }
  if (p && color(p) === activeHumanSide()) {
    selected = index;
    legalForSelected = legalMoves(state).filter(m => m.from === index);
  } else {
    selected = null;
    legalForSelected = [];
  }
  render();
}

function activeHumanSide() {
  if (mode === "online") return online.color;
  return mode === "local" ? state.turn : player;
}

function preferPromotion(move) {
  if (!move.promotion) return move;
  return { ...move, promotion: "q" };
}

function queueAi() {
  if (mode !== "ai") return;
  if (state.turn === player || !legalMoves(state).length) {
    render();
    return;
  }
  thinking = true;
  aiStatusEl.textContent = "AI is calculating...";
  render();
  setTimeout(() => {
    const move = chooseAiMove();
    if (move) state = applyMove(state, move, true);
    thinking = false;
    render();
  }, 140);
}

function resetGame() {
  stopOnlinePolling();
  stopRoomsPolling();
  state = newState();
  selected = null;
  legalForSelected = [];
  mode = modeEl.value;
  player = sideEl.value;
  thinking = false;
  online.movesApplied = 0;
  online.finished = false;
  if (mode !== "online") {
    online.joined = false;
    online.finished = false;
    setShareLink("");
  }
  syncControls();
  render();
  if (mode === "online") {
    loadActiveRooms();
    startRoomsPolling();
  }
  if (mode === "ai" && player === "b") queueAi();
}

function undo() {
  if (mode === "online") {
    roomStatusEl.textContent = "Undo is local-only. Use New game to restart the room.";
    return;
  }
  if (thinking || !state.history.length) return;
  state = state.history.pop();
  if (mode === "ai" && state.turn !== player && state.history.length) state = state.history.pop();
  selected = null;
  legalForSelected = [];
  render();
}

function syncControls() {
  const local = mode === "local";
  const onlineMode = mode === "online";
  const hasBuiltInServer = !!PUBLIC_ROOM_SERVER;
  const serverLabel = document.querySelector("label[for='serverUrl']");
  difficultyEl.disabled = local || onlineMode;
  onlineControlsEl.classList.toggle("hidden", !onlineMode);
  onlineGameActionsEl.classList.toggle("hidden", !onlineMode || !online.joined || online.finished);
  if (serverLabel) serverLabel.classList.toggle("hidden", !onlineMode || hasBuiltInServer);
  serverUrlEl.classList.toggle("hidden", !onlineMode || hasBuiltInServer);
  headlineEl.textContent = onlineMode ? "Play a friend" : (local ? "Play together" : "Play the machine");
  whiteStatusEl.textContent = local ? "Player 1" : (player === "w" ? "You" : "AI");
  blackStatusEl.textContent = local ? "Player 2" : (player === "b" ? "You" : "AI");
  if (onlineMode) {
    whiteStatusEl.textContent = online.color === "w" ? online.name || "You" : "Waiting";
    blackStatusEl.textContent = online.color === "b" ? online.name || "You" : "Waiting";
  }
  document.querySelector("label[for='side']").textContent = local || onlineMode ? "Board view" : "Your side";
}

function statusText() {
  if (state.result) return state.result;
  const legal = legalMoves(state);
  const checked = inCheck(state, state.turn);
  if (!legal.length && checked) return `${state.turn === "w" ? "White" : "Black"} is checkmated`;
  if (!legal.length) return "Stalemate";
  if (checked) return `${state.turn === "w" ? "White" : "Black"} is in check`;
  return `${state.turn === "w" ? "White" : "Black"} to move`;
}

function render() {
  boardEl.innerHTML = "";
  const viewingBlack = player === "b";
  const squares = Array.from({ length: 64 }, (_, i) => viewingBlack ? 63 - i : i);
  const legalTargets = new Map(legalForSelected.map(m => [m.to, m]));
  const checkSq = inCheck(state, state.turn) ? kingIndex(state, state.turn) : -1;

  for (const index of squares) {
    const button = document.createElement("button");
    button.className = `square ${(row(index) + col(index)) % 2 ? "dark" : "light"}`;
    button.type = "button";
    button.setAttribute("aria-label", squareName(index));
    if (selected === index) button.classList.add("selected");
    if (legalTargets.has(index)) button.classList.add(legalTargets.get(index).captured ? "capture" : "legal");
    if (state.lastMove && (state.lastMove.from === index || state.lastMove.to === index)) button.classList.add("last");
    if (checkSq === index) button.classList.add("check");
    button.addEventListener("click", () => handleSquare(index));

    const p = state.board[index];
    if (p) {
      const piece = document.createElement("span");
      piece.className = `piece ${color(p) === "w" ? "white" : "black"}`;
      piece.textContent = pieceName(p);
      button.append(piece);
    }
    boardEl.append(button);
  }

  gameStatusEl.textContent = statusText();
  const legal = legalMoves(state);
  aiStatusEl.textContent = helperText(legal.length);
  scoreEl.textContent = (evaluate(state) / 100).toFixed(2);
  renderMoves();
  renderCaptures();
}

function helperText(hasLegalMoves) {
  if (thinking) return "AI is calculating...";
  if (state.result) return "Game over by repetition.";
  if (!hasLegalMoves) return "Game over.";
  if (selected !== null) {
    const losingMoves = legalForSelected.filter(move => moveCreatesThirdRepetition(state, move)).length;
    if (losingMoves) return `${losingMoves} selected move${losingMoves === 1 ? "" : "s"} would lose by repetition.`;
  }
  if (repetitionCount(state) === 2) return "Warning: this exact position has repeated twice. A third repeat loses.";
  if (mode === "online") {
    if (online.finished) return "Game over. The room is closed.";
    if (!online.joined) return "Create or join a room to start.";
    return state.turn === online.color ? "Your move." : "Waiting for your friend.";
  }
  if (mode === "local") return `${state.turn === "w" ? "White" : "Black"} player to move.`;
  return state.turn === player ? "Your move." : "AI to move.";
}

function renderMoves() {
  movesEl.innerHTML = "";
  for (let i = 0; i < state.moveText.length; i += 2) {
    const li = document.createElement("li");
    li.textContent = state.moveText[i + 1] ? `${state.moveText[i]}  ${state.moveText[i + 1]}` : state.moveText[i];
    movesEl.append(li);
  }
}

function renderCaptures() {
  const initial = { wp: 8, wn: 2, wb: 2, wr: 2, wq: 1, wk: 1, bp: 8, bn: 2, bb: 2, br: 2, bq: 1, bk: 1 };
  const current = {};
  for (const p of state.board) if (p) current[p] = (current[p] || 0) + 1;
  const whiteLost = [];
  const blackLost = [];
  for (const piece of Object.keys(initial)) {
    const lost = initial[piece] - (current[piece] || 0);
    for (let i = 0; i < lost; i++) (color(piece) === "w" ? whiteLost : blackLost).push(pieceName(piece));
  }
  whiteCapturedEl.textContent = blackLost.join("");
  blackCapturedEl.textContent = whiteLost.join("");
}

function cleanRoomCode(value) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 12);
}

function randomRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function currentPlayerName() {
  return usernameEl.value.trim().slice(0, 20) || "Player";
}

function roomLink(room) {
  const url = new URL(window.location.href);
  url.searchParams.set("mode", "online");
  url.searchParams.set("room", room);
  const currentServer = activeServerUrl();
  const defaultServer = cleanServerUrl(defaultServerUrl());
  if (currentServer && currentServer !== defaultServer) url.searchParams.set("server", currentServer);
  else url.searchParams.delete("server");
  return url.toString();
}

function setShareLink(link = "") {
  shareBoxEl.classList.toggle("hidden", !link);
  shareLinkEl.textContent = link;
  shareLinkEl.title = link;
  copyLinkEl.textContent = "Copy";
}

function showRoomMessage(message) {
  roomStatusEl.textContent = message;
  if (online.joined && online.room && !online.finished) setShareLink(roomLink(online.room));
}

async function api(path, body) {
  const response = await fetch(apiUrl(path), {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  const type = response.headers.get("Content-Type") || "";
  if (!type.includes("application/json")) {
    throw new Error(ONLINE_UNAVAILABLE_MESSAGE);
  }
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Room server error");
  return data;
}

function apiUrl(path) {
  const base = activeServerUrl();
  return base ? base + path : path;
}

function cleanServerUrl(value) {
  return value.trim().replace(/\/+$/, "");
}

function isFullServerUrl(value) {
  return /^https?:\/\/.+/i.test(value);
}

function activeServerUrl() {
  const configured = cleanServerUrl(serverUrlEl.value);
  if (PUBLIC_ROOM_SERVER && !isFullServerUrl(configured)) return cleanServerUrl(PUBLIC_ROOM_SERVER);
  return configured;
}

function isHostedStaticPage() {
  return location.hostname.endsWith("github.io");
}

function roomServerProblem() {
  const value = activeServerUrl();
  if (!value && isHostedStaticPage()) return ONLINE_UNAVAILABLE_MESSAGE;
  if (value && !isFullServerUrl(value)) return "Room server must be a full URL, like https://your-server.onrender.com.";
  return "";
}

async function createOnlineRoom() {
  roomCodeEl.value = cleanRoomCode(roomCodeEl.value) || randomRoomCode();
  await enterOnlineRoom(true);
}

async function joinOnlineRoom() {
  await enterOnlineRoom(false);
}

async function enterOnlineRoom(create) {
  modeEl.value = "online";
  mode = "online";
  stopOnlinePolling();
  stopRoomsPolling();
  const room = cleanRoomCode(roomCodeEl.value);
  if (!room) {
    roomStatusEl.textContent = "Enter a room code first.";
    return;
  }
  const serverProblem = roomServerProblem();
  if (serverProblem) {
    showRoomMessage(serverProblem);
    activeRoomsEl.textContent = serverProblem;
    return;
  }

  try {
    showRoomMessage("Joining room...");
    serverUrlEl.value = activeServerUrl();
    localStorage.setItem("velvetChess:serverUrl", serverUrlEl.value.trim());
    const storageKey = `velvetChess:${room}:playerId`;
    const joined = await api(create ? "/api/create" : "/api/join", {
      room,
      name: currentPlayerName(),
      playerId: localStorage.getItem(storageKey) || ""
    });
    localStorage.setItem(storageKey, joined.playerId);
    online.room = joined.room;
    online.playerId = joined.playerId;
    online.name = joined.name;
    online.color = joined.color;
    online.joined = true;
    online.finished = false;
    online.movesApplied = 0;
    online.resetId = joined.resetId || 0;
    player = sideEl.value;
    state = newState();
    selected = null;
    legalForSelected = [];
    window.history.replaceState(null, "", roomLink(online.room));
    syncControls();
    await syncOnlineRoom();
    startOnlinePolling();
    showRoomMessage(`${create ? "Created" : "Joined"} ${online.room} as ${online.color === "w" ? "White" : "Black"}.`);
  } catch (error) {
    online.joined = false;
    syncControls();
    render();
    loadActiveRooms();
    startRoomsPolling();
    setShareLink("");
    showRoomMessage(error.message);
  }
}

async function sendOnlineMove(move) {
  if (!online.joined || online.finished) return;
  try {
    await api("/api/move", {
      room: online.room,
      playerId: online.playerId,
      move: { from: move.from, to: move.to, promotion: move.promotion || null }
    });
    online.movesApplied++;
    if (isGameOver(state)) {
      await finishOnlineRoom(resultText());
    } else {
      showRoomMessage("Move sent.");
    }
  } catch (error) {
    showRoomMessage(error.message);
  }
}

function isGameOver(s) {
  return !!s.result || legalMoves(s).length === 0;
}

function resultText() {
  if (state.result) return state.result;
  if (legalMoves(state).length) return "";
  if (inCheck(state, state.turn)) {
    const winner = opposite(state.turn) === "w" ? "White" : "Black";
    return `${winner} wins by checkmate.`;
  }
  return "Draw by stalemate.";
}

async function finishOnlineRoom(result) {
  online.finished = true;
  stopOnlinePolling();
  startRoomsPolling();
  setShareLink("");
  gameStatusEl.textContent = result;
  aiStatusEl.textContent = "Game over. The room is closed.";
  showRoomMessage(result);
  await api("/api/end", {
    room: online.room,
    playerId: online.playerId,
    result
  });
  syncControls();
  loadActiveRooms();
}

async function endOnlineGame() {
  if (!online.joined || online.finished) {
    goOnlineLobby("No active room to end.");
    return;
  }
  const side = online.color === "w" ? "White" : "Black";
  const name = online.name || side;
  try {
    await finishOnlineRoom(`Game ended by ${name}.`);
    goOnlineLobby(`Game ended by ${name}.`);
  } catch (error) {
    showRoomMessage(error.message);
  }
}

function goOnlineLobby(message = "Back in the online lobby.") {
  stopOnlinePolling();
  online.joined = false;
  online.finished = false;
  online.room = "";
  online.playerId = "";
  online.color = "";
  online.movesApplied = 0;
  state = newState();
  selected = null;
  legalForSelected = [];
  setShareLink("");
  syncControls();
  render();
  showRoomMessage(message);
  const url = new URL(window.location.href);
  url.searchParams.set("mode", "online");
  url.searchParams.delete("room");
  window.history.replaceState(null, "", url.toString());
  loadActiveRooms();
  startRoomsPolling();
}

async function resetOnlineRoom() {
  if (!online.joined) {
    resetGame();
    return;
  }
  try {
    await api("/api/reset", { room: online.room, playerId: online.playerId });
    state = newState();
    selected = null;
    legalForSelected = [];
    online.movesApplied = 0;
    online.finished = false;
    render();
    showRoomMessage("Room restarted.");
  } catch (error) {
    showRoomMessage(error.message);
  }
}

async function syncOnlineRoom() {
  if (!online.joined) return;
  const room = await api(`/api/room?room=${encodeURIComponent(online.room)}`);
  if (room.resetId !== online.resetId || online.movesApplied > room.moves.length) {
    online.resetId = room.resetId;
    online.movesApplied = 0;
    state = newState();
  }
  updateOnlineLabels(room.players || {});
  const pending = room.moves.slice(online.movesApplied);
  for (const remoteMove of pending) applyRemoteMove(remoteMove);
  online.movesApplied = room.moves.length;
  if (room.finished) {
    online.finished = true;
    stopOnlinePolling();
    startRoomsPolling();
    setShareLink("");
    render();
    gameStatusEl.textContent = room.result || resultText() || "Game over.";
    aiStatusEl.textContent = "Game over. The room is closed.";
    roomStatusEl.textContent = room.result || "Game over.";
    syncControls();
    loadActiveRooms();
    return;
  }
  render();
}

function applyRemoteMove(remoteMove) {
  const move = legalMoves(state).find(candidate => (
    candidate.from === remoteMove.from &&
    candidate.to === remoteMove.to &&
    (!candidate.promotion || candidate.promotion === remoteMove.promotion)
  ));
  if (move) state = applyMove(state, { ...move, promotion: remoteMove.promotion || move.promotion }, true);
}

function updateOnlineLabels(players) {
  if (mode !== "online") return;
  whiteStatusEl.textContent = players.w?.name || "Waiting";
  blackStatusEl.textContent = players.b?.name || "Waiting";
}

function startOnlinePolling() {
  stopOnlinePolling();
  online.pollTimer = setInterval(() => {
    syncOnlineRoom().catch(error => {
      roomStatusEl.textContent = error.message;
    });
  }, 900);
}

function stopOnlinePolling() {
  if (online.pollTimer) clearInterval(online.pollTimer);
  online.pollTimer = null;
}

async function loadActiveRooms() {
  if (modeEl.value !== "online") return;
  const serverProblem = roomServerProblem();
  if (serverProblem) {
    activeRoomsEl.textContent = serverProblem;
    return;
  }
  try {
    const data = await api("/api/rooms");
    renderActiveRooms(data.rooms || []);
  } catch (error) {
    activeRoomsEl.textContent = error.message;
  }
}

function renderActiveRooms(rooms) {
  activeRoomsEl.innerHTML = "";
  if (!rooms.length) {
    activeRoomsEl.textContent = "No active games yet.";
    return;
  }
  for (const room of rooms) {
    const rowEl = document.createElement("div");
    rowEl.className = "room-row";
    const infoEl = document.createElement("div");
    const titleEl = document.createElement("strong");
    titleEl.textContent = room.room;
    const detailEl = document.createElement("span");
    const white = room.players?.w || "Open";
    const black = room.players?.b || "Open";
    detailEl.textContent = `${white} vs ${black} - ${room.moves} moves`;
    infoEl.append(titleEl, detailEl);

    const buttonEl = document.createElement("button");
    const storageKey = `velvetChess:${room.room}:playerId`;
    buttonEl.textContent = localStorage.getItem(storageKey) ? "Rejoin" : "Join";
    buttonEl.type = "button";
    buttonEl.addEventListener("click", () => {
      roomCodeEl.value = room.room;
      joinOnlineRoom();
    });
    rowEl.append(infoEl, buttonEl);
    activeRoomsEl.append(rowEl);
  }
}

function startRoomsPolling() {
  stopRoomsPolling();
  if (modeEl.value !== "online" || online.joined && !online.finished) return;
  online.roomsTimer = setInterval(() => {
    loadActiveRooms();
  }, 3000);
}

function stopRoomsPolling() {
  if (online.roomsTimer) clearInterval(online.roomsTimer);
  online.roomsTimer = null;
}

async function copyShareLink() {
  const link = shareLinkEl.textContent;
  if (!link) return;
  try {
    await navigator.clipboard.writeText(link);
  } catch (_) {
    const textarea = document.createElement("textarea");
    textarea.value = link;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
  copyLinkEl.textContent = "Copied";
  setTimeout(() => {
    copyLinkEl.textContent = "Copy";
  }, 1300);
}

function bootFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const room = cleanRoomCode(params.get("room") || "");
  const serverParam = cleanServerUrl(params.get("server") || "");
  const savedServer = cleanServerUrl(localStorage.getItem("velvetChess:serverUrl") || "");
  if (params.get("mode") === "online" || room) modeEl.value = "online";
  if (room) roomCodeEl.value = room;
  if (PUBLIC_ROOM_SERVER && savedServer && !isFullServerUrl(savedServer)) {
    localStorage.removeItem("velvetChess:serverUrl");
  }
  serverUrlEl.value = isFullServerUrl(serverParam) ? serverParam : (PUBLIC_ROOM_SERVER ? defaultServerUrl() : savedServer || defaultServerUrl());
}

function defaultServerUrl() {
  if (PUBLIC_ROOM_SERVER) return PUBLIC_ROOM_SERVER;
  return location.hostname.endsWith("github.io") ? "" : location.origin;
}

newGameEl.addEventListener("click", () => {
  if (modeEl.value === "online" && online.joined) resetOnlineRoom();
  else resetGame();
});
undoEl.addEventListener("click", undo);
modeEl.addEventListener("change", resetGame);
sideEl.addEventListener("change", () => {
  player = sideEl.value;
  if (mode === "online") render();
  else resetGame();
});
createRoomEl.addEventListener("click", () => createOnlineRoom());
joinRoomEl.addEventListener("click", () => joinOnlineRoom());
copyLinkEl.addEventListener("click", () => copyShareLink());
leaveGameEl.addEventListener("click", () => goOnlineLobby("You left the game. It is still active."));
endGameEl.addEventListener("click", () => endOnlineGame());
refreshRoomsEl.addEventListener("click", () => loadActiveRooms());
difficultyEl.addEventListener("change", () => {
  aiStatusEl.textContent = "AI strength updated.";
});

bootFromUrl();
resetGame();
