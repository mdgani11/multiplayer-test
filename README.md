# Y8 Anonymous Multiplayer Chat Test

A very small multiplayer JavaScript test game/app.

## What it does

- Every visitor gets an automatic anonymous name such as `Player 1`.
- Anyone connected to the same server can see messages in real time.
- Shows the number of connected players.
- Shows join/leave notifications.
- No account or database is required.
- No Y8 SDK is included yet.

## Requirements

Node.js and npm.

## Run locally

Open a terminal in this folder:

```bash
npm install
npm start
```

Then open:

http://localhost:3000

Open the URL in two browser tabs/windows. Send a message from one tab and it should immediately appear in the other.

## Hosting

This requires a Node.js process because Socket.IO needs a persistent server connection.

Upload the project to a server that supports Node.js, run:

```bash
npm install
npm start
```

Then expose the configured port through your web server/reverse proxy.

For production, use HTTPS/WSS through your web server.

## Important Y8 test

The static frontend alone is not enough for multiplayer. The Node.js server must remain running and accessible from the browser.

This project is intentionally simple so it can be used as a first multiplayer connectivity test before adding a real game.
