// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function ModuloGerencia() {
  const [pedidos, setPedidos] = useState([])
  const [productos, setProductos] = useState([])
  const [recetas, setRecetas] = useState([])
  const [detalles, setDetalles] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true)
      try {
        // 1. Traemos los pedidos "crudos"
        const { data: dPedidos, error: errorP } = await supabase
          .from('pedidos')
          .select('*')
          .order('fecha', { ascending: false }) // Los más nuevos primero
        
        if (errorP) throw errorP

        // 2. Traemos resto de datos
        const { data: dProductos } = await supabase.from('productos').select('*')
        const { data: dRecetas } = await supabase.from('recetas').select('*')
        const { data: dDetalles } = await supabase.from('detalle_pedido').select('*')
        const { data: dClientes } = await supabase.from('clientes').select('*')

        if (dPedidos) setPedidos(dPedidos)
        if (dProductos) setProductos(dProductos)
        if (dRecetas) setRecetas(dRecetas)
        if (dDetalles) setDetalles(dDetalles)
        if (dClientes) setClientes(dClientes)

      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    cargarDatos()
  }, [])

  // --- FUNCIONES AUXILIARES PARA LA TABLA ---
  const getNombreCliente = (id) => {
    const c = clientes.find(cli => cli.id === id)
    return c ? `${c.nombre} ${c.apellido}` : 'Cliente Desconocido'
  }

  const getBadgeColor = (estado) => {
    const st = estado.toLowerCase()
    if (st === 'entregado') return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    if (st === 'cancelado') return 'bg-red-100 text-red-700 border-red-200'
    if (st.includes('pendiente')) return 'bg-amber-100 text-amber-700 border-amber-200'
    return 'bg-blue-100 text-blue-700 border-blue-200' // Fabricación, Control, etc.
  }

  const formatEstado = (estado) => {
    return estado.replace(/_/g, ' ').toUpperCase()
  }

  // --- REPORTES PDF (Sin cambios) ---
  const pdfPedidos = () => {
    const doc = new jsPDF()
    doc.text('Reporte General de Ventas', 14, 20)
    const filas = pedidos.map(p => [
      `#${p.id}`, new Date(p.fecha).toLocaleDateString(), getNombreCliente(p.cliente_id), `$${p.total}`, p.estado.toUpperCase()
    ])
    autoTable(doc, { startY: 30, head: [['ID', 'Fecha', 'Cliente', 'Total', 'Estado']], body: filas })
    doc.save('reporte_ventas.pdf')
  }

  const pdfClientes = () => {
    const doc = new jsPDF()
    doc.text('Historial de Clientes', 14, 20)
    const datosClientes = clientes.map(c => {
      const susPedidos = pedidos.filter(p => p.cliente_id === c.id && p.estado !== 'cancelado')
      const totalGastado = susPedidos.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0)
      return [ `${c.nombre} ${c.apellido || ''}`, c.telefono || '-', susPedidos.length, `$${totalGastado.toLocaleString()}` ]
    })
    autoTable(doc, { startY: 30, head: [['Cliente', 'Contacto', 'Compras', 'Total ($)']], body: datosClientes })
    doc.save('reporte_clientes.pdf')
  }

  const generarReporteStock = () => {
    const doc = new jsPDF()
    doc.text('Informe de Materiales Comprometidos', 14, 20)
    const pedidosActivosIds = pedidos.filter(p => p.estado !== 'entregado' && p.estado !== 'cancelado').map(p => p.id)
    const demanda = {}
    detalles.forEach(det => {
      if (pedidosActivosIds.includes(det.pedido_id)) {
        const recetaProd = recetas.filter(r => r.producto_final_id === det.producto_id)
        if (recetaProd.length > 0) {
          recetaProd.forEach(ing => {
            const id = ing.insumo_id; demanda[id] = (demanda[id] || 0) + (ing.cantidad * det.cantidad)
          })
        } else {
          demanda[det.producto_id] = (demanda[det.producto_id] || 0) + det.cantidad
        }
      }
    })
    const filas = productos.map(p => {
      const comp = demanda[p.id] || 0
      const disp = p.stock_actual - comp
      return [ p.nombre, p.tipo === 'materia_prima' ? 'Insumo' : 'Final', p.stock_actual, comp, disp, disp < 0 ? 'FALTA STOCK' : 'OK' ]
    })
    autoTable(doc, { startY: 35, head: [['Producto', 'Tipo', 'Stock', 'Reservado', 'Disponible', 'Estado']], body: filas })
    doc.save('reporte_materiales.pdf')
  }

  // --- KPIs ---
  const totalVentas = pedidos.filter(p => p.estado !== 'cancelado').reduce((acc, curr) => acc + (Number(curr.total) || 0), 0)
  const pedidosEnTaller = pedidos.filter(p => p.estado !== 'entregado' && p.estado !== 'cancelado').length

  return (
    <div className="animate-in fade-in space-y-8 p-6">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-slate-800">Centro de Informes</h2>
        <p className="text-slate-500 text-sm">Panel de Control Gerencial</p>
      </div>

      {loading ? <p className="text-slate-500">Cargando datos...</p> : (
        <>
          {/* BOTONES PDF */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded border shadow-sm">
              <h3 className="font-bold text-slate-700 mb-2">Ventas Generales</h3>
              <button onClick={pdfPedidos} className="w-full bg-slate-800 text-white py-2 rounded text-sm font-bold hover:bg-slate-700">DESCARGAR PDF</button>
            </div>
            <div className="bg-white p-6 rounded border shadow-sm">
              <h3 className="font-bold text-slate-700 mb-2">Cartera de Clientes</h3>
              <button onClick={pdfClientes} className="w-full bg-white border border-slate-300 text-slate-700 py-2 rounded text-sm font-bold hover:bg-slate-50">VER HISTORIAL PDF</button>
            </div>
            <div className="bg-white p-6 rounded border shadow-sm">
              <h3 className="font-bold text-slate-700 mb-2">Previsión Materiales</h3>
              <button onClick={generarReporteStock} className="w-full bg-blue-600 text-white py-2 rounded text-sm font-bold hover:bg-blue-700">ANÁLISIS STOCK PDF</button>
            </div>
          </div>

          {/* INDICADORES (KPIs) */}
          <div className="mt-8">
            <h3 className="font-bold text-slate-700 mb-4">Métricas en Tiempo Real</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-emerald-50 p-4 rounded border border-emerald-100">
                <p className="text-xs text-emerald-600 uppercase font-bold">Total Vendido</p>
                <p className="text-3xl font-bold text-emerald-700 mt-2">${totalVentas.toLocaleString()}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded border border-blue-100">
                <p className="text-xs text-blue-600 uppercase font-bold">En Producción</p>
                <p className="text-3xl font-bold text-blue-700 mt-2">{pedidosEnTaller}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded border border-slate-200">
                <p className="text-xs text-slate-500 uppercase font-bold">Clientes</p>
                <p className="text-2xl font-bold text-slate-800 mt-2">{clientes.length}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded border border-slate-200">
                <p className="text-xs text-slate-500 uppercase font-bold">Catálogo</p>
                <p className="text-2xl font-bold text-slate-800 mt-2">{productos.length}</p>
              </div>
            </div>
          </div>

          {/* --- NUEVA TABLA DE HISTORIAL DE OPERACIONES --- */}
          <div className="mt-10 bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">Historial Completo de Operaciones</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-500 uppercase font-bold text-xs">
                  <tr>
                    <th className="p-4">ID Pedido</th>
                    <th className="p-4">Fecha</th>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Total</th>
                    <th className="p-4 text-center">Estado Actual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pedidos.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-mono text-slate-500">#{p.id}</td>
                      <td className="p-4 text-slate-700">
                        {new Date(p.fecha).toLocaleDateString()}
                        <span className="text-xs text-slate-400 block">
                          {new Date(p.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} hs
                        </span>
                      </td>
                      <td className="p-4 font-medium text-slate-900">
                        {getNombreCliente(p.cliente_id)}
                      </td>
                      <td className="p-4 font-bold text-slate-800">
                        ${p.total.toLocaleString()}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wide ${getBadgeColor(p.estado)}`}>
                          {formatEstado(p.estado)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {pedidos.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        Aún no se han registrado operaciones en el sistema.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </>
      )}
    </div>
  )
}