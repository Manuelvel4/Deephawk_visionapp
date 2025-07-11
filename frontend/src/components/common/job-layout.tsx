import { Layout, Menu, Button, Dropdown, Avatar } from 'antd';
import {
    HomeOutlined,
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    UserOutlined,
    LogoutOutlined,
    SettingOutlined,
    RobotOutlined,
    ExperimentOutlined 
} from '@ant-design/icons';
import { useState, useContext } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import './job-layout.css';
import { AuthContext } from '../auth/auth-context';
import axios from 'axios';
import { removeCookie } from 'typescript-cookie';
const { Header, Sider, Content } = Layout;
import logo from '../../../public/logo.png'; 

const JobInLayout = () => {
    const [collapsed, setCollapsed] = useState(true);
    const navigate = useNavigate();
    const { user, setIsAuthenticated, setUser, setProjects } = useContext(AuthContext);
    const apiUrl = import.meta.env.VITE_API_URL;
    const handleLogout = async () => {
        try {
            await axios.post(`${apiUrl}/users/logout`, {}, {
                withCredentials: true
            });
            setIsAuthenticated(false);
            removeCookie('user');
            removeCookie('project');
            removeCookie('imagen');
            removeCookie('label');
            setUser(null);
            setProjects(null);
            navigate('/login');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    const handleProfile = () => {
        navigate('/home/editprofile');
        setCollapsed(true);
    };

    const userMenu = (
        <Menu>
            <Menu.Item key="profile" icon={<SettingOutlined />} onClick={handleProfile}>
                Perfil
            </Menu.Item>
            <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
                Cerrar sesión
            </Menu.Item>
        </Menu>
    );

    return (
        <div className='layout-container'>
            <Sider className={`SiderBar ${collapsed ? 'collapsed' : 'overlay'}`} theme='light' collapsible collapsed={collapsed} onCollapse={setCollapsed} collapsedWidth={0} trigger={null}>
                <Menu className='SiderMenu' defaultSelectedKeys={['1']}>
                <div className="SiderLogo">
                    <img className='siderLogoimg' src={logo} alt="Logo" />
                    <div className="Text">Deephawk</div>
                </div>
                    <Menu.Item key="1" icon={<HomeOutlined />} onClick={() => { navigate('/home'); setCollapsed(true) }}>
                        Home
                    </Menu.Item>
                    <Menu.Item key="2" icon={<RobotOutlined />} onClick={() => { navigate('/home/training'); setCollapsed(true) }}>
                        Training
                    </Menu.Item>
                    <Menu.Item key="3" icon={<ExperimentOutlined />} onClick={() => { navigate('/home/testmode'); setCollapsed(true) }}>
                        Test Mode
                    </Menu.Item>
                </Menu>
            </Sider>
            <Layout>
                <Header className='HeaderBar'>
                    <Button
                        className='HeaderButton'
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                    />
                    <div className="UserMenuContainer">
                        <Dropdown overlay={userMenu} placement="bottomRight" trigger={['click']}>
                            <div>
                                <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
                                <span>{user?.user || 'Usuario'}</span>
                            </div>
                        </Dropdown>
                    </div>
                </Header>
                <Content className={`MainContent ${!collapsed ? 'content-blurred' : ''}`}>
                    <Outlet />
                </Content>
            </Layout>
        </div >
    );
};

export default JobInLayout;
