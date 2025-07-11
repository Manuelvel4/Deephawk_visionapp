import { LockOutlined, UserOutlined, MailOutlined } from '@ant-design/icons';
import { Button, Form, Input, Typography, Alert } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { passwordRule } from '../utils/userRules';

import './singup-page.css';

const { Title } = Typography;

export default function Register() {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const apiUrl = import.meta.env.VITE_API_URL;

    const onFinish = async (values: any) => {
        setError(null);

        if (values.password !== values.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        const payload = {
            user: values.username,
            mail: values.email,
            password: values.password
        };

        try {
            const response = await fetch(`${apiUrl}/users/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                navigate('/login');
            } else {
                const data = await response.json();
                setError(data.message || 'Error en el registro');
            }
        } catch (err) {
            setError('Error en el servidor');
        }
    };

    return (
        <div className="auth-form">
            <button className="back-button" onClick={() => navigate('/login')}>
                ←
            </button>
            <Title level={2}>Registrarse</Title>
            <Form onFinish={onFinish} style={{ width: '100%' }}>
                <Form.Item name="username" rules={[{ required: true, message: 'Ingresa un nombre de usuario' }]}>
                    <Input prefix={<UserOutlined />} placeholder="Nombre de usuario" />
                </Form.Item>

                <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Correo válido requerido' }]}>
                    <Input prefix={<MailOutlined />} placeholder="Correo electrónico" />
                </Form.Item>

                <Form.Item name="password" rules={[{ required: true, message: 'Ingresa una contraseña' }, passwordRule]}>
                    <Input.Password prefix={<LockOutlined />} placeholder="Contraseña" />
                </Form.Item>

                <Form.Item name="confirmPassword" rules={[{ required: true, message: 'Confirma la contraseña', }, passwordRule]}>
                    <Input.Password prefix={<LockOutlined />} placeholder="Confirmar contraseña" />
                </Form.Item>

                {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

                <Form.Item>
                    <Button type="primary" htmlType="submit" block>
                        Registrarse
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
}
