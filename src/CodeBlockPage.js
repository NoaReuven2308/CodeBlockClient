import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import './styles.css';
import smileyImage from './Smiley2.png';
import 'highlight.js/styles/monokai-sublime.css';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';

hljs.registerLanguage('javascript', javascript);

function CodeBlockPage({ socket }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMentor, setIsMentor] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [studentCodeBlocks, setStudentCodeBlocks] = useState({});
  const [myCode, setMyCode] = useState("");
  const [solutionCode, setSolutionCode] = useState("");
  const [matchingStudents, setMatchingStudents] = useState([]);

  const { title } = location.state || { title: 'Unknown' };

  const textareaStyle = {
    fontFamily: 'monospace',
    fontSize: '14px',
    width: '100%',
    height: '200px',
    backgroundColor: '#f4f4f4',
    border: '1px solid #ccc',
    borderRadius: '4px',
    padding: '10px',
    margin: '10px 0',
    resize: 'none',
  };

  useEffect(() => {
    socket.emit('joinRoom', { roomId: id });

    socket.on('assignRole', ({ role, count }) => {
      setIsMentor(role === 'mentor');
      setUserCount(count);
      if (role !== 'mentor') {
        setMyCode(""); // Initialize with empty code for the student
      }
    });

    socket.on('userCountUpdated', ({ count }) => {
      setUserCount(count);
    });

    socket.on('newStudentEditor', ({ studentId, code }) => {
      setStudentCodeBlocks(prev => ({ ...prev, [studentId]: code }));
    });

    socket.on('removeStudentEditor', ({ studentId }) => {
      setStudentCodeBlocks(prev => {
        const updatedBlocks = { ...prev };
        delete updatedBlocks[studentId];
        return updatedBlocks;
      });
    });

    socket.on('codeUpdate', ({ studentId, newCode }) => {
      setStudentCodeBlocks(prev => ({ ...prev, [studentId]: newCode }));
    });

    socket.on('mentorSolution', ({ mentorSolution }) => {
      setSolutionCode(mentorSolution);
    });

    socket.on('mentorLeft', () => {
      alert('The mentor has left the session. Please start a new session.');
    });

    // Clean up event listeners
    return () => {
      socket.emit('leaveRoom', { roomId: id });
      socket.off('assignRole');
      socket.off('userCountUpdated');
      socket.off('newStudentEditor');
      socket.off('removeStudentEditor');
      socket.off('codeUpdate');
      socket.off('mentorSolution');
      socket.off('mentorLeft');
    };
  }, [id, socket]);

  useEffect(() => {
    // Apply syntax highlighting after the code blocks are rendered
    hljs.highlightAll();
  }, [studentCodeBlocks, solutionCode]);

  const handleCodeChange = (e) => {
    const updatedCode = e.target.value;
    setMyCode(updatedCode);
    if (!isMentor) {
      socket.emit('codeChange', { roomId: id, newCode: updatedCode });
    }
  };

  const handleSolutionChange = (e) => {
    const updatedSolution = e.target.value;
    setSolutionCode(updatedSolution);
  };

  const handleSave = () => {
    const mentorSolution = solutionCode;
    socket.emit('mentorSolution', { roomId: id, mentorSolution });
    alert("Solution saved successfully");
  };

  const handleStudentSave = () => {
    console.log("My solution:", myCode);
    console.log("Mentor's solution:", solutionCode);
    if (solutionCode === myCode) {
      setMatchingStudents([...matchingStudents, socket.id]);
    } else {
      alert("Your solution does not match the mentor's solution. Keep trying!");
    }
  };

  const renderCodeEditors = () => {
    let editors;

    if (isMentor) {
      editors = Object.entries(studentCodeBlocks).map(([studentId, code], index) => (
        <div key={studentId}>
          <h4>Student {index + 1}</h4>
          <pre>
            <code className="javascript" dangerouslySetInnerHTML={{ __html: hljs.highlight('javascript', code).value }} />
          </pre>
        </div>
      ));
    } else {
      editors = (
        <div>
          <h4>Your Code</h4>
          <textarea
            value={myCode}
            onChange={handleCodeChange}
            style={textareaStyle}
            className="code-textarea"
          />
          {/* {matchingStudents.includes(socket.id) && (
            //<p style={{ color: 'green' }}>Congratulations! Your solution matches the mentor's solution!</p>
          )} */}
          <button onClick={handleStudentSave}>Save</button>
          <pre>
        <code
          className="language-javascript"
          dangerouslySetInnerHTML={{ __html: hljs.highlight('javascript', myCode).value }}
        />
      </pre>
    </div>
  );
}


    return (
      <>
        {editors}
        {isMentor && (
          <div>
            <h4>Solution</h4>
            <textarea
              id="solutionTextarea"
              value={solutionCode}
              onChange={handleSolutionChange}
              style={textareaStyle}
              className="code-textarea"
            />
            <button onClick={handleSave}>Save</button>
          </div>
        )}
        {!isMentor && matchingStudents.includes(socket.id) && (
          <div>
            <h4>Congratulations!</h4>
            <p>You wrote the same solution as the mentor!</p>
            <img src={smileyImage} alt="Smiley Face" />
          </div>
        )}
      </>
    );
  };

  return (
    <div className="container">
      <h2>Code Block Editor</h2>
      <h3>{title}</h3>
      <h3>{isMentor ? 'Mentor View' : 'Student View'}</h3>
      {isMentor && <p>Number of Students in this CodeBlock: {userCount - 1}</p>}
      {renderCodeEditors()}
      <div className="button-container">
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    </div>
  );
}

export default CodeBlockPage;