// ─── Utilidades UI ───────────────────────────────────────────
const normEstado = (e) => (e || '').toString().toLowerCase();

const UI = {
  showAlert(container, mensaje, tipo = 'error') {
    container.innerHTML = `<div class="alert alert-${tipo}">${mensaje}</div>`;
    setTimeout(() => { container.innerHTML = ''; }, 4000);
  },

  badgeEstado(estado) {
    const key = normEstado(estado);
    const map = {
      activo: 'badge-activo',
      disponible: 'badge-activo',
      inactivo: 'badge-inactivo',
      ocupado: 'badge-inactivo',
      mantenimiento: 'badge-mantenimiento',
      en_mantenimiento: 'badge-mantenimiento',
      pendiente: 'badge-pendiente',
      aprobada: 'badge-aprobada',
      rechazada: 'badge-rechazada',
      cancelada: 'badge-cancelada',
      planeada: 'badge-pendiente',
      parcial: 'badge-mantenimiento',
      ejecutada: 'badge-aprobada',
      activa: 'badge-aprobada',
      cerrada: 'badge-inactivo',
      reportada: 'badge-pendiente',
      prestado: 'badge-pendiente',
      devuelto: 'badge-aprobada',
    };
    const etiqueta = key.replace(/_/g, ' ');
    return `<span class="badge ${map[key] || ''}">${etiqueta}</span>`;
  },

  openModal(titulo, bodyHtml, footerHtml) {
    document.getElementById('modalTitle').textContent = titulo;
    document.getElementById('modalBody').innerHTML = bodyHtml;
    document.getElementById('modalFooter').innerHTML = footerHtml;
    document.getElementById('modalOverlay').classList.remove('hidden');
  },

  closeModal() {
    document.getElementById('modalOverlay').classList.add('hidden');
  },
};

document.getElementById('modalClose').addEventListener('click', UI.closeModal);
document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target.id === 'modalOverlay') UI.closeModal();
});

// ─── Navegación por rol (RF-29) ──────────────────────────────
function buildSidebar() {
  const nav = document.getElementById('sidebarNav');
  nav.innerHTML = '';
  let grupoActual = null;

  MODULOS.forEach((mod) => {
    if (mod.permiso && !Auth.tienePermiso(mod.permiso)) return;

    if (mod.grupo && mod.grupo !== grupoActual) {
      grupoActual = mod.grupo;
      nav.innerHTML += `<div class="nav-group-title">${mod.grupo}</div>`;
    }

    nav.innerHTML += `
      <button class="nav-item" data-module="${mod.id}">
        <span class="nav-icon">${mod.icono || ''}</span>
        <span class="nav-text">${mod.titulo}</span>
      </button>`;
  });

  nav.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.module));
  });
}

function navigateTo(moduleId) {
  closeSidebarMobile();
  document.querySelectorAll('.nav-item').forEach((b) => b.classList.remove('active'));
  document.querySelector(`[data-module="${moduleId}"]`)?.classList.add('active');

  const mod = MODULOS.find((m) => m.id === moduleId);
  document.getElementById('pageTitle').textContent = mod?.titulo || moduleId;
  document.getElementById('pageSubtitle').textContent = mod?.grupo || '';

  const loaders = {
    inicio: renderInicio,
    'tipos-laboratorio': renderTiposLaboratorio,
    laboratorios: renderLaboratorios,
    usuarios: renderUsuarios,
    reservas: renderReservas,
    analitica: renderAnalitica,
    inventario: renderInventario,
    practicas: renderPracticas,
    consultas: renderConsultas,
    gobernanza: renderGobernanza,
  };

  (loaders[moduleId] || renderInicio)();
}

// ─── RF-16: Tipos de laboratorio ─────────────────────────────
let _tiposCache = [];

async function renderTiposLaboratorio() {
  const area = document.getElementById('contentArea');
  const puedeCrear = Auth.tienePermiso('tiposLaboratorio.crear');
  const puedeEditar = Auth.tienePermiso('tiposLaboratorio.actualizar');

  area.innerHTML = `
    <div id="tiposAlert"></div>
    <div class="card">
      <div class="card-header">
        <h2>Tipos de laboratorio</h2>
        ${puedeCrear ? '<button class="btn btn-primary btn-sm" id="btnNuevoTipo">+ Nuevo tipo</button>' : ''}
      </div>
      <div class="card-body" id="tiposTable"><p>Cargando...</p></div>
    </div>`;

  if (puedeCrear) {
    document.getElementById('btnNuevoTipo').addEventListener('click', () => abrirFormTipo());
  }

  await cargarTipos(puedeEditar);
}

