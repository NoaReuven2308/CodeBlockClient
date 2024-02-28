import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './styles.css';

/**
 * Lobby Component:
 * This component represents the main page where users can view and interact with code blocks.
 * Users can choose existing code blocks or add new ones.
 */
function Lobby() {
  // State variables to manage code blocks and form visibility
  const [codeBlocks, setCodeBlocks] = useState([]); // Stores the list of code blocks
  const [showForm, setShowForm] = useState(false); // Controls the visibility of the form
  const [newTitle, setNewTitle] = useState(''); // Stores the title of the new code block being added
  const [newCode, setNewCode] = useState(''); // Stores the code of the new code block being added

  // Hook from React Router for navigation
  const navigate = useNavigate();

  // Fetch code blocks from the server when the component mounts
  useEffect(() => {
    axios.get('https://codeblockserver-production.up.railway.app/api/codeblocks')
      .then(response => {
        setCodeBlocks(response.data); // Update codeBlocks state with fetched data
      })
      .catch(error => {
        console.error('There was an error fetching the code blocks:', error);
      });
  }, []);

  // Function to navigate to a selected code block
  const selectCodeBlock = (id, title) => {
    navigate(`/codeblock/${id}`, { state: { title } });
  };

  // Toggle the visibility of the form for adding new code blocks
  const handleAddNew = () => {
    setShowForm(!showForm);
  };

  // Handle form submission when adding a new code block
  const handleSubmit = (e) => {
    e.preventDefault();
    if (newTitle && newCode) {
      axios.post('https://codeblockserver-production.up.railway.app/api/codeblocks', { title: newTitle, code: newCode })
        .then(response => {
          console.log('New CodeBlock added:', response.data);
          setCodeBlocks([...codeBlocks, response.data]); // Update codeBlocks state with the new code block
          setShowForm(false); // Hide the form after successful addition
        })
        .catch(error => {
          console.error('Error adding new CodeBlock:', error);
        });
    }
  };

  // Cancel adding a new code block and reset form fields
  const handleCancel = () => {
    setShowForm(false);
    // Reset form fields
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
