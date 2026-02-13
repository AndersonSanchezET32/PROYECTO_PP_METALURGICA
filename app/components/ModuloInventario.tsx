// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function ModuloInventario({ productos, recargarDatos }) {
  // Estado del formulario
  const [nuevoProd, setNuevoProd] = useState({ nombre: '', tipo: 'materia_prima', stock_actual: 0, precio_minorista: 0 })
  
  // Estados para el constructor de recetas
  const [receta, setReceta] = useState([]) // Lista temporal de ingredientes
  const [insumoSelec, setInsumoSelec] = useState('') // ID del insumo seleccionado
  const [cantidadInsumo, setCantidadInsumo] = useState(1) // Cantidad necesaria

  const [cargando, setCargando] = useState(false)

  // Filtramos solo las materias primas para mostrar en el selector de ingredientes
  const materiasPrimas = productos.filter(p => p.tipo === 'materia_prima')

  // --- LOGICA DE RECETAS ---
  const agregarIngrediente = () => {
    if (!insumoSelec || cantidadInsumo <= 0) return
    
    // Buscamos el nombre del producto para mostrarlo en la lista visual
    const insumoOriginal = productos.find(p => p.id === parseInt(insumoSelec))
    
    const nuevoIngrediente = {
      insumo_id: parseInt(insumoSelec),
      nombre: insumoOriginal.nombre, // Solo para mostrar en pantalla
      cantidad: parseInt(cantidadInsumo)
    }

    setReceta([...receta, nuevoIngrediente])
    setInsumoSelec('') // Limpiar selector
    setCantidadInsumo(1)
  }

  const quitarIngrediente = (index) => {
    const nuevaReceta = [...receta]
    nuevaReceta.splice(index, 1)
    setReceta(nuevaReceta)
  }

  // --- GUARDADO EN BASE DE DATOS ---
  const crearProducto = async (e) => {
    e.preventDefault()
    setCargando(true)

    try {
      // 1. Insertamos el PRODUCTO principal
      const { data, error } = await supabase
        .from('productos')
        .insert([{
          nombre: nuevoProd.nombre,
          tipo: nuevoProd.tipo,
          stock_actual: parseInt(nuevoProd.stock_actual),
          precio_minorista: parseFloat(nuevoProd.precio_minorista)
        }])
        .select() // Importante: Pedimos que nos devuelva el dato creado para tener su ID

      if (error) throw error

      const productoCreadoId = data[0].id

      // 2. Si es compuesto, insertamos su RECETA
      if (nuevoProd.tipo === 'producto_compuesto' && receta.length > 0) {
        // Preparamos los datos para la tabla 'recetas'
        const filasReceta = receta.map(ingrediente => ({
          producto_padre_id: productoCreadoId,
          insumo_id: ingrediente.insumo_id,
          cantidad_necesaria: ingrediente.cantidad
        }))

        const { error: errorReceta } = await supabase
          .from('recetas')
          .insert(filasReceta)

        if (errorReceta) throw errorReceta
      }

      alert('Producto guardado correctamente')
      
      // Limpieza total
      setNuevoProd({ nombre: '', tipo: 'materia_prima', stock_actual: 0, precio_minorista: 0 })
      setReceta([])
      recargarDatos()

    } catch (error) {
      alert('Error al guardar: ' + error.message)
    } finally {
      setCargando(false)
    }
  }

  // --- BORRAR PRODUCTO ---
  const eliminarProducto = async (id) => {
    if (!window.confirm('¿Confirmar eliminacion permanente?')) return
    try {
      // Primero borramos la receta si existe (para que no de error de FK)
      await supabase.from('recetas').delete().eq('producto_padre_id', id)
      
      // Luego borramos el producto
      const { error } = await supabase.from('productos').delete().eq('id', id)
      if (error) throw error
      
      alert('Eliminado correctamente')
      recargarDatos()
    } catch (error) {
      alert('No se puede eliminar: El producto es parte de un pedido o receta existente.')
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in">
      
      {/* FORMULARIO DE ALTA */}
      <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Alta de Inventario</h2>
        
        <form onSubmit={crearProducto} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre</label>
              <input 
                required
                className="w-full p-2 border rounded"
                value={nuevoProd.nombre} 
                onChange={e => setNuevoProd({...nuevoProd, nombre: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Item</label>
              <select 
                className="w-full p-2 border rounded bg-white"
                value={nuevoProd.tipo} 
                onChange={e => setNuevoProd({...nuevoProd, tipo: e.target.value})}
              >
                <option value="materia_prima">Materia Prima (Insumo)</option>
                <option value="producto_compuesto">Producto Compuesto (Fabricable)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Precio Venta ($)</label>
              <input 
                type="number" required
                className="w-full p-2 border rounded"
                value={nuevoProd.precio_minorista} 
                onChange={e => setNuevoProd({...nuevoProd, precio_minorista: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Stock Inicial</label>
              <input 
                type="number" required
                className="w-full p-2 border rounded"
                value={nuevoProd.stock_actual} 
                onChange={e => setNuevoProd({...nuevoProd, stock_actual: e.target.value})}
                disabled={nuevoProd.tipo === 'producto_compuesto'} 
                title={nuevoProd.tipo === 'producto_compuesto' ? 'El stock de productos compuestos depende de la fabricacion' : ''}
              />
            </div>
          </div>

          {/* --- CONSTRUCTOR DE RECETAS (Solo visible si es Compuesto) --- */}
          {nuevoProd.tipo === 'producto_compuesto' && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="font-bold text-blue-900 mb-3 text-sm">Definir Receta de Fabricacion</h3>
              
              <div className="flex gap-2 mb-4 items-end">
                <div className="flex-1">
                  <label className="text-xs text-blue-700">Insumo Requerido</label>
                  <select 
                    className="w-full p-2 border rounded text-sm"
                    value={insumoSelec}
                    onChange={e => setInsumoSelec(e.target.value)}
                  >
                    <option value="">-- Seleccionar Insumo --</option>
                    {materiasPrimas.map(m => (
                      <option key={m.id} value={m.id}>{m.nombre} (Stock: {m.stock_actual})</option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <label className="text-xs text-blue-700">Cantidad</label>
                  <input 
                    type="number" 
                    className="w-full p-2 border rounded text-sm"
                    value={cantidadInsumo}
                    onChange={e => setCantidadInsumo(e.target.value)}
                  />
                </div>
                <button 
                  type="button"
                  onClick={agregarIngrediente}
                  className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700"
                >
                  + Agregar
                </button>
              </div>

              {/* Lista de ingredientes agregados */}
              {receta.length > 0 && (
                <div className="bg-white rounded border border-blue-200 overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-blue-100 text-blue-800">
                      <tr>
                        <th className="p-2">Insumo</th>
                        <th className="p-2">Cant. Necesaria</th>
                        <th className="p-2 text-right"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {receta.map((item, index) => (
                        <tr key={index} className="border-b border-blue-50">
                          <td className="p-2">{item.nombre}</td>
                          <td className="p-2 font-bold">{item.cantidad} u.</td>
                          <td className="p-2 text-right">
                            <button type="button" onClick={() => quitarIngrediente(index)} className="text-red-500 font-bold hover:text-red-700">X</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {receta.length === 0 && <p className="text-xs text-blue-400 italic">Agregue los materiales necesarios para fabricar 1 unidad de este producto.</p>}
            </div>
          )}

          <button disabled={cargando} className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800">
            {cargando ? 'Guardando...' : 'GUARDAR PRODUCTO'}
          </button>
        </form>
      </div>

      {/* LISTADO */}
      <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-500 uppercase font-bold text-xs">
            <tr>
              <th className="p-4">Producto</th>
              <th className="p-4">Tipo</th>
              <th className="p-4">Stock Actual</th>
              <th className="p-4 text-right">Accion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {productos.map(p => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="p-4 font-bold text-slate-700">{p.nombre}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                    p.tipo === 'materia_prima' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {p.tipo === 'materia_prima' ? 'Insumo' : 'Compuesto'}
                  </span>
                </td>
                <td className="p-4 font-mono font-bold text-slate-600">{p.stock_actual}</td>
                <td className="p-4 text-right">
                  <button onClick={() => eliminarProducto(p.id)} className="text-red-600 hover:text-red-800 font-bold text-xs border border-red-200 px-2 py-1 rounded bg-red-50">
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}