import React, { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { socket } from '../socket';

const AdminPanel = () => {
    const [clientCount, setClientCount] = useState(0);
    const [isLightOn, setIsLightOn] = useState(false);

    // Generating URL for the user to scan. 
    // Ideally this is the IP address of the host machine, not localhost.
    // For now we just use the current window location's origin.
    // If accessing from another device, the user should be on the IP address.
    const userUrl = window.location.origin;

    useEffect(() => {
        socket.on('client-count', (count) => {
            setClientCount(count);
        });

        return () => {
            socket.off('client-count');
        };
    }, []);

    const toggleLight = () => {
        const newState = !isLightOn;
        setIsLightOn(newState);
        socket.emit('toggle-light', newState);
    };

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
