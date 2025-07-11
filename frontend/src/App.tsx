import './App.css';
import RouterComponent from './components/Router/router.tsx';
import AuthProvider from '../../frontend/src/components/auth/auth-provider.tsx'
export default function App() {
  return (
    <AuthProvider>
      <RouterComponent />
    </AuthProvider>
  );
};
