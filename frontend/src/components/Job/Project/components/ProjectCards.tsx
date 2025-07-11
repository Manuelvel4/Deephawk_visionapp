// src/components/ProjectCards.tsx
import React from 'react';
import { Row, Col, Card } from 'antd';
import { Dropdown, Menu, Space } from 'antd';
import { EllipsisOutlined } from '@ant-design/icons';

interface Proyecto {
    _id: string;
    name: string;
    img: string;
    description: string;
}

interface ProjectCardsProps {
    proyectos: Proyecto[];
    onAddProject: () => void;
    onEditar: (proyecto: Proyecto) => void;
    onEliminar: (id: string) => void;
    onSelect: (proyecto: Proyecto) => void;
}

export default function ProjectCards({ proyectos, onAddProject, onEditar, onEliminar, onSelect }: ProjectCardsProps) {
    return (
        <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                <Card
                    hoverable
                    onClick={onAddProject}
                    style={{
                        height: 320,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontSize: '3rem',
                        color: '#1890ff',
                        border: '2px dashed #1890ff',
                        cursor: 'pointer'
                    }}
                >
                    +
                </Card>
            </Col>
            {proyectos.map((p) => (
                <Col key={p._id} xs={24} sm={12} md={8} lg={6} xl={4}>
                    <Card
                        hoverable
                        style={{
                            height: 320,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            position: 'relative'
                        }}
                        onClick={() => onSelect(p)}
                        cover={
                            <img
                                alt="Proyecto"
                                src={p.img || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&q=80'}
                                style={{ height: 160, objectFit: 'cover' }}
                            />
                        }
                    >
                        <Dropdown
                            trigger={['click']}
                            overlay={
                                <Menu
                                    onClick={({ key, domEvent }) => {
                                        domEvent.stopPropagation(); // <--- Esto es CLAVE

                                        if (key === 'edit') {
                                            onEditar(p);
                                        } else if (key === 'delete') {
                                            onEliminar(p._id);
                                        }
                                    }}
                                    items={[
                                        { key: 'edit', label: '✏ Modificar' },
                                        { key: 'delete', label: '🗑 Eliminar' },
                                    ]}
                                />
                            }
                        >
                            <span
                                style={{
                                    position: 'absolute',
                                    top: 8,
                                    right: 8,
                                    fontSize: '20px',
                                    cursor: 'pointer',
                                    color: '#999',
                                    zIndex: 2
                                }}
                                onClick={e => e.stopPropagation()} // 👈 También aquí
                            >
                                <EllipsisOutlined />
                            </span>
                        </Dropdown>


                        <div style={{ height: 100 }}>
                            <Card.Meta
                                title={p.name || 'Sin nombre'}
                                description={p.description || 'Sin descripción'}
                            />
                        </div>
                    </Card>
                </Col>
            ))}
        </Row>
    );
}
