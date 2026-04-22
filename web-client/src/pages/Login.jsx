import { useState, useContext } from "react"
import { login } from "../services/api"
import { AuthContext } from "../context/AuthContext"
import { useNavigate, Link } from "react-router-dom"
import { Zap, Mail, Lock, ArrowRight } from "lucide-react"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { loginUser } = useContext(AuthContext)
  const nav = useNavigate()

  async function handleLogin() {
    if (!email || !password) return
    setLoading(true)
    try {
      const data = await login({ email, password })
      const user = {
        id: data.id,
        email: data.email,
        role: data.role,
        store_id: data.store_id ?? null
      }
      loginUser(user)
      if (user.role === "consumer") nav("/stores")
      if (user.role === "store")    nav("/store")
      if (user.role === "delivery") nav("/delivery")
    } catch (err) {
      alert("Correo o contraseña incorrectos")
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e) {
    if (e.key === "Enter") handleLogin()
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">
          <Zap size={40} fill="currentColor" />
        </div>

        <h1 className="auth-title">Bienvenido</h1>
        <p className="auth-subtitle">Ingresa a tu cuenta de RappiLab</p>

        <div className="form-group">
          <label>Correo electrónico</label>
          <div style={{ position: "relative" }}>
            <Mail size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }} />
            <input
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={handleKey}
              style={{ paddingLeft: 40 }}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Contraseña</label>
          <div style={{ position: "relative" }}>
            <Lock size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }} />
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKey}
              style={{ paddingLeft: 40 }}
            />
          </div>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="btn-block"
          style={{ marginTop: 8, height: 44 }}
        >
          {loading ? "Ingresando…" : (
            <>
              Iniciar sesión <ArrowRight size={18} />
            </>
          )}
        </button>

        <div className="auth-footer">
          ¿No tienes cuenta?{" "}
          <Link to="/register">Regístrate aquí</Link>
        </div>
      </div>
    </div>
  )
}
