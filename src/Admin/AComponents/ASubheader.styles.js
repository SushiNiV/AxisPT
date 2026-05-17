import styled from 'styled-components';
import { NavLink } from 'react-router-dom';

export const AsubheaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: 2.5rem !important;
  border-radius: 5px;
  margin-bottom: 0.5rem;
`;

export const AsubheaderBlob = styled(NavLink)`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  color: #3d1616;
  padding: 10px 15px;
  margin-right: 0.75rem;
  width: 175px;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  box-sizing: border-box;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #3D161625;
    color: #555;
    padding: 10px 15px;
  }
  
  &.active {
    background-color: #3d1616;
    color: #fff;
    font-weight: bold;
    padding: 10px 15px;
    
    &:hover {
      background-color: #3d1616;
      color: #fff;
      font-weight: bold;
      padding: 10px 15px;
    }
  }
`;