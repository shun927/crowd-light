const json = (type, value) => JSON.stringify({ type, value });

export class LightRoom {
    constructor(state) {
        this.state = state;
    }

    async fetch(request) {
        if (request.headers.get('Upgrade') !== 'websocket') {
            return new Response('Expected WebSocket', { status: 426 });
        }

        const url = new URL(request.url);
        const role = url.searchParams.get('role');

        if (role !== 'admin' && role !== 'client') {
            return new Response('Invalid role', { status: 400 });
        }

        const pair = new WebSocketPair();
        const [client, server] = Object.values(pair);
        this.state.acceptWebSocket(server);
        server.serializeAttachment({ role });

        const lightOn = (await this.state.storage.get('lightOn')) ?? false;
        server.send(json('light-control', lightOn));

        if (role === 'admin') {
            server.send(json('light-state', lightOn));
            server.send(json('client-count', this.clientCount()));
        } else {
            this.broadcastClientCount();
        }

        return new Response(null, { status: 101, webSocket: client });
    }

    async webSocketMessage(webSocket, rawMessage) {
        if (typeof rawMessage !== 'string') return;

        let message;
        try {
            message = JSON.parse(rawMessage);
        } catch {
            webSocket.send(json('error', 'Invalid message'));
            return;
        }

        const connection = webSocket.deserializeAttachment();
        if (connection?.role !== 'admin' || message.type !== 'toggle-light') {
            return;
        }

        const lightOn = Boolean(message.value);
        await this.state.storage.put('lightOn', lightOn);

        for (const socket of this.state.getWebSockets()) {
            const role = socket.deserializeAttachment()?.role;
            socket.send(json(role === 'admin' ? 'light-state' : 'light-control', lightOn));
        }
    }

    webSocketClose(webSocket, code, reason) {
        const wasClient = webSocket.deserializeAttachment()?.role === 'client';
        webSocket.close(code, reason);
        if (wasClient) this.broadcastClientCount();
    }

    webSocketError(webSocket) {
        const wasClient = webSocket.deserializeAttachment()?.role === 'client';
        webSocket.close(1011, 'WebSocket error');
        if (wasClient) this.broadcastClientCount();
    }

    clientCount() {
        return this.state
            .getWebSockets()
            .filter((socket) => socket.deserializeAttachment()?.role === 'client')
            .length;
    }

    broadcastClientCount() {
        const message = json('client-count', this.clientCount());
        for (const socket of this.state.getWebSockets()) {
            if (socket.deserializeAttachment()?.role === 'admin') {
                socket.send(message);
            }
        }
    }
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (url.pathname === '/health') {
            return Response.json({ ok: true });
        }

        if (url.pathname === '/ws') {
            if (request.headers.get('Upgrade') !== 'websocket') {
                return new Response('Expected WebSocket', { status: 426 });
            }

            const origin = request.headers.get('Origin');
            if (origin && origin !== url.origin) {
                return new Response('Origin not allowed', { status: 403 });
            }

            const role = url.searchParams.get('role');
            if (role === 'admin') {
                if (!env.ADMIN_TOKEN || url.searchParams.get('token') !== env.ADMIN_TOKEN) {
                    const pair = new WebSocketPair();
                    const [client, server] = Object.values(pair);
                    server.accept();
                    server.close(4001, 'Invalid admin token');
                    return new Response(null, { status: 101, webSocket: client });
                }
            } else if (role !== 'client') {
                return new Response('Invalid role', { status: 400 });
            }

            const id = env.LIGHT_ROOM.idFromName('global');
            return env.LIGHT_ROOM.get(id).fetch(request);
        }

        return env.ASSETS.fetch(request);
    }
};
