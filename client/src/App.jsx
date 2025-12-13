import React, { useState, useEffect } from 'react';
import { socket } from './socket';
import AdminPanel from './components/AdminPanel';
import ClientView from './components/ClientView';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Simple routing based on path
    if (window.location.pathname === '/admin') {
      setIsAdmin(true);
      socket.auth = { type: 'admin' };
      socket.connect();
      socket.emit('register-admin');
    } else {
      setIsAdmin(false);
      // Client connects on user interaction (Start button)
      // to comply with auto-play/wake-lock policies
    }

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="App">
      {isAdmin ? <AdminPanel /> : <ClientView />}
    </div>
  );
}

export default App;
