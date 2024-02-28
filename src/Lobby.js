import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './styles.css';

function Lobby() {
  const [codeBlocks, setCodeBlocks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCode, setNewCode] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('https://codeblockserver-production.up.railway.app/api/codeblocks')
      .then(response => {
        setCodeBlocks(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the code blocks:', error);
      });
  }, []);

  const selectCodeBlock = (id, title) => {
    navigate(`/codeblock/${id}`, { state: { title } });
  };

  const handleAddNew = () => {
    setShowForm(!showForm);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newTitle && newCode) {
      axios.post('https://codeblockserver-production.up.railway.app/api/codeblocks', { title: newTitle, code: newCode })
        .then(response => {
          console.log('New CodeBlock added:', response.data);
          setCodeBlocks([...codeBlocks, response.data]);
          setShowForm(false);
        })
        .catch(error => {
          console.error('Error adding new CodeBlock:', error);
        });
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    // You can also clear the form fields here if needed
    setNewTitle('');
    setNewCode('');
  };

  return (
    <div className="container">
      <h1 className="title">CodeMove</h1>
      
      <div className="header-container">
        <h2>Choose a Code Block</h2>
        <button onClick={handleAddNew} className="add-codeblock-btn">Add New CodeBlock</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <textarea
            placeholder="Code"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
          />
          <div className="button-container">
            <button type="submit">Save New CodeBlock</button>
            <span className="button-space"></span>
            <button type="button" onClick={handleCancel}>Cancel</button>
          </div>
        </form>
      )}

      <div className="codeblock-frame-container">
        {codeBlocks.map((block) => (
          <div key={block._id} className="codeblock-frame" onClick={() => selectCodeBlock(block._id, block.title)}>
            <p>{block.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Lobby;
