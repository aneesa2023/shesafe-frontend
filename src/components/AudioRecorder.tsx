import React, { useState, useRef } from 'react'

interface AudioRecorderProps {
  onSave: (audioURL: string) => void
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onSave }) => {
  const [recording, setRecording] = useState(false)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    mediaRecorderRef.current = recorder
    audioChunks.current = []

    recorder.ondataavailable = e => audioChunks.current.push(e.data)
    recorder.onstop = () => {
      const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' })
      const url = URL.createObjectURL(audioBlob)
      setAudioURL(url)
      onSave(url)
    }

    recorder.start()
    setRecording(true)
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  return (
    <div className="mt-3">
      {recording ? (
        <button onClick={stopRecording} className="bg-red-500 text-white px-3 py-1 rounded">
          Stop Recording
        </button>
      ) : (
        <button onClick={startRecording} className="bg-green-600 text-white px-3 py-1 rounded">
          Start Recording
        </button>
      )}
      {audioURL && (
        <div className="mt-2">
          <audio controls src={audioURL}></audio>
        </div>
      )}
    </div>
  )
}

export default AudioRecorder