import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import PeopleList from './pages/PeopleList.jsx';
import PersonDetail from './pages/PersonDetail.jsx';
import Login from './pages/Login.jsx';
import QuickUnlock from './pages/QuickUnlock.jsx';
import { auth } from './auth.js';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(auth.isLoggedIn());
  const [showFullLogin, setShowFullLogin] = useState(false);

  const remembered = auth.getRememberedUsername();
  const canQuickUnlock = remembered && (auth.hasPin(remembered) || auth.hasBiometric(remembered));

  if (!loggedIn) {
    if (canQuickUnlock && !showFullLogin) {
      return (
        <div className="app">
          <QuickUnlock
            username={remembered}
            onUnlocked={() => setLoggedIn(true)}
            onUseFullLogin={() => setShowFullLogin(true)}
          />
        </div>
      );
    }
    return (
      <div className="app">
        <Login
          onSuccess={() => {
            setShowFullLogin(false);
            setLoggedIn(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<PeopleList onLogout={() => setLoggedIn(false)} />} />
        <Route path="/people/:id" element={<PersonDetail />} />
      </Routes>
    </div>
  );
}
