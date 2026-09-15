const path = require("path");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Your Y8 App ID
const Y8_APP_ID = "6aa308ef85ecc2b67a13293d";

// Y8 profile API
const Y8_PROFILE_URL = "https://account.y8.com/api/profile";


// ============================================================
// STATIC GAME FILES
// ============================================================

app.use(express.static(path.join(__dirname, "public")));


// ============================================================
// Y8 PLAYER VERIFICATION
// ============================================================

async function verifyY8Player(accessToken) {

  if (!accessToken) {
    return null;
  }

  try {

    const response = await fetch(Y8_PROFILE_URL, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    });

    // Invalid or expired token
    if (!response.ok) {

      console.log(
        `Y8 verification failed: HTTP ${response.status}`
      );

      return null;
    }

    const player = await response.json();
    console.log("Y8 PROFILE RESPONSE:", player);

    // Make sure this token belongs to our Y8 application
    if (player.client_id !== Y8_APP_ID) {

      console.log(
        "Y8 verification rejected: wrong client_id"
      );

      return null;
    }

    // We only trust the identity returned by Y8
    return {
      pid: player.pid,
      name: player.name
    };

  } catch (error) {

    console.error(
      "Y8 verification error:",
      error.message
    );

    return null;
  }
}


// ============================================================
// SOCKET.IO AUTHENTICATION
// ============================================================

io.use(async (socket, next) => {

  try {

    const accessToken =
      socket.handshake.auth &&
      socket.handshake.auth.accessToken;

    if (!accessToken) {

      return next(
        new Error("Y8 login required")
      );

    }

    // Verify the token directly with Y8
    const player =
      await verifyY8Player(accessToken);

    if (!player) {

      return next(
        new Error("Invalid Y8 authentication")
      );

    }

    // Store verified Y8 information on the socket
    socket.player = player;

    next();

  } catch (error) {

    console.error(
      "Socket authentication error:",
      error.message
    );

    next(
      new Error("Authentication failed")
    );

  }

});


// ============================================================
// CONNECTED PLAYERS
// ============================================================

const players = new Map();


// ============================================================
// PLAYER CONNECTION
// ============================================================

io.on("connection", (socket) => {

  const player = socket.player;

  console.log(
    `${player.name} connected (${player.pid})`
  );


  // Store verified player
  players.set(socket.id, player);


  // Send verified player information to this player
  socket.emit("welcome", {
    username: player.name
  });


  // Tell everyone that this player joined
  io.emit(
    "system_message",
    `${player.name} joined the chat.`
  );


  // Update player count
  broadcastUserCount();


  // ==========================================================
  // CHAT MESSAGE
  // ==========================================================

  socket.on("chat_message", (message) => {

    if (typeof message !== "string") {
      return;
    }

    const cleanMessage =
      message.trim().substring(0, 200);

    if (!cleanMessage) {
      return;
    }


    // IMPORTANT:
    // Use the verified player name from Y8.
    // Never use a username supplied by the browser.

    io.emit("chat_message", {

      username: player.name,

      message: cleanMessage,

      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })

    });

  });


  // ==========================================================
  // DISCONNECT
  // ==========================================================

  socket.on("disconnect", () => {

    console.log(
      `${player.name} disconnected`
    );


    players.delete(socket.id);


    io.emit(
      "system_message",
      `${player.name} left the chat.`
    );


    broadcastUserCount();

  });

});


// ============================================================
// PLAYER COUNT
// ============================================================

function broadcastUserCount() {

  io.emit(
    "user_count",
    players.size
  );

}


// ============================================================
// START SERVER
// ============================================================

server.listen(PORT, () => {

  console.log(
    `Y8 multiplayer server running on port ${PORT}`
  );

});

/*const path = require("path");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

let nextNumber = 1;
const users = new Map();

function broadcastUserCount() {
  io.emit("user_count", users.size);
}

io.on("connection", (socket) => {
  const username = `Player ${nextNumber++}`;
  users.set(socket.id, username);

  socket.emit("welcome", { username });
  io.emit("system_message", `${username} joined the chat.`);
  broadcastUserCount();

  socket.on("chat_message", (message) => {
    if (typeof message !== "string") return;

    const clean = message.trim().slice(0, 200);
    if (!clean) return;

    io.emit("chat_message", {
      username: users.get(socket.id) || "Anonymous",
      message: clean,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })
    });
  });

  socket.on("disconnect", () => {
    const username = users.get(socket.id);
    users.delete(socket.id);

    if (username) {
      io.emit("system_message", `${username} left the chat.`);
    }

    broadcastUserCount();
  });
});

server.listen(PORT, () => {
  console.log(`Y8 multiplayer chat running on port ${PORT}`);
});
*/