import styled, { keyframes } from 'styled-components';

const softRise = keyframes`
  from { 
    opacity: 0; 
    transform: translateY(10px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
`;

export const OverlayBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(1px);
`;

export const OverlayContent = styled.div`
  background: #F8FAFC;
  width: 90%;
  max-width: 350px;
  padding: 0.5rem 1.25rem;
  border-radius: 5px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  animation: ${softRise} 0.4s ease-out;
`;

export const OverlayCloseBTArea = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  width: 100%;
`;

export const CloseBt = styled.button`
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  padding: 0;
`;

export const OverlayHeader = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  gap: 5px;
`;

export const OverlayIconWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  padding: 0;
  margin: 0;
  
  svg {
    display: block;
    font-size: 24px;
    margin: 0 !important;
    color: #3d1616;
  }
`;

export const OverlayHeaderTitle = styled.h3`
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #3d1616;
`;

export const OverlayBody = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  
  p {
    font-size: 0.875rem;
    margin: 1.5rem 0;
  }
  
  button {
    background-color: #3d1616;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 0.5rem 1rem;
    font-size: 1rem;
    font-weight: 600;
    text-transform: uppercase;
    cursor: pointer;
    margin-bottom: 1rem;
  }
`;