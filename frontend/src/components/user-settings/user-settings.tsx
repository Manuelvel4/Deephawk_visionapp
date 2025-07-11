import { LockOutlined, UserOutlined, MailOutlined } from '@ant-design/icons';
import { Button, Form, Input, Typography, Alert } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useContext } from 'react';
import './user-settings.css';
import { AuthContext } from '../auth/auth-context';
import { passwordRule } from '../utils/userRules';
import axios from 'axios';
const { Title } = Typography;

export default function EditProfile() {

    const navigate = useNavigate();
    const {user, setUser } = useContext(AuthContext);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const apiUrl = import.meta.env.VITE_API_URL;
    const [form] = Form.useForm();

    const handleSaveProfile = async (values: any) => {
        setError(null);
        setSuccess(null);
    
        if (values.newPassword && values.newPassword !== values.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }
    
        const payload: any = {
            mail: values.email
        };
    
        if (values.newPassword) {
            payload.password = values.newPassword;
        }
    
        if (!user) {
            setError('Usuario no encontrado');
            return;
        }
    
        try {
            const response = await axios.patch(`${apiUrl}/users/${user.id}`, payload, {
                withCredentials: true
            });
    
            if (response.status === 200) {
                setSuccess('Perfil actualizado correctamente');
            } else {
                setError(response.data.message || 'Error al actualizar perfil');
            }
        } catch (err: any) {
            if (err.response && err.response.data) {
                setError(err.response.data.message || 'Error al actualizar perfil');
            } else {
                setError('Error en el servidor');
            }
        }
    };
    return (
        <div className="auth-form">
            <button className="back-button" onClick={() => navigate('/home')}>
                ←
            </button>
            <Title level={2}>Editar Perfil</Title>
            <Form form={form} onFinish={handleSaveProfile} style={{ width: '100%' }}>
                <Form.Item name="email"
                    rules={[
                        { required: false, message: 'Por favor, introduce un correo electrónico' },
                        { type: 'email', message: 'El correo electrónico no es válido' }
                    ]}>
                    <Input prefix={<MailOutlined />} placeholder="Correo electrónico" />
                </Form.Item>
                <Form.Item name="newPassword" rules={[{required: false, ...passwordRule}]}>
                    <Input.Password prefix={<LockOutlined />} placeholder="Nueva contraseña (opcional)" />
                </Form.Item>

                <Form.Item name="confirmPassword" rules={[{required: false, ...passwordRule}]}>
                    <Input.Password prefix={<LockOutlined />} placeholder="Confirmar nueva contraseña" />
                </Form.Item>

                {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
                {success && <Alert message={success} type="success" showIcon style={{ marginBottom: 16 }} />}

                <Form.Item>
                    <Button type="primary" htmlType="submit" block>
                        Guardar cambios
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
}
