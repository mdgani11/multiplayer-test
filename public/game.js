// ============================================================
// Y8 + MULTIPLAYER CHAT
// ============================================================


// ============================================================
// CONFIGURATION
// ============================================================

// Your Render multiplayer server
const MULTIPLAYER_SERVER =
  "https://multiplayer-test-ucc4.onrender.com";


// Your Y8 App ID
const Y8_APP_ID =
  "6aa308ef85ecc2b67a13293d";

// Your Y8 Game ID
const Y8_GAME_ID =
  "282777";


// ============================================================
// VARIABLES
// ============================================================

let y8Sdk = null;
let socket = null;
let currentUser = null;


// ============================================================
// HTML ELEMENTS
// ============================================================

const messages =
  document.getElementById("messages");

const form =
  document.getElementById("chatForm");

const input =
  document.getElementById("messageInput");

const userCount =
  document.getElementById("userCount");

const playerName =
  document.getElementById("playerName");

const loginArea =
  document.getElementById("loginArea");

const loginButton =
  document.getElementById("loginButton");


// ============================================================
// LOGIN BUTTON
// ============================================================

loginButton.addEventListener("click", () => {

  console.log("Y8 Login button clicked");


  // SDK must be ready
  if (!y8Sdk) {

    console.error(
      "Y8 SDK is not ready yet."
    );

    addMessage(
      "Y8 SDK is still loading. Please try again.",
      "system"
    );

    return;
  }


  // IMPORTANT:
  // login() is called directly from the click.
  // Do not put await or other async code before this.
  y8Sdk.login();

});


// ============================================================
// Y8 SDK READY
// ============================================================

window.addEventListener(
  "y8sdk.ready",
  function () {

    console.log(
      "Y8 SDK ready"
    );


    // Create SDK object
    y8Sdk =
      y8.sdk();


    // ========================================================
    // Y8 APP CONFIG
    // ========================================================

    const appConfig = {

      appId:
        Y8_APP_ID,

      autoLogin:
        true

    };


    // ========================================================
    // Y8 AD CONFIG
    // ========================================================

    const adConfig = {

      gameId:
        Y8_GAME_ID,

      preloadAdBreaks:
        "on",

      sound:
        "on",

      onReady: () => {

        console.log(
          "Y8 ads ready"
        );

      }

    };


    // ========================================================
    // INITIALIZE Y8 SDK
    // ========================================================

    y8Sdk.init(
      appConfig,
      adConfig
    );


    // ========================================================
    // Y8 AUTHENTICATION
    // ========================================================

    y8Sdk.onAuth(
      (user, error) => {


        // ====================================================
        // AUTHENTICATION ERROR
        // ====================================================

        if (error) {

          console.error(
            "Y8 authentication error:",
            error
          );


          playerName.textContent =
            "Y8 Login Failed";


          addMessage(
            "Unable to authenticate with Y8.",
            "system"
          );


          return;
        }


        // ====================================================
        // USER LOGGED IN
        // ====================================================

        if (user) {

          console.log(
            "Y8 user:",
            user
          );


          currentUser =
            user;


          // --------------------------------------------------
          // DISPLAY USER NAME
          // --------------------------------------------------

          playerName.textContent =
            `You are ${user.nickname}`;


          // --------------------------------------------------
          // HIDE LOGIN
          // --------------------------------------------------

          loginArea.style.display =
            "none";


          // --------------------------------------------------
          // SHOW LOGIN MESSAGE
          // --------------------------------------------------

          addMessage(
            `Logged in as ${user.nickname}`,
            "system"
          );


          // ==================================================
          // GET SECURE ACCESS TOKEN
          // ==================================================

          const accessToken =
            y8Sdk.getAccessToken();


          if (!accessToken) {

            console.error(
              "No Y8 access token available."
            );


            addMessage(
              "Y8 access token is not available.",
              "system"
            );


            return;
          }


          console.log(
            "Y8 access token received"
          );


          // ==================================================
          // CONNECT TO MULTIPLAYER
          // ==================================================

          connectToMultiplayer(
            accessToken
          );

        }


        // ====================================================
        // USER NOT LOGGED IN
        // ====================================================

        else {

          console.log(
            "No Y8 user is logged in."
          );


          currentUser =
            null;


          playerName.textContent =
            "Not logged in";


          loginArea.style.display =
            "block";


          input.disabled =
            true;


          addMessage(
            "Please log in to Y8 to join the chat.",
            "system"
          );

        }

      }
    );

  },
  {
    once: true
  }
);


// ============================================================
// HANDLE SDK ALREADY LOADED
// ============================================================

