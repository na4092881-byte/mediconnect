import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

type Role = 'patient' | 'doctor' | 'admin'
type User = { id: string; name: string; email: string; role: Role }

const QUESTIONS = [
  { en: "What is your main problem today?", hi: "आज आपकी मुख्य समस्या क्या है?", hinglish: "Aaj aapki main problem kya hai?" },
  { en: "Since when are you facing this problem?", hi: "यह समस्या कब से है?", hinglish: "Ye problem kab se hai?" },
  { en: "Where exactly is the pain or discomfort?", hi: "दर्द या तकलीफ कहाँ है?", hinglish: "Dard ya takleef kahan hai?" },
  { en: "Do you have fever? If yes, how much?", hi: "क्या बुखार है? अगर हाँ तो कितना?", hinglish: "Kya bukhar hai? Agar haan to kitna?" },
  { en: "Do you have any existing medical conditions?", hi: "क्या आपको पहले से कोई बीमारी है?", hinglish: "Kya aapko pehle se koi bimari hai?" },
  { en: "Are you currently taking any medicines?", hi: "क्या आप अभी कोई दवाई ले रहे हैं?", hinglish: "Kya aap abhi koi dawai le rahe hain?" },
  { en: "Do you have any allergies?", hi: "क्या आपको कोई एलर्जी है?", hinglish: "Kya aapko koi allergy hai?" },
  { en: "How would you rate your pain? (1-10)", hi: "आपका दर्द कितना है? (1-10)", hinglish: "Aapka dard kitna hai? (1-10)" },
]

type Lang = 'en' | 'hi' | 'hinglish'

// =================== CHAT COMPONENT ===================
function ChatBox({ caseId, caseNumber, user, onClose }: {
  caseId: number, caseNumber: string, user: User, onClose: () => void
}) {
  const [messages, setMessages] = useState<any[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMessages()
    const channel = supabase
      .channel(`chat-${caseId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `case_id=eq.${caseId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [caseId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages').select('*').eq('case_id', caseId).order('created_at', { ascending: true })
    setMessages(data || [])
  }

  const sendMessage = async () => {
    if (!newMsg.trim()) return
    setSending(true)
    await supabase.from('messages').insert({
      case_id: caseId, sender_id: user.id, sender_role: user.role, message: newMsg.trim()
    })
    setNewMsg('')
    setSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div style={{
      position: 'fixed', bottom: 0, right: 0, width: '360px', height: '500px',
      background: 'white', borderRadius: '16px 16px 0 0',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
      display: 'flex', flexDirection: 'column', zIndex: 1000
    }}>
      <div style={{
        background: user.role === 'doctor' ? '#0d9488' : '#1a73e8',
        padding: '14px 16px', borderRadius: '16px 16px 0 0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <p style={{ color: 'white', fontWeight: 'bold', margin: 0, fontSize: '15px' }}>💬 Chat — #{caseNumber}</p>
          <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '12px' }}>
            {user.role === 'doctor' ? 'Chatting with Patient' : 'Chatting with Doctor'}
          </p>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none',
          borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '16px'
        }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', background: '#f8fafc' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '40px' }}>
            <p style={{ fontSize: '32px' }}>💬</p>
            <p style={{ fontSize: '14px' }}>No messages yet. Start chatting!</p>
          </div>
        )}
        {messages.map((msg: any) => {
          const isMe = msg.sender_id === user.id
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: '10px' }}>
              {!isMe && (
                <div style={{
                  width: '30px', height: '30px', borderRadius: '50%',
                  background: msg.sender_role === 'doctor' ? '#0d9488' : '#1a73e8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', marginRight: '8px', flexShrink: 0
                }}>
                  {msg.sender_role === 'doctor' ? '👨‍⚕️' : '🧑'}
                </div>
              )}
              <div style={{
                maxWidth: '70%', padding: '10px 14px',
                borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: isMe ? (user.role === 'doctor' ? '#0d9488' : '#1a73e8') : 'white',
                color: isMe ? 'white' : '#1e293b',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)', fontSize: '14px', lineHeight: '1.4'
              }}>
                {!isMe && (
                  <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 'bold',
                    color: msg.sender_role === 'doctor' ? '#0d9488' : '#1a73e8' }}>
                    {msg.sender_role === 'doctor' ? '👨‍⚕️ Doctor' : '🧑 Patient'}
                  </p>
                )}
                <p style={{ margin: 0 }}>{msg.message}</p>
                <p style={{ margin: '4px 0 0', fontSize: '10px', opacity: 0.7, textAlign: 'right' }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: '12px', borderTop: '1px solid #e2e8f0', background: 'white', display: 'flex', gap: '8px' }}>
        <input
          value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="Type a message... (Enter to send)"
          style={{ flex: 1, padding: '10px 14px', borderRadius: '24px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
        />
        <button onClick={sendMessage} disabled={sending || !newMsg.trim()} style={{
          padding: '10px 16px', borderRadius: '24px',
          background: sending || !newMsg.trim() ? '#ccc' : (user.role === 'doctor' ? '#0d9488' : '#1a73e8'),
          color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px'
        }}>➤</button>
      </div>
    </div>
  )
}

// =================== LOGIN ===================
function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [isRegister, setIsRegister] = useState(false)
  const [role, setRole] = useState<Role>('patient')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const handleLogin = async () => {
    setLoading(true); setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
    if (!profile) { setError('Profile not found!'); setLoading(false); return }
    if (profile.blocked) { setError('Your account is blocked!'); setLoading(false); return }
    if (profile.role !== role) { setError('Wrong role selected!'); setLoading(false); return }
    onLogin({ id: data.user.id, name: profile.name, email: profile.email, role: profile.role })
    setLoading(false)
  }

  const handleRegister = async () => {
    setLoading(true); setError('')
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id, name, email, role, specialization: role === 'doctor' ? specialization : null
      })
      setMsg('Account created! Please login now.')
      setIsRegister(false)
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '16px', width: '420px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <h1 style={{ color: '#1a73e8', textAlign: 'center', marginBottom: '4px', fontSize: '28px' }}>🏥 MediConnect</h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '24px' }}>Bridging doctors and patients</p>
        {msg && <p style={{ color: 'green', textAlign: 'center', marginBottom: '12px' }}>{msg}</p>}
        <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>I am a:</p>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          {(['patient', 'doctor', 'admin'] as Role[]).map(r => (
            <button key={r} onClick={() => setRole(r)} style={{
              flex: 1, padding: '10px', borderRadius: '8px',
              border: role === r ? '2px solid #1a73e8' : '2px solid #ddd',
              background: role === r ? '#e8f0fe' : 'white',
              color: role === r ? '#1a73e8' : '#666', cursor: 'pointer', fontWeight: 'bold'
            }}>
              {r === 'patient' ? '🧑 Patient' : r === 'doctor' ? '👨‍⚕️ Doctor' : '👨‍💼 Admin'}
            </button>
          ))}
        </div>
        {isRegister && (
          <input placeholder="Full Name" value={name} onChange={e => setName(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '12px', boxSizing: 'border-box' as const }} />
        )}
        {isRegister && role === 'doctor' && (
          <input placeholder="Specialization (e.g. General Physician)" value={specialization} onChange={e => setSpecialization(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '12px', boxSizing: 'border-box' as const }} />
        )}
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '12px', boxSizing: 'border-box' as const }} />
        <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '12px', boxSizing: 'border-box' as const }} />
        {error && <p style={{ color: 'red', marginBottom: '12px', fontSize: '14px' }}>{error}</p>}
        <button onClick={isRegister ? handleRegister : handleLogin} disabled={loading} style={{
          width: '100%', padding: '14px', background: loading ? '#ccc' : '#1a73e8', color: 'white',
          border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold'
        }}>{loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}</button>
        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px' }}>
          {isRegister ? 'Already have account? ' : "Don't have account? "}
          <span onClick={() => { setIsRegister(!isRegister); setError('') }} style={{ color: '#1a73e8', cursor: 'pointer', fontWeight: 'bold' }}>
            {isRegister ? 'Sign In' : 'Register'}
          </span>
        </p>
      </div>
    </div>
  )
}

// =================== PATIENT ===================
function PatientDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [lang, setLang] = useState<Lang>('en')
  const [answers, setAnswers] = useState<string[]>(Array(QUESTIONS.length).fill(''))
  const [step, setStep] = useState<'questions' | 'cases'>('questions')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cases, setCases] = useState<any[]>([])
  const [newCaseId, setNewCaseId] = useState('')
  const [chatCase, setChatCase] = useState<any | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchCases() }, [])

  const fetchCases = async () => {
    const { data } = await supabase.from('cases').select('*, feedback(*)').eq('patient_id', user.id).order('created_at', { ascending: false })
    setCases(data || [])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const selected = Array.from(e.target.files)
    const valid = selected.filter(f => ['application/pdf', 'image/jpeg', 'image/png'].includes(f.type) && f.size <= 5 * 1024 * 1024)
    if (valid.length !== selected.length) alert('Only PDF, JPG, PNG files under 5MB allowed!')
    setFiles(prev => [...prev, ...valid])
  }

  const removeFile = (index: number) => setFiles(prev => prev.filter((_, i) => i !== index))

  const uploadFiles = async (caseId: string): Promise<string[]> => {
    const urls: string[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setUploadProgress(`Uploading file ${i + 1} of ${files.length}...`)
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${caseId}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('medical-files').upload(path, file)
      if (!error) urls.push(path)
    }
    setUploadProgress('')
    return urls
  }

  const handleSubmit = async () => {
    if (!answers[0].trim()) return
    setLoading(true)
    const caseNumber = 'MC-' + Date.now()
    const { data } = await supabase.from('cases').insert({
      case_number: caseNumber, patient_id: user.id,
      answers: QUESTIONS.map((q, i) => ({ question: q.en, answer: answers[i] }))
    }).select().single()
    if (data) {
      if (files.length > 0) {
        const filePaths = await uploadFiles(data.id)
        await supabase.from('cases').update({ file_paths: filePaths }).eq('id', data.id)
      }
      setNewCaseId(caseNumber); setSubmitted(true); setFiles([]); fetchCases()
    }
    setLoading(false)
  }

  const getFileIcon = (name: string) => {
    if (name.endsWith('.pdf')) return '📄'
    if (name.match(/\.(jpg|jpeg|png)$/i)) return '🖼️'
    return '📎'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>
      <nav style={{ background: '#1a73e8', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: 'white', margin: 0 }}>🏥 MediConnect</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={() => setStep('questions')} style={{ background: step === 'questions' ? 'white' : 'transparent', color: step === 'questions' ? '#1a73e8' : 'white', border: '1px solid white', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer' }}>📝 New Case</button>
          <button onClick={() => { setStep('cases'); fetchCases() }} style={{ background: step === 'cases' ? 'white' : 'transparent', color: step === 'cases' ? '#1a73e8' : 'white', border: '1px solid white', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer' }}>📋 My Cases</button>
          <span style={{ color: 'white' }}>👋 {user.name}</span>
          <button onClick={onLogout} style={{ background: 'white', color: '#1a73e8', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: '800px', margin: '24px auto', padding: '0 16px' }}>
        {step === 'questions' && (
          <div style={{ background: 'white', padding: '28px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: '#1a73e8', margin: 0 }}>📝 Medical Questions</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['en', 'hi', 'hinglish'] as Lang[]).map(l => (
                  <button key={l} onClick={() => setLang(l)} style={{
                    padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px',
                    background: lang === l ? '#1a73e8' : '#f0f0f0', color: lang === l ? 'white' : '#555'
                  }}>{l === 'en' ? '🇬🇧 EN' : l === 'hi' ? '🇮🇳 HI' : '🤝 Hinglish'}</button>
                ))}
              </div>
            </div>

            {submitted ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p style={{ fontSize: '48px' }}>✅</p>
                <h3 style={{ color: '#137333' }}>Case Submitted!</h3>
                <p style={{ color: '#666' }}>Case ID: <strong>{newCaseId}</strong></p>
                <p style={{ color: '#666' }}>Doctor will review soon.</p>
                <button onClick={() => { setSubmitted(false); setAnswers(Array(QUESTIONS.length).fill('')) }} style={{
                  marginTop: '16px', padding: '12px 24px', background: '#1a73e8', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer'
                }}>Submit New Case</button>
              </div>
            ) : (
              <>
                {QUESTIONS.map((q, i) => (
                  <div key={i} style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', color: '#333' }}>{i + 1}. {q[lang]}</label>
                    <input value={answers[i]} onChange={e => { const a = [...answers]; a[i] = e.target.value; setAnswers(a) }}
                      placeholder={lang === 'en' ? 'Your answer...' : lang === 'hi' ? 'आपका जवाब...' : 'Aapka jawab...'}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' as const }} />
                  </div>
                ))}

                <div style={{ marginBottom: '20px', padding: '16px', background: '#f8f9ff', borderRadius: '12px', border: '2px dashed #c7d7fc' }}>
                  <p style={{ fontWeight: 'bold', color: '#333', marginBottom: '10px' }}>
                    📎 Attach Medical Files <span style={{ fontWeight: 'normal', color: '#888', fontSize: '13px' }}>(Optional)</span>
                  </p>
                  <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>PDF reports, X-rays, prescriptions • JPG/PNG/PDF • Max 5MB each</p>
                  {files.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      {files.map((f, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'white', borderRadius: '8px', marginBottom: '6px', border: '1px solid #e0e0e0' }}>
                          <span style={{ fontSize: '14px' }}>{getFileIcon(f.name)} {f.name}<span style={{ color: '#888', fontSize: '12px', marginLeft: '8px' }}>({(f.size / 1024).toFixed(0)} KB)</span></span>
                          <button onClick={() => removeFile(i)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' }}>✕ Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" multiple onChange={handleFileChange} style={{ display: 'none' }} />
                  <button onClick={() => fileInputRef.current?.click()} style={{
                    padding: '10px 20px', background: 'white', color: '#1a73e8',
                    border: '2px solid #1a73e8', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px'
                  }}>+ Add Files</button>
                  {uploadProgress && <p style={{ color: '#1a73e8', fontSize: '13px', marginTop: '8px' }}>⏳ {uploadProgress}</p>}
                </div>

                <button onClick={handleSubmit} disabled={loading} style={{
                  width: '100%', padding: '14px', background: loading ? '#ccc' : '#1a73e8', color: 'white',
                  border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold'
                }}>{loading ? (uploadProgress || 'Submitting...') : 'Submit Case →'}</button>
              </>
            )}
          </div>
        )}

        {step === 'cases' && (
          <div>
            <h3 style={{ marginBottom: '16px' }}>📋 My Cases ({cases.length})</h3>
            {cases.length === 0 && <p style={{ color: '#666' }}>No cases yet. Submit your first case!</p>}
            {cases.map((c: any) => (
              <div key={c.id} style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold', color: '#1a73e8' }}>#{c.case_number}</span>
                  <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold',
                    background: c.status === 'reviewed' ? '#e6f4ea' : '#fef3cd',
                    color: c.status === 'reviewed' ? '#137333' : '#856404' }}>
                    {c.status === 'reviewed' ? '✅ Reviewed' : '⏳ Pending'}
                  </span>
                </div>
                <p style={{ color: '#555', fontSize: '14px' }}>Submitted: {new Date(c.created_at).toLocaleDateString()}</p>
                {c.file_paths && c.file_paths.length > 0 && <p style={{ color: '#888', fontSize: '13px' }}>📎 {c.file_paths.length} file(s) attached</p>}
                {c.feedback && c.feedback.length > 0 && (
                  <div style={{ background: '#e8f0fe', padding: '12px', borderRadius: '8px', marginTop: '8px' }}>
                    <p style={{ color: '#1a73e8', fontWeight: 'bold', marginBottom: '4px' }}>👨‍⚕️ Doctor's Reply:</p>
                    <p style={{ color: '#333', margin: 0 }}>{c.feedback[0].message}</p>
                  </div>
                )}
                <button onClick={() => setChatCase(chatCase?.id === c.id ? null : c)} style={{
                  marginTop: '10px', padding: '8px 16px', background: '#1a73e8', color: 'white',
                  border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'
                }}>
                  💬 {chatCase?.id === c.id ? 'Close Chat' : 'Chat with Doctor'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {chatCase && <ChatBox caseId={chatCase.id} caseNumber={chatCase.case_number} user={user} onClose={() => setChatCase(null)} />}
    </div>
  )
}

// =================== DOCTOR ===================
function DoctorDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [cases, setCases] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [fileUrls, setFileUrls] = useState<{ name: string; url: string }[]>([])
  const [chatCase, setChatCase] = useState<any | null>(null)

  useEffect(() => { fetchCases() }, [])

  const fetchCases = async () => {
    const { data } = await supabase.from('cases').select('*, profiles!cases_patient_id_fkey(name, email), feedback(*)').order('created_at', { ascending: false })
    setCases(data || [])
  }

  const loadFileUrls = async (filePaths: string[]) => {
    const urls = await Promise.all(filePaths.map(async (path) => {
      const { data } = await supabase.storage.from('medical-files').createSignedUrl(path, 3600)
      const name = path.split('/').pop() || path
      return { name, url: data?.signedUrl || '' }
    }))
    setFileUrls(urls.filter(u => u.url))
  }

  const handleReply = async () => {
    if (!reply.trim() || !selected) return
    setLoading(true)
    await supabase.from('feedback').insert({ case_id: selected.id, doctor_id: user.id, message: reply })
    await supabase.from('cases').update({ status: 'reviewed' }).eq('id', selected.id)
    await supabase.from('notifications').insert({
      user_id: selected.patient_id, title: 'Doctor replied to your case',
      message: `Case #${selected.case_number}: ${reply.substring(0, 50)}...`
    })
    setSent(true); fetchCases(); setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>
      <nav style={{ background: '#0d9488', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: 'white', margin: 0 }}>🏥 MediConnect</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: 'white' }}>👨‍⚕️ {user.name}</span>
          <button onClick={onLogout} style={{ background: 'white', color: '#0d9488', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: '900px', margin: '24px auto', padding: '0 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Cases', value: cases.length, color: '#1a73e8' },
            { label: 'Pending', value: cases.filter(c => c.status === 'pending').length, color: '#f59e0b' },
            { label: 'Reviewed', value: cases.filter(c => c.status === 'reviewed').length, color: '#10b981' }
          ].map(s => (
            <div key={s.label} style={{ background: 'white', padding: '20px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: s.color, margin: 0 }}>{s.value}</p>
              <p style={{ color: '#666', margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>

        <h3 style={{ marginBottom: '16px' }}>Patient Cases</h3>
        {cases.length === 0 && <p style={{ color: '#666' }}>No cases yet!</p>}
        {cases.map((c: any) => (
          <div key={c.id} style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 'bold', color: '#0d9488' }}>#{c.case_number}</span>
                <span style={{ margin: '0 8px', color: '#ddd' }}>|</span>
                <span style={{ fontWeight: 'bold' }}>{c.profiles?.name}</span>
                <span style={{ color: '#666', fontSize: '13px', marginLeft: '8px' }}>{c.profiles?.email}</span>
                {c.file_paths && c.file_paths.length > 0 && (
                  <span style={{ marginLeft: '8px', fontSize: '12px', color: '#1a73e8', background: '#e8f0fe', padding: '2px 8px', borderRadius: '10px' }}>📎 {c.file_paths.length} file(s)</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold',
                  background: c.status === 'reviewed' ? '#e6f4ea' : '#fef3cd',
                  color: c.status === 'reviewed' ? '#137333' : '#856404' }}>
                  {c.status === 'reviewed' ? '✅ Reviewed' : '⏳ Pending'}
                </span>
                <button onClick={() => {
                  if (selected?.id === c.id) { setSelected(null); setFileUrls([]) }
                  else { setSelected(c); setSent(false); setReply(''); if (c.file_paths?.length > 0) loadFileUrls(c.file_paths); else setFileUrls([]) }
                }} style={{ padding: '8px 16px', background: '#0d9488', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                  View & Reply
                </button>
                <button onClick={() => setChatCase(chatCase?.id === c.id ? null : c)} style={{
                  padding: '8px 16px', background: '#1a73e8', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                }}>💬 Chat</button>
              </div>
            </div>

            {selected?.id === c.id && (
              <div style={{ marginTop: '16px', padding: '16px', background: '#f0fdf9', borderRadius: '8px' }}>
                <h4 style={{ color: '#0d9488', marginBottom: '12px' }}>Patient's Answers:</h4>
                {c.answers?.map((a: any, i: number) => (
                  <div key={i} style={{ marginBottom: '8px', padding: '8px', background: 'white', borderRadius: '6px' }}>
                    <p style={{ fontWeight: 'bold', margin: '0 0 4px', fontSize: '13px', color: '#555' }}>{a.question}</p>
                    <p style={{ margin: 0, color: '#333' }}>{a.answer || 'Not answered'}</p>
                  </div>
                ))}
                {fileUrls.length > 0 && (
                  <div style={{ marginTop: '12px', padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #d1fae5' }}>
                    <p style={{ fontWeight: 'bold', color: '#0d9488', marginBottom: '10px' }}>📎 Attached Files:</p>
                    {fileUrls.map((f, i) => (
                      <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px', marginRight: '10px', marginBottom: '8px',
                        padding: '8px 14px', background: '#e0f2f1', color: '#0d9488', borderRadius: '8px',
                        textDecoration: 'none', fontSize: '14px', fontWeight: 'bold'
                      }}>{f.name.endsWith('.pdf') ? '📄' : '🖼️'} {f.name}</a>
                    ))}
                  </div>
                )}
                <textarea placeholder="Write prescription or reply..." value={reply} onChange={e => setReply(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', height: '80px', boxSizing: 'border-box' as const, marginTop: '12px' }} />
                <button onClick={handleReply} disabled={loading} style={{
                  marginTop: '8px', padding: '10px 20px', background: loading ? '#ccc' : '#0d9488', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer'
                }}>{loading ? 'Sending...' : 'Send Reply ✉️'}</button>
                {sent && <span style={{ marginLeft: '12px', color: 'green', fontWeight: 'bold' }}>✅ Reply sent!</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      {chatCase && <ChatBox caseId={chatCase.id} caseNumber={chatCase.case_number} user={user} onClose={() => setChatCase(null)} />}
    </div>
  )
}

// =================== ADMIN ===================
function AdminDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [users, setUsers] = useState<any[]>([])
  const [cases, setCases] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'cases'>('overview')
  const [searchUser, setSearchUser] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [selectedCase, setSelectedCase] = useState<any | null>(null)

  useEffect(() => { fetchUsers(); fetchCases() }, [])

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers(data || [])
  }

  const fetchCases = async () => {
    const { data } = await supabase.from('cases').select('*, profiles!cases_patient_id_fkey(name, email), feedback(*)').order('created_at', { ascending: false })
    setCases(data || [])
  }

  const toggleBlock = async (u: any) => {
    await supabase.from('profiles').update({ blocked: !u.blocked }).eq('id', u.id)
    fetchUsers()
  }

  const filteredUsers = users.filter(u => {
    const matchSearch = u.name?.toLowerCase().includes(searchUser.toLowerCase()) || u.email?.toLowerCase().includes(searchUser.toLowerCase())
    const matchRole = filterRole === 'all' || u.role === filterRole
    return matchSearch && matchRole
  })

  // Daily cases for last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toLocaleDateString('en', { weekday: 'short' })
  })
  const casesPerDay = last7Days.map((_day, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return cases.filter(c => new Date(c.created_at).toDateString() === d.toDateString()).length
  })
  const maxCases = Math.max(...casesPerDay, 1)

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>
      <nav style={{ background: '#7c3aed', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: 'white', margin: 0 }}>🏥 MediConnect Admin</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Tab Buttons */}
          {[
            { key: 'overview', label: '📊 Overview' },
            { key: 'users', label: '👥 Users' },
            { key: 'cases', label: '📋 Cases' },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key as any)} style={{
              padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px',
              background: activeTab === t.key ? 'white' : 'rgba(255,255,255,0.2)',
              color: activeTab === t.key ? '#7c3aed' : 'white'
            }}>{t.label}</button>
          ))}
          <span style={{ color: 'white', marginLeft: '8px' }}>👨‍💼 {user.name}</span>
          <button onClick={onLogout} style={{ background: 'white', color: '#7c3aed', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '24px auto', padding: '0 16px' }}>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '14px', marginBottom: '24px' }}>
              {[
                { label: 'Total Users', value: users.length, color: '#1a73e8', icon: '👥' },
                { label: 'Doctors', value: users.filter(u => u.role === 'doctor').length, color: '#0d9488', icon: '👨‍⚕️' },
                { label: 'Patients', value: users.filter(u => u.role === 'patient').length, color: '#8b5cf6', icon: '🧑' },
                { label: 'Total Cases', value: cases.length, color: '#f59e0b', icon: '📋' },
                { label: 'Reviewed', value: cases.filter(c => c.status === 'reviewed').length, color: '#10b981', icon: '✅' },
              ].map(s => (
                <div key={s.label} style={{ background: 'white', padding: '16px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <p style={{ fontSize: '24px', margin: '0 0 4px' }}>{s.icon}</p>
                  <p style={{ fontSize: '28px', fontWeight: 'bold', color: s.color, margin: 0 }}>{s.value}</p>
                  <p style={{ color: '#666', margin: 0, fontSize: '12px' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Cases Chart */}
            <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
              <h3 style={{ color: '#7c3aed', marginBottom: '20px' }}>📈 Cases - Last 7 Days</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '150px' }}>
                {casesPerDay.map((count, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#7c3aed' }}>{count}</span>
                    <div style={{
                      width: '100%', borderRadius: '6px 6px 0 0',
                      background: count > 0 ? '#7c3aed' : '#e9d5ff',
                      height: `${Math.max((count / maxCases) * 120, count > 0 ? 8 : 4)}px`
                    }} />
                    <span style={{ fontSize: '11px', color: '#666' }}>{last7Days[i]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
                <h4 style={{ color: '#7c3aed', marginBottom: '12px' }}>🔴 Pending Cases</h4>
                {cases.filter(c => c.status === 'pending').slice(0, 4).map((c: any) => (
                  <div key={c.id} style={{ padding: '8px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold' }}>#{c.case_number}</span>
                    <span style={{ fontSize: '12px', color: '#666' }}>{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
                {cases.filter(c => c.status === 'pending').length === 0 && <p style={{ color: '#888', fontSize: '13px' }}>No pending cases! 🎉</p>}
              </div>
              <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
                <h4 style={{ color: '#0d9488', marginBottom: '12px' }}>👨‍⚕️ Active Doctors</h4>
                {users.filter(u => u.role === 'doctor' && !u.blocked).map((u: any) => (
                  <div key={u.id} style={{ padding: '8px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{u.name}</span>
                    <span style={{ fontSize: '12px', color: '#0d9488' }}>{u.specialization || 'General'}</span>
                  </div>
                ))}
                {users.filter(u => u.role === 'doctor').length === 0 && <p style={{ color: '#888', fontSize: '13px' }}>No doctors yet!</p>}
              </div>
            </div>
          </div>
        )}

        {/* ── USERS TAB ── */}
        {activeTab === 'users' && (
          <div>
            {/* Search & Filter */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <input
                placeholder="🔍 Search by name or email..."
                value={searchUser}
                onChange={e => setSearchUser(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}
              />
              {['all', 'doctor', 'patient', 'admin'].map(r => (
                <button key={r} onClick={() => setFilterRole(r)} style={{
                  padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px',
                  background: filterRole === r ? '#7c3aed' : '#e9d5ff', color: filterRole === r ? 'white' : '#7c3aed'
                }}>{r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}</button>
              ))}
            </div>

            <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
              <h3 style={{ marginBottom: '16px', color: '#7c3aed' }}>👥 User Management ({filteredUsers.length})</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    {['Name', 'Role', 'Email', 'Joined', 'Status', 'Action'].map(h => (
                      <th key={h} style={{ padding: '12px', textAlign: 'left', fontSize: '14px', color: '#666' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u: any) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f0f0f0', opacity: u.blocked ? 0.6 : 1 }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{u.name}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px',
                          background: u.role === 'doctor' ? '#e0f2f1' : u.role === 'admin' ? '#ede9fe' : '#fef3cd',
                          color: u.role === 'doctor' ? '#0d9488' : u.role === 'admin' ? '#7c3aed' : '#856404' }}>{u.role}</span>
                      </td>
                      <td style={{ padding: '12px', color: '#666', fontSize: '14px' }}>{u.email}</td>
                      <td style={{ padding: '12px', color: '#888', fontSize: '13px' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold',
                          background: u.blocked ? '#fee2e2' : '#e6f4ea', color: u.blocked ? '#dc2626' : '#137333' }}>
                          {u.blocked ? '🚫 Blocked' : '✅ Active'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button onClick={() => toggleBlock(u)} style={{
                          padding: '6px 14px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
                          background: u.blocked ? '#e6f4ea' : '#fee2e2', color: u.blocked ? '#137333' : '#dc2626'
                        }}>{u.blocked ? 'Unblock' : 'Block'}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>No users found!</p>}
            </div>
          </div>
        )}

        {/* ── CASES TAB ── */}
        {activeTab === 'cases' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>📋 All Cases ({cases.length})</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ padding: '6px 14px', borderRadius: '20px', background: '#fef3cd', color: '#856404', fontSize: '13px', fontWeight: 'bold' }}>
                  ⏳ Pending: {cases.filter(c => c.status === 'pending').length}
                </span>
                <span style={{ padding: '6px 14px', borderRadius: '20px', background: '#e6f4ea', color: '#137333', fontSize: '13px', fontWeight: 'bold' }}>
                  ✅ Reviewed: {cases.filter(c => c.status === 'reviewed').length}
                </span>
              </div>
            </div>

            {cases.map((c: any) => (
              <div key={c.id} style={{ background: 'white', padding: '16px', borderRadius: '12px', marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 'bold', color: '#7c3aed' }}>#{c.case_number}</span>
                    <span style={{ margin: '0 8px', color: '#ddd' }}>|</span>
                    <span style={{ fontWeight: 'bold' }}>{c.profiles?.name}</span>
                    <span style={{ color: '#666', fontSize: '13px', marginLeft: '8px' }}>{c.profiles?.email}</span>
                    <span style={{ color: '#888', fontSize: '12px', marginLeft: '8px' }}>{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold',
                      background: c.status === 'reviewed' ? '#e6f4ea' : '#fef3cd',
                      color: c.status === 'reviewed' ? '#137333' : '#856404' }}>
                      {c.status === 'reviewed' ? '✅ Reviewed' : '⏳ Pending'}
                    </span>
                    <button onClick={() => setSelectedCase(selectedCase?.id === c.id ? null : c)} style={{
                      padding: '6px 14px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px'
                    }}>👁️ View</button>
                  </div>
                </div>

                {selectedCase?.id === c.id && (
                  <div style={{ marginTop: '12px', padding: '12px', background: '#faf5ff', borderRadius: '8px' }}>
                    <h4 style={{ color: '#7c3aed', marginBottom: '10px' }}>Patient's Answers:</h4>
                    {c.answers?.map((a: any, i: number) => (
                      <div key={i} style={{ marginBottom: '6px', padding: '8px', background: 'white', borderRadius: '6px' }}>
                        <p style={{ fontWeight: 'bold', margin: '0 0 2px', fontSize: '12px', color: '#555' }}>{a.question}</p>
                        <p style={{ margin: 0, color: '#333', fontSize: '13px' }}>{a.answer || 'Not answered'}</p>
                      </div>
                    ))}
                    {c.feedback && c.feedback.length > 0 && (
                      <div style={{ marginTop: '10px', padding: '10px', background: '#e0f2f1', borderRadius: '8px' }}>
                        <p style={{ fontWeight: 'bold', color: '#0d9488', marginBottom: '4px', fontSize: '13px' }}>👨‍⚕️ Doctor's Reply:</p>
                        <p style={{ margin: 0, fontSize: '13px' }}>{c.feedback[0].message}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {cases.length === 0 && <p style={{ textAlign: 'center', color: '#888' }}>No cases yet!</p>}
          </div>
        )}
      </div>
    </div>
  )
}

// =================== MAIN ===================
export default function App() {
  const [user, setUser] = useState<User | null>(null)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  if (!user) return <Login onLogin={setUser} />
  if (user.role === 'patient') return <PatientDashboard user={user} onLogout={handleLogout} />
  if (user.role === 'doctor') return <DoctorDashboard user={user} onLogout={handleLogout} />
  return <AdminDashboard user={user} onLogout={handleLogout} />
}
