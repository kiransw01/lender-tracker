import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import PeopleList from './pages/PeopleList.jsx';
import PersonDetail from './pages/PersonDetail.jsx';
import Login from './pages/Login.jsx';
import { auth } from './auth.js';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(auth.isLoggedIn());

  if (!loggedIn) {
    return (
      <div className="app">
        <Login onSuccess={() => setLoggedIn(true)} />
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