if (
  window.y8 &&
  window.y8.emitReadyEvent
) {

  window.y8.emitReadyEvent();

}


// ============================================================
// CONNECT TO MULTIPLAYER SERVER
// ============================================================

function connectToMultiplayer(
  accessToken
) {

  console.log(
    "Connecting to multiplayer server..."
  );


  // ----------------------------------------------------------
  // Remove previous connection
  // ----------------------------------------------------------

  if (socket) {

    socket.disconnect();

    socket =
      null;

  }


  // ----------------------------------------------------------
  // Create Socket.IO connection
  // ----------------------------------------------------------

  socket =
    io(
      MULTIPLAYER_SERVER,
      {

        auth: {

          accessToken:
            accessToken

        }

      }
    );


  // ==========================================================
  // CONNECTED
  // ==========================================================

  socket.on(
    "connect",
    () => {

      console.log(
        "Connected to multiplayer server:",
        socket.id
      );


      addMessage(
        "Connected to multiplayer server.",
        "system"
      );


      input.disabled =
        false;

    }
  );


  // ==========================================================
  // WELCOME
  // ==========================================================

  socket.on(
    "welcome",
    (data) => {

      console.log(
        "Server welcome:",
        data
      );


      if (data && data.username) {

        playerName.textContent =
          `You are ${data.username}`;

      }

    }
  );


  // ==========================================================
  // USER COUNT
  // ==========================================================

  socket.on(
    "user_count",
    (count) => {

      userCount.textContent =
        count;

    }
  );


  // ==========================================================
  // SYSTEM MESSAGE
  // ==========================================================

  socket.on(
    "system_message",
    (message) => {

      addMessage(
        message,
        "system"
      );

    }
  );


  // ==========================================================
  // CHAT MESSAGE
  // ==========================================================

  socket.on(
    "chat_message",
    (data) => {

      if (!data) {
        return;
      }


      addMessage(
        `${data.username}: ${data.message}`,
        "chat",
        data.time
      );

    }
  );


  // ==========================================================
  // CONNECTION ERROR
  // ==========================================================

  socket.on(
    "connect_error",
    (error) => {

      console.error(
        "Multiplayer connection error:",
        error
      );


      input.disabled =
        true;


      addMessage(
        `Multiplayer connection failed: ${error.message}`,
        "system"
      );

    }
  );


  // ==========================================================
  // DISCONNECTED
  // ==========================================================

  socket.on(
    "disconnect",
    (reason) => {

      console.log(
        "Disconnected:",
        reason
      );


      input.disabled =
        true;


      addMessage(
        "Disconnected from multiplayer server.",
        "system"
      );

    }
  );

}


// ============================================================
// SEND CHAT MESSAGE
// ============================================================

form.addEventListener(
  "submit",
  (event) => {

    event.preventDefault();


    // --------------------------------------------------------
    // Check Socket.IO
    // --------------------------------------------------------

    if (
      !socket ||
      !socket.connected
    ) {

      addMessage(
        "You are not connected to the multiplayer server.",
        "system"
      );

      return;
    }


    // --------------------------------------------------------
    // Get message
    // --------------------------------------------------------

    const message =
      input.value.trim();


    if (!message) {

      return;

    }


    // --------------------------------------------------------
    // Limit message length
    // --------------------------------------------------------

    const cleanMessage =
      message.substring(
        0,
        200
      );


    // --------------------------------------------------------
    // Send message
    // --------------------------------------------------------

    socket.emit(
      "chat_message",
      cleanMessage
    );


    // --------------------------------------------------------
    // Clear input
    // --------------------------------------------------------

    input.value =
      "";


    input.focus();

  }
);


// ============================================================
// ADD MESSAGE
// ============================================================

function addMessage(
  text,
  type,
  time = ""
) {

  const row =
    document.createElement(
      "div"
    );


  row.className =
    `message ${type}`;


  const content =
    document.createElement(
      "span"
    );


  // textContent prevents HTML injection
  content.textContent =
    text;


  row.appendChild(
    content
  );


  // ----------------------------------------------------------
  // Time
  // ----------------------------------------------------------

  if (time) {

    const clock =
      document.createElement(
        "small"
      );


    clock.textContent =
      time;


    row.appendChild(
      clock
    );

  }


  // ----------------------------------------------------------
  // Add to chat
  // ----------------------------------------------------------

  messages.appendChild(
    row
  );


  // ----------------------------------------------------------
  // Scroll to bottom
  // ----------------------------------------------------------

  messages.scrollTop =
    messages.scrollHeight;

}