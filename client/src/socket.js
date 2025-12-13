import { io } from "socket.io-client";

// Use environment variable for production (Vercel -> Render), or undefined for local proxy
const URL = import.meta.env.VITE_SERVER_URL || undefined;

export const socket = io(URL, {
    autoConnect: false
});
