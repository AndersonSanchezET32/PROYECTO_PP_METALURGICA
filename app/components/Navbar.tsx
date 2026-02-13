// @ts-nocheck
'use client'

interface NavbarProps {
  vistaActual: string;
  setVistaActual: (vista: string) => void;
  user: { name: string; role: string } | null;
  onLogout: () => void;
}

export default function Navbar({ vistaActual, setVistaActual, user, onLogout }: NavbarProps) {
  
  // Definimos las pestañas base disponibles para todos
  const tabs = [
    { id: 'ventas', label: 'Ventas' },
    { id: 'clientes', label: 'Clientes' },
    { id: 'taller', label: 'Taller' },
    { id: 'inventario', label: 'Inventario' },
    { id: 'gerencia', label: 'Gerencia' }
  ]

  // LÓGICA DE SEGURIDAD:
  // Si el usuario es 'Administrador', le agregamos la pestaña de Usuarios
  if (user?.role === 'Administrador') {
    tabs.push({ id: 'usuarios', label: ' Usuarios' })
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
        
        {/* Logo y Usuario */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 text-white w-10 h-10 flex items-center justify-center rounded-lg font-bold text-xl shadow-md">
            M
          </div>
          <div>
            <h1 className="font-bold text-slate-900 tracking-tight leading-tight">METALÚRGICA N°32</h1>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                {user?.name || 'Invitado'}
              </span>
              {/* Etiqueta de Rol */}
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                user?.role === 'Administrador' ? 'bg-purple-100 text-purple-700' : 
                user?.role === 'Vendedor' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {user?.role || 'Sin Rol'}
              </span>
            </div>
          </div>
        </div>

        {/* Navegación y Salir */}
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex bg-slate-100 p-1 rounded-lg">
            {tabs.map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setVistaActual(tab.id)}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                  vistaActual === tab.id 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          
          <button 
            onClick={onLogout} 
            className="text-xs font-bold text-red-500 hover:text-red-700 uppercase border border-red-100 px-3 py-2 rounded hover:bg-red-50 transition-colors"
          >
            Salir
          </button>
        </div>
      </div>
      
      <div className="md:hidden flex overflow-x-auto p-2 gap-2 bg-slate-50 border-t border-slate-200 scrollbar-hide">
         {tabs.map(tab => (
            <button key={tab.id} onClick={() => setVistaActual(tab.id)}
              className={`whitespace-nowrap px-3 py-1 rounded text-xs font-bold ${vistaActual === tab.id ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>
              {tab.label}
            </button>
         ))}
      </div>
    </header>
  )
}