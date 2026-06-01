const Auth = {
  getSession() {
    const raw = localStorage.getItem('gilih_session');
    return raw ? JSON.parse(raw) : null;
  },

  saveSession(token, usuario) {
    localStorage.setItem('gilih_token', token);
    localStorage.setItem('gilih_session', JSON.stringify(usuario));
  },

  logout() {
    localStorage.removeItem('gilih_token');
    localStorage.removeItem('gilih_session');
    window.location.href = 'index.html';
  },

  requireAuth() {
    if (!this.getSession()) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  },

  tienePermiso(permiso) {
    const session = this.getSession();
    if (!session) return false;
    if (session.rol === 'administrador') return true;
    return session.permisos?.includes(permiso);
  },

  async login(email, contrasena) {
    const data = await api.post('/auth/login', { email, contrasena });
    this.saveSession(data.token, data.usuario);
    return data;
  },

  async refreshMe() {
    const data = await api.get('/auth/me');
    const token = localStorage.getItem('gilih_token');
    this.saveSession(token, {
      id: data.id,
      nombre: data.nombre,
      email: data.email,
      rol: data.rol,
      etiquetaRol: data.etiquetaRol,
      descripcionRol: data.descripcionRol,
      permisos: data.permisos,
    });
    return data;
  },
};
