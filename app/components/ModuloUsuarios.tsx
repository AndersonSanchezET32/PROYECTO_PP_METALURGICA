// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function ModuloUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  
  // Cargar lista de empleados
  const cargarUsuarios = async () => {
    const { data } = await supabase.from('perfiles').select('*').order('rol')
    if (data) setUsuarios(data)
  }

  useEffect(() => { cargarUsuarios() }, [])

  // Cambiar Rol
  const actualizarRol = async (id, nuevoRol) => {
    await supabase.from('perfiles').update({ rol: nuevoRol }).eq('id', id)
    cargarUsuarios() // Recargar tabla
  }

  return (
    <div className="animate-in fade-in space-y-6">
      <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Gestión de Usuarios</h2>
        <p className="text-slate-500 mb-6">Panel exclusivo de Administración</p>

        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase font-bold">
            <tr>
              <th className="p-4">Nombre</th>
              <th className="p-4">Email</th>
              <th className="p-4">Rol Asignado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usuarios.map(u => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="p-4 font-bold text-slate-700">{u.nombre_completo}</td>
                <td className="p-4 text-slate-500">{u.email}</td>
                <td className="p-4">
                  <select 
                    value={u.rol} 
                    onChange={(e) => actualizarRol(u.id, e.target.value)}
                    className="border border-slate-300 rounded p-2 bg-white font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Administrador">Administrador</option>
                    <option value="Vendedor">Vendedor</option>
                    <option value="Almacén">Almacén</option>
                    <option value="Gerencia">Gerencia</option>
                    <option value="Taller">Taller</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
     
    </div>
  )
}