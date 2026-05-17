import styled from 'styled-components';

export const Container = styled.div`
  width: 100%;
  height: 100vh;
  max-height: 100%;
  background-color: #3D1616;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

export const TopBar = styled.div`
  width: 100%;
  max-width: 100%;
  height: 1.5rem;
  display: flex;
  align-items: center;
  padding: 1.25rem;
  background-color: transparent;
`;

export const LogoArea = styled.div`
  margin-left: 1rem;
  display: flex;
  align-items: center;
  
  p {
    color: white;
    font-family: 'Times New Roman', Times, serif;
    font-size: 1.75rem;
    margin-left: 0.5rem;
  }
`;

export const MainLogo = styled.img`
  height: 2rem;
  margin-left: 1rem;
`;

export const ReturnButton = styled.button`
  margin-right: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  margin-left: auto;
  
  .material-icons {
    color: white;
    font-size: 1.5rem;
    font-weight: bold;
  }
`;

export const Card = styled.form`
  background-color: #F8FAFC;
  border-radius: 10px;
  margin: auto;
  padding: 2rem 5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

export const Title = styled.p`
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0;
  margin-bottom: 1rem;
  text-transform: uppercase;
  color: #3D1616;
`;

export const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-top: 1rem;
  border: none !important;
  
  label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #3d1616;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    text-align: left;
  }
  
  input {
    padding: 0.8rem;
    border: 1px solid #c2c6cb;
    border-radius: 6px;
    font-size: 0.875rem;
    outline: none;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
    width: 100%;
    box-sizing: border-box;
    
    &:focus {
      border-color: #ff5f5f;
      box-shadow: 0 0 0 3px rgba(255, 95, 95, 0.1);
    }
    
    &::placeholder {
      color: #c2c6cb;
    }
  }
`;

export const PasswordWrapper = styled.div`
  position: relative;
  width: 100%;
`;

export const EyeIcon = styled.span`
  position: absolute;
  right: 0.8rem;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #c2c6cb;
  user-select: none;
  font-size: 1.2rem;
  
  &:hover {
    color: #3D1616;
  }
`;

export const ChangeButton = styled.button`
  background-color: #EF3F3F;
  color: white;
  border: none;
  margin-top: 2rem;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  text-transform: uppercase;
  
  &:hover {
    background-color: #d63232;
  }
`;

export const BottomBar = styled.div`
  width: 100%;
  padding: 0.75rem;
  display: flex;
  justify-content: center;
  background-color: #000;
  margin-top: auto;
  z-index: 20;
`;

export const BottomText = styled.p`
  font-size: 0.75rem;
  color: #fff;
`;