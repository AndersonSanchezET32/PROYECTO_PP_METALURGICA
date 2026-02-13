// @ts-nocheck
'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('') // Nuevo campo para registro
  const [isRegistering, setIsRegistering] = useState(false) // Para cambiar entre Login y Registro
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMsg('')

    try {
      if (isRegistering) {
        // --- LÓGICA DE REGISTRO ---
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: nombre } 
          }
        })

        if (signUpError) throw signUpError

        // Creamos la entrada en la tabla perfiles manualmente para asegurar
        if (data.user) {
          await supabase.from('perfiles').insert({
            id: data.user.id,
            email: email,
            nombre_completo: nombre,
            rol: 'Invitado' 
          })
        }

        setMsg('¡Usuario creado! Ya puedes iniciar sesión.')
        setIsRegistering(false) // Volver al login
      } else {
        // --- LÓGICA DE LOGIN ---
        const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (authError) throw authError

        // Buscar el rol en la tabla perfiles
        const { data: perfil, error: perfilError } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (perfil) {
          onLogin({ name: perfil.nombre_completo, role: perfil.rol })
        } else {
          onLogin({ name: user.email, role: 'Invitado' })
        }
      }

    } catch (err) {
      console.error(err)
      setError(err.message || 'Ocurrió un error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-600 text-white w-12 h-12 flex items-center justify-center rounded-lg font-bold text-xl mx-auto mb-4 shadow-lg">M</div>
          <h1 className="text-2xl font-bold text-slate-800">SGI Metalúrgica</h1>
          <p className="text-slate-500 text-sm">
            {isRegistering ? 'Crear Nueva Cuenta' : 'Ingreso al Sistema'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          
          {/* Campo de Nombre (Solo visible en Registro) */}
          {isRegistering && (
            <input 
              type="text" 
              required
              className="w-full p-3 rounded-lg border bg-slate-50 text-slate-900"
              placeholder="Nombre Completo (ej. Juan Pérez)"
              value={nombre} onChange={e => setNombre(e.target.value)}
            />
          )}

          <input 
            type="email" 
            required
            className="w-full p-3 rounded-lg border bg-slate-50 text-slate-900"
            placeholder="Correo Electrónico"
            value={email} onChange={e => setEmail(e.target.value)}
          />
          <input 
            type="password" 
            required
            className="w-full p-3 rounded-lg border bg-slate-50 text-slate-900"
            placeholder="Contraseña"
            value={password} onChange={e => setPassword(e.target.value)}
          />
          
          {error && <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded border border-red-100">{error}</div>}
          {msg && <div className="text-green-600 text-sm text-center bg-green-50 p-2 rounded border border-green-100">{msg}</div>}

          <button disabled={loading} className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors">
            {loading ? 'Procesando...' : (isRegistering ? 'REGISTRARSE' : 'INICIAR SESIÓN')}
          </button>
        </form>

        {/* Botón para cambiar entre Login y Registro */}
        <div className="mt-6 text-center text-sm">
          <button 
            type="button"
            onClick={() => { setIsRegistering(!isRegistering); setError(''); setMsg('') }}
            className="text-blue-600 hover:text-blue-800 font-semibold"
          >
            {isRegistering 
              ? '¿Ya tienes cuenta? Inicia Sesión' 
              : '¿No tienes cuenta? Regístrate aquí'}
          </button>
        </div>
      </div>
    </div>
  )
}