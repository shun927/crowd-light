import { useEffect, useMemo, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { socket } from '../socket';

const AdminPanel = () => {
    const isPreview = import.meta.env.DEV && new URLSearchParams(window.location.search).has('preview');
    const [clientCount, setClientCount] = useState(isPreview ? 128 : 0);
    const [isLightOn, setIsLightOn] = useState(false);
    const [token, setToken] = useState(() => sessionStorage.getItem('admin-token') || '');
    const [isConnected, setIsConnected] = useState(isPreview);
    const [error, setError] = useState('');
    const [activeSection, setActiveSection] = useState('session');

    const userUrl = window.location.origin;
    const activity = useMemo(() => [
        { time: '22:41:08', label: '参加端末を受け付けています', value: `${clientCount} 台` },
        { time: '22:40:52', label: 'リアルタイム接続', value: '安定' },
        { time: '22:40:31', label: 'ライト制御', value: isLightOn ? '点灯中' : '待機中' },
    ], [clientCount, isLightOn]);

    useEffect(() => {
        if (isPreview) return undefined;

        const handleConnect = () => {
            setIsConnected(true);
            setError('');
        };
        const handleDisconnect = (reason) => {
            setIsConnected(false);
            if (reason) setError(reason);
        };
        const handleError = (message) => setError(message || '接続に失敗しました');
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
    }, [isPreview]);

    const connectAdmin = (event) => {
        event.preventDefault();
        sessionStorage.setItem('admin-token', token);
        socket.auth = { type: 'admin', token };
        socket.connect();
    };

    const toggleLight = () => {
        const newState = !isLightOn;
        if (isPreview) setIsLightOn(newState);
        socket.emit('toggle-light', newState);
    };

    if (!isConnected) {
        return (
            <main className="access-page">
                <section className="access-panel" aria-labelledby="access-title">
                    <div className="brand-lockup">
                        <span className="brand-index">CL—01</span>
                        <span>CROWD LIGHT</span>
                    </div>
                    <div className="access-copy">
                        <p className="eyebrow">OPERATOR ACCESS</p>
                        <h1 id="access-title">管理画面に接続</h1>
                        <p>Cloudflare に登録した管理トークンを入力してください。</p>
                    </div>
                    <form onSubmit={connectAdmin} className="access-form">
                        <label htmlFor="admin-token">管理トークン</label>
                        <input
                            id="admin-token"
                            type="password"
                            value={token}
                            onChange={(event) => setToken(event.target.value)}
                            placeholder="••••••••••••"
                            autoComplete="current-password"
                        />
                        <button className="button button--primary" type="submit">接続する</button>
                    </form>
                    {error && <p className="form-error" role="alert">{error}</p>}
                </section>
            </main>
        );
    }

    return (
        <main className="admin-shell">
            <aside className="sidebar">
                <div className="brand-lockup brand-lockup--stacked">
                    <span className="brand-index">CL—01</span>
                    <span>CROWD<br />LIGHT</span>
                </div>

                <nav className="side-nav" aria-label="管理メニュー">
                    {[
                        ['session', 'セッション'],
                        ['participants', '参加者'],
                        ['settings', '設定'],
                    ].map(([id, label]) => (
                        <button
                            className={activeSection === id ? 'side-nav__item is-active' : 'side-nav__item'}
                            key={id}
                            onClick={() => setActiveSection(id)}
                            type="button"
                        >
                            <span>{label}</span>
                            <span className="side-nav__number">0{['session', 'participants', 'settings'].indexOf(id) + 1}</span>
                        </button>
                    ))}
                </nav>

                <div className="sidebar-status">
                    <span className="status-label">SYSTEM</span>
                    <strong>接続は安定しています</strong>
                    <span>Cloudflare Edge</span>
                </div>
            </aside>

            <section className="admin-main">
                <header className="admin-header">
                    <div>
                        <p className="eyebrow">LIVE CONTROL / SESSION 001</p>
                        <h1>ライトコントロール</h1>
                    </div>
                    <div className="live-badge">
                        <span>LIVE</span>
                        <strong>受付中</strong>
                    </div>
                </header>

                <div className="dashboard-grid">
                    <section className="metric-section" aria-labelledby="connected-title">
                        <p className="section-label" id="connected-title">CONNECTED DEVICES</p>
                        <div className="device-count">
                            <strong>{clientCount}</strong>
                            <span>台</span>
                        </div>
                        <p className="metric-copy">スマートフォンが<br />このセッションに接続中</p>
                        <div className="signal-row">
                            <span>リアルタイム同期</span>
                            <strong>安定</strong>
                        </div>
                    </section>

                    <section className="qr-section" aria-labelledby="qr-title">
                        <div className="section-heading-row">
                            <div>
                                <p className="section-label">JOIN SESSION</p>
                                <h2 id="qr-title">参加用QRコード</h2>
                            </div>
                            <span className="session-code">#001</span>
                        </div>
                        <div className="qr-content">
                            <div className="qr-frame">
                                <QRCodeCanvas
                                    value={userUrl}
                                    size={208}
                                    bgColor="#f1efe7"
                                    fgColor="#181a18"
                                    level="H"
                                    marginSize={1}
                                />
                            </div>
                            <div className="qr-instructions">
                                <span>01</span>
                                <p>スマートフォンのカメラで読み取ります</p>
                                <span>02</span>
                                <p>画面の案内に沿って接続します</p>
                                <small>{userUrl}</small>
                            </div>
                        </div>
                    </section>

                    <section className={isLightOn ? 'master-section is-on' : 'master-section'} aria-labelledby="master-title">
                        <div className="master-copy">
                            <p className="section-label">MASTER CONTROL</p>
                            <h2 id="master-title">{isLightOn ? '会場を点灯中' : '現在は消灯中'}</h2>
                            <p>
                                接続中のすべての端末を同時に
                                {isLightOn ? '消灯します。' : '点灯します。'}
                            </p>
                        </div>
                        <button
                            className="master-button"
                            type="button"
                            onClick={toggleLight}
                            aria-pressed={isLightOn}
                        >
                            <span className="master-button__state">{isLightOn ? 'ON' : 'READY'}</span>
                            <strong>{isLightOn ? '一斉消灯' : '一斉点灯'}</strong>
                            <span>PRESS TO {isLightOn ? 'TURN OFF' : 'ACTIVATE'}</span>
                        </button>
                    </section>

                    <section className="activity-section" aria-labelledby="activity-title">
                        <div className="section-heading-row">
                            <div>
                                <p className="section-label">SESSION STATUS</p>
                                <h2 id="activity-title">現在の状態</h2>
                            </div>
                            <span className="updated-label">LIVE UPDATE</span>
                        </div>
                        <div className="activity-list">
                            {activity.map((item) => (
                                <div className="activity-row" key={item.label}>
                                    <time>{item.time}</time>
                                    <span>{item.label}</span>
                                    <strong>{item.value}</strong>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </section>
        </main>
    );
};

export default AdminPanel;
