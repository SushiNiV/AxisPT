import styled from 'styled-components';
import { NavLink } from 'react-router-dom';

export const AsidebarContainer = styled.div`
  box-sizing: border-box !important;
  border: none;
  height: 100vh;
  width: ${props => props.$isCollapsed ? '95px' : '275px'};
  position: sticky;
  top: 0;
  left: 0;
  z-index: 1000;
  overflow: hidden;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s ease;
  
  ${props => props.$isCollapsed && `
    background-color: #efefef;
  `}
`;

export const AsidebarArea = styled.div`
  background-color: ${props => props.$isCollapsed ? '#3d1616' : '#FFFFFF'};
  padding: 0.85rem;
  height: 100%;
  border-radius: ${props => props.$isCollapsed ? '10px' : '5px'};
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
`;

export const AlogoArea = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  height: max-content;
  padding: 0;
  ${props => props.$isCollapsed && `
    justify-content: center;
  `}
`;

export const AmainLogo = styled.img`
  padding: 0;
  margin: 0;
  height: 45px;
`;

export const AlogoText = styled.div`
  margin-left: 0.25rem;
`;

export const HeadT = styled.h1`
  padding: 0;
  margin: 0;
  font-family: 'Times New Roman', Times, serif;
  text-transform: uppercase;
  font-size: 1.25rem;
  text-align: left;
  color: #3d1616;
  letter-spacing: 1px;
  
  p& {
    font-size: 1.25rem;
  }
`;

export const NavContainer = styled.nav`
  ${props => props.$isCollapsed && `
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  `}
`;

export const StyledNavLink = styled(NavLink)`
  display: flex !important;
  margin: 0 0 0.25rem 0;
  padding: 1rem 0.875rem !important;
  cursor: pointer;
  border-radius: 8px;
  color: #555 !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: clip;
  text-decoration: none !important;
  font-size: 0.875rem;
  align-items: center;
  
  ${props => props.$isCollapsed && `
    align-items: center;
    justify-content: center;
    padding: 1rem !important;
    border-radius: 15px;
    color: #aaa !important;
    margin-bottom: 0.25rem;
  `}
  
  &:hover {
    background-color: #3d161625;
    color: #000;
  }
  
  ${props => props.$isCollapsed && `
    &:hover {
      background-color: #FFFFFFAA;
      color: #3d1616 !important;
    }
  `}
  
  &.active {
    background-color: #3d1616;
    color: #FFFFFF !important;
    font-weight: 600;
    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);
  }
  
  ${props => props.$isCollapsed && `
    &.active {
      background-color: #FFFFFF;
      color: #3d1616 !important;
      box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);
    }
  `}
`;

export const LinkIcon = styled.div`
  font-size: 20px;
  margin-right: ${props => props.$isCollapsed ? '0' : '15px'};
  display: flex;
  align-items: center;
`;

export const BotBtns = styled.div`
  margin-top: auto;
  margin-left: 0.5rem;
  ${props => props.$isCollapsed && `
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0;
    margin-top: auto;
    margin-left: 0;
  `}
`;

export const CollapseBtnArea = styled.div`
  display: flex;
  justify-content: flex-end;
  ${props => props.$isCollapsed && `
    justify-content: center;
  `}
`;

export const CollapseBtn = styled.button`
  background-color: #3D161625;
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
  
  svg {
    font-size: 2rem;
  }
  
  &:hover {
    background-color: #3D1616;
    color: #FFFFFF;
    transform: scale(1.25);
  }
  
  ${props => props.$isCollapsed && `
    background-color: #FFFFFFAA;
    color: #3d1616;
    
    &:hover {
      background-color: #FFFFFF;
      color: black;
    }
  `}
`;

export const ThemeToggleArea = styled.div`
  margin-top: 1rem;
  ${props => props.$isCollapsed && `
    display: flex;
    justify-content: center;
  `}
`;

export const ThemeSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 40px;
  height: 70px;
  display: flex;
  
  input {
    display: none;
    visibility: hidden;
  }
`;

export const Slider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${props => props.$isCollapsed ? '#FFFFFFAA' : '#3D161625'};
  transition: .4s;
  border-radius: 34px;
  
  &:before {
    position: absolute;
    content: "";
    height: 32px;
    width: 32px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
    z-index: 1;
  }
  
  ${props => props.$isChecked && `
    background-color: ${props.$isCollapsed ? 'black' : '#3d1616'};
    
    &:before {
      transform: translateY(-26px);
    }
  `}
`;

export const IconSun = styled.div`
  position: absolute;
  left: 11px;
  bottom: 11px;
  font-size: 18px;
  transition: .4s;
  z-index: 2;
  pointer-events: none;
  opacity: ${props => props.$isChecked ? 0 : 1};
  transform: ${props => props.$isChecked ? 'translateY(-26px)' : 'none'};
  color: ${props => props.$isCollapsed ? '#3D1616' : '#000'};
`;

export const IconMoon = styled.div`
  position: absolute;
  left: 11px;
  bottom: 11px;
  font-size: 18px;
  transition: .4s;
  z-index: 2;
  pointer-events: none;
  opacity: ${props => props.$isChecked ? 1 : 0};
  transform: ${props => props.$isChecked ? 'translateY(-26px)' : 'none'};
  color: ${props => props.$isCollapsed ? 'black' : '#3d1616'};
`;