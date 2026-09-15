const path = require("path");
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
