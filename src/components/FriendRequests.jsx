import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './FriendRequests.css'

function FriendRequests({ currentUser, apiBase, onRequestHandled }) {
  const [requests, setRequests] = useState([])

  useEffect(() => {
    if (currentUser) {
      fetchRequests()
      const interval = setInterval(fetchRequests, 3000)
      return () => clearInterval(interval)
    }
  }, [currentUser])

  const fetchRequests = async () => {
    try {
      const response = await axios.get(`${apiBase}/friend-requests/pending/${currentUser.id}`)
      const incoming = (response.data || []).filter(r => r.receiver_id === currentUser.id)
      console.log('Incoming requests:', incoming)
      setRequests(incoming)
    } catch (error) {
      console.error('Error fetching requests:', error)
    }
  }

  const handleAccept = async (requestId) => {
    try {
      await axios.post(`${apiBase}/friend-requests/${requestId}/accept`)
      setRequests(requests.filter(r => r.id !== requestId))
      if (onRequestHandled) {
        onRequestHandled()
      }
    } catch (error) {
      console.error('Error accepting request:', error)
    }
  }

  const handleReject = async (requestId) => {
    try {
      await axios.post(`${apiBase}/friend-requests/${requestId}/reject`)
      setRequests(requests.filter(r => r.id !== requestId))
    } catch (error) {
      console.error('Error rejecting request:', error)
    }
  }

  if (requests.length === 0) {
    return null
  }

  return (
    <div className="friend-requests-container">
      <div className="requests-header">
        <h3>Friend Requests ({requests.length})</h3>
      </div>
      <div className="requests-list">
        {requests.map(request => (
          <div key={request.id} className="request-item">
            <div className="request-sender">
              <div className="sender-avatar">
                {request.sender_username ? request.sender_username[0].toUpperCase() : '?'}
              </div>
              <div className="request-info">
                <div className="request-username">{request.sender_username || 'Unknown'}</div>
                <div className="request-email">{request.sender_email || 'N/A'}</div>
              </div>
            </div>
            <div className="request-actions">
              <button
                className="accept-btn"
                onClick={() => handleAccept(request.id)}
              >
                Accept
              </button>
              <button
                className="reject-btn"
                onClick={() => handleReject(request.id)}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FriendRequests
