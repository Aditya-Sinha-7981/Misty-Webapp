import "./ControlPage.css";

function ControlPage() {

  const sendAction = async (actionName) => {
    try {
      await fetch("http://127.0.0.1:8000/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action: actionName })
      });

      alert(`${actionName} command sent to Misty`);
    } catch (err) {
      alert("Backend not reachable.");
    }
  };

  return (
    <div className="control-container">
      <h1 className="control-title">Misty Command Center</h1>

      <div className="control-grid">
        <button className="control-btn" onClick={() => sendAction("wave")}>
          👋 Wave
        </button>

        <button className="control-btn" onClick={() => sendAction("dance")}>
          💃 Dance
        </button>

        <button className="control-btn" onClick={() => sendAction("turn_left")}>
          ⬅ Turn Left
        </button>

        <button className="control-btn" onClick={() => sendAction("turn_right")}>
          ➡ Turn Right
        </button>

        <button className="control-btn" onClick={() => sendAction("move_forward")}>
          ⬆ Move Forward
        </button>

        <button className="control-btn" onClick={() => sendAction("stop")}>
          🛑 Stop
        </button>
      </div>
    </div>
  );
}

export default ControlPage;