import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import SignInLayout from '../login-page/signing-common/signing-layout';
import Login from '../login-page/login-page';
import Register from '../login-page/signup-page';
import JobInLayout from '../common/job-layout';
import { useAuth } from '../auth/use-auth';
import TrainPage from '../../components/Job/Traininig/train-page';
import LabelPage from '../../components/Job/Labening/label-page';
import ProjectOPage from '../../components/Job/Project/form-project/form-project';
import TestModelPage from '../../components/Job/TestModel/test-model-page';
import EditProfile from '../../components/user-settings/user-settings';

const RouterComponent = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div>Cargando...</div>;
    }

    const router = createBrowserRouter([
        {
            path: '/',
            element: isAuthenticated ? <Navigate to="/home" /> : <SignInLayout />,
            children: [
                { index: true, element: <Navigate to="/login" /> },
                { path: 'login', element: <Login /> },
                { path: 'register', element: <Register /> },
            ],
        },
        {
            path: '/home',
            element: !isAuthenticated ? <Navigate to="/login" /> : <JobInLayout />,
            children: [
                { index: true, element: <ProjectOPage /> },
                { path: 'training', element: <TrainPage /> },
                { path: 'label', element: <LabelPage /> },
                { path: 'testmode', element: <TestModelPage /> },
                { path: 'editprofile', element: <EditProfile /> },

            ],
        },
        {
            path: '*',
            element: isAuthenticated ? <Navigate to="/" /> : <Navigate to="/" />
        }
    ]);

    return <RouterProvider router={router} />;
};

export default RouterComponent;
