// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function ModuloVentas() {
  const [clientes, setClientes] = useState([])
  const [productos, setProductos] = useState([])
  const [carrito, setCarrito] = useState([])
  
  const [clienteSeleccionado, setClienteSeleccionado] = useState('')
  const [prodSeleccionado, setProdSeleccionado] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [loading, setLoading] = useState(false)

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      const { data: cl } = await supabase.from('clientes').select('*')
      // Filtramos solo productos con stock positivo para evitar errores
      const { data: pr } = await supabase.from('productos').select('*').gt('stock_actual', 0)
      
      if (cl) setClientes(cl)
      if (pr) setProductos(pr)
    }
    cargarDatos()
  }, [])

  // --- FUNCIÓN CORREGIDA (Solución al error de pantalla roja) ---
  const agregarAlCarrito = (e) => {
    e.preventDefault()
    if (!prodSeleccionado || !cantidad) return

    // CORRECCIÓN CLAVE: Convertimos ambos IDs a String para asegurar que coincidan
    // (A veces la BD envía números y el select envía texto)
    const productoReal = productos.find(p => String(p.id) === String(prodSeleccionado))
    
    // Seguridad extra: Si no lo encuentra, cortamos aquí para que no explote
    if (!productoReal) {
      alert('Error: No se pudo identificar el producto seleccionado.')
      return
    }

    // Verificar stock básico
    if (productoReal.stock_actual < cantidad) {
      alert(`Stock insuficiente. Solo quedan ${productoReal.stock_actual} unidades.`)
      return
    }

    const item = {
      producto_id: prodSeleccionado,
      nombre: productoReal.nombre,
      precio: productoReal.precio_minorista, 
      cantidad: Number(cantidad),
      subtotal: productoReal.precio_minorista * cantidad
    }

    setCarrito([...carrito, item])
  }
  // -------------------------------------------------------------

  // Confirmar la venta y enviar a Taller
  const confirmarVenta = async () => {
    if (!clienteSeleccionado || carrito.length === 0) {
      alert('Seleccione un cliente y agregue productos.')
      return
    }

    setLoading(true)
    try {
      // 1. Calcular total
      const totalVenta = carrito.reduce((acc, item) => acc + item.subtotal, 0)

      // 2. Crear el PEDIDO (Cabecera)
      // Importante: estado 'pendiente' para que salga en el Taller
      const { data: pedido, error: errorPedido } = await supabase
        .from('pedidos')
        .insert({
          cliente_id: clienteSeleccionado,
          fecha: new Date(),
          total: totalVenta,
          estado: 'pendiente' 
        })
        .select()
        .single()

      if (errorPedido) throw errorPedido

      // 3. Crear los DETALLES (Items)
      const detalles = carrito.map(item => ({
        pedido_id: pedido.id,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio
      }))

      const { error: errorDetalles } = await supabase
        .from('detalle_pedido')
        .insert(detalles)

      if (errorDetalles) throw errorDetalles

      // 4. Descontar Stock 
      for (const item of carrito) {
        // Buscamos de nuevo el producto original para saber su stock actual
        const prod = productos.find(p => String(p.id) === String(item.producto_id))
        if (prod) {
          await supabase
            .from('productos')
            .update({ stock_actual: prod.stock_actual - item.cantidad })
            .eq('id', item.producto_id)
        }
      }

      alert('✅ Venta confirmada correctamente.')
      
      // Limpiar formulario
      setCarrito([])
      setCantidad(1)
      setProdSeleccionado('')
      
      // Recargar productos para actualizar el stock visual
      const { data: pr } = await supabase.from('productos').select('*').gt('stock_actual', 0)
      if (pr) setProductos(pr)
      
    } catch (error) {
      console.error(error)
      alert('Error al procesar la venta: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-in fade-in space-y-6">
      <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Nueva Orden de Venta</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* SELECCIÓN DE CLIENTE */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Cliente</label>
            <select 
              className="w-full p-3 rounded border bg-slate-50"
              value={clienteSeleccionado}
              onChange={e => setClienteSeleccionado(e.target.value)}
            >
              <option value="">-- Seleccionar Cliente --</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>
              ))}
            </select>
          </div>

          {/* AGREGAR PRODUCTOS */}
          <div className="bg-slate-50 p-4 rounded border border-slate-200">
            <label className="block text-sm font-bold text-slate-700 mb-2">Producto</label>
            <div className="flex gap-2">
              <select 
                className="w-full p-2 rounded border"
                value={prodSeleccionado}
                onChange={e => setProdSeleccionado(e.target.value)}
              >
                <option value="">-- Producto --</option>
                {productos.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} (Stock: {p.stock_actual})
                  </option>
                ))}
              </select>
              <input 
                type="number" 
                min="1"
                className="w-20 p-2 rounded border"
                value={cantidad}
                onChange={e => setCantidad(e.target.value)}
              />
              <button 
                onClick={agregarAlCarrito}
                className="bg-blue-600 text-white px-4 rounded font-bold hover:bg-blue-700"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CARRITO Y CONFIRMACIÓN */}
      {carrito.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4">Detalle del Pedido</h3>
          <table className="w-full text-left text-sm mb-6">
            <thead className="bg-slate-100 text-slate-500 uppercase">
              <tr>
                <th className="p-3">Producto</th>
                <th className="p-3">Cant</th>
                <th className="p-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {carrito.map((item, index) => (
                <tr key={index}>
                  <td className="p-3">{item.nombre}</td>
                  <td className="p-3">{item.cantidad}</td>
                  <td className="p-3 text-right">${item.subtotal}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end items-center gap-4">
            <div className="text-xl font-bold text-slate-800">
              Total: ${carrito.reduce((acc, item) => acc + item.subtotal, 0)}
            </div>
            <button 
              onClick={confirmarVenta}
              disabled={loading}
              className="bg-green-600 text-white py-3 px-8 rounded-lg font-bold hover:bg-green-700 shadow-lg"
            >
              {loading ? 'Procesando...' : 'CONFIRMAR PEDIDO'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}