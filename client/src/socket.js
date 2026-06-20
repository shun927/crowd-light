class RealtimeSocket {
    constructor() {
        this.auth = {};
        this.webSocket = null;
        this.listeners = new Map();
        this.queue = [];
        this.reconnectTimer = null;
        this.manuallyClosed = false;
    }

    on(event, callback) {
        const callbacks = this.listeners.get(event) || new Set();
        callbacks.add(callback);
        this.listeners.set(event, callbacks);
    }

    off(event, callback) {
        if (!callback) {
            this.listeners.delete(event);
            return;
        }

        this.listeners.get(event)?.delete(callback);
    }

    dispatch(event, payload) {
        this.listeners.get(event)?.forEach((callback) => callback(payload));
    }

    connect() {
        if (
            this.webSocket?.readyState === WebSocket.OPEN ||
            this.webSocket?.readyState === WebSocket.CONNECTING
        ) {
            return;
        }

        this.manuallyClosed = false;
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const url = new URL('/ws', window.location.origin);
        url.protocol = protocol;
        url.searchParams.set('role', this.auth.type || 'client');

        if (this.auth.token) {
            url.searchParams.set('token', this.auth.token);
        }

        this.webSocket = new WebSocket(url);

        this.webSocket.addEventListener('open', () => {
            const pendingMessages = this.queue.splice(0);
            pendingMessages.forEach((message) => this.webSocket.send(message));
            this.dispatch('connect');
        });

        this.webSocket.addEventListener('message', (event) => {
            try {
                const message = JSON.parse(event.data);
                this.dispatch(message.type, message.value ?? message.message);
            } catch {
                this.dispatch('error', 'Invalid server response');
            }
        });

        this.webSocket.addEventListener('close', (event) => {
            this.webSocket = null;
            this.dispatch('disconnect', event.reason);

            if (!this.manuallyClosed && event.code !== 4001) {
                clearTimeout(this.reconnectTimer);
                this.reconnectTimer = setTimeout(() => this.connect(), 1500);
            }
        });

        this.webSocket.addEventListener('error', () => {
            this.dispatch('error', 'Realtime connection failed');
        });
    }

    emit(type, value) {
        const message = JSON.stringify({ type, value });

        if (this.webSocket?.readyState === WebSocket.OPEN) {
            this.webSocket.send(message);
        } else {
            this.queue.push(message);
        }
    }

    disconnect() {
        this.manuallyClosed = true;
        clearTimeout(this.reconnectTimer);
        this.queue = [];
        this.webSocket?.close(1000, 'Client disconnected');
        this.webSocket = null;
    }
}

export const socket = new RealtimeSocket();
