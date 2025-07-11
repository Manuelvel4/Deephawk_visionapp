import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import './signing-common.css';

export default function SignInLayout() {
    return (
        <Layout
            className="sign-in-layout">
            <Outlet />
        </Layout>
    );
}
