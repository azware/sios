import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SiswaList from './components/SiswaList';
import SiswaCreate from './components/SiswaCreate';
import SiswaEdit from './components/SiswaEdit';
import SiswaView from './components/SiswaView';

function App() {
  return (
    <Router>
      <div className="container mt-5">
        <Routes>
          <Route path="/siswa" exact component={SiswaList} />
          <Route path="/siswa/create" component={SiswaCreate} />
          <Route path="/siswa/edit/:id" component={SiswaEdit} />
          <Route path="/siswa/view/:id" component={SiswaView} />
          <Route path="/" component={SiswaList} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;