import React, { useEffect, useRef, useState, useCallback } from 'react';
import $ from 'jquery';
import { Scrollbars } from 'react-custom-scrollbars-2';
import { getMatchData } from '../api/footballApi';
import axios from 'axios';

const ChatBot = () => {
  // State to store chat messages
  const [messages, setMessages] = useState([]);

  // State to store the current message input
  const [msg, setMsg] = useState('');

  // Ref to enable automatic scrolling in the chat area
  const scrollbarsRef = useRef(null);

  // Ref to keep track of time for timestamping messages
  const d = useRef(new Date());
  const m = useRef(d.current.getMinutes());

  // State to store match data (fetched but currently unused in UI)
  const [matchData, setMatchData] = useState([]);

  // Fetch match data once on initial component mount
  useEffect(() => {
    const fetchMatchData = async () => {
      try {
        const data = await getMatchData();
        console.log(data); // Debug log
        setMatchData(data.matches);
      } catch (error) {
        console.error('Error retrieving match data :', error);
      }
    };

    fetchMatchData();
  }, []);

  // Scroll to the bottom of the chat when new messages arrive
  const scrollToBottom = useCallback(() => {
    if (scrollbarsRef.current) {
      scrollbarsRef.current.scrollToBottom();
    }
  }, []);

  // Trigger scroll when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Adds a timestamp message if the current minute has changed
  const setDate = () => {
    d.current = new Date();
    if (m.current !== d.current.getMinutes()) {
      m.current = d.current.getMinutes();
      setMessages(prevMessages => [
        ...prevMessages,
        { type: 'timestamp', time: `${d.current.getHours()}:${m.current}` }
      ]);
    }
  };

  // Sends the message to the backend and receives the bot's response
  const insertMessage = async () => {
    if ($.trim(msg) === '') return false;

    // Add the user's message to the chat
    setMessages(prevMessages => [
      ...prevMessages,
      { type: 'personal', text: msg }
    ]);
    setMsg('');
    setDate();

    try {
      // POST request to the backend API (Heroku endpoint)
      const response = await axios.post('https://goalbuddy-dcc4885decf4.herokuapp.com/api/message', { message: msg });

      // Add the bot's reply to the chat
      setMessages(prevMessages => [
        ...prevMessages,
        { type: 'bot', text: response.data.text }
      ]);
    } catch (error) {
      console.error('Error sending message to server :', error);
    }
  };

  // Handle message input change
  const handleMsgChange = (e) => {
    setMsg(e.target.value);
  };

  // Handle form submit (on Send button click)
  const handleMsgSubmit = (e) => {
    e.preventDefault();
    insertMessage();
  };

  return (
    <div className="chat">
      {/* Chat Header */}
      <div className="chat-title">
        <h1>GoalBuddy</h1>
        <h2>Your Personalized Football Assistant</h2>
        <figure className="avatar">
          <img src="/logo.png" alt="logo"/>
        </figure>
      </div>

      {/* Messages Section */}
      <div className="messages">
        <Scrollbars ref={scrollbarsRef} autoHide>
          <div className="messages-content">
            {messages.map((message, index) => (
              message.type === 'timestamp' ? (
                <></>
                // Timestamp block intentionally hidden
              ) : (
                <div className={`message ${message.type === 'personal' ? 'message-personal' : ''} ${message.type === 'bot' ? 'new' : ''}`} key={index}>
                  {message.type === 'bot' && (
                    <figure className="avatar">
                      <img src="/logo.png" alt="logo"/>
                    </figure>
                  )}
                  {message.text}
                </div>
              )
            ))}
          </div>
        </Scrollbars>
      </div>

      {/* Message Input Box */}
      <div className="message-box">
        <textarea
          type="text"
          className="message-input"
          placeholder="Type message..."
          value={msg}
          onChange={handleMsgChange}
        />
        <button type="submit" className="message-submit" onClick={handleMsgSubmit}>Send</button>
      </div>

      {/* Footer */}
      <div className='Copyright'>
        Designed by <a href='https://x.com/clementkanku8'>Clement Kanku</a>
      </div>
    </div>
  );
};

export default ChatBot;
