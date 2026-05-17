import styled from 'styled-components';
import olfuBG from '../assets/olfu.jpg';

export const SignInContainer = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: #F8FAFC;
  overflow: hidden;
`;

export const LeftCard = styled.div`
  flex: 1;
  background-image: 
    linear-gradient(rgba(54, 20, 20, 0.75), rgba(54, 20, 20, 0.75), rgba(54, 20, 20, 1)), 
    url(${olfuBG});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: #361414;
  margin: 0.5rem;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
`;

export const RightContainer = styled.div`
  flex: 1.5;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: 1rem 0.5rem 1rem 1rem;
`;

export const TopBar = styled.div`
  padding: 1.25rem;
  display: flex;
  justify-content: flex-end;
`;

export const SignInText = styled.p`
  font-size: 0.75rem;
  color: #000;
`;

export const SignInForm = styled.form`
  flex: 1.2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 5rem;
  height: 80%;
`;

export const FormTitle = styled.p`
  font-size: 2.5rem;
  font-weight: bold;
  margin: 0;
  color: #361414;
`;

export const FormColumn = styled.div`
  margin-top: 1rem;
  width: 75%;
`;

export const FormCol = styled.div`
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
`;

export const Label = styled.label`
  font-size: 0.85rem;
  font-weight: 600;
  color: #3d1616;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const PasswordWrapper = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
`;

export const Input = styled.input`
  width: 100%;
  padding: 0.8rem;
  padding-right: 2.5rem;
  border: 1px solid #c2c6cb;
  border-radius: 5px;
  font-size: 0.875rem;
  outline: none;
  transition: all 0.3s ease;
  box-sizing: border-box;

  &:focus {
    border-color: #ff5f5f;
    box-shadow: 0 0 0 3px rgba(255, 95, 95, 0.1);
  }
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
`;

export const SignInButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 2rem;
`;

export const SignInButton = styled.button`
  background-color: #EF3F3F;
  color: white;
  border: none;
  padding: 0.75rem 0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  width: 12rem;
  text-transform: uppercase;
`;

export const PrivText = styled.div`
  width: 80%;
  font-size: 0.7rem;
  color: #666;
  text-align: center;
  margin-top: 1.5rem;
  font-style: italic;
`;

export const FormOptions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.25rem;
  margin-bottom: 20px;
  width: 100%;
  color: #3d1616;
`;

export const RememberMeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;

  input {
    margin-bottom: auto !important;
  }

  label {
    font-size: 14px;
    cursor: pointer;
    margin: 0 !important;
  }
`;

export const ForgotPass = styled.p`
  font-size: 14px;
  cursor: pointer;
  margin: 0;
`;