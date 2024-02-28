import './styles.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import io from 'socket.io-client';
import Lobby from './Lobby';
import CodeBlockPage from './CodeBlockPage';

// Initialize socket connection
const socket = io('https://codeblockserver-production.up.railway.app/'); 

function App() {
  return (
    <Router>
        <Routes>
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/codeblock/:id" element={<CodeBlockPage socket={socket} mentor={true} />} />
        </Routes>
    </Router>
  );
}

export default App;
