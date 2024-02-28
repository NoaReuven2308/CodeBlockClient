import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import './styles.css';
import smileyImage from './Smiley2.png';
import 'highlight.js/styles/monokai-sublime.css';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';

hljs.registerLanguage('javascript', javascript);

/**
 * CodeBlockPage Component:
 * Represents the page where students and mentors interact with code blocks.
 * Students can view and edit their code, while mentors can view all students' code and provide solutions.
 * @param {object} socket - Socket object for real-time communication
 */
function CodeBlockPage({ socket }) {
  // Extracting parameters and hooks for navigation and location
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // State variables to manage component state
  const [isMentor, setIsMentor] = useState(false); // Indicates if the user is a mentor
  const [userCount, setUserCount] = useState(0); // Tracks the number of users in the session
  const [studentCodeBlocks, setStudentCodeBlocks] = useState({}); // Stores code blocks submitted by students
  const [myCode, setMyCode] = useState(""); // Stores the code of the current user (student)
  const [solutionCode, setSolutionCode] = useState(""); // Stores the solution code provided by the mentor
  const [matchingStudents, setMatchingStudents] = useState([]); // Tracks students whose code matches the mentor's solution

  // Extracting title from location state or defaulting to 'Unknown'
  const { title } = location.state || { title: 'Unknown' };

  // Inline style for textarea
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

  // Effect hook to handle socket events and cleanup
  useEffect(() => {
    // Joining the room with the provided ID
    socket.emit('joinRoom', { roomId: id });

    // Listening for role assignment and user count updates
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

    // Handling events related to student code submission
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

    // Handling mentor solution updates
    socket.on('mentorSolution', ({ mentorSolution }) => {
      setSolutionCode(mentorSolution);
    });

    // Alerting users if the mentor leaves the session
    socket.on('mentorLeft', () => {
      alert('The mentor has left the session. Please start a new session.');
    });

    // Cleanup function to leave the room and remove event listeners
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

  // Effect hook to apply syntax highlighting after code blocks update
  useEffect(() => {
    hljs.highlightAll();
  }, [studentCodeBlocks, solutionCode]);

  // Function to handle user's code change
  const handleCodeChange = (e) => {
    const updatedCode = e.target.value;
    setMyCode(updatedCode);
    if (!isMentor) {
      socket.emit('codeChange', { roomId: id, newCode: updatedCode });
    }
  };

  // Function to handle mentor's solution change
  const handleSolutionChange = (e) => {
    const updatedSolution = e.target.value;
    setSolutionCode(updatedSolution);
  };

  // Function to save mentor's solution
  const handleSave = () => {
    const mentorSolution = solutionCode;
    socket.emit('mentorSolution', { roomId: id, mentorSolution });
    alert("Solution saved successfully");
  };

  // Function to save student's solution and check for match
  const handleStudentSave = () => {
    console.log("My solution:", myCode);
    console.log("Mentor's solution:", solutionCode);
    if (solutionCode === myCode) {
      setMatchingStudents([...matchingStudents, socket.id]);
    } else {
      alert("Your solution does not match the mentor's solution. Keep trying!");
    }
  };

  // Function to render code editors based on user role
  const renderCodeEditors = () => {
    let editors;

    if (isMentor) {
      // Render all student code blocks for mentors
      editors = Object.entries(studentCodeBlocks).map(([studentId, code], index) => (
        <div key={studentId}>
          <h4>Student {index + 1}</h4>
          <pre>
            <code className="javascript" dangerouslySetInnerHTML={{ __html: hljs.highlight('javascript', code).value }} />
          </pre>
        </div>
      ));
    } else {
      // Render student's own code editor for students
      editors = (
        <div>
          <h4>Your Code</h4>
          <textarea
            value={myCode}
            onChange={handleCodeChange}
            style={textareaStyle}
            className="code-textarea"
          />
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

    return editors;
  };

  return (
    <div className="container">
      <h2>Code Block Editor</h2>
      <h3>{title}</h3>
      <h3>{isMentor ? 'Mentor View' : 'Student View'}</h3>
      {isMentor && <p>Number of Students in this CodeBlock: {userCount - 1}</p>}
      {renderCodeEditors()}
      {/* Render solution textarea for mentors */}
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
      {/* Render congratulations message for students whose code matches mentor's solution */}
      {!isMentor && matchingStudents.includes(socket.id) && (
        <div>
          <h4>Congratulations!</h4>
          <p>You wrote the same solution as the mentor!</p>
          <img src={smileyImage} alt="Smiley Face" />
        </div>
      )}
      {/* Button to navigate back */}
      <div className="button-container">
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    </div>
  );
}

export default CodeBlockPage;
