// @ts-nocheck
'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function ModuloClientes({ clientes, recargarDatos }) {
  const [nuevo, setNuevo] = useState({ nombre: '', email: '', lista: 'minorista' })
  const [loading, setLoading] = useState(false)

  const guardar = async () => {
    if (!nuevo.nombre) return alert('Nombre requerido')
    setLoading(true)
    await supabase.from('clientes').insert([{
      nombre: nuevo.nombre, email: nuevo.email, lista_precio_asignada: nuevo.lista
    }])
    setNuevo({ nombre: '', email: '', lista: 'minorista' })
    recargarDatos()
    setLoading(false)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
      <div className="bg-white p-6 rounded-xl shadow h-fit">
        <h2 className="font-bold text-lg mb-4">👤 Nuevo Cliente</h2>
        <div className="space-y-3">
          <input className="w-full p-2 border rounded" placeholder="Nombre" value={nuevo.nombre} onChange={e => setNuevo({...nuevo, nombre: e.target.value})} />
          <input className="w-full p-2 border rounded" placeholder="Email" value={nuevo.email} onChange={e => setNuevo({...nuevo, email: e.target.value})} />
          <select className="w-full p-2 border rounded" value={nuevo.lista} onChange={e => setNuevo({...nuevo, lista: e.target.value})}>
            <option value="minorista">Minorista</option>
            <option value="mayorista">Mayorista</option>
            <option value="especial">Especial</option>
          </select>
          <button onClick={guardar} disabled={loading} className="w-full bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700">Guardar</button>
        </div>
      </div>

      <div className="md:col-span-2 bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-800 text-white"><tr><th className="p-3">Cliente</th><th className="p-3">Email</th><th className="p-3">Lista</th></tr></thead>
          <tbody className="divide-y">
            {clientes.map(c => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="p-3 font-medium">{c.nombre}</td>
                <td className="p-3 text-slate-500">{c.email}</td>
                <td className="p-3"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold uppercase">{c.lista_precio_asignada}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}