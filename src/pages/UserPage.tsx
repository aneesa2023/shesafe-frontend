import React, { useState } from 'react'
import AudioRecorder from '../components/AudioRecorder'

interface Incident {
  id: string
  text: string
  audioURL?: string
  location?: { lat: number; lon: number }
  time: string
  status: 'Pending' | 'AI Resolved' | 'Escalated'
  aiSummary?: string
  severity?: 'low' | 'medium' | 'high'
  aiRecommendation?: string
}

const UserPage: React.FC = () => {
  const [text, setText] = useState('')
  const [audioURL, setAudioURL] = useState<string | undefined>(undefined)
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [aiResponse, setAiResponse] = useState<string>('')

  const handleLocation = () => {
    navigator.geolocation.getCurrentPosition(
      pos => setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      err => alert('Unable to fetch location')
    )
  }

const handleSubmit = async () => {
  if (!text && !audioURL) {
    alert('Please add text or record audio before submitting.')
    return
  }

  setAiResponse('Processing with Gemini AI...')

  // Save incident locally first
  const incidents: Incident[] = JSON.parse(localStorage.getItem('incidents') || '[]')
  const newIncident: Incident = {
    id: Date.now().toString(),
    text,
    audioURL,
    location: location || undefined,
    time: new Date().toLocaleString(),
    status: 'Pending'
  }
  incidents.push(newIncident)
  localStorage.setItem('incidents', JSON.stringify(incidents))

  try {
    // Call new endpoint with raw text
    const formData = new FormData()
    formData.append('text', text)

    const res = await fetch('http://localhost:8000/incident/analyze-text', {
      method: 'POST',
      body: formData
    })
    const data = await res.json()

    if (data.status === 'success') {
      const { summary, severity, recommendation } = data

      // Update incident with AI analysis
      newIncident.aiSummary = summary
      newIncident.severity = severity as 'low' | 'medium' | 'high'
      newIncident.aiRecommendation = recommendation
      newIncident.status = 'AI Resolved'

      localStorage.setItem('incidents', JSON.stringify(incidents))
      setAiResponse(`${summary}\nSeverity: ${severity}\nNext Steps: ${recommendation}`)
    } else {
      setAiResponse('AI analysis failed: ' + data.message)
    }

    setSubmitted(true)
    setText('')
    setAudioURL(undefined)
    setLocation(null)
  } catch (err) {
    console.error(err)
    setAiResponse('Failed to get AI response.')
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

      <button onClick={handleSubmit} className="mt-4 w-full bg-pink-700 text-white px-4 py-2 rounded hover:bg-pink-800">
        Submit Incident
      </button>

      {aiResponse && (
        <div className="mt-4 p-3 border-l-4 border-pink-700 bg-pink-50 rounded">
          <h2 className="font-semibold text-pink-700">AI Summary & Recommendation</h2>
          <pre className="whitespace-pre-wrap text-gray-800">{aiResponse}</pre>
        </div>
      )}

      {submitted && <p className="mt-3 text-green-600">Incident submitted successfully!</p>}
    </div>
  )
}

export default UserPage