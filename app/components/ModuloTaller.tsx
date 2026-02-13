// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

const NOMBRES_UI = {
  'pendiente': 'PENDIENTE DE APROBACION',
  'fabricacion': 'EN FABRICACION',
  'control_calidad': 'CONTROL DE CALIDAD',
  'listo_retiro': 'LISTO PARA RETIRAR',
  'entregado': 'ENTREGADO',
  'cancelado': 'CANCELADO' // <--- Agregamos este estado
}

export default function ModuloTaller() {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const cargarPedidos = async () => {
    setLoading(true)
    setErrorMsg('')

    try {
      // 1. Traemos los PEDIDOS "crudos" (Filtrando los entregados Y los cancelados)
      const { data: listaPedidos, error: errorP } = await supabase
        .from('pedidos')
        .select('*')
        .neq('estado', 'entregado')
        .neq('estado', 'cancelado') // <--- NO MOSTRAR LOS CANCELADOS
        .order('fecha', { ascending: true })
      
      if (errorP) throw errorP

      // 2. Traemos TODOS los CLIENTES
      const { data: listaClientes } = await supabase.from('clientes').select('*')

      // 3. Traemos TODOS los DETALLES
      const { data: listaDetalles } = await supabase.from('detalle_pedido').select('*')

      // 4. Traemos TODOS los PRODUCTOS
      const { data: listaProductos } = await supabase.from('productos').select('*')

      // 5. ¡MAGIA! Unimos todo manualmente (Mantenemos tu lógica segura)
      const pedidosCompletos = listaPedidos.map(pedido => {
        const clienteEncontrado = listaClientes?.find(c => c.id === pedido.cliente_id)

        const detallesDelPedido = listaDetalles?.filter(d => d.pedido_id === pedido.id).map(detalle => {
          const productoReal = listaProductos?.find(p => p.id === detalle.producto_id)
          return {
            ...detalle,
            productos: { nombre: productoReal ? productoReal.nombre : 'Producto Borrado' }
          }
        })

        return {
          ...pedido,
          clientes: clienteEncontrado || { nombre: 'Cliente', apellido: 'Desconocido' },
          detalle_pedido: detallesDelPedido || []
        }
      })

      setPedidos(pedidosCompletos)

    } catch (error) {
      console.error(error)
      setErrorMsg('Error al cargar datos: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarPedidos() }, [])

  // --- NUEVA FUNCIÓN: CANCELAR PEDIDO ---
  const cancelarPedido = async (id) => {
    if (!window.confirm('¿Seguro que deseas cancelar este pedido? Desaparecerá de la lista.')) return

    // Simplemente cambiamos el estado a 'cancelado'
    const { error } = await supabase
      .from('pedidos')
      .update({ estado: 'cancelado' })
      .eq('id', id)

    if (error) alert('Error: ' + error.message)
    else cargarPedidos() // Recargamos y el filtro lo ocultará
  }

  // --- LÓGICA DE AVANCE (Tu lógica original) ---
  const avanzarEstado = async (id, estadoActual) => {
    let nuevoEstado = ''
    if (estadoActual === 'pendiente') nuevoEstado = 'fabricacion'
    else if (estadoActual === 'fabricacion') nuevoEstado = 'control_calidad'
    else if (estadoActual === 'control_calidad') nuevoEstado = 'listo_retiro'
    else if (estadoActual === 'listo_retiro') nuevoEstado = 'entregado'

    if (!nuevoEstado) return

    const { error } = await supabase.from('pedidos').update({ estado: nuevoEstado }).eq('id', id)
    if (error) alert('Error: ' + error.message)
    else cargarPedidos()
  }

  // Estilos y Textos
  const getEstiloTarjeta = (estado) => {
    switch(estado) {
      case 'pendiente': return 'border-l-4 border-l-yellow-500 bg-white'
      case 'fabricacion': return 'border-l-4 border-l-blue-600 bg-blue-50'
      case 'control_calidad': return 'border-l-4 border-l-purple-600 bg-purple-50'
      case 'listo_retiro': return 'border-l-4 border-l-green-600 bg-green-50'
      default: return 'bg-white'
    }
  }

  const getTextoBoton = (estado) => {
    switch(estado) {
      case 'pendiente': return 'APROBAR ORDEN'
      case 'fabricacion': return 'TERMINAR FABRICACION'
      case 'control_calidad': return 'APROBAR CALIDAD'
      case 'listo_retiro': return 'REGISTRAR ENTREGA'
      default: return 'AVANZAR'
    }
  }

  return (
    <div className="animate-in fade-in space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Monitor de Produccion</h2>
        <button onClick={cargarPedidos} className="text-sm bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-700">Actualizar</button>
      </div>

      {errorMsg && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4 border border-red-200">
          🚨 {errorMsg}
        </div>
      )}

      {!loading && pedidos.length === 0 && !errorMsg && (
        <div className="text-center py-12 bg-slate-50 rounded border border-dashed border-slate-300">
          <p className="text-slate-500">No hay órdenes pendientes.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pedidos.map((p) => (
          <div key={p.id} className={`p-6 rounded shadow-sm border relative ${getEstiloTarjeta(p.estado)}`}>
            
            {/* --- BOTÓN CANCELAR (X Roja) --- */}
            <button 
              onClick={() => cancelarPedido(p.id)}
              className="absolute top-4 right-4 text-slate-300 hover:text-red-500 font-bold text-xl leading-none transition-colors z-10"
              title="Cancelar Pedido"
            >
              &times;
            </button>
            {/* -------------------------------- */}

            <div className="flex justify-between items-start mb-4 pr-8">
              <div>
                <h3 className="font-bold text-slate-900">Orden #{p.id.toString().slice(0,4)}</h3>
                <p className="text-slate-500 text-xs">
                  {p.clientes.nombre} {p.clientes.apellido}
                </p>
              </div>
            </div>

            <div className="mb-4">
               <span className="px-2 py-1 bg-white/80 rounded text-[10px] font-bold border uppercase tracking-wider">
                {NOMBRES_UI[p.estado] || p.estado}
              </span>
            </div>

            <div className="bg-white/50 p-3 rounded border mb-4 text-sm space-y-1">
              {p.detalle_pedido.length > 0 ? (
                p.detalle_pedido.map((d, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="font-medium text-slate-700">{d.productos?.nombre}</span>
                    <span className="text-slate-500">x{d.cantidad}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">Sin detalles</p>
              )}
            </div>

            <button 
              onClick={() => avanzarEstado(p.id, p.estado)}
              className="w-full py-3 bg-slate-900 text-white rounded font-bold text-xs hover:bg-slate-800 transition-colors uppercase tracking-widest"
            >
              {getTextoBoton(p.estado)}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}