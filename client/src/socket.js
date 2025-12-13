import { io } from "socket.io-client";

// Since we configured proxy in vite.config.js, we can use relative path (undefined URL).
// Socket.io will automatically connect to window.location.host
const URL = undefined;

export const socket = io(URL, {
    autoConnect: false
});
