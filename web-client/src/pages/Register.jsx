import { useState } from "react"
import { register } from "../services/api"
import { useNavigate, Link } from "react-router-dom"
import { Zap, User, Store, Truck, Mail, Lock, Building, ArrowRight } from "lucide-react"

const ROLE_OPTIONS = [
  { id: "consumer", label: "Consumidor", desc: "Pide comida", icon: User },
  { id: "store",    label: "Tienda",     desc: "Vende productos", icon: Store },
  { id: "delivery", label: "Repartidor", desc: "Entrega pedidos", icon: Truck }
]

export default function Register() {
  const [role, setRole] = useState("consumer")
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await register({ ...form, role })
      alert("¡Cuenta creada exitosamente!")
      nav("/")
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: 440 }}>
        <div className="auth-logo">
          <Zap size={40} fill="currentColor" />
        </div>

        <h1 className="auth-title">Crear cuenta</h1>
        <p className="auth-subtitle">Únete a la red de RappiLab</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 24 }}>
          {ROLE_OPTIONS.map((opt) => {
            const Icon = opt.icon
            const active = role === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setRole(opt.id)}
                className="btn-secondary"
                style={{
                  padding: "16px 8px",
                  flexDirection: "column",
                  height: "auto",
                  borderColor: active ? "var(--accent)" : "var(--border)",
                  background: active ? "var(--bg-2)" : "var(--bg-1)",
                  color: active ? "var(--text)" : "var(--text-3)"
                }}
              >
                <Icon size={20} color={active ? "var(--accent)" : "currentColor"} />
                <div style={{ fontSize: 12, fontWeight: 600, marginTop: 8 }}>{opt.label}</div>
              </button>
            )
          })}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre completo</label>
            <div style={{ position: "relative" }}>
              <User size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }} />
              <input name="name" placeholder="Tu nombre" onChange={handleChange} required style={{ paddingLeft: 40 }} />
            </div>
          </div>
          
          <div className="form-group">
            <label>Correo electrónico</label>
            <div style={{ position: "relative" }}>
              <Mail size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }} />
              <input name="email" type="email" placeholder="tu@correo.com" onChange={handleChange} required style={{ paddingLeft: 40 }} />
            </div>
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <div style={{ position: "relative" }}>
              <Lock size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }} />
              <input name="password" type="password" placeholder="Mínimo 6 caracteres" onChange={handleChange} required style={{ paddingLeft: 40 }} />
            </div>
          </div>

          {role === "store" && (
            <div className="form-group">
              <label>Nombre de la tienda</label>
              <div style={{ position: "relative" }}>
                <Building size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }} />
                <input name="store_name" placeholder="Ej: Burger House" onChange={handleChange} required style={{ paddingLeft: 40 }} />
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-block" style={{ marginTop: 16, height: 44 }}>
            {loading ? "Creando cuenta…" : (
              <>
                Registrarme <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          ¿Ya tienes cuenta? <Link to="/">Inicia sesión</Link>
        </div>
      </div>
    </div>
  )
}
