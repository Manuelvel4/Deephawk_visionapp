// src/components/ProjectForm.tsx
import { Button, Form, Input, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import React from 'react';
import './ProjectForm.css';
interface Proyecto {
    name?: string;
    description?: string;
    modelo?: string;
    modelodescrip?: string;
    img?: string;
}

interface ProjectFormProps {
    visible: boolean;
    proyecto: Partial<Proyecto>;
    onChange: (data: Partial<Proyecto>) => void;
    onImagen: (file: File) => void;
    onGuardar: () => void;
    onCancelar: () => void;
}

export default function ProjectForm({
    visible,
    proyecto,
    onChange,
    onImagen,
    onGuardar,
    onCancelar
}: ProjectFormProps) {
    if (!visible) return null;

    return (
        <div className="overlay">
            <div className="popup-form">
                <h3 className="form-title">Nuevo Proyecto</h3>
                <Form layout="vertical">
                    <Form.Item label="Nombre del proyecto">
                        <Input
                            placeholder="Nombre del proyecto"
                            value={proyecto.name}
                            onChange={(e) => onChange({ ...proyecto, name: e.target.value })}
                        />
                    </Form.Item>

                    <Form.Item label="Descripción del proyecto">
                        <Input.TextArea
                            placeholder="Descripción"
                            rows={3}
                            value={proyecto.description}
                            onChange={(e) => onChange({ ...proyecto, description: e.target.value })}
                        />
                    </Form.Item>

                    <Form.Item label="Modelo">
                        <Input
                            placeholder="Modelo"
                            value={proyecto.modelo}
                            onChange={(e) => onChange({ ...proyecto, modelo: e.target.value })}
                        />
                    </Form.Item>

                    <Form.Item label="Descripción del modelo">
                        <Input.TextArea
                            placeholder="Descripción del modelo"
                            rows={2}
                            value={proyecto.modelodescrip}
                            onChange={(e) => onChange({ ...proyecto, modelodescrip: e.target.value })}
                        />
                    </Form.Item>

                    <Form.Item label="Imagen del proyecto">
                        <Upload
                            accept="image/*"
                            beforeUpload={(file) => {
                                onImagen(file);
                                return false;
                            }}
                            maxCount={1}
                            listType="picture"
                            showUploadList={false}
                        >
                            <Button icon={<UploadOutlined />}>Seleccionar imagen</Button>
                        </Upload>
                    </Form.Item>

                    <div className="form-project-buttons">
                        <Button type="primary" onClick={onGuardar}>
                            Guardar
                        </Button>
                        <Button onClick={onCancelar}>
                            Cancelar
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    );
}
