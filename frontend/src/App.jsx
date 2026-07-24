import { Routes, Route } from 'react-router-dom';
import PeopleList from './pages/PeopleList.jsx';
import PersonDetail from './pages/PersonDetail.jsx';

export default function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<PeopleList />} />
        <Route path="/people/:id" element={<PersonDetail />} />
      </Routes>
    </div>
  );
}