async function cargarTipos(puedeEditar) {
  try {
    const { tipos } = await api.get('/tipos-laboratorio');
    _tiposCache = tipos;
    const table = document.getElementById('tiposTable');

    if (!tipos.length) {
      table.innerHTML = '<div class="empty-state">No hay tipos registrados</div>';
      return;
    }

    table.innerHTML = `
      <div class="table-scroll"><table>
        <thead><tr><th>ID</th><th>Nombre</th><th>Estado</th>${puedeEditar ? '<th>Acciones</th>' : ''}</tr></thead>
        <tbody>${tipos.map((t) => `
          <tr>
            <td>${t.id}</td>
            <td>${t.nombre}</td>
            <td>${UI.badgeEstado(t.estado)}</td>
            ${puedeEditar ? `<td class="actions">
              <button class="btn btn-secondary btn-sm" onclick="editarTipo(${t.id})">Editar</button>
              ${normEstado(t.estado) === 'activo' ? `<button class="btn btn-danger btn-sm" onclick="desactivarTipo(${t.id})">Desactivar</button>` : ''}
            </td>` : ''}
          </tr>`).join('')}
        </tbody>
      </table></div>`;
  } catch (err) {
    document.getElementById('tiposTable').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

function editarTipo(id) {
  const tipo = _tiposCache.find((t) => t.id === id);
  if (tipo) abrirFormTipo(tipo);
}

function abrirFormTipo(tipo = null) {
  UI.openModal(
    tipo ? 'Editar tipo de laboratorio' : 'Nuevo tipo de laboratorio',
    `<div class="form-group"><label>Nombre</label>
     <input id="fTipoNombre" value="${tipo?.nombre || ''}" placeholder="Ej: software, hardware, electrónica"></div>
     ${tipo ? `<div class="form-group"><label>Estado</label>
     <select id="fTipoEstado"><option value="activo" ${normEstado(tipo.estado)==='activo'?'selected':''}>Activo</option>
     <option value="inactivo" ${normEstado(tipo.estado)==='inactivo'?'selected':''}>Inactivo</option></select></div>` : ''}`,
    `<button class="btn btn-secondary" onclick="UI.closeModal()">Cancelar</button>
     <button class="btn btn-primary" id="btnGuardarTipo">Guardar</button>`
  );

  document.getElementById('btnGuardarTipo').addEventListener('click', async () => {
    const nombre = document.getElementById('fTipoNombre').value.trim();
    if (!nombre) return;
    try {
      if (tipo) {
        const body = { nombre };
        const estado = document.getElementById('fTipoEstado')?.value;
        if (estado) body.estado = estado;
        await api.put(`/tipos-laboratorio/${tipo.id}`, body);
      } else {
        await api.post('/tipos-laboratorio', { nombre });
      }
      UI.closeModal();
      UI.showAlert(document.getElementById('tiposAlert'), 'Tipo guardado correctamente', 'success');
      await cargarTipos(true);
    } catch (err) {
      UI.showAlert(document.getElementById('tiposAlert'), err.message);
    }
  });
}

async function desactivarTipo(id) {
  if (!confirm('¿Desactivar este tipo de laboratorio?')) return;
  try {
    await api.patch(`/tipos-laboratorio/${id}/desactivar`);
    UI.showAlert(document.getElementById('tiposAlert'), 'Tipo desactivado', 'success');
    await cargarTipos(true);
  } catch (err) {
    UI.showAlert(document.getElementById('tiposAlert'), err.message);
  }
}

// ─── RF-17: Laboratorios ─────────────────────────────────────
let _labsCache = [];

async function renderLaboratorios() {
  const area = document.getElementById('contentArea');
  const puedeCrear = Auth.tienePermiso('laboratorios.crear');
  const puedeEditar = Auth.tienePermiso('laboratorios.actualizar');

  area.innerHTML = `
    <div id="labsAlert"></div>
    <div class="card">
      <div class="card-header">
        <h2>Laboratorios</h2>
        ${puedeCrear ? '<button class="btn btn-primary btn-sm" id="btnNuevoLab">+ Nuevo laboratorio</button>' : ''}
      </div>
      <div class="card-body" id="labsTable"><p>Cargando...</p></div>
    </div>`;

  if (puedeCrear) {
    document.getElementById('btnNuevoLab').addEventListener('click', () => abrirFormLab());
  }

  await cargarLaboratorios(puedeEditar);
}

async function cargarLaboratorios(puedeEditar) {
  try {
    const { laboratorios } = await api.get('/laboratorios');
    _labsCache = laboratorios;
    const table = document.getElementById('labsTable');

    if (!laboratorios.length) {
      table.innerHTML = '<div class="empty-state">No hay laboratorios registrados</div>';
      return;
    }

    table.innerHTML = `
      <div class="table-scroll"><table>
        <thead><tr>
          <th>Nombre</th><th>Ubicación</th><th>Tipo</th><th>Capacidad</th>
          <th>Equipos</th><th>Estado</th>${puedeEditar ? '<th>Acciones</th>' : ''}
        </tr></thead>
        <tbody>${laboratorios.map((l) => `
          <tr>
            <td><strong>${l.nombre}</strong></td>
            <td>${l.ubicacion}</td>
            <td>${l.tipo?.nombre || '—'}</td>
            <td>${l.capacidad}</td>
            <td>${l.totalEquipos ?? 0}</td>
            <td>${UI.badgeEstado(l.estado)}</td>
            ${puedeEditar ? `<td class="actions">
              <button class="btn btn-secondary btn-sm" onclick="editarLab(${l.id})">Editar</button>
              ${l.estado !== 'inactivo' ? `<button class="btn btn-danger btn-sm" onclick="desactivarLab(${l.id})">Desactivar</button>` : ''}
            </td>` : ''}
          </tr>`).join('')}
        </tbody>
      </table></div>`;
  } catch (err) {
    document.getElementById('labsTable').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

function editarLab(id) {
  const lab = _labsCache.find((l) => l.id === id);
  if (lab) abrirFormLab(lab);
}

async function abrirFormLab(lab = null) {
  const { tipos } = await api.get('/tipos-laboratorio?estado=activo');
  const tiposOptions = tipos.map((t) =>
    `<option value="${t.id}" ${lab?.tipo_id === t.id ? 'selected' : ''}>${t.nombre}</option>`
  ).join('');

  UI.openModal(
    lab ? 'Editar laboratorio' : 'Nuevo laboratorio',
    `<div class="form-group"><label>Nombre</label><input id="fLabNombre" value="${lab?.nombre || ''}"></div>
     <div class="form-group"><label>Ubicación</label><input id="fLabUbicacion" value="${lab?.ubicacion || ''}"></div>
     <div class="form-group"><label>Equipamiento</label><textarea id="fLabEquipamiento" rows="3" placeholder="Descripción del equipamiento">${lab?.equipamiento || ''}</textarea></div>
     <div class="form-row">
       <div class="form-group"><label>Capacidad</label><input type="number" id="fLabCapacidad" value="${lab?.capacidad || 0}" min="0"></div>
       <div class="form-group"><label>Tipo</label><select id="fLabTipo"><option value="">Seleccionar...</option>${tiposOptions}</select></div>
     </div>
     ${lab ? `<div class="form-group"><label>Estado</label>
       <select id="fLabEstado">
         <option value="activo" ${normEstado(lab.estado)==='disponible'?'selected':''}>Disponible</option>
         <option value="inactivo" ${normEstado(lab.estado)==='en_mantenimiento'?'selected':''}>En mantenimiento</option>
         <option value="ocupado" ${normEstado(lab.estado)==='ocupado'?'selected':''}>Ocupado</option>
       </select></div>
       ${lab.equipos?.length ? `<div class="form-group"><label>Equipamiento (${lab.equipos.length})</label>
         <ul style="font-size:0.875rem;color:var(--muted);padding-left:1.25rem">
           ${lab.equipos.map(e => `<li>${e.nombre} — ${e.tipo} (${e.estado})</li>`).join('')}
         </ul></div>` : ''}` : ''}`,
    `<button class="btn btn-secondary" onclick="UI.closeModal()">Cancelar</button>
     <button class="btn btn-primary" id="btnGuardarLab">Guardar</button>`
  );

  document.getElementById('btnGuardarLab').addEventListener('click', async () => {
    const body = {
      nombre: document.getElementById('fLabNombre').value.trim(),
      ubicacion: document.getElementById('fLabUbicacion').value.trim(),
      capacidad: parseInt(document.getElementById('fLabCapacidad').value, 10) || 0,
      tipo_id: parseInt(document.getElementById('fLabTipo').value, 10),
      equipamiento: document.getElementById('fLabEquipamiento').value.trim() || null,
    };
    const estado = document.getElementById('fLabEstado')?.value;
    if (estado) body.estado = estado;

    if (!body.nombre || !body.ubicacion || !body.tipo_id) {
      alert('Complete todos los campos requeridos');
      return;
    }

    try {
      if (lab) {
        await api.put(`/laboratorios/${lab.id}`, body);
      } else {
        await api.post('/laboratorios', body);
      }
      UI.closeModal();
      UI.showAlert(document.getElementById('labsAlert'), 'Laboratorio guardado', 'success');
      await cargarLaboratorios(true);
    } catch (err) {
      UI.showAlert(document.getElementById('labsAlert'), err.message);
    }
  });
}

async function desactivarLab(id) {
  if (!confirm('¿Desactivar este laboratorio?')) return;
  try {
    await api.patch(`/laboratorios/${id}/desactivar`);
    UI.showAlert(document.getElementById('labsAlert'), 'Laboratorio desactivado', 'success');
    await cargarLaboratorios(true);
  } catch (err) {
    UI.showAlert(document.getElementById('labsAlert'), err.message);
  }
}

// ─── RF-18: Usuarios ─────────────────────────────────────────
let _usersCache = [];

async function renderUsuarios() {
  const area = document.getElementById('contentArea');
  const puedeCrear = Auth.tienePermiso('usuarios.crear');
  const puedeEditar = Auth.tienePermiso('usuarios.actualizar');

  area.innerHTML = `
    <div id="usersAlert"></div>
    <div class="card">
      <div class="card-header">
        <h2>Usuarios del sistema</h2>
        ${puedeCrear ? '<button class="btn btn-primary btn-sm" id="btnNuevoUser">+ Nuevo usuario</button>' : ''}
      </div>
      <div class="card-body">
        <div class="filters-inline">
          <input id="filtroBusqueda" class="filter-input" placeholder="Buscar por nombre o email...">
          <select id="filtroRol" class="filter-select">
            <option value="">Todos los roles</option>
          </select>
        </div>
        <div id="usersTable"><p>Cargando...</p></div>
      </div>
    </div>`;

  if (puedeCrear) {
    document.getElementById('btnNuevoUser').addEventListener('click', () => abrirFormUsuario());
  }

  document.getElementById('filtroBusqueda').addEventListener('input', () => cargarUsuarios(puedeEditar));
  document.getElementById('filtroRol').addEventListener('change', () => cargarUsuarios(puedeEditar));

  await cargarUsuarios(puedeEditar);
}

async function cargarUsuarios(puedeEditar) {
  try {
    const busqueda = document.getElementById('filtroBusqueda')?.value || '';
    const rol = document.getElementById('filtroRol')?.value || '';
    let url = '/usuarios?';
    if (busqueda) url += `busqueda=${encodeURIComponent(busqueda)}&`;
    if (rol) url += `rol=${encodeURIComponent(rol)}&`;

    const { usuarios } = await api.get(url);
    _usersCache = usuarios;

    const filtroRol = document.getElementById('filtroRol');
    if (filtroRol.options.length <= 1) {
      const rolesUnicos = [...new Set(usuarios.map((u) => u.rol?.nombre).filter(Boolean))];
      rolesUnicos.forEach((r) => {
        filtroRol.innerHTML += `<option value="${r}">${ETIQUETAS_ROLES[r] || r}</option>`;
      });
    }

    const table = document.getElementById('usersTable');
    if (!usuarios.length) {
      table.innerHTML = '<div class="empty-state">No se encontraron usuarios</div>';
      return;
    }

    table.innerHTML = `
      <div class="table-scroll"><table>
        <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th>${puedeEditar ? '<th>Acciones</th>' : ''}</tr></thead>
        <tbody>${usuarios.map((u) => `
          <tr>
            <td>${u.nombre}</td>
            <td>${u.email}</td>
            <td>${ETIQUETAS_ROLES[u.rol?.nombre] || u.rol?.nombre || '—'}</td>
            <td>${UI.badgeEstado(u.estado)}</td>
            ${puedeEditar ? `<td class="actions">
              <button class="btn btn-secondary btn-sm" onclick="editarUsuario(${u.id})">Editar</button>
              ${normEstado(u.estado) === 'activo' ? `<button class="btn btn-danger btn-sm" onclick="desactivarUsuario(${u.id})">Desactivar</button>` : ''}
            </td>` : ''}
          </tr>`).join('')}
        </tbody>
      </table></div>`;
  } catch (err) {
    document.getElementById('usersTable').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

function editarUsuario(id) {
  const user = _usersCache.find((u) => u.id === id);
  if (user) abrirFormUsuario(user);
}

async function abrirFormUsuario(user = null) {
  const { roles } = await api.get('/roles');
  const rolesOptions = roles.map((r) =>
    `<option value="${r.id}" ${user?.rol_id === r.id ? 'selected' : ''}>${ETIQUETAS_ROLES[r.nombre] || r.nombre}</option>`
  ).join('');

  UI.openModal(
    user ? 'Editar usuario' : 'Nuevo usuario',
    `<div class="form-group"><label>Nombre completo</label><input id="fUserNombre" value="${user?.nombre || ''}"></div>
     <div class="form-group"><label>Correo institucional</label><input type="email" id="fUserEmail" value="${user?.email || ''}"></div>
     <div class="form-group"><label>Rol</label><select id="fUserRol"><option value="">Seleccionar rol...</option>${rolesOptions}</select></div>
     <div class="form-group"><label>${user ? 'Nueva contraseña (opcional)' : 'Contraseña'}</label>
       <input type="password" id="fUserPass" ${user ? '' : 'required'}></div>`,
    `<button class="btn btn-secondary" onclick="UI.closeModal()">Cancelar</button>
     <button class="btn btn-primary" id="btnGuardarUser">Guardar</button>`
  );

  document.getElementById('btnGuardarUser').addEventListener('click', async () => {
    const body = {
      nombre: document.getElementById('fUserNombre').value.trim(),
      email: document.getElementById('fUserEmail').value.trim(),
      rol_id: parseInt(document.getElementById('fUserRol').value, 10),
    };
    const pass = document.getElementById('fUserPass').value;
    if (pass) body.contrasena = pass;

    if (!body.nombre || !body.email || !body.rol_id) {
      alert('Complete los campos requeridos');
      return;
    }
    if (!user && !pass) {
      alert('La contraseña es requerida para nuevos usuarios');
      return;
    }

    try {
      if (user) {
        await api.put(`/usuarios/${user.id}`, body);
      } else {
        await api.post('/usuarios', body);
      }
      UI.closeModal();
      UI.showAlert(document.getElementById('usersAlert'), 'Usuario guardado', 'success');
      await cargarUsuarios(true);
    } catch (err) {
      UI.showAlert(document.getElementById('usersAlert'), err.message);
    }
  });
}

async function desactivarUsuario(id) {
  if (!confirm('¿Desactivar este usuario?')) return;
  try {
    await api.patch(`/usuarios/${id}/desactivar`);
    UI.showAlert(document.getElementById('usersAlert'), 'Usuario desactivado', 'success');
    await cargarUsuarios(true);
  } catch (err) {
    UI.showAlert(document.getElementById('usersAlert'), err.message);
  }
}

// ─── Módulos adicionales (vista básica RF-29) ────────────────
// ─── Dashboard (vista de inicio) ─────────────────────────────
const DASH_ICONS = {
  flask: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6"/><path d="M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>',
  warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
};

const INV_COLORES = {
  disponible: { color: '#16a34a', etiqueta: 'Disponible' },
  prestado: { color: '#4b3f9e', etiqueta: 'En préstamo' },
  mantenimiento: { color: '#d97706', etiqueta: 'En reparación' },
  baja: { color: '#dc2626', etiqueta: 'Fuera de servicio' },
};

let _ocupacionDash = [];

async function renderInicio() {
  const area = document.getElementById('contentArea');
  area.innerHTML = '<div class="empty-state">Cargando panel...</div>';

  let laboratorios = [];
  let reservas = [];
  try { laboratorios = (await api.get('/laboratorios')).laboratorios || []; } catch (_) { /* sin acceso */ }
  try { reservas = (await api.get('/reservas/calendario')).reservas || []; } catch (_) { /* sin acceso */ }

  const ahora = Date.now();
  const hace7 = ahora - 7 * 86400000;
  const en7 = ahora + 7 * 86400000;

  const labsActivos = laboratorios.filter((l) => normEstado(l.estado) === 'disponible').length;
  const labsMantenimiento = laboratorios.filter((l) => normEstado(l.estado) === 'en_mantenimiento');

  const activas = reservas.filter((r) => normEstado(r.estado) === 'pendiente' || normEstado(r.estado) === 'aprobada');
  const reservasSemana = activas.filter((r) => {
    const f = new Date(r.fecha).getTime();
    return f >= hace7 && f <= en7;
  });
  const pendientes = reservas.filter((r) => normEstado(r.estado) === 'pendiente');
  const aprobadas = reservas.filter((r) => normEstado(r.estado) === 'aprobada');
  const baseEstado = reservas.length || 1;
  const pctAprob = Math.round((aprobadas.length / baseEstado) * 100);

  // Ocupación por laboratorio (reservas activas) — top 6
  const conteo = {};
  activas.forEach((r) => {
    const nombre = r.laboratorio?.nombre || 'Laboratorio';
    conteo[nombre] = (conteo[nombre] || 0) + 1;
  });
  _ocupacionDash = Object.entries(conteo)
    .map(([nombre, total]) => ({ nombre, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);
  const maxOcup = Math.max(1, ..._ocupacionDash.map((o) => o.total));
  const minOcup = Math.min(..._ocupacionDash.map((o) => o.total));

  // Inventario (solo si tiene permiso) — dona
  let inv = null;
  if (Auth.tienePermiso('inventario.consultar') && laboratorios.length) {
    inv = { disponible: 0, prestado: 0, mantenimiento: 0, baja: 0 };
    const consultables = laboratorios.filter((l) => l.estado !== 'inactivo');
    const resultados = await Promise.allSettled(
      consultables.map((l) => api.get(`/inventario/laboratorio/${l.id}`))
    );
    resultados.forEach((r) => {
      const pe = r.status === 'fulfilled' ? r.value?.resumen?.porEstado : null;
      if (pe) {
        inv.disponible += pe.disponible || 0;
        inv.prestado += pe.prestado || 0;
        inv.mantenimiento += pe.mantenimiento || 0;
        inv.baja += pe.baja || 0;
      }
    });
  }

  // Alertas del sistema (derivadas de datos reales)
  const alertas = [];
  if (labsMantenimiento.length) {
    alertas.push({ tipo: 'danger', titulo: `${labsMantenimiento.length} laboratorio(s) en mantenimiento`, detalle: labsMantenimiento.map((l) => l.nombre).join(', ') });
  }
  if (inv && inv.mantenimiento) {
    alertas.push({ tipo: 'warning', titulo: `${inv.mantenimiento} equipo(s) en reparación`, detalle: 'Revisa el inventario para más detalle' });
  }
  if (pendientes.length) {
    alertas.push({ tipo: 'info', titulo: `${pendientes.length} solicitud(es) de reserva pendientes`, detalle: 'Esperando aprobación' });
  }
  if (!alertas.length) {
    alertas.push({ tipo: 'success', titulo: 'Todo en orden', detalle: 'No hay alertas activas en este momento' });
  }

  const recientes = [...reservas]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 5);

  area.innerHTML = `
    <div class="dash-kpis">
      ${kpiCard(DASH_ICONS.flask, 'neutral', labsActivos, 'Laboratorios activos', `de ${laboratorios.length} registrados`)}
      ${kpiCard(DASH_ICONS.calendar, 'info', reservasSemana.length, 'Reservas esta semana', 'ventana de 7 días')}
      ${kpiCard(DASH_ICONS.check, 'success', `${pctAprob}%`, 'Reservas aprobadas', `${aprobadas.length} de ${reservas.length}`)}
      ${kpiCard(DASH_ICONS.warning, 'danger', pendientes.length, 'Reservas pendientes', 'por aprobar')}
    </div>

    <div class="dash-row">
      <div class="dash-panel">
        <div class="panel-head">
          <h2>Ocupación por laboratorio</h2>
          <button class="btn btn-secondary btn-sm" id="btnExportOcup">Exportar</button>
        </div>
        ${_ocupacionDash.length ? `
        <div class="bar-chart">
          ${_ocupacionDash.map((o) => {
            const pct = Math.round((o.total / maxOcup) * 100);
            const esMin = o.total === minOcup && _ocupacionDash.length > 1;
            return `<div class="bar-row">
              <span class="bar-label" title="${o.nombre}">${o.nombre}</span>
              <span class="bar-track"><span class="bar-fill ${esMin ? 'bar-fill-low' : ''}" style="width:${pct}%"></span></span>
              <span class="bar-value">${o.total}</span>
            </div>`;
          }).join('')}
        </div>` : '<div class="empty-state">Sin reservas para mostrar ocupación</div>'}
      </div>

      <div class="dash-panel">
        <div class="panel-head"><h2>Estado de inventario</h2></div>
        ${donutInventario(inv)}
      </div>
    </div>

    <div class="dash-row">
      <div class="dash-panel">
        <div class="panel-head"><h2>Reservas recientes</h2></div>
        ${recientes.length ? `
        <div class="table-scroll"><table>
          <thead><tr><th>Laboratorio</th><th>Docente</th><th>Asignatura</th><th>Fecha</th><th>Estado</th></tr></thead>
          <tbody>${recientes.map((r) => `
            <tr>
              <td>${r.laboratorio?.nombre || '—'}</td>
              <td>${r.docente?.nombre || '—'}</td>
              <td>${r.asignatura || '—'}</td>
              <td>${r.fecha}</td>
              <td>${UI.badgeEstado(r.estado)}</td>
            </tr>`).join('')}
          </tbody>
        </table></div>` : '<div class="empty-state">No hay reservas registradas</div>'}
      </div>

      <div class="dash-panel">
        <div class="panel-head"><h2>Alertas del sistema</h2></div>
        <div class="dash-alerts">
          ${alertas.map((a) => `
            <div class="dash-alert dash-alert-${a.tipo}">
              <strong>${a.titulo}</strong>
              <span>${a.detalle}</span>
            </div>`).join('')}
        </div>
      </div>
    </div>`;

  document.getElementById('btnExportOcup')?.addEventListener('click', exportarOcupacionCSV);
}

function kpiCard(icono, tono, valor, etiqueta, sub) {
  return `<div class="kpi-card">
    <div class="kpi-top">
      <div class="kpi-text">
        <div class="kpi-value">${valor}</div>
        <div class="kpi-label">${etiqueta}</div>
      </div>
      <div class="kpi-icon kpi-icon-${tono}">${icono}</div>
    </div>
    <div class="kpi-sub">${sub}</div>
  </div>`;
}

function donutInventario(inv) {
  const total = inv ? inv.disponible + inv.prestado + inv.mantenimiento + inv.baja : 0;
  if (!inv) {
    return '<div class="empty-state">Sin acceso al inventario para tu rol</div>';
  }
  if (!total) {
    return '<div class="empty-state">No hay equipos registrados</div>';
  }

  const orden = ['disponible', 'prestado', 'mantenimiento', 'baja'];
  let acumulado = 0;
  const tramos = [];
  const leyenda = [];
  orden.forEach((clave) => {
    const cantidad = inv[clave];
    const pct = Math.round((cantidad / total) * 100);
    const inicio = acumulado;
    acumulado += pct;
    const { color, etiqueta } = INV_COLORES[clave];
    tramos.push(`${color} ${inicio}% ${acumulado}%`);
    leyenda.push(`<div class="legend-item">
      <span class="legend-dot" style="background:${color}"></span>
      <span class="legend-name">${etiqueta}</span>
      <span class="legend-val">${pct}%</span>
    </div>`);
  });

  return `<div class="donut-wrap">
    <div class="donut" style="background:conic-gradient(${tramos.join(',')})">
      <div class="donut-hole"><span>${total}</span><small>equipos</small></div>
    </div>
    <div class="donut-legend">${leyenda.join('')}</div>
  </div>`;
}

function exportarOcupacionCSV() {
  if (!_ocupacionDash.length) return;
  const filas = [['Laboratorio', 'Reservas activas'], ..._ocupacionDash.map((o) => [o.nombre, o.total])];
  const csv = filas.map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ocupacion-laboratorios.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Reservas (gestión) ──────────────────────────────────────
const MESES_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const RESERVAS_PAGE_SIZE = 8;
const ICO_EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>';
const ICO_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
const ICO_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
const ICO_TABLA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
const ICO_TARJETAS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>';

let _reservasData = [];
let _reservasPage = 1;
let _reservasVista = 'tabla';

function fechaLarga(f) {
  if (!f) return '—';
  const [y, m, d] = String(f).split('-').map(Number);
  if (!y || !m || !d) return f;
  return `${d} ${MESES_ES[m - 1]} ${y}`;
}

function horaCorta(h) {
  return (h || '').slice(0, 5);
}

async function renderReservas() {
  const puedeSolicitar = Auth.tienePermiso('reservas.solicitar');
  _reservasVista = 'tabla';
  _reservasPage = 1;

  document.getElementById('pageTitle').textContent = 'Gestión de Reservas';
  document.getElementById('pageSubtitle').textContent = 'Portal · Reservas';

  document.getElementById('contentArea').innerHTML = `
    <div id="reservasAlert"></div>
    <div class="reservas-toolbar">
      ${puedeSolicitar ? '<button class="btn btn-primary" id="btnSolicitarReserva">+ Nueva Reserva</button>' : '<span></span>'}
      <div class="view-toggle">
        <button class="view-btn active" data-vista="tabla" title="Vista de tabla" onclick="cambiarVistaReservas('tabla')">${ICO_TABLA}</button>
        <button class="view-btn" data-vista="calendario" title="Vista de tarjetas" onclick="cambiarVistaReservas('calendario')">${ICO_TARJETAS}</button>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <div class="reservas-filtros">
          <div class="filtro-buscar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
            <input type="search" id="resBuscar" placeholder="Buscar por laboratorio o docente...">
          </div>
          <select id="resLab" class="filtro-select"><option value="">Laboratorio: Todos</option></select>
          <select id="resEstado" class="filtro-select">
            <option value="">Estado: Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="aprobada">Aprobada</option>
            <option value="rechazada">Rechazada</option>
            <option value="cancelada">Cancelada</option>
          </select>
          <input type="date" id="resDesde" class="filtro-date" title="Desde">
          <input type="date" id="resHasta" class="filtro-date" title="Hasta">
          <button class="auth-link" id="btnLimpiarFiltros" type="button">Limpiar filtros</button>
        </div>
        <div id="reservasContent"><div class="empty-state">Cargando reservas...</div></div>
      </div>
    </div>`;

  if (puedeSolicitar) {
    document.getElementById('btnSolicitarReserva').addEventListener('click', abrirFormReserva);
  }

  try {
    const { laboratorios } = await api.get('/laboratorios');
    const sel = document.getElementById('resLab');
    laboratorios.forEach((l) => {
      sel.innerHTML += `<option value="${l.id}">${l.nombre}</option>`;
    });
  } catch (_) { /* opcional */ }

  ['resBuscar', 'resEstado', 'resLab', 'resDesde', 'resHasta'].forEach((id) => {
    const el = document.getElementById(id);
    el?.addEventListener(id === 'resBuscar' ? 'input' : 'change', () => {
      _reservasPage = 1;
      renderVistaReservas();
    });
  });

  document.getElementById('btnLimpiarFiltros').addEventListener('click', () => {
    ['resBuscar', 'resEstado', 'resLab', 'resDesde', 'resHasta'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    _reservasPage = 1;
    renderVistaReservas();
  });

  await recargarReservas();
}

async function recargarReservas() {
  const container = document.getElementById('reservasContent');
  try {
    const { reservas } = await api.get('/reservas/calendario?activas=false');
    _reservasData = reservas || [];
    renderVistaReservas();
  } catch (err) {
    if (container) container.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

function reservasFiltradas() {
  const q = (document.getElementById('resBuscar')?.value || '').trim().toLowerCase();
  const lab = document.getElementById('resLab')?.value || '';
  const estado = document.getElementById('resEstado')?.value || '';
  const desde = document.getElementById('resDesde')?.value || '';
  const hasta = document.getElementById('resHasta')?.value || '';

  return _reservasData.filter((r) => {
    if (lab && String(r.laboratorio_id) !== lab) return false;
    if (estado && r.estado !== estado) return false;
    if (desde && r.fecha < desde) return false;
    if (hasta && r.fecha > hasta) return false;
    if (q) {
      const texto = `${r.laboratorio?.nombre || ''} ${r.docente?.nombre || ''} ${r.asignatura || ''} ${r.grupo || ''}`.toLowerCase();
      if (!texto.includes(q)) return false;
    }
    return true;
  });
}

function renderVistaReservas() {
  const filtradas = reservasFiltradas();
  if (_reservasVista === 'calendario') {
    renderCalendarioReservas(filtradas);
  } else {
    renderTablaReservas(filtradas);
  }
}

function cambiarVistaReservas(vista) {
  _reservasVista = vista;
  document.querySelectorAll('.view-btn').forEach((b) => b.classList.toggle('active', b.dataset.vista === vista));
  renderVistaReservas();
}

function irPaginaReservas(n) {
  if (n < 1) return;
  _reservasPage = n;
  renderVistaReservas();
}

function paginacionBotones(actual, total) {
  if (total <= 1) return '';
  const nums = [];
  const paginas = [...new Set([1, total, actual, actual - 1, actual + 1])]
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b);
  let prev = 0;
  paginas.forEach((n) => {
    if (prev && n - prev > 1) nums.push('<span class="page-ellipsis">…</span>');
    nums.push(`<button class="page-btn ${n === actual ? 'active' : ''}" onclick="irPaginaReservas(${n})">${n}</button>`);
    prev = n;
  });
  return `<button class="page-btn nav" ${actual === 1 ? 'disabled' : ''} onclick="irPaginaReservas(${actual - 1})">‹</button>${nums.join('')}<button class="page-btn nav" ${actual === total ? 'disabled' : ''} onclick="irPaginaReservas(${actual + 1})">›</button>`;
}

function renderTablaReservas(filtradas) {
  const puedeAprobar = Auth.tienePermiso('reservas.aprobar');
  const container = document.getElementById('reservasContent');

  const total = filtradas.length;
  if (!total) {
    container.innerHTML = '<div class="empty-state">No hay reservas con los filtros seleccionados</div>';
    return;
  }

  const totalPaginas = Math.max(1, Math.ceil(total / RESERVAS_PAGE_SIZE));
  if (_reservasPage > totalPaginas) _reservasPage = totalPaginas;
  const inicio = (_reservasPage - 1) * RESERVAS_PAGE_SIZE;
  const items = filtradas.slice(inicio, inicio + RESERVAS_PAGE_SIZE);

  container.innerHTML = `
    <div class="table-scroll"><table class="reservas-table">
      <thead><tr>
        <th class="col-check"><input type="checkbox" id="resCheckAll" aria-label="Seleccionar todo"></th>
        <th>#</th>
        <th>Laboratorio</th>
        <th>Docente</th>
        <th>Asignatura / Grupo</th>
        <th>Fecha</th>
        <th>Franja</th>
        <th>Estado</th>
        <th>Acciones</th>
      </tr></thead>
      <tbody>${items.map((r, i) => {
        const acciones = [`<button class="icon-btn icon-view" title="Ver detalle" onclick="verReserva(${r.id})">${ICO_EYE}</button>`];
        if (puedeAprobar && normEstado(r.estado) === 'pendiente') {
          acciones.push(`<button class="icon-btn icon-ok" title="Aprobar" onclick="aprobarReserva(${r.id})">${ICO_CHECK}</button>`);
          acciones.push(`<button class="icon-btn icon-no" title="Rechazar" onclick="rechazarReserva(${r.id})">${ICO_X}</button>`);
        }
        return `<tr class="res-row estado-${r.estado}">
          <td class="col-check"><input type="checkbox" class="res-check" aria-label="Seleccionar reserva"></td>
          <td>${inicio + i + 1}</td>
          <td><strong>${r.laboratorio?.nombre || '—'}</strong></td>
          <td>${r.docente?.nombre || '—'}</td>
          <td>${r.asignatura || '—'} - G-${r.grupo || '—'}</td>
          <td>${fechaLarga(r.fecha)}</td>
          <td>${horaCorta(r.hora_inicio)} - ${horaCorta(r.hora_fin)}</td>
          <td>${UI.badgeEstado(r.estado)}</td>
          <td><div class="row-actions">${acciones.join('')}</div></td>
        </tr>`;
      }).join('')}</tbody>
    </table></div>
    <div class="pagination">
      <span class="pagination-info">Mostrando ${inicio + 1}-${inicio + items.length} de ${total} reservas</span>
      <div class="pagination-pages">${paginacionBotones(_reservasPage, totalPaginas)}</div>
    </div>`;

  const checkAll = document.getElementById('resCheckAll');
  checkAll?.addEventListener('change', () => {
    container.querySelectorAll('.res-check').forEach((c) => { c.checked = checkAll.checked; });
  });
}

function renderCalendarioReservas(filtradas) {
  const session = Auth.getSession();
  const puedeAprobar = Auth.tienePermiso('reservas.aprobar');
  const puedeCancelar = Auth.tienePermiso('reservas.cancelar');
  const container = document.getElementById('reservasContent');

  if (!filtradas.length) {
    container.innerHTML = '<div class="empty-state">No hay reservas con los filtros seleccionados</div>';
    return;
  }

  container.innerHTML = `<div class="calendar-grid">${filtradas.map((r) => {
    const esPropia = r.docente_id === session.id;
    const puedeCancelarEsta = puedeCancelar && (normEstado(r.estado) === 'aprobada' || normEstado(r.estado) === 'pendiente')
      && (esPropia || puedeAprobar || session.rol === 'administrador');

    return `<div class="calendar-item">
      <div class="calendar-item-info">
        <h4>${r.laboratorio?.nombre || 'Laboratorio'} — ${UI.badgeEstado(r.estado)}</h4>
        <p><strong>${fechaLarga(r.fecha)}</strong> · ${horaCorta(r.hora_inicio)} – ${horaCorta(r.hora_fin)}</p>
        <p>${r.asignatura} · Grupo ${r.grupo}</p>
        <p>Docente: ${r.docente?.nombre || '—'}</p>
        ${r.observaciones ? `<p style="margin-top:0.5rem;font-style:italic">Obs: ${r.observaciones}</p>` : ''}
      </div>
      <div class="actions" style="flex-shrink:0;flex-direction:column">
        ${puedeAprobar && normEstado(r.estado) === 'pendiente' ? `
          <button class="btn btn-primary btn-sm" onclick="aprobarReserva(${r.id})">Aprobar</button>
          <button class="btn btn-danger btn-sm" onclick="rechazarReserva(${r.id})">Rechazar</button>` : ''}
        ${puedeCancelarEsta ? `
          <button class="btn btn-secondary btn-sm" onclick="cancelarReserva(${r.id}, '${r.estado}')">Cancelar</button>` : ''}
      </div>
    </div>`;
  }).join('')}</div>`;
}

function verReserva(id) {
  const r = _reservasData.find((x) => x.id === id);
  if (!r) return;
  const session = Auth.getSession();
  const puedeAprobar = Auth.tienePermiso('reservas.aprobar');
  const puedeCancelar = Auth.tienePermiso('reservas.cancelar');
  const esPropia = r.docente_id === session.id;
  const puedeCancelarEsta = puedeCancelar && (normEstado(r.estado) === 'aprobada' || normEstado(r.estado) === 'pendiente')
    && (esPropia || puedeAprobar || session.rol === 'administrador');

  const footer = ['<button class="btn btn-secondary" onclick="UI.closeModal()">Cerrar</button>'];
  if (puedeAprobar && normEstado(r.estado) === 'pendiente') {
    footer.push(`<button class="btn btn-danger" onclick="rechazarReserva(${r.id})">Rechazar</button>`);
    footer.push(`<button class="btn btn-primary" onclick="aprobarReserva(${r.id})">Aprobar</button>`);
  } else if (puedeCancelarEsta) {
    footer.push(`<button class="btn btn-danger" onclick="cancelarReserva(${r.id}, '${r.estado}')">Cancelar reserva</button>`);
  }

  UI.openModal(
    'Detalle de la reserva',
    `<div class="detalle-grid">
      <div class="det-item"><label>Laboratorio</label>${r.laboratorio?.nombre || '—'}</div>
      <div class="det-item"><label>Estado</label>${UI.badgeEstado(r.estado)}</div>
      <div class="det-item"><label>Docente</label>${r.docente?.nombre || '—'}</div>
      <div class="det-item"><label>Asignatura</label>${r.asignatura || '—'}</div>
      <div class="det-item"><label>Grupo</label>G-${r.grupo || '—'}</div>
      <div class="det-item"><label>Fecha</label>${fechaLarga(r.fecha)}</div>
      <div class="det-item"><label>Franja</label>${horaCorta(r.hora_inicio)} - ${horaCorta(r.hora_fin)}</div>
      <div class="det-item"><label>Ubicación</label>${r.laboratorio?.ubicacion || '—'}</div>
    </div>
    ${r.observaciones ? `<div class="det-item" style="margin-top:1rem"><label>Observaciones</label>${r.observaciones}</div>` : ''}`,
    footer.join('')
  );
}

async function abrirFormReserva() {
  const { laboratorios } = await api.get('/laboratorios?estado=activo');
  const labsOptions = laboratorios.map((l) =>
    `<option value="${l.id}">${l.nombre} — ${l.ubicacion}</option>`
  ).join('');

  UI.openModal(
    'Solicitar reserva de laboratorio',
    `<div class="form-group"><label>Laboratorio</label>
     <select id="fResLab"><option value="">Seleccionar...</option>${labsOptions}</select></div>
     <div class="form-row">
       <div class="form-group"><label>Fecha</label><input type="date" id="fResFecha"></div>
       <div class="form-group"><label>Grupo</label><input id="fResGrupo" placeholder="Ej: 901"></div>
     </div>
     <div class="form-row">
       <div class="form-group"><label>Hora inicio</label><input type="time" id="fResInicio"></div>
       <div class="form-group"><label>Hora fin</label><input type="time" id="fResFin"></div>
     </div>
     <div class="form-group"><label>Asignatura / Programa</label>
       <input id="fResAsignatura" placeholder="Ej: Programación I"></div>
     <div class="form-group"><label>Observaciones (opcional)</label>
       <textarea id="fResObs" rows="2"></textarea></div>`,
    `<button class="btn btn-secondary" onclick="UI.closeModal()">Cancelar</button>
     <button class="btn btn-primary" id="btnEnviarReserva">Enviar solicitud</button>`
  );

  document.getElementById('btnEnviarReserva').addEventListener('click', async () => {
    const body = {
      laboratorio_id: parseInt(document.getElementById('fResLab').value, 10),
      fecha: document.getElementById('fResFecha').value,
      hora_inicio: document.getElementById('fResInicio').value,
      hora_fin: document.getElementById('fResFin').value,
      asignatura: document.getElementById('fResAsignatura').value.trim(),
      grupo: document.getElementById('fResGrupo').value.trim(),
      observaciones: document.getElementById('fResObs').value.trim() || null,
    };

    if (!body.laboratorio_id || !body.fecha || !body.hora_inicio || !body.hora_fin || !body.asignatura || !body.grupo) {
      alert('Complete todos los campos requeridos');
      return;
    }

    try {
      await api.post('/reservas', body);
      UI.closeModal();
      UI.showAlert(document.getElementById('reservasAlert'), 'Reserva solicitada. El coordinador fue notificado.', 'success');
      await recargarReservas();
      await cargarNotificaciones();
    } catch (err) {
      alert(err.message);
    }
  });
}

async function aprobarReserva(id) {
  UI.openModal(
    'Aprobar reserva',
    `<div class="form-group"><label>Observaciones (opcional)</label>
     <textarea id="fAprobarObs" rows="3" placeholder="Ej: Laboratorio disponible según lo solicitado"></textarea></div>`,
    `<button class="btn btn-secondary" onclick="UI.closeModal()">Cancelar</button>
     <button class="btn btn-primary" id="btnConfirmAprobar">Aprobar</button>`
  );

  document.getElementById('btnConfirmAprobar').addEventListener('click', async () => {
    try {
      const obs = document.getElementById('fAprobarObs').value.trim();
      await api.patch(`/reservas/${id}/aprobar`, { observaciones: obs || undefined });
      UI.closeModal();
      UI.showAlert(document.getElementById('reservasAlert'), 'Reserva aprobada. Docente notificado.', 'success');
      await recargarReservas();
      await cargarNotificaciones();
    } catch (err) {
      alert(err.message);
    }
  });
}

async function rechazarReserva(id) {
  UI.openModal(
    'Rechazar reserva',
    `<div class="form-group"><label>Motivo del rechazo (requerido)</label>
     <textarea id="fRechazarObs" rows="3" required placeholder="Indique el motivo del rechazo"></textarea></div>`,
    `<button class="btn btn-secondary" onclick="UI.closeModal()">Cancelar</button>
     <button class="btn btn-danger" id="btnConfirmRechazar">Rechazar</button>`
  );

  document.getElementById('btnConfirmRechazar').addEventListener('click', async () => {
    const obs = document.getElementById('fRechazarObs').value.trim();
    if (!obs) { alert('Debe indicar el motivo del rechazo'); return; }
    try {
      await api.patch(`/reservas/${id}/rechazar`, { observaciones: obs });
      UI.closeModal();
      UI.showAlert(document.getElementById('reservasAlert'), 'Reserva rechazada. Docente notificado.', 'success');
      await recargarReservas();
      await cargarNotificaciones();
    } catch (err) {
      alert(err.message);
    }
  });
}

async function cancelarReserva(id, estado) {
  UI.openModal(
    'Cancelar reserva',
    `<div class="form-group"><label>Motivo de cancelación${estado === 'aprobada' ? ' (requerido)' : ''}</label>
     <textarea id="fCancelarMotivo" rows="3" placeholder="Indique el motivo de la cancelación"></textarea></div>`,
    `<button class="btn btn-secondary" onclick="UI.closeModal()">Cerrar</button>
     <button class="btn btn-danger" id="btnConfirmCancelar">Confirmar cancelación</button>`
  );

  document.getElementById('btnConfirmCancelar').addEventListener('click', async () => {
    const motivo = document.getElementById('fCancelarMotivo').value.trim();
    if (estado === 'aprobada' && !motivo) { alert('El motivo es requerido para cancelar una reserva aprobada'); return; }
    try {
      await api.patch(`/reservas/${id}/cancelar`, { motivo });
      UI.closeModal();
      UI.showAlert(document.getElementById('reservasAlert'), 'Reserva cancelada. Involucrados notificados.', 'success');
      await recargarReservas();
      await cargarNotificaciones();
    } catch (err) {
      alert(err.message);
    }
  });
}

// ─── Notificaciones (RF-22) ──────────────────────────────────
async function cargarNotificaciones() {
  try {
    const { notificaciones, noLeidas } = await api.get('/notificaciones?solo_no_leidas=false');
    const badge = document.getElementById('notifCount');
    const panel = document.getElementById('notifPanel');

    if (noLeidas > 0) {
      badge.textContent = noLeidas > 9 ? '9+' : noLeidas;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }

    if (!notificaciones.length) {
      panel.innerHTML = '<div class="notif-item">Sin notificaciones</div>';
      return;
    }

    panel.innerHTML = `
      <div style="padding:0.75rem 1rem;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
        <strong>Notificaciones</strong>
        ${noLeidas > 0 ? '<button class="btn btn-sm btn-secondary" id="btnLeerTodas">Marcar todas</button>' : ''}
      </div>
      ${notificaciones.map((n) => `
        <div class="notif-item ${n.leida ? '' : 'unread'}" data-id="${n.id}">
          <strong>${n.titulo}</strong>
          ${n.mensaje}
          <span>${new Date(n.created_at).toLocaleString('es-CO')}</span>
        </div>`).join('')}`;

    panel.querySelectorAll('.notif-item[data-id]').forEach((el) => {
      el.addEventListener('click', async () => {
        await api.patch(`/notificaciones/${el.dataset.id}/leida`);
        await cargarNotificaciones();
      });
    });

    document.getElementById('btnLeerTodas')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      await api.patch('/notificaciones/leer-todas');
      await cargarNotificaciones();
    });
  } catch (_) { /* silencioso si falla */ }
}

async function renderAnalitica() {
  document.getElementById('contentArea').innerHTML = `
    <div id="anAlert"></div>
    <div class="card" style="margin-bottom:1.5rem">
      <div class="card-body">
        <div class="filters-bar">
          <div class="form-group"><label>Desde</label><input type="date" id="anDesde"></div>
          <div class="form-group"><label>Hasta</label><input type="date" id="anHasta"></div>
          <div class="form-group"><label>Periodo académico</label><input id="anPeriodo" placeholder="Ej: 2026-1"></div>
          <div class="form-group"><label>Umbral subutilización (%)</label><input type="number" id="anUmbral" value="30" min="1" max="100"></div>
          <button class="btn btn-primary btn-sm" id="btnDashboard">Generar dashboard</button>
        </div>
      </div>
    </div>
    <div id="dashboardContent"><div class="empty-state">Configure el período y pulse "Generar dashboard"</div></div>`;

  const hoy = new Date().toISOString().slice(0, 10);
  const hace30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  document.getElementById('anDesde').value = hace30;
  document.getElementById('anHasta').value = hoy;

  document.getElementById('btnDashboard').addEventListener('click', cargarDashboard);
}

function tablaHTML(headers, rows) {
  if (!rows.length) return '<p style="color:var(--muted);font-size:0.875rem">Sin datos</p>';
  return `<div class="table-scroll"><table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.join('')}</tbody></table></div>`;
}

function closeSidebarMobile() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebarBackdrop')?.classList.add('hidden');
  document.getElementById('btnMenuToggle')?.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('sidebar-open');
}

function toggleSidebarMobile() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  const btn = document.getElementById('btnMenuToggle');
  if (!sidebar || !backdrop) return;

  const open = sidebar.classList.toggle('open');
  backdrop.classList.toggle('hidden', !open);
  btn?.setAttribute('aria-expanded', open ? 'true' : 'false');
  document.body.classList.toggle('sidebar-open', open);
}

function initSidebarMobile() {
  document.getElementById('btnMenuToggle')?.addEventListener('click', toggleSidebarMobile);
  document.getElementById('sidebarBackdrop')?.addEventListener('click', closeSidebarMobile);
  window.addEventListener('resize', () => {
    if (window.innerWidth > 992) closeSidebarMobile();
  });
}

async function cargarDashboard() {
  const desde = document.getElementById('anDesde').value;
  const hasta = document.getElementById('anHasta').value;
  const periodo = document.getElementById('anPeriodo').value.trim();
  const umbral = document.getElementById('anUmbral').value;

  document.getElementById('dashboardContent').innerHTML = '<p style="text-align:center;padding:2rem">Cargando indicadores...</p>';

  try {
    let url = `/analitica/dashboard?fecha_inicio=${desde}&fecha_fin=${hasta}&umbral=${umbral}`;
    if (periodo) url += `&periodo=${encodeURIComponent(periodo)}`;

    const d = await api.get(url);

    document.getElementById('dashboardContent').innerHTML = `
      <!-- RF-35 -->
      <div class="dashboard-section">
        <h3>RF-35 · Tasa de ocupación por laboratorio</h3>
        ${tablaHTML(
          ['Laboratorio', 'Capacidad', 'H. disponibles', 'H. ocupadas', 'Tasa %'],
          (d.rf35_ocupacion?.resultados || []).map((r) =>
            `<tr><td>${r.laboratorio}</td><td>${r.capacidad}</td><td>${r.horasDisponibles}</td><td>${r.horasOcupadas}</td><td>${barraProgreso(r.tasaOcupacion)}</td></tr>`
          )
        )}
      </div>

      <!-- RF-36 -->
      <div class="dashboard-section">
        <h3>RF-36 · Prácticas planeadas vs ejecutadas</h3>
        <div class="kpi-grid">
          <div class="stat-card"><div class="label">Total</div><div class="value">${d.rf36_practicas?.resumen?.total || 0}</div></div>
          <div class="stat-card"><div class="label">Ejecutadas</div><div class="value" style="color:var(--success)">${d.rf36_practicas?.resumen?.ejecutadas || 0}</div></div>
          <div class="stat-card"><div class="label">Cumplimiento</div><div class="value">${d.rf36_practicas?.resumen?.porcentajeCumplimiento || 0}%</div></div>
        </div>
        <div class="responsive-grid">
          <div>${tablaHTML(['Asignatura', 'Plan.', 'Ejec.', '%'], (d.rf36_practicas?.porAsignatura || []).map((a) =>
            `<tr><td>${a.etiqueta}</td><td>${a.planeadas}</td><td>${a.ejecutadas}</td><td>${a.porcentaje}%</td></tr>`))}</div>
          <div>${tablaHTML(['Docente', 'Plan.', 'Ejec.', '%'], (d.rf36_practicas?.porDocente || []).map((doc) =>
            `<tr><td>${doc.etiqueta}</td><td>${doc.planeadas}</td><td>${doc.ejecutadas}</td><td>${doc.porcentaje}%</td></tr>`))}</div>
        </div>
      </div>

      <!-- RF-37 -->
      <div class="dashboard-section">
        <h3>RF-37 · Ausentismo estudiantil</h3>
        <div class="stat-card" style="margin-bottom:1rem;display:inline-block">
          <div class="label">Promedio ausentismo</div>
          <div class="value">${d.rf37_ausentismo?.resumen?.promedioAusentismo || 0}%</div>
        </div>
        <div class="responsive-grid">
          <div>${tablaHTML(['Asignatura', 'Sesiones', 'Ausentismo %'], (d.rf37_ausentismo?.porAsignatura || []).map((a) =>
            `<tr><td>${a.etiqueta}</td><td>${a.sesiones}</td><td>${a.porcentajeAusentismo}%</td></tr>`))}</div>
          <div>${tablaHTML(['Laboratorio', 'Sesiones', 'Ausentismo %'], (d.rf37_ausentismo?.porLaboratorio || []).map((l) =>
            `<tr><td>${l.etiqueta}</td><td>${l.sesiones}</td><td>${l.porcentajeAusentismo}%</td></tr>`))}</div>
        </div>
      </div>

      <!-- RF-38 -->
      <div class="dashboard-section">
        <h3>RF-38 · Alertas de equipos críticos (${d.rf38_inventarioCritico?.total || 0})</h3>
        ${(d.rf38_inventarioCritico?.alertas || []).length
          ? (d.rf38_inventarioCritico.alertas.map((a) =>
              `<div class="alert-item ${a.criticidad === 'media' ? 'media' : ''}"><strong>${a.nombre}</strong> — ${a.laboratorio || ''}<br>${a.motivo} ${UI.badgeEstado(a.estado)}</div>`
            ).join(''))
          : '<p style="color:var(--muted)">No hay alertas críticas</p>'}
      </div>

      <!-- RF-39 -->
      <div class="dashboard-section">
        <h3>RF-39 · Laboratorios subutilizados (umbral ${d.rf39_subutilizados?.umbral || 30}%)</h3>
        ${tablaHTML(['Laboratorio', 'Ocupación %', 'Déficit'], (d.rf39_subutilizados?.laboratorios || []).map((l) =>
          `<tr><td>${l.laboratorio}</td><td>${l.tasaOcupacion}%</td><td>${UI.badgeEstado('pendiente').replace('pendiente', l.alerta)} ${l.diferencia}% bajo umbral</td></tr>`
        ))}
      </div>

      <!-- RF-40 -->
      <div class="dashboard-section">
        <h3>RF-40 · Patrones de cancelación de reservas</h3>
        <p style="font-size:0.875rem;color:var(--muted);margin-bottom:0.75rem">Total cancelaciones: ${d.rf40_patronesCancelacion?.totalCancelaciones || 0}</p>
        <div class="responsive-grid responsive-grid-3">
          <div>${tablaHTML(['Docente', 'Cancel.'], (d.rf40_patronesCancelacion?.porDocente || []).slice(0, 5).map((p) =>
            `<tr><td>${p.etiqueta}</td><td>${p.cancelaciones}</td></tr>`))}</div>
          <div>${tablaHTML(['Laboratorio', 'Cancel.'], (d.rf40_patronesCancelacion?.porLaboratorio || []).slice(0, 5).map((p) =>
            `<tr><td>${p.etiqueta}</td><td>${p.cancelaciones}</td></tr>`))}</div>
          <div>${tablaHTML(['Asignatura', 'Cancel.'], (d.rf40_patronesCancelacion?.porAsignatura || []).slice(0, 5).map((p) =>
            `<tr><td>${p.etiqueta}</td><td>${p.cancelaciones}</td></tr>`))}</div>
        </div>
        ${(d.rf40_patronesCancelacion?.patronesRecurrentes || []).length ? `
          <p style="margin-top:1rem;font-weight:600;color:var(--danger)">Patrones recurrentes (≥2 cancelaciones):</p>
          <ul style="font-size:0.875rem;padding-left:1.25rem">${d.rf40_patronesCancelacion.patronesRecurrentes.map((p) =>
            `<li>${p.etiqueta}: ${p.cancelaciones} cancelaciones</li>`).join('')}</ul>` : ''}
      </div>

      <!-- RF-41 -->
      <div class="dashboard-section">
        <h3>RF-41 · Equipos con más incidencias</h3>
        ${tablaHTML(['Equipo', 'Laboratorio', 'Estado', 'Incidencias', 'Prioridad'], (d.rf41_equiposIncidencias?.equipos || []).map((e) =>
          `<tr><td>${e.nombre || '—'}</td><td>${e.laboratorio || '—'}</td><td>${UI.badgeEstado(e.estado)}</td><td><strong>${e.totalIncidencias}</strong></td><td>${UI.badgeEstado(e.prioridad === 'alta' ? 'rechazada' : 'pendiente').replace(e.prioridad === 'alta' ? 'rechazada' : 'pendiente', e.prioridad)}</td></tr>`
        ))}
      </div>

      <!-- RF-42 -->
      <div class="dashboard-section">
        <h3>RF-42 · Comparativo por carrera/grupo y asignatura</h3>
        <div class="responsive-grid">
          <div>${tablaHTML(['Asignatura', 'Plan.', 'Ejec.', 'Cumpl. %'], (d.rf42_comparativo?.porAsignatura || []).map((a) =>
            `<tr><td>${a.asignatura}</td><td>${a.planeadas}</td><td>${a.ejecutadas}</td><td>${a.cumplimiento}%</td></tr>`))}</div>
          <div>${tablaHTML(['Carrera/Grupo', 'Reservas', 'Asignaturas'], (d.rf42_comparativo?.porCarreraGrupo || []).map((g) =>
            `<tr><td>${g.carrera_grupo}</td><td>${g.reservas}</td><td>${(g.asignaturas || []).join(', ')}</td></tr>`))}</div>
        </div>
      </div>

      <!-- RF-43 -->
      <div class="dashboard-section">
        <h3>RF-43 · Indicadores individuales por docente</h3>
        ${tablaHTML(
          ['Docente', 'Prác. ejecutadas', 'Cumplimiento %', 'Asistencia prom.', 'Incidencias', 'Sesiones'],
          (d.rf43_indicadoresDocente?.indicadores || []).map((doc) =>
            `<tr><td><strong>${doc.docente}</strong></td><td>${doc.practicasEjecutadas}</td><td>${doc.cumplimientoPracticas}%</td><td>${doc.tasaAsistenciaPromedio}%</td><td>${doc.incidenciasReportadas}</td><td>${doc.sesionesImpartidas}</td></tr>`
          )
        )}
      </div>`;
  } catch (err) {
    document.getElementById('dashboardContent').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

async function renderInventario() {
  const puedeRegistrar = Auth.tienePermiso('inventario.registrar');
  const puedeGestionar = Auth.tienePermiso('inventario.actualizarEstado');

  document.getElementById('contentArea').innerHTML = `
    <div id="invAlert"></div>
    <div class="card">
      <div class="card-header">
        <h2>Inventario por laboratorio</h2>
        ${puedeRegistrar ? '<button class="btn btn-primary btn-sm" id="btnRegistrarRecurso">+ Registrar recurso</button>' : ''}
      </div>
      <div class="card-body">
        <div class="filters-bar">
          <div class="form-group">
            <label>Laboratorio</label>
            <select id="invLab"><option value="">Seleccionar...</option></select>
          </div>
          <div class="form-group">
            <label>Categoría</label>
            <select id="invCategoria">
              <option value="">Todas</option>
              <option value="hardware">Hardware</option>
              <option value="software">Software</option>
              <option value="instrumento">Instrumento</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div class="form-group">
            <label>Estado</label>
            <select id="invEstado">
              <option value="">Todos</option>
              <option value="disponible">Disponible</option>
              <option value="prestado">Prestado</option>
              <option value="mantenimiento">Mantenimiento</option>
              <option value="baja">Baja</option>
            </select>
          </div>
          <div class="form-group">
            <label>Buscar</label>
            <input id="invBusqueda" placeholder="Nombre o serie...">
          </div>
          <button class="btn btn-primary btn-sm" id="btnFiltrarInv">Consultar</button>
        </div>
        <div id="invResumen"></div>
        <div id="invContent"><div class="empty-state">Seleccione un laboratorio</div></div>
      </div>
    </div>`;

  if (puedeRegistrar) {
    document.getElementById('btnRegistrarRecurso').addEventListener('click', abrirFormRecurso);
  }

  document.getElementById('btnFiltrarInv').addEventListener('click', cargarInventario);

  try {
    const { laboratorios } = await api.get('/laboratorios?estado=activo');
    const sel = document.getElementById('invLab');
    laboratorios.forEach((l) => {
      sel.innerHTML += `<option value="${l.id}">${l.nombre}</option>`;
    });
    if (laboratorios.length) {
      sel.value = laboratorios[0].id;
      await cargarInventario();
    }
  } catch (err) {
    document.getElementById('invContent').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

const ETIQUETAS_CATEGORIA = {
  hardware: 'Hardware',
  software: 'Software',
  instrumento: 'Instrumento',
  otro: 'Otro',
  equipo: 'Hardware',
  licencia: 'Software',
  insumo: 'Otro',
};

async function cargarInventario() {
  const labId = document.getElementById('invLab')?.value;
  if (!labId) return;

  const puedeGestionar = Auth.tienePermiso('inventario.actualizarEstado');
  let url = `/inventario/laboratorio/${labId}?`;
  const cat = document.getElementById('invCategoria')?.value;
  const est = document.getElementById('invEstado')?.value;
  const busq = document.getElementById('invBusqueda')?.value;
  if (cat) url += `categoria=${cat}&`;
  if (est) url += `estado=${est}&`;
  if (busq) url += `busqueda=${encodeURIComponent(busq)}&`;

  try {
    const data = await api.get(url);
    const { resumen, equipos, laboratorio } = data;

    document.getElementById('invResumen').innerHTML = `
      <div class="stats-grid" style="margin-bottom:1.25rem">
        <div class="stat-card"><div class="label">Total recursos</div><div class="value">${resumen.total}</div></div>
        <div class="stat-card"><div class="label">Disponibles</div><div class="value" style="color:var(--success)">${resumen.porEstado.disponible}</div></div>
        <div class="stat-card"><div class="label">Prestados</div><div class="value" style="color:var(--warning)">${resumen.porEstado.prestado}</div></div>
        <div class="stat-card"><div class="label">En mantenimiento</div><div class="value" style="color:var(--danger)">${resumen.porEstado.mantenimiento}</div></div>
      </div>
      <p style="font-size:0.875rem;color:var(--muted);margin-bottom:1rem">
        ${laboratorio.nombre} · ${resumen.porCategoria.hardware} hardware, ${resumen.porCategoria.software} software, ${resumen.porCategoria.instrumento} instrumentos, ${resumen.porCategoria.otro} otros
      </p>`;

    const container = document.getElementById('invContent');
    if (!equipos.length) {
      container.innerHTML = '<div class="empty-state">No hay recursos con los filtros seleccionados</div>';
      return;
    }

    container.innerHTML = `
      <div class="table-scroll"><table>
        <thead><tr>
          <th>Nombre</th><th>Categoría</th><th>Tipo</th><th>N° Serie</th><th>Estado</th>
          ${puedeGestionar ? '<th>Acciones</th>' : ''}
        </tr></thead>
        <tbody>${equipos.map((e) => `
          <tr>
            <td><strong>${e.nombre}</strong></td>
            <td>${ETIQUETAS_CATEGORIA[e.categoria] || e.categoria}</td>
            <td>${e.tipo}</td>
            <td>${e.numero_serie || '—'}</td>
            <td>${UI.badgeEstado(e.estado)}</td>
            ${puedeGestionar ? `<td class="actions">
              ${normEstado(e.estado) === 'en_mantenimiento' ? `<button class="btn btn-primary btn-sm" onclick="repararRecurso(${e.id})">Reparado</button>` : ''}
              ${e.estado !== 'baja' ? `<button class="btn btn-secondary btn-sm" onclick="cambiarEstadoRecurso(${e.id}, '${e.estado}')">Estado</button>` : ''}
            </td>` : ''}
          </tr>`).join('')}
        </tbody>
      </table></div>`;
  } catch (err) {
    document.getElementById('invContent').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

async function abrirFormRecurso() {
  const { laboratorios } = await api.get('/laboratorios?estado=activo');
  const labsOptions = laboratorios.map((l) => `<option value="${l.id}">${l.nombre}</option>`).join('');

  UI.openModal(
    'Registrar recurso en inventario',
    `<div class="form-group"><label>Categoría</label>
     <select id="fInvCat">
       <option value="hardware">Hardware</option>
       <option value="software">Software</option>
       <option value="instrumento">Instrumento</option>
       <option value="otro">Otro</option>
     </select></div>
     <div class="form-group"><label>Nombre</label><input id="fInvNombre" placeholder="Ej: Multímetro Fluke / MATLAB License"></div>
     <div class="form-row">
       <div class="form-group"><label>Tipo / Descripción</label><input id="fInvTipo" placeholder="Ej: Multímetro digital"></div>
       <div class="form-group"><label>N° Serie / Licencia</label><input id="fInvSerie" placeholder="Opcional"></div>
     </div>
     <div class="form-group"><label>Laboratorio</label>
     <select id="fInvLab">${labsOptions}</select></div>`,
    `<button class="btn btn-secondary" onclick="UI.closeModal()">Cancelar</button>
     <button class="btn btn-primary" id="btnGuardarRecurso">Registrar</button>`
  );

  document.getElementById('btnGuardarRecurso').addEventListener('click', async () => {
    const body = {
      categoria: document.getElementById('fInvCat').value,
      nombre: document.getElementById('fInvNombre').value.trim(),
      tipo: document.getElementById('fInvTipo').value.trim(),
      numero_serie: document.getElementById('fInvSerie').value.trim() || null,
      laboratorio_id: parseInt(document.getElementById('fInvLab').value, 10),
    };

    if (!body.nombre || !body.tipo || !body.laboratorio_id) {
      alert('Complete los campos requeridos');
      return;
    }

    try {
      await api.post('/inventario', body);
      UI.closeModal();
      UI.showAlert(document.getElementById('invAlert'), 'Recurso registrado correctamente', 'success');
      document.getElementById('invLab').value = body.laboratorio_id;
      await cargarInventario();
    } catch (err) {
      alert(err.message);
    }
  });
}

async function cambiarEstadoRecurso(id, estadoActual) {
  UI.openModal(
    'Actualizar estado del recurso',
    `<div class="form-group"><label>Nuevo estado</label>
     <select id="fInvNuevoEstado">
       <option value="disponible" ${estadoActual==='disponible'?'selected':''}>Disponible</option>
       <option value="prestado" ${estadoActual==='prestado'?'selected':''}>Prestado</option>
       <option value="mantenimiento" ${estadoActual==='mantenimiento'?'selected':''}>Mantenimiento</option>
       <option value="baja" ${estadoActual==='baja'?'selected':''}>Baja</option>
     </select></div>`,
    `<button class="btn btn-secondary" onclick="UI.closeModal()">Cancelar</button>
     <button class="btn btn-primary" id="btnCambiarEstado">Actualizar</button>`
  );

  document.getElementById('btnCambiarEstado').addEventListener('click', async () => {
    try {
      await api.patch(`/inventario/${id}/estado`, { estado: document.getElementById('fInvNuevoEstado').value });
      UI.closeModal();
      UI.showAlert(document.getElementById('invAlert'), 'Estado actualizado', 'success');
      await cargarInventario();
    } catch (err) {
      alert(err.message);
    }
  });
}

async function repararRecurso(id) {
  if (!confirm('¿Marcar este recurso como reparado y disponible?')) return;
  try {
    await api.patch(`/inventario/${id}/reparar`);
    UI.showAlert(document.getElementById('invAlert'), 'Recurso reparado y disponible', 'success');
    await cargarInventario();
  } catch (err) {
    alert(err.message);
  }
}

// ─── RF-26 / RF-27: Prácticas académicas ─────────────────────
function barraProgreso(porcentaje) {
  const color = porcentaje >= 75 ? 'var(--success)' : porcentaje >= 50 ? 'var(--warning)' : 'var(--danger)';
  return `<div style="background:var(--border);border-radius:999px;height:8px;width:120px;display:inline-block;vertical-align:middle">
    <div style="background:${color};height:100%;border-radius:999px;width:${porcentaje}%"></div>
  </div> <span style="font-size:0.8125rem;font-weight:600;margin-left:0.5rem">${porcentaje}%</span>`;
}

async function renderPracticas() {
  const puedePlanear = Auth.tienePermiso('practicas.planear');
  const puedeEjecutar = Auth.tienePermiso('practicas.ejecutar');
  const esCoordinacion = Auth.tienePermiso('usuarios.listar');

  document.getElementById('contentArea').innerHTML = `
    <div id="practicasAlert"></div>

    ${puedePlanear ? `
    <div class="card" style="margin-bottom:1.5rem">
      <div class="card-header">
        <h2>Prácticas planeadas</h2>
        <button class="btn btn-primary btn-sm" id="btnPlanearPractica">+ Planear práctica</button>
      </div>
      <div class="card-body" id="practicasLista">Cargando...</div>
    </div>` : ''}

    <div class="card">
      <div class="card-header"><h2>${esCoordinacion ? 'Seguimiento y comparación' : 'Mi seguimiento'}</h2></div>
      <div class="card-body">
        <div class="filters-bar">
          <div class="form-group">
            <label>Periodo académico</label>
            <input id="pracPeriodo" placeholder="Ej: 2026-1">
          </div>
          <div class="form-group">
            <label>Asignatura</label>
            <input id="pracAsignatura" placeholder="Filtrar asignatura...">
          </div>
          ${esCoordinacion ? `<div class="form-group">
            <label>Docente</label>
            <select id="pracDocente"><option value="">Todos</option></select>
          </div>` : ''}
          <button class="btn btn-primary btn-sm" id="btnFiltrarPracticas">Consultar</button>
        </div>
        <div id="practicasResumen"></div>
        <div id="practicasComparacion"></div>
        <div id="practicasDetalle"></div>
      </div>
    </div>`;

  if (puedePlanear) {
    document.getElementById('btnPlanearPractica').addEventListener('click', abrirFormPractica);
  }

  document.getElementById('btnFiltrarPracticas').addEventListener('click', cargarSeguimientoPracticas);

  if (esCoordinacion) {
    try {
      const { usuarios } = await api.get('/usuarios?rol=docente&estado=activo');
      const sel = document.getElementById('pracDocente');
      usuarios.forEach((u) => {
        sel.innerHTML += `<option value="${u.id}">${u.nombre}</option>`;
      });
    } catch (_) { /* opcional */ }
  }

  if (puedePlanear) await cargarListaPracticas(puedeEjecutar);
  await cargarSeguimientoPracticas();
}

async function cargarListaPracticas(puedeEjecutar) {
  try {
    const { practicas } = await api.get('/practicas/seguimiento');
    const pendientes = practicas.filter((p) => (p.total_planeadas || 0) > (p.total_ejecutadas || 0));
    const container = document.getElementById('practicasLista');

    if (!pendientes.length) {
      container.innerHTML = '<div class="empty-state">No tiene prácticas pendientes por ejecutar</div>';
      return;
    }

    container.innerHTML = `
      <div class="table-scroll"><table>
        <thead><tr>
          <th>Asignatura</th><th>Periodo</th><th>Grupo</th><th>Laboratorio</th>
          <th>Planeadas</th><th>Ejecutadas</th><th>Pendientes</th>${puedeEjecutar ? '<th>Acción</th>' : ''}
        </tr></thead>
        <tbody>${pendientes.map((p) => `
          <tr>
            <td><strong>${p.asignatura}</strong></td>
            <td>${p.periodo}</td>
            <td>${p.grupo}</td>
            <td>${p.laboratorio?.nombre || '—'}</td>
            <td>${p.total_planeadas || 0}</td>
            <td>${p.total_ejecutadas || 0}</td>
            <td>${Math.max(0, (p.total_planeadas || 0) - (p.total_ejecutadas || 0))}</td>
            ${puedeEjecutar ? `<td><button class="btn btn-primary btn-sm" onclick="ejecutarPractica(${p.id})">Registrar ejecución</button></td>` : ''}
          </tr>`).join('')}
        </tbody>
      </table></div>`;
  } catch (err) {
    document.getElementById('practicasLista').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

async function cargarSeguimientoPracticas() {
  let url = '/practicas/seguimiento?';
  const periodo = document.getElementById('pracPeriodo')?.value.trim();
  const asignatura = document.getElementById('pracAsignatura')?.value.trim();
  const docente = document.getElementById('pracDocente')?.value;

  if (periodo) url += `periodo=${encodeURIComponent(periodo)}&`;
  if (asignatura) url += `asignatura=${encodeURIComponent(asignatura)}&`;
  if (docente) url += `docente_id=${docente}&`;

  try {
    const data = await api.get(url);
    const { resumen, comparacion, practicas } = data;

    document.getElementById('practicasResumen').innerHTML = `
      <div class="stats-grid" style="margin-bottom:1.5rem">
        <div class="stat-card"><div class="label">Total prácticas</div><div class="value">${resumen.total}</div></div>
        <div class="stat-card"><div class="label">Pendientes</div><div class="value" style="color:var(--warning)">${resumen.pendiente ?? resumen.planeada}</div></div>
        <div class="stat-card"><div class="label">Ejecutadas</div><div class="value" style="color:var(--success)">${resumen.ejecutada}</div></div>
        <div class="stat-card"><div class="label">% Cumplimiento</div><div class="value">${resumen.porcentajeCumplimiento}%</div></div>
      </div>`;

    document.getElementById('practicasComparacion').innerHTML = `
      <div class="responsive-grid" style="margin-bottom:1.5rem">
        <div>
          <h3 style="font-size:0.9375rem;margin-bottom:0.75rem;color:var(--primary)">Por asignatura (RF-27)</h3>
          ${comparacion.porAsignatura.length ? `
          <div class="table-scroll"><table><thead><tr><th>Asignatura</th><th>Plan.</th><th>Ejec.</th><th>Cumplimiento</th></tr></thead>
          <tbody>${comparacion.porAsignatura.map((a) => `
            <tr>
              <td>${a.etiqueta}</td>
              <td>${a.planeadas}</td>
              <td>${a.ejecutadas}</td>
              <td>${barraProgreso(a.porcentajeEjecucion)}</td>
            </tr>`).join('')}
          </tbody></table></div>` : '<p style="color:var(--muted);font-size:0.875rem">Sin datos</p>'}
        </div>
        <div>
          <h3 style="font-size:0.9375rem;margin-bottom:0.75rem;color:var(--primary)">Por docente (RF-27)</h3>
          ${comparacion.porDocente.length ? `
          <div class="table-scroll"><table><thead><tr><th>Docente</th><th>Plan.</th><th>Ejec.</th><th>Cumplimiento</th></tr></thead>
          <tbody>${comparacion.porDocente.map((d) => `
            <tr>
              <td>${d.etiqueta}</td>
              <td>${d.planeadas}</td>
              <td>${d.ejecutadas}</td>
              <td>${barraProgreso(d.porcentajeEjecucion)}</td>
            </tr>`).join('')}
          </tbody></table></div>` : '<p style="color:var(--muted);font-size:0.875rem">Sin datos</p>'}
        </div>
      </div>`;

    document.getElementById('practicasDetalle').innerHTML = practicas.length ? `
      <h3 style="font-size:0.9375rem;margin-bottom:0.75rem;color:var(--primary)">Detalle de prácticas</h3>
      <div class="table-scroll"><table>
        <thead><tr>
          <th>Asignatura</th><th>Periodo</th><th>Grupo</th><th>Docente</th><th>Laboratorio</th>
          <th>Planeadas</th><th>Ejecutadas</th><th>Pendientes</th><th>Estado</th>
        </tr></thead>
        <tbody>${practicas.map((p) => `
          <tr>
            <td>${p.asignatura}</td>
            <td>${p.periodo}</td>
            <td>${p.grupo}</td>
            <td>${p.docente?.nombre || '—'}</td>
            <td>${p.laboratorio?.nombre || '—'}</td>
            <td>${p.total_planeadas || 0}</td>
            <td>${p.total_ejecutadas || 0}</td>
            <td>${p.pendientes ?? Math.max(0, (p.total_planeadas || 0) - (p.total_ejecutadas || 0))}</td>
            <td>${UI.badgeEstado(p.estado)}</td>
          </tr>`).join('')}
        </tbody>
      </table></div>` : '<div class="empty-state">No hay prácticas con los filtros seleccionados</div>';
  } catch (err) {
    document.getElementById('practicasResumen').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

async function abrirFormPractica() {
  const { laboratorios } = await api.get('/laboratorios?estado=activo');
  const labsOptions = laboratorios.map((l) => `<option value="${l.id}">${l.nombre}</option>`).join('');

  UI.openModal(
    'Planear práctica académica',
    `<div class="form-group"><label>Asignatura</label>
     <input id="fPracAsignatura" placeholder="Ej: Programación I"></div>
     <div class="form-row">
       <div class="form-group"><label>Periodo académico</label>
         <input id="fPracPeriodo" placeholder="Ej: 2026-1"></div>
       <div class="form-group"><label>Grupo</label>
         <input id="fPracGrupo" placeholder="Ej: 901"></div>
     </div>
     <div class="form-row">
       <div class="form-group"><label>Laboratorio</label>
         <select id="fPracLab"><option value="">Seleccionar...</option>${labsOptions}</select></div>
       <div class="form-group"><label>Cantidad planeada</label>
         <input type="number" id="fPracCantidad" min="1" value="1"></div>
     </div>`,
    `<button class="btn btn-secondary" onclick="UI.closeModal()">Cancelar</button>
     <button class="btn btn-primary" id="btnGuardarPractica">Registrar</button>`
  );

  document.getElementById('btnGuardarPractica').addEventListener('click', async () => {
    const body = {
      asignatura: document.getElementById('fPracAsignatura').value.trim(),
      periodo: document.getElementById('fPracPeriodo').value.trim(),
      grupo: document.getElementById('fPracGrupo').value.trim(),
      laboratorio_id: parseInt(document.getElementById('fPracLab').value, 10),
      total_planeadas: parseInt(document.getElementById('fPracCantidad').value, 10) || 1,
    };

    if (!body.asignatura || !body.periodo || !body.grupo || !body.laboratorio_id || body.total_planeadas < 1) {
      alert('Complete todos los campos requeridos');
      return;
    }

    try {
      await api.post('/practicas', body);
      UI.closeModal();
      UI.showAlert(document.getElementById('practicasAlert'), 'Práctica planeada registrada', 'success');
      await cargarListaPracticas(true);
      await cargarSeguimientoPracticas();
    } catch (err) {
      alert(err.message);
    }
  });
}

async function ejecutarPractica(id) {
  UI.openModal(
    'Registrar ejecución de práctica',
    `<p style="margin-bottom:1rem;color:var(--muted)">Se registrará 1 práctica ejecutada.</p>`,
    `<button class="btn btn-secondary" onclick="UI.closeModal()">Cancelar</button>
     <button class="btn btn-primary" id="btnConfirmEjecutar">Confirmar</button>`
  );

  document.getElementById('btnConfirmEjecutar').addEventListener('click', async () => {
    try {
      await api.patch(`/practicas/${id}/ejecutar`, { cantidad: 1 });
      UI.closeModal();
      UI.showAlert(document.getElementById('practicasAlert'), 'Práctica marcada como ejecutada', 'success');
      await cargarListaPracticas(true);
      await cargarSeguimientoPracticas();
    } catch (err) {
      alert(err.message);
    }
  });
}

// ─── RF-08 / RF-09 / RF-10: Consultas portal web ─────────────
async function renderConsultas() {
  const puedeIncidencias = Auth.tienePermiso('consultas.incidenciasHistorial');
  const puedeAgenda = Auth.tienePermiso('consultas.agenda');
  const puedeDisponibilidad = Auth.tienePermiso('laboratorios.disponibilidad');

  document.getElementById('contentArea').innerHTML = `
    <div id="consultasAlert"></div>
    <div class="tabs-bar">
      ${puedeIncidencias ? '<button class="tab-btn active" data-tab="incidencias">RF-08 · Incidencias</button>' : ''}
      ${puedeAgenda ? `<button class="tab-btn ${!puedeIncidencias ? 'active' : ''}" data-tab="agenda">RF-09 · Agenda</button>` : ''}
      ${puedeDisponibilidad ? '<button class="tab-btn" data-tab="disponibilidad">RF-10 · Disponibilidad</button>' : ''}
    </div>
    <div id="consultasTabContent"></div>`;

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      cargarTabConsultas(btn.dataset.tab);
    });
  });

  const tabInicial = puedeIncidencias ? 'incidencias' : puedeAgenda ? 'agenda' : 'disponibilidad';
  await cargarTabConsultas(tabInicial);
}

async function cargarTabConsultas(tab) {
  const container = document.getElementById('consultasTabContent');

  if (tab === 'incidencias') {
    container.innerHTML = `
      <div class="card"><div class="card-body">
        <div class="filters-bar">
          <div class="form-group"><label>Laboratorio</label><select id="incLab"><option value="">Seleccionar...</option></select></div>
          <div class="form-group"><label>Desde</label><input type="date" id="incDesde"></div>
          <div class="form-group"><label>Hasta</label><input type="date" id="incHasta"></div>
          <button class="btn btn-primary btn-sm" id="btnIncidencias">Consultar historial</button>
        </div>
        <div id="incResult"></div>
      </div></div>`;
    const { laboratorios } = await api.get('/laboratorios?estado=activo');
    laboratorios.forEach((l) => {
      document.getElementById('incLab').innerHTML += `<option value="${l.id}">${l.nombre}</option>`;
    });
    document.getElementById('btnIncidencias').addEventListener('click', async () => {
      const labId = document.getElementById('incLab').value;
      if (!labId) { alert('Seleccione un laboratorio'); return; }
      let url = `/consultas/incidencias?laboratorio_id=${labId}`;
      const desde = document.getElementById('incDesde').value;
      const hasta = document.getElementById('incHasta').value;
      if (desde && hasta) url += `&fecha_inicio=${desde}&fecha_fin=${hasta}`;
      try {
        const data = await api.get(url);
        document.getElementById('incResult').innerHTML = data.incidencias.length ? `
          <h3 style="margin:1rem 0">Historial — ${data.laboratorio.nombre} (${data.total})</h3>
          ${tablaHTML(['Fecha', 'Tipo falla', 'Descripción', 'Reportó', 'Equipo'], data.incidencias.map((i) =>
            `<tr><td>${new Date(i.fecha).toLocaleDateString('es-CO')}</td><td>${i.tipo_falla}</td><td>${i.descripcion.substring(0, 80)}...</td><td>${i.usuario?.nombre || '—'}</td><td>${i.equipo?.nombre || '—'}</td></tr>`
          ))}` : '<div class="empty-state">No hay incidencias registradas</div>';
      } catch (err) {
        document.getElementById('incResult').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
      }
    });
  }

  if (tab === 'agenda') {
    const session = Auth.getSession();
    container.innerHTML = `
      <div class="card"><div class="card-body">
        <p style="font-size:0.875rem;color:var(--muted);margin-bottom:1rem">
          Vista según su rol (${session.etiquetaRol || session.rol}): ${session.rol === 'docente' ? 'solo sus reservas y sesiones' : session.rol === 'estudiante' ? 'reservas aprobadas y sesiones programadas' : 'agenda completa del laboratorio'}
        </p>
        <div class="filters-bar">
          <div class="form-group"><label>Laboratorio</label><select id="agLab"><option value="">Todos</option></select></div>
          <div class="form-group"><label>Desde</label><input type="date" id="agDesde"></div>
          <div class="form-group"><label>Hasta</label><input type="date" id="agHasta"></div>
          <button class="btn btn-primary btn-sm" id="btnAgenda">Consultar agenda</button>
        </div>
        <div id="agResult"></div>
      </div></div>`;
    const hoy = new Date().toISOString().slice(0, 10);
    const en7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    document.getElementById('agDesde').value = hoy;
    document.getElementById('agHasta').value = en7;
    const { laboratorios } = await api.get('/laboratorios?estado=activo');
    laboratorios.forEach((l) => {
      document.getElementById('agLab').innerHTML += `<option value="${l.id}">${l.nombre}</option>`;
    });
    document.getElementById('btnAgenda').addEventListener('click', async () => {
      let url = `/consultas/agenda?fecha_inicio=${document.getElementById('agDesde').value}&fecha_fin=${document.getElementById('agHasta').value}`;
      const lab = document.getElementById('agLab').value;
      if (lab) url += `&laboratorio_id=${lab}`;
      try {
        const data = await api.get(url);
        document.getElementById('agResult').innerHTML = data.eventos.length ? `
          <p style="margin:1rem 0;font-size:0.875rem">${data.resumen.reservas} reservas · ${data.resumen.sesiones} sesiones</p>
          <div class="calendar-grid">${data.eventos.map((e) => `
            <div class="calendar-item">
              <div class="calendar-item-info">
                <h4>${e.laboratorio} — ${e.tipo === 'reserva' ? 'Reserva' : 'Sesión'} ${UI.badgeEstado(e.estado)}</h4>
                <p><strong>${e.fecha}</strong> · ${e.hora_inicio} – ${e.hora_fin}</p>
                ${e.asignatura ? `<p>${e.asignatura} · Grupo ${e.grupo}</p>` : ''}
                <p>Docente: ${e.docente || '—'}</p>
              </div>
            </div>`).join('')}</div>`
          : '<div class="empty-state">No hay eventos en el periodo seleccionado</div>';
      } catch (err) {
        document.getElementById('agResult').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
      }
    });
    document.getElementById('btnAgenda').click();
  }

  if (tab === 'disponibilidad') {
    container.innerHTML = `
      <div class="card"><div class="card-body">
        <div class="filters-bar">
          <div class="form-group"><label>Fecha</label><input type="date" id="dispFecha"></div>
          <div class="form-group"><label>Hora inicio</label><input type="time" id="dispInicio" value="08:00"></div>
          <div class="form-group"><label>Hora fin</label><input type="time" id="dispFin" value="10:00"></div>
          <button class="btn btn-primary btn-sm" id="btnDisponibilidad">Verificar disponibilidad</button>
        </div>
        <div id="dispResult"></div>
      </div></div>`;
    document.getElementById('dispFecha').value = new Date().toISOString().slice(0, 10);
    document.getElementById('btnDisponibilidad').addEventListener('click', async () => {
      const fecha = document.getElementById('dispFecha').value;
      const hi = document.getElementById('dispInicio').value;
      const hf = document.getElementById('dispFin').value;
      try {
        const data = await api.get(`/laboratorios/disponibilidad?fecha=${fecha}&hora_inicio=${hi}&hora_fin=${hf}`);
        document.getElementById('dispResult').innerHTML = `
          <div class="stats-grid" style="margin-top:1rem">
            <div class="stat-card"><div class="label">Disponibles</div><div class="value" style="color:var(--success)">${data.totalDisponibles}</div></div>
            <div class="stat-card"><div class="label">Ocupados</div><div class="value" style="color:var(--danger)">${data.totalNoDisponibles || data.noDisponibles?.length || 0}</div></div>
          </div>
          <div class="responsive-grid" style="margin-top:1.5rem">
            <div><h4 style="margin-bottom:0.75rem;color:var(--success)">Disponibles</h4>
              ${(data.disponibles || []).map((l) => `<div class="calendar-item" style="margin-bottom:0.5rem;padding:0.75rem"><strong>${l.nombre}</strong><br><span style="font-size:0.8125rem;color:var(--muted)">${l.ubicacion} · ${l.tipo?.nombre || ''}</span></div>`).join('') || '<p style="color:var(--muted)">Ninguno</p>'}
            </div>
            <div><h4 style="margin-bottom:0.75rem;color:var(--danger)">No disponibles</h4>
              ${(data.noDisponibles || []).map((l) => `<div class="calendar-item" style="margin-bottom:0.5rem;padding:0.75rem;border-color:#fecaca"><strong>${l.nombre}</strong><br><span style="font-size:0.8125rem;color:var(--muted)">${l.conflictos ? `${l.conflictos.reservas} reservas, ${l.conflictos.sesiones} sesiones` : 'Ocupado'}</span></div>`).join('') || '<p style="color:var(--muted)">Ninguno</p>'}
            </div>
          </div>`;
      } catch (err) {
        document.getElementById('dispResult').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
      }
    });
  }
}

// ─── RF-44: Gobernanza de datos ──────────────────────────────
function renderGobernanza() {
  document.getElementById('contentArea').innerHTML = `
    <div class="card">
      <div class="card-header"><h2>Políticas de Gobernanza de Datos — GILIH</h2></div>
      <div class="card-body policy-doc">
        <p><strong>Versión:</strong> 1.0 · <strong>Vigencia:</strong> 2026 · <strong>Responsable:</strong> Administrador del Sistema GILIH — Universidad Alexander Von Humboldt</p>
        <p>Este documento establece las políticas de tratamiento, anonimización, retención y seguridad de los datos personales procesados por el sistema GILIH, conforme a la <strong>Ley 1581 de 2012</strong>, el <strong>Decreto 1377 de 2013</strong> y demás normatividad colombiana de protección de datos personales (Habeas Data).</p>

        <h4>1. Marco normativo</h4>
        <ul>
          <li>Ley 1581 de 2012 — Régimen General de Protección de Datos Personales.</li>
          <li>Decreto 1377 de 2013 — Reglamentación parcial de la Ley 1581.</li>
          <li>Decreto 1074 de 2015 — Sector comercio, industria y turismo (Título 25).</li>
          <li>Autoridad de vigilancia: Superintendencia de Industria y Comercio (SIC).</li>
        </ul>

        <h4>2. Datos personales tratados</h4>
        <ul>
          <li><strong>Identificación:</strong> nombre, correo institucional, rol académico.</li>
          <li><strong>Autenticación:</strong> contraseña almacenada con hash bcrypt (nunca en texto plano).</li>
          <li><strong>Operacionales:</strong> registros de asistencia, reservas, sesiones, incidencias y préstamos.</li>
          <li><strong>Técnicos:</strong> tokens JWT de sesión, logs de acceso al sistema.</li>
        </ul>

        <h4>3. Finalidad del tratamiento</h4>
        <p>Los datos se utilizan exclusivamente para la gestión integral de laboratorios de ingeniería: control de acceso, registro de asistencia, reservas, inventario, reportes analíticos e incidencias. No se ceden a terceros sin autorización del titular o mandato legal.</p>

        <h4>4. Política de anonimización</h4>
        <ul>
          <li>Los dashboards analíticos (RF-35 a RF-43) presentan datos agregados sin identificar estudiantes individualmente.</li>
          <li>Los reportes de ausentismo muestran porcentajes por sesión/asignatura, no nombres de estudiantes.</li>
          <li>Para investigación o publicación de indicadores, se aplicará anonimización irreversible (eliminación de identificadores directos e indirectos).</li>
          <li>El acceso a datos identificables está restringido por rol (RBAC) según el principio de mínimo privilegio.</li>
        </ul>

        <h4>5. Política de retención</h4>
        <ul>
          <li><strong>Usuarios activos:</strong> mientras mantengan relación con la institución.</li>
          <li><strong>Usuarios inactivos:</strong> conservación máxima de 2 años tras desactivación, luego eliminación o anonimización.</li>
          <li><strong>Asistencias y sesiones:</strong> 5 años académicos para fines de auditoría y acreditación.</li>
          <li><strong>Incidencias e inventario:</strong> 3 años para trazabilidad de mantenimiento.</li>
          <li><strong>Logs del sistema:</strong> 12 meses.</li>
          <li>Transcurridos los plazos, los datos serán eliminados de forma segura o anonimizados.</li>
        </ul>

        <h4>6. Política de seguridad</h4>
        <ul>
          <li>Autenticación mediante JWT con expiración de 8 horas.</li>
          <li>Contraseñas hasheadas con bcrypt (factor 10).</li>
          <li>Comunicación API protegida; en producción se exige HTTPS/TLS.</li>
          <li>Control de acceso basado en roles (administrador, coordinador, docente, auxiliar, estudiante).</li>
          <li>Base de datos MySQL con acceso restringido al servidor de aplicaciones.</li>
          <li>Copias de seguridad periódicas cifradas del servidor de base de datos.</li>
          <li>Variables sensibles (.env) excluidas del control de versiones.</li>
        </ul>

        <h4>7. Derechos de los titulares (ARCO)</h4>
        <p>Los titulares pueden ejercer sus derechos de <strong>Acceso, Rectificación, Cancelación y Oposición</strong> (ARCO) mediante solicitud al administrador del sistema o al Oficial de Protección de Datos de la institución. Respuesta máxima: 10 días hábiles.</p>

        <h4>8. Transferencia y transmisión</h4>
        <p>No se transfieren datos personales fuera del territorio colombiano. La transmisión entre el portal web y la API ocurre dentro de la infraestructura institucional autorizada.</p>

        <h4>9. Incidentes de seguridad</h4>
        <p>Ante una brecha de datos personales, se notificará a la SIC y a los titulares afectados en un plazo máximo de 15 días hábiles, conforme al artículo 13 de la Ley 1581 de 2012.</p>

        <h4>10. Actualización de políticas</h4>
        <p>Esta política se revisará anualmente o ante cambios normativos. Los usuarios serán notificados de modificaciones sustanciales al iniciar sesión en el portal.</p>

        <div class="alert alert-success" style="margin-top:1.5rem">
          Documento alineado con RF-44 — Gobernanza de Datos del Proyecto GILIH.
        </div>
      </div>
    </div>`;
}

// ─── Init ────────────────────────────────────────────────────
async function init() {
  if (!Auth.requireAuth()) return;

  const session = Auth.getSession();
  document.getElementById('userName').textContent = session.nombre;
  const emailEl = document.getElementById('userEmail');
  if (emailEl) emailEl.textContent = session.email;
  document.getElementById('userRole').textContent = session.etiquetaRol || ETIQUETAS_ROLES[session.rol] || session.rol;

  const iniciales = (session.nombre || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');
  document.getElementById('userAvatar').textContent = iniciales;
  const topAvatar = document.getElementById('topbarAvatar');
  if (topAvatar) {
    topAvatar.textContent = iniciales;
    topAvatar.title = `${session.nombre} · ${session.etiquetaRol || session.rol}`;
  }

  document.getElementById('btnLogout').addEventListener('click', () => Auth.logout());

  document.getElementById('btnNotificaciones').addEventListener('click', () => {
    document.getElementById('notifPanel').classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.topbar-actions')) {
      document.getElementById('notifPanel').classList.add('hidden');
    }
  });

  initSidebarMobile();
  buildSidebar();
  await cargarNotificaciones();
  navigateTo('inicio');
}

init();
