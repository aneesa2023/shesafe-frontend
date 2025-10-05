import React, { useState, useEffect, useRef } from 'react'
import AudioRecorder from '../components/AudioRecorder'

interface Message {
  sender: 'user' | 'ai'
  text: string
}

interface Incident {
  id: string
  text: string
  audioURL?: string
  location?: { lat: number; lon: number }
  time: string
  status: 'Pending' | 'AI Resolved' | 'Escalated'
  conversation: Message[]
  severity?: 'low' | 'medium' | 'high'
  aiRecommendation?: string
}

const UserPage: React.FC = () => {
  const [text, setText] = useState('')
  const [audioURL, setAudioURL] = useState<string | undefined>(undefined)
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [currentIncident, setCurrentIncident] = useState<Incident | null>(null)
  const [followUp, setFollowUp] = useState('')
  const chatEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('incidents') || '[]')
    setIncidents(stored)
    if (stored.length) setCurrentIncident(stored[stored.length - 1])
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentIncident])

  const handleLocation = () => {
    navigator.geolocation.getCurrentPosition(
      pos => setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      err => alert('Unable to fetch location')
    )
  }

  const handleSubmit = async () => {
    if (!text && !audioURL) return alert('Please add text or record audio before submitting.')

    const newIncident: Incident = {
      id: Date.now().toString(),
      text,
      audioURL,
      location: location || undefined,
      time: new Date().toLocaleString(),
      status: 'Pending',
      conversation: [{ sender: 'user', text }]
    }

    setIncidents(prev => [...prev, newIncident])
    setCurrentIncident(newIncident)
    localStorage.setItem('incidents', JSON.stringify([...incidents, newIncident]))
    setText('')
    setAudioURL(undefined)
    setLocation(null)

    try {
      const formData = new FormData()
      formData.append('text', newIncident.text)

      const res = await fetch('http://localhost:8000/incident/analyze-text', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()

      if (data.status === 'success') {
        const { summary, severity, recommendation } = data
        newIncident.conversation.push({ sender: 'ai', text: summary })
        newIncident.severity = severity
        newIncident.aiRecommendation = recommendation
        newIncident.status = 'AI Resolved'

        const updatedIncidents = [...incidents.slice(), newIncident]
        setIncidents(updatedIncidents)
        setCurrentIncident(newIncident)
        localStorage.setItem('incidents', JSON.stringify(updatedIncidents))
      } else {
        newIncident.conversation.push({ sender: 'ai', text: 'AI analysis failed: ' + data.message })
      }
    } catch (err) {
      console.error(err)
      newIncident.conversation.push({ sender: 'ai', text: 'Failed to get AI response.' })
    }
  }

  const handleFollowUp = async () => {
    if (!followUp || !currentIncident) return

    const incidentCopy = { ...currentIncident }
    incidentCopy.conversation.push({ sender: 'user', text: followUp })
    setFollowUp('')
    setCurrentIncident(incidentCopy)

    try {
      const res = await fetch('http://localhost:8000/incident/follow-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId: incidentCopy.id,
          followUp,
          conversation: incidentCopy.conversation
        })
      })
      const data = await res.json()
      if (data.status === 'success') {
        incidentCopy.conversation.push({ sender: 'ai', text: data.answer })
        const updatedIncidents = [...incidents.slice(0, -1), incidentCopy]
        setIncidents(updatedIncidents)
        setCurrentIncident(incidentCopy)
        localStorage.setItem('incidents', JSON.stringify(updatedIncidents))
      } else {
        incidentCopy.conversation.push({ sender: 'ai', text: 'Follow-up failed: ' + data.message })
      }
    } catch (err) {
      console.error(err)
      incidentCopy.conversation.push({ sender: 'ai', text: 'Follow-up failed.' })
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4 bg-white shadow-md rounded-lg">
      <h1 className="text-3xl font-bold mb-4 text-pink-700 text-center">Report an Incident</h1>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Describe your emergency..."
        className="w-full p-3 border rounded focus:ring-2 focus:ring-pink-300"
        rows={4}
      />

      <AudioRecorder onSave={setAudioURL} />

      <div className="flex items-center space-x-3">
        <button onClick={handleLocation} className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Capture Location
        </button>
        {location && (
          <span className="text-sm text-gray-600">
            📍 Lat: {location.lat.toFixed(4)}, Lon: {location.lon.toFixed(4)}
          </span>
        )}
      </div>

      <button
        onClick={handleSubmit}
        className="mt-4 w-full bg-pink-700 text-white px-4 py-2 rounded hover:bg-pink-800"
      >
        Submit Incident
      </button>

      {currentIncident && (
        <div className="mt-4 p-3 border-l-4 border-pink-700 bg-pink-50 rounded space-y-2 max-h-96 overflow-y-auto">
          <h2 className="font-semibold text-pink-700">Conversation</h2>
          {currentIncident.conversation.map((msg, idx) => (
            <div key={idx} className={`p-2 rounded ${msg.sender === 'user' ? 'bg-pink-100 text-gray-800 self-end' : 'bg-pink-200 text-gray-900 self-start'}`}>
              <strong>{msg.sender === 'user' ? 'You:' : 'AI:'}</strong> {msg.text}
            </div>
          ))}
          <div ref={chatEndRef} />
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              placeholder="Ask a follow-up question..."
              value={followUp}
              onChange={e => setFollowUp(e.target.value)}
              className="flex-1 p-2 border rounded"
            />
            <button
              onClick={handleFollowUp}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Ask
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserPage