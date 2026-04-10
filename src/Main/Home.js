import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import cptLogo from '../assets/cpt-logo.png'; 

function Home() {
  const navigate = useNavigate()

  return (
    <div className="home-container"> 

        <div className='topBar'>
            <div className='logoArea'>
                <img src={cptLogo} alt='CPT Logo' className='mainLogo'/>
                <p className='mainTitle'>College of Physical Therapy</p>
            </div>
            <div className='searchArea'>
                <div className='searchBar'>
                    <input type='text' placeholder='Search' className='searchInput'/>
                    <button className='searchBT'>
                        <span className="material-icons">search</span>
                    </button>
                </div>
                    <div className='signupBar'>
                        <button className='signupBT' onClick={() => navigate('/signin')}>
                            Sign Up
                        </button>
                    </div>
            </div>
        </div>

        <div className='navBar'>
            <a href='#' className='navLink'>Home</a>
            <a href='#' className='navLink'>About</a>
            <a href='#' className='navLink'>Academics</a>
            <a href='#' className='navLink'>Students</a>
            <a href='#' className='navLink'>Admissions</a>
            <a href='#' className='navLink'>News</a>
            <a href='#' className='navLink'>Contact</a>
        </div>

        <div className='contentArea'>
            <div className='welcomeSection'>
                <p className='welcomeText'>Welcome to the College of Physical Therapy!</p>
            </div>        
            <div className='enrollBar'>
                <button className='enrollBT' onClick={() => navigate('/enrollment-form')}>
                    Enroll Now
                </button>
            </div>
        </div>
    </div>
  );
}

export default Home;