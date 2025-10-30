import { useEffect, useState } from 'react'
import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL })

export default function App() {
  const [messages, setMessages] = useState([])
  const [username, setUsername] = useState('')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/messages')
      setMessages(res.data)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const create = async (e) => {
    e.preventDefault()
    if (!username || !text) return
    await api.post('/messages', { username, text })
    setText(''); setUsername('')
    await load()
  }

  const startEdit = (m) => { setEditingId(m.id); setUsername(m.username); setText(m.text) }
  const saveEdit = async () => {
    await api.put(`/messages/${editingId}`, { username, text })
    setEditingId(null); setUsername(''); setText(''); await load()
  }
  const cancelEdit = () => { setEditingId(null); setUsername(''); setText('') }
  const remove = async (id) => { await api.delete(`/messages/${id}`); await load() }

  return (
    <div style={{maxWidth:720,margin:'0 auto',padding:24,fontFamily:'system-ui,sans-serif'}}>
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h1 style={{margin:0}}>Anslagstavla</h1>
        <button onClick={load} disabled={loading}>{loading?'Laddar…':'Uppdatera'}</button>
      </header>

      <form onSubmit={editingId ? (e)=>{e.preventDefault(); saveEdit()} : create}
        style={{display:'grid',gap:8,gridTemplateColumns:'1fr auto',marginBottom:24}}>
        <input placeholder="Användarnamn" value={username} onChange={e=>setUsername(e.target.value)} />
        <div />
        <textarea placeholder="Skriv ett meddelande…" value={text} onChange={e=>setText(e.target.value)}
          rows={3} style={{gridColumn:'1 / -1'}} />
        {editingId ? (
          <>
            <button type="button" onClick={saveEdit}>Spara</button>
            <button type="button" onClick={cancelEdit}>Avbryt</button>
          </>
        ) : (
          <button type="submit">Posta</button>
        )}
      </form>

      <ul style={{listStyle:'none',padding:0,display:'grid',gap:12}}>
        {messages.map(m => (
          <li key={m.id} style={{border:'1px solid #ddd',borderRadius:12,padding:12}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <strong>@{m.username}</strong>
              <small>{m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}</small>
            </div>
            <p style={{margin:'8px 0 0'}}>{m.text}</p>
            <div style={{marginTop:8,display:'flex',gap:8}}>
              <button onClick={() => startEdit(m)}>Ändra</button>
              <button onClick={() => remove(m.id)}>Ta bort</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
