import { useState } from 'react'
import './App.css'

const VITE_API_URL = import.meta.env.VITE_API_URL;

function App() {
  
const [plateNumber, setPlateNumber] = useState("No vehicle detected")
const [operation, setOperation] = useState("No operation selected")
const [status, setStatus] = useState("Waiting for processing")
const [time, setTime] = useState("No timestap available")
const [selectedOperation, setSelectedOperation] = useState("");
const [selectedFile, setSelectedFile] = useState(null);

function convertToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = () => {
      resolve(reader.result.split(",")[1]);
    };

    reader.onerror = (error) => {
      reject(error);
    };
  });
}

async function handleProcessVehicle() {
  if (!selectedFile) {
  alert("Please select a vehicle image.");
  return;
}

if (!selectedOperation) {
  alert("Please select Entry or Exit.");
  return;
}

  try {

    const imageBase64 = await convertToBase64(selectedFile);

    const response = await fetch(`${VITE_API_URL}/process-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        operation: selectedOperation,
        image: imageBase64,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Request failed");
}

    setPlateNumber(data.plateNumber);
    setOperation(data.operation);
    setStatus(data.status);
    setTime(data.time);

  } catch (error) {
    console.error(error);
    setStatus("Error connecting to AWS");
  }
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
  <input
  type="file"
  id="vehicleImage"
  accept="image/*"
  onChange={(e) => setSelectedFile(e.target.files[0])}
/>

  <h3>Operation</h3>

  <div className="operation-options">

  <label>
    <input
      type="radio"
      name="operation"
      value="Entry"
      onChange={() => setSelectedOperation("Entry")}
    />
    Entry
  </label>

  <label>
    <input
      type="radio"
      name="operation"
      value="Exit"
      onChange={() => setSelectedOperation("Exit")}
    />
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

  <table>

    <thead>
      <tr>
        <th>License Plate</th>
        <th>Entry Time</th>
        <th>Status</th>
      </tr>
    </thead>

    <tbody>
      <tr>
        <td>CA 123-456</td>
        <td>27 Jul 2026 09:30</td>
        <td>Parked</td>
      </tr>

      <tr>
        <td>GP 456-789</td>
        <td>27 Jul 2026 10:15</td>
        <td>Parked</td>
      </tr>

      <tr>
        <td>ND 321-654</td>
        <td>27 Jul 2026 11:05</td>
        <td>Parked</td>
      </tr>

    </tbody>

  </table>

</section>

      </main>

    </div>
  )
}

export default App
