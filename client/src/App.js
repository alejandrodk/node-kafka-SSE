import './App.css';
import { useState, useEffect } from 'react'

function App() {
const [id, setId] = useState(null);
const [messages, setMessages] = useState([]);

  useEffect(() => {
    const _id = Math.random(); 
    setId(_id);
    const sse = new EventSource('nginx:8080/kafka/' + id); 

    sse.onmessage = e => setMessages([...messages, e.data]);
    sse.onerror = (e) => {
      console.log(e);
      sse.close();
    }

    return () => {
      sse.close();
    }
  }, [])
  return (
    <div className="App">
      <h1>Messages App</h1>
      <p>ID: {id}</p>
      {
      messages && messages.map(text => <p>{text}</p>)
      }
    </div>
  );
}

export default App;
