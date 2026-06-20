import React, { useEffect, useState, useRef } from 'react';
import { socket } from '../socket';

const ClientView = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [status, setStatus] = useState('Standby');
    const [hasTorch, setHasTorch] = useState(true);
    const [isFlashOn, setIsFlashOn] = useState(false);
    const trackRef = useRef(null);
    const wakeLockRef = useRef(null);

    const startSession = async () => {
        try {
            // 1. Request Wake Lock
            if ('wakeLock' in navigator) {
                try {
                    wakeLockRef.current = await navigator.wakeLock.request('screen');
                    console.log('Wake Lock active');
                } catch (err) {
                    console.warn('Wake Lock error:', err);
                }
            }

            // 2. Access Camera for Torch
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
                const track = stream.getVideoTracks()[0];
                trackRef.current = track;

                // Check if torch is supported
                const capabilities = track.getCapabilities();
                if (!capabilities.torch) {
                    console.warn('Torch not supported on this device/browser');
                    setHasTorch(false);
                    // Don't stop the track if we want to keep the connection "live" or camera active (sometimes needed for iOS)
                    // But effectively we might not need the camera stream if torch isn't there.
                }
            } catch (err) {
                console.warn('Camera access error:', err);
                setHasTorch(false);
            }

            // 3. Connect to the Cloudflare Worker
            socket.auth = { type: 'client' };
            socket.connect();
            setIsConnected(true);
            setStatus('Connecting');

        } catch (err) {
            console.error(err);
            setStatus('Error: ' + err.message);
        }
    };

    useEffect(() => {
        const handleConnect = () => setStatus('Ready');
        const handleDisconnect = () => setStatus('Reconnecting');
        const handleError = (message) => setStatus(message || 'Connection error');

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('error', handleError);
        socket.on('light-control', (isOn) => {
            console.log('Light Command:', isOn);
            setIsFlashOn(isOn);

            if (trackRef.current && hasTorch) {
                trackRef.current.applyConstraints({
                    advanced: [{ torch: isOn }]
                }).catch(err => {
                    console.error('Torch apply error', err);
                    // If torch fails effectively at runtime, maybe fallback locally?
                });
            }
        });

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('error', handleError);
            socket.off('light-control');
            socket.disconnect();
            if (trackRef.current) {
                trackRef.current.stop();
            }
        };
    }, [hasTorch]); // Dependency on hasTorch to ensure we use fallback if needed

    return (
        <div
            className={!hasTorch && isFlashOn ? 'screen-flash-on' : ''}
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: !hasTorch && isFlashOn ? 'white' : 'var(--bg-dark)',
                transition: 'background 0.1s'
            }}
        >
            {!isConnected ? (
                <button
                    onClick={startSession}
                    style={{ fontSize: '1.5rem', padding: '30px', borderRadius: '50%' }}
                >
                    CONNECT
                </button>
            ) : (
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ color: isFlashOn ? 'white' : '#555' }}>
                        {status.toUpperCase()}
                    </h2>
                    <div style={{
                        width: '20px',
                        height: '20px',
                        background: isFlashOn ? 'white' : '#333',
                        borderRadius: '50%',
                        margin: '0 auto',
                        boxShadow: isFlashOn ? '0 0 20px white' : 'none'
                    }} />
                    <p style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '20px' }}>
                        {hasTorch ? '🔦 Torch Mode' : '📱 Screen Mode'}
                    </p>
                    <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>
                        Do not lock your screen.
                    </p>
                </div>
            )}
        </div>
    );
};

export default ClientView;
