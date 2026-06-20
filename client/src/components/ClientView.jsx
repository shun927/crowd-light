import { useEffect, useRef, useState } from 'react';
import { socket } from '../socket';

const ClientView = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [status, setStatus] = useState('待機中');
    const [hasTorch, setHasTorch] = useState(true);
    const [isFlashOn, setIsFlashOn] = useState(false);
    const trackRef = useRef(null);
    const wakeLockRef = useRef(null);

    const startSession = async () => {
        try {
            if ('wakeLock' in navigator) {
                try {
                    wakeLockRef.current = await navigator.wakeLock.request('screen');
                } catch (error) {
                    console.warn('Wake Lock error:', error);
                }
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
                const track = stream.getVideoTracks()[0];
                trackRef.current = track;
                if (!track.getCapabilities().torch) setHasTorch(false);
            } catch (error) {
                console.warn('Camera access error:', error);
                setHasTorch(false);
            }

            socket.auth = { type: 'client' };
            socket.connect();
            setIsConnected(true);
            setStatus('接続中');
        } catch (error) {
            setStatus(`エラー: ${error.message}`);
        }
    };

    useEffect(() => {
        const handleConnect = () => setStatus('準備完了');
        const handleDisconnect = () => setStatus('再接続中');
        const handleError = () => setStatus('接続エラー');

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('error', handleError);
        socket.on('light-control', (isOn) => {
            setIsFlashOn(isOn);
            if (navigator.vibrate && isOn) navigator.vibrate(60);

            if (trackRef.current && hasTorch) {
                trackRef.current.applyConstraints({
                    advanced: [{ torch: isOn }]
                }).catch((error) => {
                    console.error('Torch apply error', error);
                    setHasTorch(false);
                });
            }
        });

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('error', handleError);
            socket.off('light-control');
            socket.disconnect();
            trackRef.current?.stop();
            wakeLockRef.current?.release?.();
        };
    }, [hasTorch]);

    const screenFallbackOn = !hasTorch && isFlashOn;

    return (
        <main className={screenFallbackOn ? 'client-page is-flashing' : 'client-page'}>
            <header className="client-header">
                <div className="brand-lockup">
                    <span className="brand-index">CL—01</span>
                    <span>CROWD LIGHT</span>
                </div>
                <span className="client-session">SESSION 001</span>
            </header>

            {!isConnected ? (
                <section className="client-connect">
                    <div className="client-connect__copy">
                        <p className="eyebrow">SYNC YOUR LIGHT</p>
                        <h1>あなたの光を<br />会場のひとつに。</h1>
                        <p>
                            スマートフォンのライトを演出に使用します。
                            カメラ映像や音声が送信されることはありません。
                        </p>
                    </div>
                    <button className="client-connect-button" onClick={startSession} type="button">
                        <span>準備ができたら</span>
                        <strong>接続する</strong>
                        <span>CONNECT</span>
                    </button>
                    <div className="privacy-note">
                        <strong>PRIVACY</strong>
                        <p>カメラはライト制御のみに使用し、映像は保存・送信しません。</p>
                    </div>
                </section>
            ) : (
                <section className={isFlashOn ? 'client-ready is-on' : 'client-ready'}>
                    <p className="eyebrow">CONNECTED / LIVE</p>
                    <div className="client-state">
                        <span>{isFlashOn ? 'LIGHT ON' : 'STANDBY'}</span>
                        <strong>{isFlashOn ? '点灯中' : status}</strong>
                        <p>
                            {isFlashOn
                                ? '会場の演出と同期しています'
                                : 'このまま画面を閉じずにお待ちください'}
                        </p>
                    </div>
                    <div className="client-meta">
                        <div>
                            <span>MODE</span>
                            <strong>{hasTorch ? 'TORCH' : 'SCREEN'}</strong>
                        </div>
                        <div>
                            <span>CONNECTION</span>
                            <strong>{status}</strong>
                        </div>
                    </div>
                </section>
            )}
        </main>
    );
};

export default ClientView;
