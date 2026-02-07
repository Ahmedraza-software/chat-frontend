import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import './ChatWindow.css'

function ChatWindow({ currentUser, selectedUser, apiBase }) {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [ws, setWs] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    fetchMessages()
    connectWebSocket()
    // Auto-focus the input when chat is opened
    if (inputRef.current) {
      inputRef.current.focus()
    }

    return () => {
      if (ws) {
        ws.close()
      }
    }
  }, [selectedUser])

  useEffect(() => {
    scrollToBottom()
    // Mark received messages as read
    messages.forEach(msg => {
      if (msg.receiver_id === currentUser.id && !msg.is_read) {
        axios.post(`${apiBase}/messages/${msg.id}/read`).catch(err => console.error(err))
      }
    })
  }, [messages])

  useEffect(() => {
    // Refresh messages every 1 second to update read status in real-time
    const interval = setInterval(() => {
      fetchMessages()
    }, 1000)
    return () => clearInterval(interval)
  }, [selectedUser])

  const fetchMessages = async () => {
    try {
      const response = await axios.get(
        `${apiBase}/messages/${currentUser.id}/${selectedUser.id}`
      )
      setMessages(response.data)
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const connectWebSocket = () => {
    const wsUrl = `ws://localhost:8000/ws/${currentUser.id}`
    const websocket = new WebSocket(wsUrl)

    websocket.onopen = () => {
      console.log('WebSocket connected')
    }

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.sender_id === selectedUser.id) {
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          sender_id: data.sender_id,
          receiver_id: currentUser.id,
          content: data.content,
          timestamp: data.timestamp
        }])
      }
    }

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    setWs(websocket)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    const messageData = {
      sender_id: currentUser.id,
      receiver_id: selectedUser.id,
      content: inputValue
    }

    try {
      // Send via WebSocket if connected
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(messageData))
      } else {
        // Fallback to REST API
        await axios.post(`${apiBase}/messages`, messageData)
      }

      // Add message to local state
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        ...messageData,
        timestamp: new Date().toISOString()
      }])

      setInputValue('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-user-info">
          <div className="chat-avatar">{selectedUser.username[0].toUpperCase()}</div>
          <div>
            <div className="chat-username">{selectedUser.username}</div>
            <div className="chat-email">{selectedUser.email}</div>
          </div>
        </div>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              className={`message ${message.sender_id === currentUser.id ? 'sent' : 'received'}`}
            >
              <div className="message-content">{message.content}</div>
              <div className="message-footer">
                <div className="message-time">
                  {new Date(message.timestamp).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </div>
                {message.sender_id === currentUser.id && (
                  <div className={`message-tick ${message.is_read ? 'read' : 'sent'}`}>
                    {message.is_read ? '✓✓' : '✓'}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-input-form" onSubmit={handleSendMessage}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Type a message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="message-input"
        />
        <button type="submit" className="send-btn">Send</button>
      </form>
    </div>
  )
}

export default ChatWindow
