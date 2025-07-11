import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Form, Input, Typography, Alert } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from '../auth/auth-context';
import axios from 'axios';
import './login-page.css';

const { Title } = Typography;

export default function Login() {
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_URL;
    const { setIsAuthenticated, setUser } = useContext(AuthContext);

    const onFinish = async (values: any) => {
        setError(null);
        const payload = {
            user: values.username,
            password: values.password
        };

        try {
            const response = await axios.post(`${apiUrl}/users/login`, payload, {
                headers: { 'Content-Type': 'application/json' },
                withCredentials: true
            });

            if (response.status === 200) {
                setIsAuthenticated(true);
                setUser(response.data.user);
                navigate('/home');
            } else {
                setError('Credenciales inválidas');
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Error del Servidor al iniciar sesión');
        }
    };

    return (
        <div className="auth-form">
            <Title level={2}>Iniciar Sesión</Title>
            <Form onFinish={onFinish} style={{ width: '100%' }}>
                <Form.Item name="username" rules={[{ required: true, message: 'Ingresa tu usuario' }]}>
                    <Input prefix={<UserOutlined />} placeholder="Nombre de usuario" />
                </Form.Item>
                <Form.Item name="password" rules={[{ required: true, message: 'Ingresa tu contraseña' }]}>
                    <Input.Password prefix={<LockOutlined />} placeholder="Contraseña" />
                </Form.Item>

                {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

                <Form.Item>
                    <Button type="primary" htmlType="submit" block>
                        Iniciar Sesión
                    </Button>
                </Form.Item>
                <Form.Item style={{ textAlign: 'center' }}>
                    ¿No tienes cuenta? <a onClick={() => navigate('/register')}>Regístrate</a>
                </Form.Item>
            </Form>
        </div>
    );
}
