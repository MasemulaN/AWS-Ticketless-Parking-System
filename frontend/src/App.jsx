import { useState } from 'react'
import './App.css'

function App() {
  
const [plateNumber, setPlateNumber] = useState("No vehicle detected")
const [operation, setOperation] = useState("No operation selected")
const [status, setStatus] = useState("Waiting for processing")
const [time, setTime] = useState("No timestap available")

function handleProcessVehicle() {
setPlateNumber("CA 123-456")
setOperation ("Entry")
setStatus("Vehicle Recorded Successfully")
setTime(new Date().toLocaleString())
}

  return (
    <div className="app">

      <header className="header">
        <h1>AutoPark Vision</h1>
        <p>AI-Powered Ticketless Parking Management System</p>
      </header>

      <main>

<section className="upload-section">
  <h2>Vehicle Processing</h2>

  <label htmlFor="vehicleImage">Upload Vehicle Image</label>
  <input type="file" id="vehicleImage" accept="image/*" />

  <h3>Operation</h3>

  <div className="operation-options">
    <label>
      <input type="radio" name="operation" value="entry" />
      Entry
    </label>

    <label>
      <input type="radio" name="operation" value="exit" />
      Exit
    </label>
  </div>

  <button onClick={handleProcessVehicle}>
    Process Vehicle
  </button>
</section>

        <section className="result-section">
          <h2>Processing Result</h2>
          <p><strong>License Plate:</strong> {plateNumber}</p>
          <p><strong>Operation:</strong> {operation}</p>
          <p><strong>Status:</strong> {status}</p>
          <p><strong>Time:</strong> {time}</p>
        </section>

        <section className="sessions-section">
          <h2>Active Parking Sessions</h2>
        </section>

      </main>

    </div>
  )
}

export default App
