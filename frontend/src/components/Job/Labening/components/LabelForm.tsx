// src/components/ImageForm.tsx
import { Button, Form, Input } from 'antd';
import type { LabelImagenFile } from '../types/label-types';
import './LabelForm.css';


interface LabelFormProps {
    labelFormVisible: boolean;
    label: Partial<LabelImagenFile>;
    onChangeLabel: (data: Partial<LabelImagenFile>) => void;
    onGuardarLabel: () => void;
    onCancelarLabel: () => void;
    error?: string | null;
}


export default function ImageForm({ labelFormVisible, label, onChangeLabel, onGuardarLabel, onCancelarLabel, error, }: LabelFormProps) {
    if (!labelFormVisible) return null;

    return (
        <div className="overlay">
            <div className="popup-form">
                <h3 className="form-title">Nueva Etiqueta</h3>
                <Form layout="vertical">
                    <Form.Item label="Nombre">
                        <Input
                            value={label.name}
                            onChange={(e) => onChangeLabel({ ...label, name: e.target.value })}
                        />
                    </Form.Item>
                    <div className="form-project-buttons">
                        <Button type="primary" onClick={onGuardarLabel}>
                            Guardar
                        </Button>
                        <Button onClick={onCancelarLabel}>Cancelar</Button>
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
