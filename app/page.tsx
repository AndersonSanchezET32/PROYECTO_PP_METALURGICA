// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Login from './components/Login'
import Navbar from './components/Navbar'
import ModuloVentas from './components/ModuloVentas'
import ModuloClientes from './components/ModuloClientes'
import ModuloTaller from './components/ModuloTaller'
import ModuloInventario from './components/ModuloInventario'
import ModuloGerencia from './components/ModuloGerencia'
import ModuloUsuarios from './components/ModuloUsuarios'
// ---------------------------

export default function Home() {
  // --- ESTADOS GLOBALES ---
  const [user, setUser] = useState<{ name: string; role: string } | null>(null)
  const [vistaActual, setVistaActual] = useState('ventas')
  const [loading, setLoading] = useState(false)

  // --- DATOS DEL SISTEMA ---
  const [productos, setProductos] = useState([])
  const [clientes, setClientes] = useState([])
  const [pedidos, setPedidos] = useState([])

  const recargarDatos = async () => {
    setLoading(true)
    try {
      const [resProductos, resClientes, resPedidos] = await Promise.all([
        supabase.from('productos').select('*').order('nombre'),
        supabase.from('clientes').select('*').order('nombre'),
        supabase.from('pedidos').select('*, clientes(*)').order('created_at', { ascending: false })
      ])

      if (resProductos.data) setProductos(resProductos.data)
      if (resClientes.data) setClientes(resClientes.data)
      if (resPedidos.data) setPedidos(resPedidos.data)
      
    } catch (error) {
      console.error("Error cargando datos:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      recargarDatos()
    }
  }, [user])

  // --- RENDERIZADO ---

  // 1. Si no hay usuario, mostramos LOGIN
  if (!user) {
    return <Login onLogin={setUser} />
  }

  // 2. Si hay usuario, mostramos el SISTEMA
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* Barra de Navegación Superior */}
      <Navbar 
        vistaActual={vistaActual} 
        setVistaActual={setVistaActual} 
        user={user} 
        onLogout={() => setUser(null)} 
      />

      {/* Contenedor Principal */}
      <main className="max-w-7xl mx-auto p-6">
        
        {/* MÓDULO DE VENTAS */}
        {vistaActual === 'ventas' && (
          <ModuloVentas 
            productos={productos} 
            clientes={clientes} 
            recargarDatos={recargarDatos} 
          />
        )}

        {/* MÓDULO DE CLIENTES */}
        {vistaActual === 'clientes' && (
          <ModuloClientes 
            clientes={clientes} 
            recargarDatos={recargarDatos} 
          />
        )}

        {/* MÓDULO DE TALLER (Producción) */}
        {vistaActual === 'taller' && (
          <ModuloTaller 
            pedidos={pedidos} 
            recargarDatos={recargarDatos} 
          />
        )}

        {/* MÓDULO DE INVENTARIO (Alta de Productos) */}
        {vistaActual === 'inventario' && (
          <ModuloInventario 
            productos={productos} 
            recargarDatos={recargarDatos} 
          />
        )}

        {/* MÓDULO DE GERENCIA (Reportes y PDFs) */}
        {vistaActual === 'gerencia' && (
          <ModuloGerencia 
            pedidos={pedidos} 
            productos={productos} 
          />
        )}

        {/* MÓDULO DE USUARIOS (Solo Admin) */}
        {vistaActual === 'usuarios' && user.role === 'Administrador' && (
          <ModuloUsuarios />
        )}

      </main>
    </div>
  )
}