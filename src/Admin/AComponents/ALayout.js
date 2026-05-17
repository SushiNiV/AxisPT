import ASideBar from './ASideBar';
import AHeader from './AHeader';
import ASubheader from './ASubheader';
import { Outlet } from 'react-router-dom';
import {
  AdminContainer,
  AdminMainContainer,
  AdminPageContent
} from './ALayout.styles';

function ALayout() {
  return (
    <AdminContainer>
      <ASideBar />
      <AdminMainContainer>
        <AHeader />
        <AdminPageContent>
          <Outlet />
        </AdminPageContent>
      </AdminMainContainer>
    </AdminContainer>
  );
}

export default ALayout;