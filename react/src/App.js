import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SiswaList from './components/SiswaList';
import SiswaCreate from './components/SiswaCreate';
import SiswaEdit from './components/SiswaEdit';
import SiswaView from './components/SiswaView';
import 'bootstrap/dist/css/bootstrap.min.css'; // Mengimpor gaya Bootstrap

function App() {
  return (
    <Router>
      <div className="container mt-5">
        <Routes>
          <Route path="/" element={<SiswaList />} />
          <Route path="/siswa" element={<SiswaList />} />
          <Route path="/siswa/create" element={<SiswaCreate />}/>
          <Route path="/siswa/edit/:id" element={<SiswaEdit />}/>
          <Route path="/siswa/view/:id" element={<SiswaView />}/>
        </Routes>
      </div>
    </Router>
  );
}

export default App;