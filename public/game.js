// ============================================================
// Y8 + MULTIPLAYER CHAT
// ============================================================

// Your Render multiplayer server
const MULTIPLAYER_SERVER = "https://multiplayer-test-ucc4.onrender.com/";


// ============================================================
// HTML ELEMENTS
// ============================================================

const messages = document.getElementById("messages");
const form = document.getElementById("chatForm");
const input = document.getElementById("messageInput");
const userCount = document.getElementById("userCount");
const playerName = document.getElementById("playerName");


// ============================================================
// VARIABLES
// ============================================================

let y8Sdk = null;
let socket = null;
let currentUser = null;


// ============================================================
// START Y8 SDK
// ============================================================

window.addEventListener(
  "y8sdk.ready",
  function () {

    console.log("Y8 SDK ready");

    y8Sdk = y8.sdk();

    const appConfig = {
      appId: "6aa308ef85ecc2b67a13293d",
      autoLogin: true
    };

    // Ads are optional.
    // Remove this section if this test does not use ads.
    const adConfig = {
      gameId: "282777",
      preloadAdBreaks: "on",
      sound: "on",
      onReady: () => {
        console.log("Y8 ads ready");
      }
    };

    y8Sdk.init(appConfig, adConfig);


    // ========================================================
    // Y8 AUTHENTICATION
    // ========================================================

    y8Sdk.onAuth((user, error) => {

      if (error) {

        console.error("Y8 authentication error:", error);

        playerName.textContent = "Y8 Login Failed";

        addMessage(
          "Unable to authenticate with Y8.",
          "system"
        );

        return;
      }


      // ------------------------------------------------------
      // USER LOGGED IN
      // ------------------------------------------------------

      if (user) {

        currentUser = user;

        console.log("Y8 user:", user);

        playerName.textContent =
          `You are ${user.nickname}`;

        addMessage(
          `Logged in as ${user.nickname}`,
          "system"
        );


        // ====================================================
        // GET SECURE Y8 ACCESS TOKEN
        // ====================================================

        const accessToken = y8Sdk.getAccessToken();

        if (!accessToken) {

          console.error(
            "No Y8 access token available."
          );

          addMessage(
            "Y8 authentication token is not available.",
            "system"
          );

          return;
        }


        console.log(
          "Y8 access token received"
        );


        // ====================================================
        // CONNECT TO MULTIPLAYER SERVER
        // ====================================================

        connectToMultiplayer(accessToken);

      } else {

        // ----------------------------------------------------
        // NOT LOGGED IN
        // ----------------------------------------------------

        playerName.textContent =
          "Not logged in";

        addMessage(
          "Please log in to Y8 to join the chat.",
          "system"
        );

      }

    });

  },
  { once: true }
);


// ============================================================
// HANDLE CASE WHERE SDK ALREADY LOADED
// ============================================================

if (window.y8 && window.y8.emitReadyEvent) {

  window.y8.emitReadyEvent();

}


// ============================================================
// CONNECT TO SOCKET.IO MULTIPLAYER SERVER
// ============================================================

function connectToMultiplayer(accessToken) {

  console.log(
    "Connecting to multiplayer server..."
  );


  // Prevent duplicate connections
  if (socket) {

    socket.disconnect();
    socket = null;

  }


  socket = io(MULTIPLAYER_SERVER, {

    // Send the Y8 access token to our server
    auth: {
      accessToken: accessToken
    }

  });


  // ========================================================
  // SOCKET CONNECTED
  // ========================================================

  socket.on("connect", () => {

    console.log(
      "Connected to multiplayer server:",
      socket.id
    );

    addMessage(
      "Connected to multiplayer server.",
      "system"
    );

    input.disabled = false;

  });


  // ========================================================
  // SERVER WELCOME
  // ========================================================

  socket.on("welcome", (data) => {

    console.log(
      "Server welcome:",
      data
    );

    // Use the verified server username
    if (data.username) {

      playerName.textContent =
        `You are ${data.username}`;

    }

  });


  // ========================================================
  // PLAYER COUNT
  // ========================================================

  socket.on("user_count", (count) => {

    userCount.textContent = count;

  });


  // ========================================================
  // SYSTEM MESSAGE
  // ========================================================

  socket.on("system_message", (message) => {

    addMessage(
      message,
      "system"
    );

  });


  // ========================================================
  // CHAT MESSAGE
  // ========================================================

  socket.on("chat_message", (data) => {

    addMessage(
      `${data.username}: ${data.message}`,
      "chat",
      data.time
    );

  });


  // ========================================================
  // SERVER ERROR
  // ========================================================

  socket.on("connect_error", (error) => {

    console.error(
      "Multiplayer connection error:",
      error
    );

    addMessage(
      "Unable to connect to multiplayer server.",
      "system"
    );

    input.disabled = true;

  });


  // ========================================================
  // DISCONNECTED
  // ========================================================

  socket.on("disconnect", (reason) => {

    console.log(
      "Disconnected:",
      reason
    );

    addMessage(
      "Disconnected from multiplayer server.",
      "system"
    );

    input.disabled = true;

  });

}


// ============================================================
// SEND CHAT MESSAGE
// ============================================================

form.addEventListener("submit", (event) => {

  event.preventDefault();


  // Make sure Socket.IO is connected
  if (!socket || !socket.connected) {

    addMessage(
      "You are not connected to the multiplayer server.",
      "system"
    );

    return;

  }


  const message = input.value.trim();


  if (!message) {
    return;
  }


  // Maximum 200 characters
  const cleanMessage =
    message.substring(0, 200);


  // Send message to server
  socket.emit(
    "chat_message",
    cleanMessage
  );


  // Clear input
  input.value = "";

  input.focus();

});


// ============================================================
// ADD MESSAGE TO CHAT
// ============================================================

function addMessage(
  text,
  type,
  time = ""
) {

  const row =
    document.createElement("div");

  row.className =
    `message ${type}`;


  const content =
    document.createElement("span");

  // textContent prevents HTML injection
  content.textContent =
    text;


  row.appendChild(
    content
  );


  if (time) {

    const clock =
      document.createElement("small");

    clock.textContent =
      time;

    row.appendChild(
      clock
    );

  }


  messages.appendChild(
    row
  );


  // Scroll to newest message
  messages.scrollTop =
    messages.scrollHeight;

}
/*const socket = io();

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
*/