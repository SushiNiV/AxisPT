import React from 'react';
import './Home.css';
import cptLogo from './assets/cpt-logo.png'; 

function Home() {
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
                    <button className='searchButton'>
                        <span className="material-icons">search</span>
                    </button>
                </div>
                <div className='enrollBar'>
                    <button className='enrollBT'>
                        Enroll Now!
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
    </div>
  );
}

export default Home;