import styled from 'styled-components';

export const AdminContainer = styled.div`
  display: flex;
  height: 100vh;
  overflow-x: hidden;
  background-color: #EFEFEF;
`;

export const AdminMainContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-width: 0;
  overflow: hidden;
  box-sizing: border-box;
`;

export const AdminPageContent = styled.main`
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
  padding-right: 0.5rem;
  box-sizing: border-box;
`;