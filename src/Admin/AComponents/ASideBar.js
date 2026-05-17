import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BiGridAlt, BiUser, BiBookAlt, BiGroup, BiBriefcase, BiCheckShield, BiFile, BiBell, BiHistory, BiSun, BiMoon, BiChevronLeft, BiChevronRight } from 'react-icons/bi';
import cptLogo from '../../assets/cpt-logo.png';
import {
  AsidebarContainer,
  AsidebarArea,
  AlogoArea,
  AmainLogo,
  AlogoText,
  HeadT,
  NavContainer,
  StyledNavLink,
  LinkIcon,
  BotBtns,
  CollapseBtnArea,
  CollapseBtn,
  ThemeToggleArea,
  ThemeSwitch,
  Slider,
  IconSun,
  IconMoon
} from './ASideBar.styles';

function ASideBar() {
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle('dark-mode');
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const isActiveCheck = (paths) => {
    return paths.some(path => location.pathname.includes(path));
  };

  return (
    <AsidebarContainer $isCollapsed={isCollapsed}>
      <AsidebarArea $isCollapsed={isCollapsed}>
        <AlogoArea $isCollapsed={isCollapsed}>
          <AmainLogo src={cptLogo} alt='CPT Logo' />
          {!isCollapsed && (
            <AlogoText>
              <HeadT as="h1">Administrator</HeadT>
              <HeadT as="p">Axis CPT Portal</HeadT>
            </AlogoText>
          )}
        </AlogoArea>

        <NavContainer $isCollapsed={isCollapsed}>
          <StyledNavLink 
            to="/admin/dashboard" 
            $isCollapsed={isCollapsed}
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <LinkIcon $isCollapsed={isCollapsed}>
              <BiGridAlt />
            </LinkIcon>
            {!isCollapsed && <span>Dashboard</span>}
          </StyledNavLink>
          
          <StyledNavLink 
            to="/admin/student-management/masterlist" 
            $isCollapsed={isCollapsed}
            className={isActiveCheck(['/admin/student-management']) ? 'active' : ''}
          >
            <LinkIcon $isCollapsed={isCollapsed}>
              <BiUser />
            </LinkIcon>
            {!isCollapsed && <span>Student Management</span>}
          </StyledNavLink>
          
          <StyledNavLink
            to="/admin/academics/programs&sections"
            $isCollapsed={isCollapsed}
            className={isActiveCheck(['/admin/academics']) ? 'active' : ''}
          >
            <LinkIcon $isCollapsed={isCollapsed}>
              <BiBookAlt />
            </LinkIcon>
            {!isCollapsed && <span>Academics & Grades</span>}
          </StyledNavLink>

          <StyledNavLink 
            to="/admin/documents/student-form" 
            $isCollapsed={isCollapsed}
            className={isActiveCheck(['/admin/documents']) ? 'active' : ''}
          >
            <LinkIcon $isCollapsed={isCollapsed}>
              <BiFile />
            </LinkIcon>
            {!isCollapsed && <span>Documents</span>}
          </StyledNavLink>
          
          <StyledNavLink 
            to="/admin/access-control" 
            $isCollapsed={isCollapsed}
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <LinkIcon $isCollapsed={isCollapsed}>
              <BiBell />
            </LinkIcon>
            {!isCollapsed && <span>Access Control</span>}
          </StyledNavLink>
          
          <StyledNavLink 
            to="/admin/history" 
            $isCollapsed={isCollapsed}
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <LinkIcon $isCollapsed={isCollapsed}>
              <BiHistory />
            </LinkIcon>
            {!isCollapsed && <span>History</span>}
          </StyledNavLink>
        </NavContainer>

        <BotBtns $isCollapsed={isCollapsed}>
          <CollapseBtnArea $isCollapsed={isCollapsed}>
            <CollapseBtn onClick={toggleCollapse} $isCollapsed={isCollapsed}>
              {isCollapsed ? <BiChevronRight /> : <BiChevronLeft />}
            </CollapseBtn>
          </CollapseBtnArea>

          <ThemeToggleArea $isCollapsed={isCollapsed}>
            <ThemeSwitch>
              <input type="checkbox" onChange={toggleTheme} checked={isDarkMode} />
              <Slider $isChecked={isDarkMode} $isCollapsed={isCollapsed}>
                <IconSun $isChecked={isDarkMode} $isCollapsed={isCollapsed}>
                  <BiSun />
                </IconSun>
                <IconMoon $isChecked={isDarkMode} $isCollapsed={isCollapsed}>
                  <BiMoon />
                </IconMoon>
              </Slider>
            </ThemeSwitch>
          </ThemeToggleArea>
        </BotBtns>
      </AsidebarArea>
    </AsidebarContainer>
  );
}

export default ASideBar;