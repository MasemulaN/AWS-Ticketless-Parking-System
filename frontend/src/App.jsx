import './App.css'

function App() {
  return (
    <div className="app">

      <header className="header">
        <h1>AutoPark Vision</h1>
        <p>AI-Powered Ticketless Parking Management System</p>
      </header>

      <main>

<section className="upload-section">

  <h2>Vehicle Processing</h2>

  <label htmlFor="vehicleImage">
    Upload Vehicle Image
  </label>

  <input
    type="file"
    id="vehicleImage"
    accept="image/*"
  />
    <h3>Operation</h3>

  <label>
    <input
      type="radio"
      name="operation"
      value="entry"
    />
    Entry
  </label>

  <label>
    <input
      type="radio"
      name="operation"
      value="exit"
    />
    Exit
  </label>
</section>

        <section className="result-section">
          <h2>Processing Result</h2>
        </section>

        <section className="sessions-section">
          <h2>Active Parking Sessions</h2>
        </section>

      </main>

    </div>
  )
}

export default App