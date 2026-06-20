import React, { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { socket } from '../socket';

const AdminPanel = () => {
    const [clientCount, setClientCount] = useState(0);
    const [isLightOn, setIsLightOn] = useState(false);
    const [token, setToken] = useState(() => sessionStorage.getItem('admin-token') || '');
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState('');

    const userUrl = window.location.origin;

    useEffect(() => {
        const handleConnect = () => {
            setIsConnected(true);
            setError('');
        };
        const handleDisconnect = (reason) => {
            setIsConnected(false);
            if (reason) setError(reason);
        };
        const handleError = (message) => setError(message || 'Connection failed');
        const handleCount = (count) => setClientCount(count);
        const handleLightState = (isOn) => setIsLightOn(isOn);

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('error', handleError);
        socket.on('client-count', handleCount);
        socket.on('light-state', handleLightState);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('error', handleError);
            socket.off('client-count', handleCount);
            socket.off('light-state', handleLightState);
            socket.disconnect();
        };
    }, []);

    const connectAdmin = (event) => {
        event.preventDefault();
        sessionStorage.setItem('admin-token', token);
        socket.auth = { type: 'admin', token };
        socket.connect();
    };

    const toggleLight = () => {
        const newState = !isLightOn;
        socket.emit('toggle-light', newState);
    };

    if (!isConnected) {
        return (
            <form onSubmit={connectAdmin} style={{ textAlign: 'center' }}>
                <h1>ADMIN ACCESS</h1>
                <p>Cloudflare に登録した管理トークンを入力してください。</p>
                <input
                    type="password"
                    value={token}
                    onChange={(event) => setToken(event.target.value)}
                    placeholder="Admin token"
                    autoComplete="current-password"
                    style={{ fontSize: '1rem', padding: '14px', minWidth: '260px' }}
                />
                <div style={{ marginTop: '16px' }}>
                    <button type="submit">CONNECT</button>
                </div>
                {error && <p style={{ color: 'var(--neon-red)' }}>{error}</p>}
            </form>
        );
    }

    return (
        <div style={{ textAlign: 'center' }}>
            <h1>ADMIN CONTROL</h1>
            <div style={{ background: 'white', padding: '10px', display: 'inline-block' }}>
                <QRCodeCanvas value={userUrl} size={200} />
            </div>
            <p>Scan to Connect: {userUrl}</p>

            <div style={{ margin: '20px' }}>
                <h2>CONNECTED: <span style={{ color: 'var(--neon-cyan)' }}>{clientCount}</span></h2>
            </div>

            <button
                onClick={toggleLight}
                style={{
                    fontSize: '2rem',
                    padding: '20px 40px',
                    background: isLightOn ? 'var(--neon-red)' : 'transparent',
                    color: isLightOn ? 'white' : 'var(--neon-cyan)',
                    borderColor: isLightOn ? 'var(--neon-red)' : 'var(--neon-cyan)'
                }}
            >
                {isLightOn ? 'LIGHT ON' : 'LIGHT OFF'}
            </button>
        </div>
    );
};

export default AdminPanel;
