import React from 'react';
import { Row, Col, Card, Dropdown, Menu, Input } from 'antd';
import { EllipsisOutlined } from '@ant-design/icons';
import { Button } from 'antd/es/radio';
import type { LabelImagenFile } from '../types/label-types';
import { setCookie } from 'typescript-cookie';
import './styles/LabelCards.css'; // Importa tu CSS personalizado si es necesario

interface ImageCardsProps {
    Labeles: LabelImagenFile[];
    busquedaLabel: string;
    onBuscarLabel: (valor: string) => void;
    onAddLabel: () => void;
    onEditarLabel: (imagen: LabelImagenFile) => void;
    onEliminarLabel: (id: string) => void;
    onSelectLabel?: (imagen: LabelImagenFile) => void;
}

export default function ImageCards({
    Labeles,
    busquedaLabel,
    onBuscarLabel,
    onAddLabel,
    onEditarLabel,
    onEliminarLabel,
    onSelectLabel
}: ImageCardsProps) {
    const filtered = Labeles.filter((label) =>
        label.name.toLowerCase().includes(busquedaLabel.toLowerCase())
    );
    const handleSelectLabel = (label: LabelImagenFile) => {
        onSelectLabel?.(label);
        setCookie('label', JSON.stringify(label));
    }

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <div style={{ marginBottom: 0 }}>
                <Input.Search
                    placeholder="Buscar label por nombre"
                    allowClear
                    value={busquedaLabel}
                    onChange={(e) => onBuscarLabel(e.target.value)}
                />
                <Button className="add-label-btn" type="primary"  onClick={onAddLabel}>Añadir Label</Button>

            </div>

            <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
                <Row gutter={[1, 1]} style={{ width: '100%', gap: 0 }}>

                    {filtered.map((label) => (
                        <Col key={label._id} span={24}>
                            <Card
                                hoverable
                                onClick={() => handleSelectLabel(label)}
                                cover={
                                    <div
                                        style={{ height: '100%', width: '100%', objectFit: 'cover' }}
                                    />
                                }
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    padding: 0,
                                    position: 'relative'
                                }}
                            >
                                {/* Menú de tres puntos */}
                                <Dropdown
                                    trigger={['click']}
                                    overlay={
                                        <Menu>
                                            <Menu.Item key="edit" onClick={() => onEditarLabel(label)}>
                                                ✏ Modificar
                                            </Menu.Item>
                                            <Menu.Item key="delete" onClick={() => onEliminarLabel(label._id)}>
                                                🗑 Eliminar
                                            </Menu.Item>
                                        </Menu>
                                    }
                                >
                                    <EllipsisOutlined
                                        style={{
                                            position: 'absolute',
                                            top: 8,
                                            right: 8,
                                            fontSize: 18,
                                            cursor: 'pointer',
                                            color: '#999',
                                            zIndex: 1
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </Dropdown>

                                <Card.Meta
                                    title={label.name}
                                />
                            </Card>
                        </Col>
                    ))}
                </Row>

            </div>


        </div>
    );
}
