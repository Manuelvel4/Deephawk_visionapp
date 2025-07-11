// src/components/ImageForm.tsx
import { Button, Form, Input, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import './ImageForm.css';

interface Imagen {
    name?: string;
    url?: string;
}

interface ImageFormProps {
    visible: boolean;
    imagen: Partial<Imagen>;
    onChange: (data: Partial<Imagen>) => void;
    onImagen: (file: File) => void;
    onGuardar: () => void;
    onCancelar: () => void;
    error?: string | null; // nuevo
}


export default function ImageForm({
    visible,
    imagen,
    onChange,
    onImagen,
    onGuardar,
    onCancelar,
    error,
}: ImageFormProps) {
    if (!visible) return null;

    return (
        <div className="overlay">
            <div className="popup-form">
                <h3 className="form-title">Nueva Imagen</h3>
                <Form layout="vertical">
                    <Form.Item label="Nombre">
                        <Input
                            value={imagen.name}
                            onChange={(e) => onChange({ ...imagen, name: e.target.value })}
                        />
                    </Form.Item>

                    <Form.Item label="Imagen">
                        <Upload
                            accept="image/*"
                            beforeUpload={(file) => {
                                onImagen(file);
                                return false;
                            }}
                            maxCount={1}
                            showUploadList={false}
                        >
                            <Button icon={<UploadOutlined />}>Seleccionar imagen</Button>
                        </Upload>
                    </Form.Item>

                    <div className="form-project-buttons">
                        <Button type="primary" onClick={onGuardar}>
                            Guardar
                        </Button>
                        <Button onClick={onCancelar}>Cancelar</Button>
                    </div>
                    {error && (
                        <div style={{ color: 'red', marginBottom: 10 }}>
                            {error}
                        </div>
                    )}
                </Form>
            </div>
        </div>
    );
}
