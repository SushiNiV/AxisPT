import styled from 'styled-components';

export const AheaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 75px;
  width: 100%;
  padding: 0 1rem 0 1rem;
  box-sizing: border-box;
  background-color: #EFEFEF;
  
  h1 {
    margin: 0;
  }
`;

export const HeaderTitle = styled.span`
  margin-right: auto;
  font-size: 2.25rem;
  color: #3d1616;
  font-weight: bold;
`;

export const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const HeaderIcon = styled.div`
  font-size: 20px;
  color: #3d1616;
`;

export const NotificationBtn = styled.div`
  background-color: #fff;
  border: none;
  color: #000;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
`;

export const ProfileBtn = styled.div`
  background-color: #fff;
  border: none;
  color: #000;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
`;

export const LogoutBtn = styled.div`
  display: flex;
  align-items: center;
  background-color: transparent;
  border: 1px solid #3d1616;
  color: #3d1616;
  padding: 0 15px;
  height: 35px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #d32f2f;
    border: 1px solid #d32f2f;
    color: white;
  }
`;

export const LogoutIconMar = styled.div`
  margin-right: 8px;
  display: flex;
  align-items: center;
`;

export const ProfilePic = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
`;

export const ProfileIconPlaceholder = styled.div`
  font-size: 20px;
  color: #3d1616;
`;

export const LogoutModalContent = styled.div`
  p {
    margin: 2rem 0;
  }
`;

export const OverlayActionButtons = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
`;

export const ConfirmBtn = styled.button`
  background-color: #3d1616 !important;
  color: #fff !important;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  cursor: pointer;
  margin-bottom: 1rem;
  
  &:hover {
    background-color: #d32f2f !important;
  }
`;