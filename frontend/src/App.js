import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from './components/ui/card';
import { Textarea } from './components/ui/textarea';
import { Badge } from './components/ui/badge';
import { Toast } from './components/ui/toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Bell, FileText, Users, Settings, LogOut, Plus, Edit, Trash2, Eye, EyeOff, Shield, Gavel } from 'lucide-react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showToast, setShowToast] = useState({ show: false, message: '', type: 'success' });

  // Form states
  const [reportForm, setReportForm] = useState({
    expediente: '',
    tribunal: '',
    decision: '',
    observacion: '',
    nombre_acusado: '',
    fecha: '',
    hora: ''
  });

  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    role: 'alguacil',
    full_name: ''
  });

  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: ''
  });

  const [editingReport, setEditingReport] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [showPasswords, setShowPasswords] = useState({});

  // WebSocket connection for real-time notifications
  useEffect(() => {
    if (user && user.role === 'admin') {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = API_BASE_URL.replace('https://', '').replace('http://', '');
      const ws = new WebSocket(`${wsProtocol}//${wsUrl}/ws`);
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'notification') {
          setNotifications(prev => [data.data, ...prev]);
          showToastMessage('Nueva notificación recibida', 'info');
        } else if (data.type === 'announcement') {
          setAnnouncements(prev => [data.data, ...prev]);
        }
      };

      return () => ws.close();
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    }
  }, [token]);

  const showToastMessage = (message, type = 'success') => {
    setShowToast({ show: true, message, type });
    setTimeout(() => setShowToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      if (response.data.role === 'admin') {
        fetchAllData();
      } else {
        fetchReports();
        fetchAnnouncements();
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('token');
      setToken(null);
    }
  };

  const fetchAllData = async () => {
    try {
      const [reportsRes, usersRes, notificationsRes, announcementsRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/reports`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/notifications`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/announcements`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/stats`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      setReports(reportsRes.data);
      setUsers(usersRes.data);
      setNotifications(notificationsRes.data);
      setAnnouncements(announcementsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/announcements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/login`, loginData);
      setToken(response.data.access_token);
      localStorage.setItem('token', response.data.access_token);
      setUser(response.data.user);
      setLoginData({ username: '', password: '' });
      showToastMessage('Inicio de sesión exitoso', 'success');
    } catch (error) {
      showToastMessage('Error en el inicio de sesión', 'error');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setReports([]);
    setUsers([]);
    setNotifications([]);
    setAnnouncements([]);
  };

  const handleCreateReport = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/reports`, reportForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportForm({
        expediente: '',
        tribunal: '',
        decision: '',
        observacion: '',
        nombre_acusado: '',
        fecha: '',
        hora: ''
      });
      fetchReports();
      showToastMessage('Reporte creado exitosamente', 'success');
    } catch (error) {
      showToastMessage('Error al crear el reporte', 'error');
    }
    setLoading(false);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/users`, userForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserForm({ username: '', password: '', role: 'alguacil', full_name: '' });
      fetchAllData();
      showToastMessage('Usuario creado exitosamente', 'success');
    } catch (error) {
      showToastMessage('Error al crear el usuario', 'error');
    }
    setLoading(false);
  };

  const handleDeleteUser = async (userId) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAllData();
      showToastMessage('Usuario eliminado exitosamente', 'success');
    } catch (error) {
      showToastMessage('Error al eliminar el usuario', 'error');
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/announcements`, announcementForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnnouncementForm({ title: '', message: '' });
      fetchAnnouncements();
      showToastMessage('Anuncio enviado exitosamente', 'success');
    } catch (error) {
      showToastMessage('Error al enviar el anuncio', 'error');
    }
    setLoading(false);
  };

  const togglePasswordVisibility = (userId) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  if (!token || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
              <Gavel className="h-10 w-10 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">SISTEMA DE REPORTE</CardTitle>
              <CardDescription className="text-lg font-semibold text-blue-800">CJP VIGIA</CardDescription>
              <p className="text-sm text-gray-600 mt-2">Tribunal Supremo de Justicia</p>
              <p className="text-sm text-gray-600">República Bolivariana de Venezuela</p>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  type="text"
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  required
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                  className="w-full"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-blue-800 hover:bg-blue-900">
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>
          </CardContent>
        </Card>
        {showToast.show && (
          <div className="fixed top-4 right-4 z-50">
            <Toast className={`${showToast.type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white`}>
              {showToast.message}
            </Toast>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Gavel className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">SISTEMA DE REPORTE CJP VIGIA</h1>
                  <p className="text-sm text-blue-200">Tribunal Supremo de Justicia - Venezuela</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-white border-white">
                {user.role === 'admin' ? 'Administrador' : 'Alguacil'}
              </Badge>
              <span className="text-sm">{user.full_name}</span>
              <Button variant="ghost" onClick={handleLogout} className="text-white hover:bg-blue-800">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user.role === 'admin' ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="dashboard" className="text-sm">Dashboard</TabsTrigger>
              <TabsTrigger value="reports" className="text-sm">Reportes</TabsTrigger>
              <TabsTrigger value="users" className="text-sm">Usuarios</TabsTrigger>
              <TabsTrigger value="notifications" className="text-sm">Notificaciones</TabsTrigger>
              <TabsTrigger value="announcements" className="text-sm">Anuncios</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="flex items-center p-6">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Reportes</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.total_reports || 0}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center p-6">
                    <Users className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Alguaciles</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.total_alguaciles || 0}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center p-6">
                    <Shield className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Administradores</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.total_admins || 0}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center p-6">
                    <Bell className="h-8 w-8 text-red-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Notificaciones</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.unread_notifications || 0}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Reportes Recientes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {reports.slice(0, 5).map((report) => (
                        <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">Expediente: {report.expediente}</p>
                            <p className="text-sm text-gray-600">Por: {report.nombre_alguacil}</p>
                          </div>
                          <Badge variant="outline">{report.tribunal}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Notificaciones Recientes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {notifications.slice(0, 5).map((notification) => (
                        <div key={notification.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                          <Bell className="h-5 w-5 text-blue-600 mt-1" />
                          <div>
                            <p className="font-medium">{notification.title}</p>
                            <p className="text-sm text-gray-600">{notification.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gestión de Reportes</CardTitle>
                  <CardDescription>Todos los reportes del sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Expediente</TableHead>
                        <TableHead>Tribunal</TableHead>
                        <TableHead>Decisión</TableHead>
                        <TableHead>Acusado</TableHead>
                        <TableHead>Alguacil</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">{report.expediente}</TableCell>
                          <TableCell>{report.tribunal}</TableCell>
                          <TableCell>{report.decision}</TableCell>
                          <TableCell>{report.nombre_acusado}</TableCell>
                          <TableCell>{report.nombre_alguacil}</TableCell>
                          <TableCell>{report.fecha}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" className="text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Crear Usuario</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                      <div>
                        <Label htmlFor="username">Nombre de Usuario</Label>
                        <Input
                          id="username"
                          value={userForm.username}
                          onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="full_name">Nombre Completo</Label>
                        <Input
                          id="full_name"
                          value={userForm.full_name}
                          onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Contraseña</Label>
                        <Input
                          id="password"
                          type="password"
                          value={userForm.password}
                          onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Rol</Label>
                        <Select value={userForm.role} onValueChange={(value) => setUserForm({ ...userForm, role: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="alguacil">Alguacil</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit" disabled={loading} className="w-full">
                        {loading ? 'Creando...' : 'Crear Usuario'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Lista de Usuarios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {users.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{user.full_name}</p>
                            <p className="text-sm text-gray-600">@{user.username}</p>
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="mt-1">
                              {user.role === 'admin' ? 'Administrador' : 'Alguacil'}
                            </Badge>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => togglePasswordVisibility(user.id)}
                            >
                              {showPasswords[user.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-red-600">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. El usuario será eliminado permanentemente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Centro de Notificaciones</CardTitle>
                  <CardDescription>Notificaciones en tiempo real del sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div key={notification.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                        <Bell className="h-5 w-5 text-blue-600 mt-1" />
                        <div className="flex-1">
                          <h4 className="font-medium">{notification.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(notification.created_at).toLocaleString('es-ES')}
                          </p>
                        </div>
                        {!notification.read && (
                          <Badge variant="default">Nueva</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="announcements" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Enviar Anuncio</CardTitle>
                    <CardDescription>Envía anuncios a todos los alguaciles</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                      <div>
                        <Label htmlFor="title">Título</Label>
                        <Input
                          id="title"
                          value={announcementForm.title}
                          onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="message">Mensaje</Label>
                        <Textarea
                          id="message"
                          rows={4}
                          value={announcementForm.message}
                          onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                          required
                        />
                      </div>
                      <Button type="submit" disabled={loading} className="w-full">
                        {loading ? 'Enviando...' : 'Enviar Anuncio'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Anuncios Enviados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {announcements.map((announcement) => (
                        <div key={announcement.id} className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-medium">{announcement.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{announcement.message}</p>
                          <div className="flex justify-between items-center mt-2">
                            <p className="text-xs text-gray-500">Por: {announcement.created_by}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(announcement.created_at).toLocaleString('es-ES')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Crear Nuevo Reporte</CardTitle>
                  <CardDescription>Completa todos los campos para generar el reporte</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateReport} className="space-y-4">
                    <div>
                      <Label htmlFor="expediente">Expediente</Label>
                      <Input
                        id="expediente"
                        value={reportForm.expediente}
                        onChange={(e) => setReportForm({ ...reportForm, expediente: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="tribunal">Tribunal</Label>
                      <Input
                        id="tribunal"
                        value={reportForm.tribunal}
                        onChange={(e) => setReportForm({ ...reportForm, tribunal: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="decision">Decisión</Label>
                      <Input
                        id="decision"
                        value={reportForm.decision}
                        onChange={(e) => setReportForm({ ...reportForm, decision: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="nombre_acusado">Nombre del Acusado</Label>
                      <Input
                        id="nombre_acusado"
                        value={reportForm.nombre_acusado}
                        onChange={(e) => setReportForm({ ...reportForm, nombre_acusado: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fecha">Fecha</Label>
                        <Input
                          id="fecha"
                          type="date"
                          value={reportForm.fecha}
                          onChange={(e) => setReportForm({ ...reportForm, fecha: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="hora">Hora</Label>
                        <Input
                          id="hora"
                          type="time"
                          value={reportForm.hora}
                          onChange={(e) => setReportForm({ ...reportForm, hora: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="observacion">Observación</Label>
                      <Textarea
                        id="observacion"
                        rows={3}
                        value={reportForm.observacion}
                        onChange={(e) => setReportForm({ ...reportForm, observacion: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full">
                      {loading ? 'Creando Reporte...' : 'Crear Reporte'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Mis Reportes</CardTitle>
                    <CardDescription>Historial de reportes creados</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {reports.map((report) => (
                        <div key={report.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">Expediente: {report.expediente}</p>
                              <p className="text-sm text-gray-600">Tribunal: {report.tribunal}</p>
                              <p className="text-sm text-gray-600">Acusado: {report.nombre_acusado}</p>
                            </div>
                            <Badge variant="outline">{report.fecha}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Anuncios</CardTitle>
                    <CardDescription>Comunicados de la administración</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {announcements.map((announcement) => (
                        <div key={announcement.id} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                          <h4 className="font-medium text-blue-900">{announcement.title}</h4>
                          <p className="text-sm text-blue-700 mt-1">{announcement.message}</p>
                          <p className="text-xs text-blue-600 mt-2">
                            {new Date(announcement.created_at).toLocaleString('es-ES')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>

      {showToast.show && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-4 py-2 rounded-lg shadow-lg text-white ${
            showToast.type === 'error' ? 'bg-red-500' : 
            showToast.type === 'info' ? 'bg-blue-500' : 'bg-green-500'
          }`}>
            {showToast.message}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;