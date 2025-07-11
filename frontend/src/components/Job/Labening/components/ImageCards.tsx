import React from 'react';
import { Row, Col, Card, Dropdown, Menu, Input } from 'antd';
import { EllipsisOutlined } from '@ant-design/icons';
import { Button } from 'antd/es/radio';
interface Imagen {
    _id: string;
    name: string;
    url: string;
    metadata: {
        imgData: string;
    };
}

interface ImageCardsProps {
    imagenes: Imagen[];
    busqueda: string;
    onBuscar: (valor: string) => void;
    onAddImage: () => void;
    onEditar: (imagen: Imagen) => void;
    onEliminar: (id: string) => void;
    onSelect?: (imagen: Imagen) => void;
}

export default function ImageCards({
    imagenes,
    busqueda,
    onBuscar,
    onAddImage,
    onEditar,
    onEliminar,
    onSelect
}: ImageCardsProps) {
    const filtered = imagenes.filter((img) =>
        img.name.toLowerCase().includes(busqueda.toLowerCase())
    );

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <div style={{ marginBottom: 0 }}>
                <Input.Search
                    placeholder="Buscar imagen por nombre"
                    allowClear
                    value={busqueda}
                    onChange={(e) => onBuscar(e.target.value)}
                />
                <Button className="add-label-btn" type="primary"  onClick={onAddImage}>Añadir Imagen</Button>

            </div>

            <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
                <Row gutter={[1, 1]} style={{ width: '100%', gap: 0 }}>

                    {filtered.map((img) => (
                        <Col key={img._id} span={24}>
                            <Card
                                hoverable
                                onClick={() => onSelect?.(img)}
                                cover={
                                    <img
                                        alt={img.name}
                                        src={img.url}
                                        style={{ height: '15vh', width: '100%', objectFit: 'contain' }}
                                    />
                                }
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    flexWrap: 'wrap',
                                    justifyContent: 'center',
                                    width: '100%',
                                    height: '100%',
                                    position: 'relative',
                                    marginBottom: '16px',
                                }}
                            >
                                {/* Menú de tres puntos */}
                                <Dropdown
                                    trigger={['click']}
                                    overlay={
                                        <Menu>
                                            <Menu.Item key="edit" onClick={() => onEditar(img)}>
                                                ✏ Modificar
                                            </Menu.Item>
                                            <Menu.Item key="delete" onClick={() => onEliminar(img._id)}>
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
                                    title={img.name}
                                />
                            </Card>
                        </Col>
                    ))}
                </Row>

            </div>


        </div>
    );
}
