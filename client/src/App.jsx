import AdminPanel from './components/AdminPanel';
import ClientView from './components/ClientView';

function App() {
  const isAdmin = window.location.pathname === '/admin';

  return (
    <div className="App">
      {isAdmin ? <AdminPanel /> : <ClientView />}
    </div>
  );
}

export default App;
