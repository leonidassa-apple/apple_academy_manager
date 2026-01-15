import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import Alunos from './pages/Alunos';
import Devices from './pages/Devices';
import Emprestimos from './pages/Emprestimos';
import Eventos from './pages/Eventos';
import Agenda from './pages/Agenda';
import Equipments from './pages/Equipments';
import Admin from './pages/Admin';
import Livros from './pages/Livros';
import LivrosPublic from './pages/LivrosPublic';
import EmprestimosLivros from './pages/EmprestimosLivros';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-100 text-gray-500">Carregando aplicação...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/alunos" element={<Alunos />} />
            <Route path="/devices" element={<Devices />} />
            <Route path="/emprestimos" element={<Emprestimos />} />
            <Route path="/eventos" element={<Eventos />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/dispositivos" element={<Equipments />} />
            <Route path="/admin" element={<Admin />} />

            {/* Books Module Routes */}
            <Route path="/livros" element={<Livros />} />
            <Route path="/biblioteca" element={<LivrosPublic />} />
            <Route path="/emprestimos-livros" element={<EmprestimosLivros />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
