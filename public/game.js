const socket = io();

const messages = document.getElementById("messages");
const form = document.getElementById("chatForm");
const input = document.getElementById("messageInput");
const userCount = document.getElementById("userCount");
const playerName = document.getElementById("playerName");

socket.on("welcome", (data) => {
  playerName.textContent = `You are ${data.username}`;
});

socket.on("user_count", (count) => {
  userCount.textContent = count;
});

socket.on("system_message", (message) => {
  addMessage(message, "system");
});

socket.on("chat_message", (data) => {
  addMessage(`${data.username}: ${data.message}`, "chat", data.time);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const message = input.value.trim();
  if (!message) return;

  socket.emit("chat_message", message);
  input.value = "";
  input.focus();
});

function addMessage(text, type, time = "") {
  const row = document.createElement("div");
  row.className = `message ${type}`;

  const content = document.createElement("span");
  content.textContent = text;
  row.appendChild(content);

  if (time) {
    const clock = document.createElement("small");
    clock.textContent = time;
    row.appendChild(clock);
  }

  messages.appendChild(row);
  messages.scrollTop = messages.scrollHeight;
}
