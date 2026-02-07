import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './UserList.css'

function UserList({ users, currentUser, selectedUser, onSelectUser, apiBase }) {
  const [friends, setFriends] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [sentRequests, setSentRequests] = useState([])
  const [incomingRequests, setIncomingRequests] = useState([])
  const [lastMessages, setLastMessages] = useState({})
  const [unreadCounts, setUnreadCounts] = useState({})
  const [, setTimeRefresh] = useState(0)

  useEffect(() => {
    if (currentUser) {
      loadData()
      const interval = setInterval(loadData, 2000)
      // Refresh time display every second for real-time relative time
      const timeInterval = setInterval(() => {
        setTimeRefresh(prev => prev + 1)
      }, 1000)
      return () => {
        clearInterval(interval)
        clearInterval(timeInterval)
      }
    }
  }, [currentUser])

  const loadData = async () => {
    try {
      // Fetch friends
      const friendsRes = await axios.get(`${apiBase}/friends/${currentUser.id}`)
      const friendsList = friendsRes.data || []
      setFriends(friendsList)

      // Fetch last messages and unread counts for each friend
      const messages = {}
      const unread = {}
      for (const friend of friendsList) {
        try {
          const msgRes = await axios.get(`${apiBase}/messages/${currentUser.id}/${friend.id}`)
          const allMessages = msgRes.data || []
          if (allMessages.length > 0) {
            messages[friend.id] = allMessages[allMessages.length - 1]
          }
          // Count unread messages from this friend
          const unreadCount = allMessages.filter(m => m.sender_id === friend.id && !m.is_read).length
          unread[friend.id] = unreadCount
        } catch (error) {
          console.error(`Error fetching messages for friend ${friend.id}:`, error)
        }
      }
      setLastMessages(messages)
      setUnreadCounts(unread)

      // Fetch all pending requests
      const requestsRes = await axios.get(`${apiBase}/friend-requests/pending/${currentUser.id}`)
      const allRequests = requestsRes.data || []
      
      // Separate sent and incoming
      const sent = allRequests.filter(r => r.sender_id === currentUser.id).map(r => r.receiver_id)
      const incoming = allRequests.filter(r => r.receiver_id === currentUser.id).map(r => r.sender_id)
      
      setSentRequests(sent)
      setIncomingRequests(incoming)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const handleSendRequest = async (userId) => {
    try {
      await axios.post(`${apiBase}/friend-requests/${userId}?sender_id=${currentUser.id}`)
      setSentRequests([...sentRequests, userId])
    } catch (error) {
      console.error('Error sending request:', error)
    }
  }

  const getLastMessagePreview = (friendId) => {
    const msg = lastMessages[friendId]
    if (!msg) return 'No messages yet'
    
    const isFromMe = msg.sender_id === currentUser.id
    const prefix = isFromMe ? 'You: ' : ''
    const content = msg.content.length > 30 ? msg.content.substring(0, 30) + '...' : msg.content
    return prefix + content
  }

  const getLastMessageTime = (friendId) => {
    const msg = lastMessages[friendId]
    if (!msg || !msg.timestamp) return ''
    
    try {
      // Parse the timestamp string to Date object
      const date = new Date(msg.timestamp)
      
      // Ensure valid date
      if (isNaN(date.getTime())) {
        return ''
      }
      
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)
      
      if (diffMins < 1) return 'now'
      if (diffMins < 60) return `${diffMins}m`
      if (diffHours < 24) return `${diffHours}h`
      if (diffDays < 7) return `${diffDays}d`
      
      // For older messages, show the actual time
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    } catch (error) {
      console.error('Error parsing timestamp:', msg.timestamp, error)
      return ''
    }
  }

  const availableUsers = users.filter(u => 
    !friends.some(f => f.id === u.id) && 
    !incomingRequests.includes(u.id)
  )

  return (
    <div className="user-list">
      <div className="contacts-header">
        <h2>Contacts</h2>
        <button
          className="add-icon-btn"
          onClick={() => setShowModal(true)}
          title="Add Friends"
        >
          +
        </button>
      </div>
      
      <div className="friends-section">
        <div className="users">
          {friends.length === 0 ? (
            <div className="no-users">No friends yet</div>
          ) : (
            friends.map(user => (
              <div
                key={user.id}
                className={`user-item ${selectedUser?.id === user.id ? 'active' : ''}`}
                onClick={() => onSelectUser(user)}
              >
                <div className="user-avatar">{user.username[0].toUpperCase()}</div>
                <div className="user-info">
                  <div className="user-name">{user.username}</div>
                  <div className="user-preview">{getLastMessagePreview(user.id)}</div>
                </div>
                <div className="user-meta">
                  <div className="user-time">{getLastMessageTime(user.id)}</div>
                  {unreadCounts[user.id] > 0 && (
                    <div className="unread-badge">{unreadCounts[user.id]}</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Other Users</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-users">
              {availableUsers.length === 0 ? (
                <div className="no-users">No users available</div>
              ) : (
                availableUsers.map(user => (
                  <div key={user.id} className="user-item">
                    <div className="user-avatar">{user.username[0].toUpperCase()}</div>
                    <div className="user-info">
                      <div className="user-name">{user.username}</div>
                      <div className="user-email">{user.email}</div>
                    </div>
                    <button
                      className={`request-btn ${sentRequests.includes(user.id) ? 'sent' : ''}`}
                      onClick={() => handleSendRequest(user.id)}
                      disabled={sentRequests.includes(user.id)}
                    >
                      {sentRequests.includes(user.id) ? 'Requested' : 'Send Request'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserList
