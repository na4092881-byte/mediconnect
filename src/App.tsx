import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'
import './index.css'

type Role = 'patient' | 'doctor' | 'admin'
type User = { id: string; name: string; email: string; role: Role }

const QUESTIONS = [
  { en: "Do you have history of cough?", hi: "क्या आपको खांसी का इतिहास है?", hinglish: "Kya aapko khansi ki history hai?" },
  { en: "Do you have expectoration?", hi: "क्या आपको बलगम आता है?", hinglish: "Kya aapko balgam aata hai?" },
  { en: "Do you feel breathless on climbing two flights of stairs?", hi: "क्या दो मंजिल सीढ़ियाँ चढ़ने पर सांस फूलती है?", hinglish: "Kya do floor seedhiyan chadhne par saans phoolti hai?" },
  { en: "Can you perform your daily routine work without getting breathless?", hi: "क्या आप बिना सांस फूले अपना रोज़ का काम कर सकते हैं?", hinglish: "Kya aap bina saans phoole apna daily kaam kar sakte hain?" },
  { en: "Do you have history of chest pain?", hi: "क्या आपको सीने में दर्द का इतिहास है?", hinglish: "Kya aapko chest pain ki history hai?" },
  { en: "Do you have increased BP (Hypertension)?", hi: "क्या आपको हाई ब्लड प्रेशर है?", hinglish: "Kya aapko high BP hai?" },
  { en: "Do you have swelling in the body?", hi: "क्या शरीर में सूजन है?", hinglish: "Kya sharir mein swelling hai?" },
  { en: "Do you smoke?", hi: "क्या आप धूम्रपान करते हैं?", hinglish: "Kya aap smoking karte ho?" },
  { en: "Do you consume alcohol?", hi: "क्या आप शराब पीते हैं?", hinglish: "Kya aap alcohol lete ho?" },
  { en: "Did you have jaundice?", hi: "क्या आपको पीलिया हुआ था?", hinglish: "Kya aapko jaundice hua tha?" },
  { en: "Do you have history of high blood sugar (Diabetes)?", hi: "क्या आपको डायबिटीज है?", hinglish: "Kya aapko diabetes hai?" },
  { en: "Do you have history of thyroid disease?", hi: "क्या आपको थायरॉइड की बीमारी है?", hinglish: "Kya aapko thyroid ki problem hai?" },
  { en: "Do you have any history of having fits?", hi: "क्या आपको दौरे पड़ने का इतिहास है?", hinglish: "Kya aapko fits ki history hai?" },
  { en: "Do you have history of fainting?", hi: "क्या बेहोशी का इतिहास है?", hinglish: "Kya aapko faint hone ki history hai?" },
  { en: "Do you snore while sleeping?", hi: "क्या सोते समय खर्राटे आते हैं?", hinglish: "Kya aap sote waqt kharate lete ho?" },
  { en: "Is there any history of previous hospitalisation?", hi: "क्या पहले कभी अस्पताल में भर्ती हुए हैं?", hinglish: "Kya pehle kabhi hospital me admit hue ho?" },
  { en: "Is there any history of blood transfusion?", hi: "क्या कभी खून चढ़ाया गया है?", hinglish: "Kya kabhi blood chadhaya gaya hai?" },
  { en: "Is there any history of drug/medicine intake?", hi: "क्या कोई दवा चल रही है?", hinglish: "Kya koi medicine chal rahi hai?" },
  { en: "Are you on any treatment?", hi: "क्या आपका कोई इलाज चल रहा है?", hinglish: "Kya aapka koi treatment chal raha hai?" },
  { en: "Is there any history of palpitation?", hi: "क्या दिल की धड़कन तेज होने की शिकायत है?", hinglish: "Kya dil ki dhadkan tez hone ki problem hai?" },
  { en: "Is there any history of heart attack?", hi: "क्या हार्ट अटैक का इतिहास है?", hinglish: "Kya heart attack ki history hai?" }
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

// =================== NOTIFICATION BELL ===================
function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    fetchNotifications()
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications').select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
    setNotifications(data || [])
  }

  const markAllRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', position: 'relative' }}
      >
        <span style={{ fontSize: '18px' }}>🔔</span>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px',
            background: '#ef4444', color: 'white', borderRadius: '50%',
            width: '18px', height: '18px', fontSize: '10px', fontWeight: 'bold',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div style={{
          position: 'absolute', top: '44px', right: 0, width: '320px',
          background: 'white', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          zIndex: 999, overflow: 'hidden'
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', color: '#1e293b' }}>🔔 Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ fontSize: '12px', color: '#1a73e8', background: 'none', border: 'none', cursor: 'pointer' }}>
                Mark all read
              </button>
            )}
          </div>
          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {notifications.length === 0 && (
              <p style={{ textAlign: 'center', color: '#888', padding: '24px', fontSize: '14px' }}>No notifications yet!</p>
            )}
            {notifications.map((n: any) => (
              <div key={n.id} style={{
                padding: '12px 16px', borderBottom: '1px solid #f8f8f8',
                background: n.is_read ? 'white' : '#eff6ff',
                cursor: 'pointer'
              }}>
                <p style={{ margin: '0 0 4px', fontWeight: 'bold', fontSize: '13px', color: '#1e293b' }}>{n.title}</p>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#555' }}>{n.message}</p>
                <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{new Date(n.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showDropdown && (
        <div onClick={() => setShowDropdown(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
      )}
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) { setError('Please enter a valid email address!'); setLoading(false); return }
    if (name.trim().length < 2) { setError('Please enter your full name!'); setLoading(false); return }
    if (password.length < 6) { setError('Password must be at least 6 characters!'); setLoading(false); return }
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { emailRedirectTo: window.location.origin }
    })
    if (error) { setError(error.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id, name: name.trim(), email, role,
        specialization: role === 'doctor' ? specialization : null
      })
      if (data.user.identities?.length === 0) {
        setError('This email is already registered! Please login.')
      } else if (!data.session) {
        setMsg('✅ Account created! Please check your email to verify, then login.')
      } else {
        setMsg('✅ Account created! Please login now.')
      }
      setIsRegister(false)
    }
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg, #0A1628, #0F2241)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 4px 20px rgba(10,22,40,0.2)' }}>
            <span style={{ fontSize: '28px' }}>🏥</span>
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', color: '#0A1628', marginBottom: '4px' }}>MediConnect</h1>
          <p style={{ color: '#94A3B8', fontSize: '14px' }}>Bridging doctors and patients</p>
        </div>
        {msg && (
          <div style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', color: '#065F46', fontSize: '14px', fontWeight: '500' }}>
            ✅ {msg}
          </div>
        )}
        <p style={{ fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>I am a</p>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {(['patient', 'doctor', 'admin'] as Role[]).map(r => (
            <button key={r} onClick={() => setRole(r)} className={`role-btn ${role === r ? 'active' : ''}`}>
              {r === 'patient' ? '🧑 Patient' : r === 'doctor' ? '👨‍⚕️ Doctor' : '👨‍💼 Admin'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          {isRegister && (
            <input className="input-field" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
          )}
          {isRegister && role === 'doctor' && (
            <input className="input-field" placeholder="Specialization (e.g. General Physician)" value={specialization} onChange={e => setSpecialization(e.target.value)} />
          )}
          <input className="input-field" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} />
          <input className="input-field" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        {error && (
          <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px', color: '#991B1B', fontSize: '13px' }}>
            ⚠️ {error}
          </div>
        )}
        <button onClick={isRegister ? handleRegister : handleLogin} disabled={loading} className="btn-navy" style={{ marginBottom: '16px' }}>
          {loading ? '⏳ Please wait...' : isRegister ? 'Create Account →' : 'Sign In →'}
        </button>
        <p style={{ textAlign: 'center', fontSize: '14px', color: '#94A3B8' }}>
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <span onClick={() => { setIsRegister(!isRegister); setError('') }} style={{ color: '#0D9488', cursor: 'pointer', fontWeight: '600' }}>
            {isRegister ? 'Sign In' : 'Register'}
          </span>
        </p>
      </div>
    </div>
  )
}

// =================== PATIENT HOME ===================
function PatientHome({ user, cases, records, onNavigate }: {
  user: any; cases: any[]; records: any[]; onNavigate: (step: string) => void;
}) {
  const pendingCases = cases.filter((c: any) => c.status !== 'reviewed').length
  const recentCase = cases[0]
  const recentRecord = records[0]
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? '🌅 Good Morning' : hour < 17 ? '☀️ Good Afternoon' : '🌙 Good Evening'

  return (
    <div style={{ padding: '20px 0' }}>
      <div style={{
        background: 'linear-gradient(135deg, #0A1628 0%, #0F2241 50%, #0d9488 100%)',
        borderRadius: '20px', padding: '28px 24px', marginBottom: '24px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -20, right: 40, width: 90, height: 90, borderRadius: '50%', background: 'rgba(13,148,136,0.3)' }} />
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '6px' }}>{greeting}</p>
        <h2 style={{ color: 'white', fontSize: '24px', margin: '0 0 6px', fontFamily: 'DM Serif Display, serif' }}>{user.name} 👋</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: 0 }}>Welcome to your health dashboard</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total Cases', value: cases.length, icon: '📋', color: '#3B82F6' },
          { label: 'Pending', value: pendingCases, icon: '⏳', color: '#F59E0B' },
          { label: 'Records', value: records.length, icon: '🏥', color: '#10B981' },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ textAlign: 'center', padding: '16px 10px' }}>
            <div style={{ fontSize: '26px', marginBottom: '6px' }}>{s.icon}</div>
            <div style={{ fontSize: '26px', fontWeight: '700', color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', fontWeight: '500' }}>{s.label}</div>
          </div>
        ))}
      </div>
      <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#0A1628', marginBottom: '12px' }}>Quick Actions</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        {[
          { icon: '📝', label: 'New Case', desc: 'Submit symptoms', color: '#0d9488', step: 'questions' },
          { icon: '📋', label: 'My Cases', desc: `${cases.length} total`, color: '#3B82F6', step: 'cases' },
          { icon: '🏥', label: 'Records', desc: `${records.length} records`, color: '#8B5CF6', step: 'records' },
          { icon: '💬', label: 'Chat Doctor', desc: 'Open cases', color: '#F59E0B', step: 'cases' },
          { icon: '🏥', label: 'Find by Specialty', desc: 'Specialty wise doctor', color: '#0d9488', step: 'specialty' },
        ].map((a, i) => (
          <button key={i} onClick={() => onNavigate(a.step)} style={{
            background: 'white', border: `2px solid ${a.color}20`, borderRadius: '14px',
            padding: '16px 14px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{a.icon}</div>
            <div style={{ fontWeight: '600', color: '#0A1628', fontSize: '14px' }}>{a.label}</div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>{a.desc}</div>
          </button>
        ))}
      </div>
      {recentCase && (
        <>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#0A1628', marginBottom: '12px' }}>Recent Activity</h3>
          <div style={{ background: 'white', borderRadius: '14px', padding: '16px', marginBottom: '12px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: '600', color: '#3B82F6', fontSize: '14px' }}>📋 #{recentCase.case_number}</span>
              <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                background: recentCase.status === 'reviewed' ? '#D1FAE5' : '#FEF3C7',
                color: recentCase.status === 'reviewed' ? '#065F46' : '#92400E' }}>
                {recentCase.status === 'reviewed' ? '✅ Reviewed' : '⏳ Pending'}
              </span>
            </div>
            <p style={{ color: '#64748B', fontSize: '13px', margin: '0 0 10px' }}>
              Submitted: {new Date(recentCase.created_at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
            {recentCase.feedback?.length > 0 && (
              <div style={{ background: '#EFF6FF', padding: '10px 12px', borderRadius: '10px', borderLeft: '3px solid #3B82F6' }}>
                <p style={{ color: '#3B82F6', fontWeight: '600', fontSize: '12px', margin: '0 0 4px' }}>👨‍⚕️ Doctor's Reply:</p>
                <p style={{ color: '#333', fontSize: '13px', margin: 0 }}>{recentCase.feedback[0].message}</p>
              </div>
            )}
            <button onClick={() => onNavigate('cases')} style={{
              marginTop: '12px', padding: '8px 16px', background: '#0d9488', color: 'white',
              border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600'
            }}>View All Cases →</button>
          </div>
        </>
      )}
      {recentRecord && (
        <div style={{ background: 'white', borderRadius: '14px', padding: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: '600', color: '#8B5CF6', fontSize: '14px' }}>🏥 Latest Medical Record</span>
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>{new Date(recentRecord.created_at).toLocaleDateString()}</span>
          </div>
          {recentRecord.diagnosis && (
            <p style={{ color: '#333', fontSize: '13px', margin: '0 0 8px' }}>🔍 {recentRecord.diagnosis}</p>
          )}
          <p style={{ color: '#64748B', fontSize: '12px', margin: 0 }}>
            👨‍⚕️ Dr. {recentRecord.profiles?.name} {recentRecord.profiles?.specialization ? `— ${recentRecord.profiles.specialization}` : ''}
          </p>
          <button onClick={() => onNavigate('records')} style={{
            marginTop: '12px', padding: '8px 16px', background: '#8B5CF6', color: 'white',
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600'
          }}>View All Records →</button>
        </div>
      )}
      {cases.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🏥</div>
          <p style={{ fontWeight: '600', color: '#0A1628', marginBottom: '8px' }}>No cases yet!</p>
          <p>Submit your first case to get started</p>
          <button onClick={() => onNavigate('questions')} style={{
            marginTop: '16px', padding: '12px 24px', background: '#0d9488', color: 'white',
            border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px'
          }}>+ Submit First Case</button>
        </div>
      )}
    </div>
  )
}

// =================== DOCTOR HOME ===================
function DoctorHome({ user, cases, onNavigate }: {
  user: User
  cases: any[]
  onNavigate: (step: 'home' | 'cases') => void
}) {
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? '🌅 Good Morning' : hour < 17 ? '☀️ Good Afternoon' : '🌙 Good Evening'
  const pending = cases.filter(c => c.status !== 'reviewed').length
  const reviewed = cases.filter(c => c.status === 'reviewed').length
  const today = cases.filter(c => new Date(c.created_at).toDateString() === now.toDateString()).length
  const recentCases = cases.slice(0, 3)

  return (
    <div style={{ padding: '20px 0' }}>
      <div style={{
        background: 'linear-gradient(135deg, #0A1628 0%, #0F2241 55%, #0d9488 100%)',
        borderRadius: '20px', padding: '28px 24px', marginBottom: '24px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -20, right: 40, width: 90, height: 90, borderRadius: '50%', background: 'rgba(13,148,136,0.3)' }} />
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '6px' }}>{greeting}, Doctor</p>
        <h2 style={{ color: 'white', fontSize: '24px', margin: '0 0 8px', fontFamily: 'DM Serif Display, serif' }}>
          Dr. {user.name} 👨‍⚕️
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: 0 }}>
          {pending > 0 ? `${pending} patient case${pending > 1 ? 's' : ''} waiting for your review` : 'All cases are up to date ✅'}
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total Cases', value: cases.length, icon: '📋', color: '#3B82F6' },
          { label: 'Pending', value: pending, icon: '⏳', color: '#F59E0B' },
          { label: 'Reviewed', value: reviewed, icon: '✅', color: '#10B981' },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ textAlign: 'center', padding: '16px 10px' }}>
            <div style={{ fontSize: '24px', marginBottom: '6px' }}>{s.icon}</div>
            <div style={{ fontSize: '26px', fontWeight: '700', color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', fontWeight: '500' }}>{s.label}</div>
          </div>
        ))}
      </div>
      {today > 0 && (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '14px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '22px' }}>📅</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: '600', color: '#1D4ED8', margin: 0, fontSize: '14px' }}>{today} new case{today > 1 ? 's' : ''} today</p>
            <p style={{ color: '#3B82F6', fontSize: '12px', margin: 0 }}>Submitted in the last 24 hours</p>
          </div>
          <button onClick={() => onNavigate('cases')} style={{ padding: '8px 16px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Review →</button>
        </div>
      )}
      <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#0A1628', marginBottom: '12px' }}>Quick Actions</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        {[
          { icon: '📋', label: 'All Cases', desc: `${cases.length} total`, color: '#0d9488' },
          { icon: '⏳', label: 'Pending Review', desc: `${pending} waiting`, color: '#F59E0B' },
        ].map((a, i) => (
          <button key={i} onClick={() => onNavigate('cases')} style={{
            background: 'white', border: `2px solid ${a.color}25`, borderRadius: '14px',
            padding: '18px 14px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <div style={{ fontSize: '26px', marginBottom: '8px' }}>{a.icon}</div>
            <div style={{ fontWeight: '600', color: '#0A1628', fontSize: '14px' }}>{a.label}</div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '3px' }}>{a.desc}</div>
          </button>
        ))}
      </div>
      {recentCases.length > 0 && (
        <>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#0A1628', marginBottom: '12px' }}>Recent Cases</h3>
          {recentCases.map((c: any) => (
            <div key={c.id} style={{ background: 'white', borderRadius: '14px', padding: '14px 16px', marginBottom: '10px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: '600', color: '#0d9488', fontSize: '14px' }}>#{c.case_number}</span>
                  <span style={{ marginLeft: '10px', color: '#0A1628', fontSize: '14px', fontWeight: '500' }}>{c.profiles?.name}</span>
                </div>
                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                  background: c.status === 'reviewed' ? '#D1FAE5' : '#FEF3C7',
                  color: c.status === 'reviewed' ? '#065F46' : '#92400E' }}>
                  {c.status === 'reviewed' ? '✅ Reviewed' : '⏳ Pending'}
                </span>
              </div>
              <p style={{ color: '#94A3B8', fontSize: '12px', margin: '6px 0 0' }}>
                {new Date(c.created_at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          ))}
          <button onClick={() => onNavigate('cases')} style={{ width: '100%', padding: '13px', background: 'transparent', color: '#0d9488', border: '2px dashed #0d948850', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>View All Cases →</button>
        </>
      )}
      {cases.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🏥</div>
          <p style={{ fontWeight: '600', color: '#0A1628', marginBottom: '8px' }}>No cases assigned yet</p>
          <p>Patients will appear here once they select you as their doctor</p>
        </div>
      )}
    </div>
  )
}

// =================== PATIENT ===================
function PatientDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [lang, setLang] = useState<Lang>('en')
  const [answers, setAnswers] = useState<string[]>(Array(QUESTIONS.length).fill(''))
 const [step, setStep] = useState<'home' | 'questions' | 'cases' | 'records' | 'specialty'>('home')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cases, setCases] = useState<any[]>([])
  const [newCaseId, setNewCaseId] = useState('')
  const [chatCase, setChatCase] = useState<any | null>(null)
  const [records, setRecords] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchCases(); fetchRecords(); fetchDoctors() }, [])

  const fetchDoctors = async () => {
    const { data } = await supabase.from('profiles').select('id, name, specialization').eq('role', 'doctor')
    setDoctors(data || [])
  }
  const fetchCases = async () => {
    const { data } = await supabase.from('cases').select('*, feedback(*)').eq('patient_id', user.id).order('created_at', { ascending: false })
    setCases(data || [])
  }
  const fetchRecords = async () => {
    const { data } = await supabase.from('medical_records').select('*, profiles!medical_records_doctor_id_fkey(name, specialization)').eq('patient_id', user.id).order('created_at', { ascending: false })
    setRecords(data || [])
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
      doctor_id: selectedDoctorId || null,
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
    <div style={{ minHeight: '100vh', background: 'var(--off-white)' }}>
      <nav className="nav-main">
        <div className="nav-logo"><span>🏥</span> MediConnect</div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setStep('home')} className={`nav-btn ${step === 'home' ? 'active' : ''}`}>🏠 Home</button>
          <button onClick={() => { setStep('cases'); fetchCases() }} className={`nav-btn ${step === 'cases' ? 'active' : ''}`}>📋 Cases</button>
          <button onClick={() => { setStep('records'); fetchRecords() }} className={`nav-btn ${step === 'records' ? 'active' : ''}`}>🏥 Records</button>
          <NotificationBell userId={user.id} />
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>👋 {user.name}</span>
          <button onClick={onLogout} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: '800px', margin: '20px auto', padding: '0 12px' }}>
        {step === 'home' && <PatientHome user={user} cases={cases} records={records} onNavigate={(s) => setStep(s as any)} />}
          {step === 'specialty' && (
          <div style={{ background: 'white', padding: '28px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <button onClick={() => setStep('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>←</button>
              <h3 style={{ color: '#0A1628', margin: 0 }}>🏥 Select Specialty</h3>
            </div>
            {!selectedSpecialty ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {[
                  { id: 'general',       name: 'General Physician', icon: '🩺', desc: 'Fever, cold, checkup' },
                  { id: 'cardiology',    name: 'Cardiology',        icon: '❤️', desc: 'Heart & BP' },
                  { id: 'neurology',     name: 'Neurology',         icon: '🧠', desc: 'Brain & nerves' },
                  { id: 'orthopedics',   name: 'Orthopedics',       icon: '🦴', desc: 'Bones & joints' },
                  { id: 'dermatology',   name: 'Dermatology',       icon: '🧴', desc: 'Skin & hair' },
                  { id: 'pediatrics',    name: 'Pediatrics',        icon: '👶', desc: 'Children 0-18' },
                  { id: 'gynecology',    name: 'Gynecology',        icon: '🌸', desc: "Women's health" },
                  { id: 'ophthalmology', name: 'Ophthalmology',     icon: '👁️', desc: 'Eyes & vision' },
                  { id: 'ent',           name: 'ENT',               icon: '👂', desc: 'Ear, nose & throat' },
                  { id: 'psychiatry',    name: 'Psychiatry',        icon: '🧘', desc: 'Mental health' },
                  { id: 'diabetes',      name: 'Diabetology',       icon: '💉', desc: 'Diabetes & thyroid' },
                  { id: 'pulmonology',   name: 'Pulmonology',       icon: '🫁', desc: 'Lungs & breathing' },
                ].map(sp => (
                  <button key={sp.id} onClick={() => setSelectedSpecialty(sp.id)} style={{
                    background: 'white', border: '1.5px solid #E2E8F0',
                    borderRadius: '14px', padding: '16px 10px', cursor: 'pointer',
                    textAlign: 'center', transition: 'all 0.2s',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.border = '2px solid #0d9488'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { e.currentTarget.style.border = '1.5px solid #E2E8F0'; e.currentTarget.style.transform = 'translateY(0)' }}
                  >
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>{sp.icon}</div>
                    <div style={{ fontWeight: '600', fontSize: '12px', color: '#0A1628', lineHeight: 1.3, marginBottom: '4px' }}>{sp.name}</div>
                    <div style={{ fontSize: '10px', color: '#94A3B8' }}>{sp.desc}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <button onClick={() => setSelectedSpecialty('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>←</button>
                  <span style={{ background: '#E1F5EE', color: '#0d9488', padding: '4px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
                    Specialty selected ✓
                  </span>
                </div>
                <p style={{ fontWeight: '600', color: '#0A1628', marginBottom: '12px', fontSize: '15px' }}>👨‍⚕️ Available Doctors</p>
                {doctors.length === 0 ? (
                  <p style={{ color: '#94A3B8', fontSize: '13px', fontStyle: 'italic' }}>No doctors available yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                    {doctors.map((d: any) => (
                      <button key={d.id} onClick={() => { setSelectedDoctorId(d.id); setStep('questions') }} style={{
                        background: 'white', border: '1.5px solid #E2E8F0',
                        borderRadius: '12px', padding: '14px 16px', cursor: 'pointer',
                        textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s',
                      }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = '#0d9488')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
                      >
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #0A1628, #0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '16px', flexShrink: 0 }}>
                          {d.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: '600', color: '#0A1628', margin: 0, fontSize: '15px' }}>Dr. {d.name}</p>
                          <p style={{ color: '#94A3B8', fontSize: '12px', margin: '2px 0 0' }}>{d.specialization || 'General Physician'}</p>
                        </div>
                        <span style={{ color: '#0d9488', fontSize: '13px', fontWeight: '600' }}>Select →</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

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
                  <p style={{ fontWeight: 'bold', color: '#333', marginBottom: '10px' }}>📎 Attach Medical Files <span style={{ fontWeight: 'normal', color: '#888', fontSize: '13px' }}>(Optional)</span></p>
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
                  <button onClick={() => fileInputRef.current?.click()} style={{ padding: '10px 20px', background: 'white', color: '#1a73e8', border: '2px solid #1a73e8', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>+ Add Files</button>
                  {uploadProgress && <p style={{ color: '#1a73e8', fontSize: '13px', marginTop: '8px' }}>⏳ {uploadProgress}</p>}
                </div>
                <div style={{ marginBottom: '20px', padding: '16px', background: '#f0fdf9', borderRadius: '12px', border: '1px solid #d1fae5' }}>
                  <p style={{ fontWeight: 'bold', color: '#0d9488', marginBottom: '10px', fontSize: '14px' }}>👨‍⚕️ Select Your Doctor</p>
                  <select value={selectedDoctorId} onChange={e => setSelectedDoctorId(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1fae5', fontSize: '14px', background: 'white', color: '#1e293b' }}>
                    <option value="">-- Select a Doctor --</option>
                    {doctors.map((d: any) => (
                      <option key={d.id} value={d.id}>👨‍⚕️ Dr. {d.name} {d.specialization ? `— ${d.specialization}` : ''}</option>
                    ))}
                  </select>
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
                }}>💬 {chatCase?.id === c.id ? 'Close Chat' : 'Chat with Doctor'}</button>
              </div>
            ))}
          </div>
        )}

        {step === 'records' && (
          <div>
            <h3 style={{ marginBottom: '16px' }}>🏥 My Medical Records ({records.length})</h3>
            {records.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '16px' }}>
                <p style={{ fontSize: '48px' }}>🏥</p>
                <p style={{ color: '#666' }}>No medical records yet. Submit a case and get doctor's prescription!</p>
              </div>
            )}
            {records.map((r: any) => (
              <div key={r.id} style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontWeight: 'bold', color: '#1a73e8', fontSize: '16px' }}>🏥 Medical Record</span>
                    <span style={{ marginLeft: '12px', color: '#666', fontSize: '13px' }}>{new Date(r.created_at).toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <span style={{ padding: '4px 12px', borderRadius: '20px', background: '#e8f0fe', color: '#1a73e8', fontSize: '12px', fontWeight: 'bold' }}>
                    👨‍⚕️ Dr. {r.profiles?.name}
                  </span>
                </div>
                {r.diagnosis && (
                  <div style={{ marginBottom: '10px', padding: '12px', background: '#fff7ed', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                    <p style={{ fontWeight: 'bold', color: '#92400e', margin: '0 0 4px', fontSize: '13px' }}>🔍 Diagnosis / Main Problem:</p>
                    <p style={{ margin: 0, color: '#333' }}>{r.diagnosis}</p>
                  </div>
                )}
                {r.prescription && (
                  <div style={{ marginBottom: '10px', padding: '12px', background: '#f0fdf9', borderRadius: '8px', borderLeft: '4px solid #0d9488' }}>
                    <p style={{ fontWeight: 'bold', color: '#0d9488', margin: '0 0 4px', fontSize: '13px' }}>💊 Prescription / Doctor's Advice:</p>
                    <p style={{ margin: 0, color: '#333' }}>{r.prescription}</p>
                  </div>
                )}
                {r.notes && <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>📋 {r.notes}</p>}
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
  const [step, setStep] = useState<'home' | 'cases'>('home')

  useEffect(() => { fetchCases() }, [])

  const fetchCases = async () => {
    const { data } = await supabase.from('cases').select('*, profiles!cases_patient_id_fkey(name, email), feedback(*)').eq('doctor_id', user.id).order('created_at', { ascending: false })
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

  const sendEmailNotification = async (toEmail: string, patientName: string, caseNumber: string, prescription: string) => {
    try {
      const apiKey = import.meta.env.VITE_RESEND_API_KEY
      if (!apiKey) return
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          from: 'MediConnect <onboarding@resend.dev>',
          to: [toEmail],
          subject: `Doctor replied to your case #${caseNumber}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: #1a73e8; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0;">🏥 MediConnect</h1>
                <p style="color: #cce0ff; margin: 8px 0 0;">Your doctor has replied!</p>
              </div>
              <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
                <p style="color: #333; font-size: 16px;">Dear <strong>${patientName}</strong>,</p>
                <p style="color: #555;">Your doctor has reviewed your case <strong>#${caseNumber}</strong> and sent a reply.</p>
                <div style="background: #e8f0fe; border-left: 4px solid #1a73e8; padding: 16px; border-radius: 8px; margin: 16px 0;">
                  <p style="font-weight: bold; color: #1a73e8; margin: 0 0 8px;">💊 Doctor's Prescription/Advice:</p>
                  <p style="color: #333; margin: 0;">${prescription}</p>
                </div>
                <p style="color: #555;">Login to MediConnect to view full details and chat with your doctor.</p>
                <div style="text-align: center; margin-top: 24px;">
                  <a href="https://mediconnect-git-main-na4092881-bytes-projects.vercel.app"
                     style="background: #1a73e8; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                    View on MediConnect
                  </a>
                </div>
                <p style="color: #888; font-size: 12px; margin-top: 24px; text-align: center;">MediConnect — Bridging Doctors and Patients</p>
              </div>
            </div>
          `
        })
      })
    } catch (e) {
      console.log('Email error:', e)
    }
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
    await sendEmailNotification(selected.profiles?.email, selected.profiles?.name, selected.case_number, reply)
    await supabase.from('medical_records').insert({
      patient_id: selected.patient_id, doctor_id: user.id, case_id: selected.id,
      diagnosis: selected.answers?.[0]?.answer || '', prescription: reply,
      notes: `Case #${selected.case_number}`
    })
    setSent(true); fetchCases(); setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>
      <nav className="nav-main">
        <div className="nav-logo">
          <span>🏥</span> MediConnect
          <span style={{ fontSize: '12px', background: 'rgba(13,148,136,0.3)', color: '#5EEAD4', padding: '3px 10px', borderRadius: '20px', marginLeft: '8px', fontFamily: "'DM Sans', sans-serif", fontWeight: '500' }}>Doctor</span>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setStep('home')} className={`nav-btn ${step === 'home' ? 'active' : ''}`}>🏠 Home</button>
          <button onClick={() => { setStep('cases'); fetchCases() }} className={`nav-btn ${step === 'cases' ? 'active' : ''}`}>📋 Cases</button>
          <NotificationBell userId={user.id} />
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>👨‍⚕️ {user.name}</span>
          <button onClick={onLogout} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '7px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: '900px', margin: '20px auto', padding: '0 12px' }}>

        {step === 'home' && <DoctorHome user={user} cases={cases} onNavigate={setStep} />}

        {step === 'cases' && (
          <div>
            <div className='stats-grid' style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
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
                  <div className='case-actions' style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
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
        )}

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
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return d.toLocaleDateString('en', { weekday: 'short' })
  })
  const casesPerDay = last7Days.map((_day, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return cases.filter(c => new Date(c.created_at).toDateString() === d.toDateString()).length
  })
  const maxCases = Math.max(...casesPerDay, 1)

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>
      <nav className="nav-main">
        <div className="nav-logo">
          <span>🏥</span> MediConnect
          <span style={{ fontSize: '12px', background: 'rgba(124,58,237,0.3)', color: '#C4B5FD', padding: '3px 10px', borderRadius: '20px', marginLeft: '8px', fontFamily: "'DM Sans', sans-serif", fontWeight: '500' }}>Admin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {[{ key: 'overview', label: '📊 Overview' }, { key: 'users', label: '👥 Users' }, { key: 'cases', label: '📋 Cases' }].map(t => (
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
        {activeTab === 'overview' && (
          <div>
            <div className='stats-grid' style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
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
            <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
              <h3 style={{ color: '#7c3aed', marginBottom: '20px' }}>📈 Cases - Last 7 Days</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '150px' }}>
                {casesPerDay.map((count, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#7c3aed' }}>{count}</span>
                    <div style={{ width: '100%', borderRadius: '6px 6px 0 0', background: count > 0 ? '#7c3aed' : '#e9d5ff', height: `${Math.max((count / maxCases) * 120, count > 0 ? 8 : 4)}px` }} />
                    <span style={{ fontSize: '11px', color: '#666' }}>{last7Days[i]}</span>
                  </div>
                ))}
              </div>
            </div>
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
        {activeTab === 'users' && (
          <div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <input placeholder="🔍 Search by name or email..." value={searchUser} onChange={e => setSearchUser(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }} />
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
        {activeTab === 'cases' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>📋 All Cases ({cases.length})</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ padding: '6px 14px', borderRadius: '20px', background: '#fef3cd', color: '#856404', fontSize: '13px', fontWeight: 'bold' }}>⏳ Pending: {cases.filter(c => c.status === 'pending').length}</span>
                <span style={{ padding: '6px 14px', borderRadius: '20px', background: '#e6f4ea', color: '#137333', fontSize: '13px', fontWeight: 'bold' }}>✅ Reviewed: {cases.filter(c => c.status === 'reviewed').length}</span>
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        if (profile && !profile.blocked) {
          setUser({ id: session.user.id, name: profile.name, email: profile.email, role: profile.role })
        }
      }
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, _session) => {
      if (event === 'SIGNED_OUT') { setUser(null) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0A1628, #0F2241)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg, #0d9488, #14B8A6)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', boxShadow: '0 8px 24px rgba(13,148,136,0.4)', animation: 'pulse 1.5s ease-in-out infinite' }}>🏥</div>
      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', fontFamily: 'DM Sans, sans-serif' }}>Loading MediConnect...</p>
    </div>
  )

  if (!user) return <Login onLogin={setUser} />
  if (user.role === 'patient') return <PatientDashboard user={user} onLogout={handleLogout} />
  if (user.role === 'doctor') return <DoctorDashboard user={user} onLogout={handleLogout} />
  return <AdminDashboard user={user} onLogout={handleLogout} />
}
