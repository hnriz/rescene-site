import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../hooks/useSearch';
import Avatar from './Avatar';
import logo from '../img/logo-branco.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBell,
    faSearch,
    faFilm,
    faTv,
    faChartLine,
    faUser,
    faEye,
    faHeart,
    faList,
    faCog,
    faSignOutAlt,
    faHome,
    faTimes,
    faChevronDown,
    faChevronUp,
    faRightToBracket
} from '@fortawesome/free-solid-svg-icons';

function HeaderEN() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { searchResults, isLoading, handleSearchInput, clearResults } = useSearch();
    const [userData, setUserData] = useState(user);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    // const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [placeholderText, setPlaceholderText] = useState('');
    
    const searchInputRef = useRef(null);
    const searchTerms = [
        "Find movies, TV shows or reviews...", 
        "Discover new content...",
        "Search by actors or directors..."
    ];

    // Sincronizar dados do usuário do contexto
    useEffect(() => {
        if (user) {
            setUserData(user);
        } else {
            setUserData(null);
            setIsUserDropdownOpen(false);
        }
    }, [user]);

    // Efeito de digitação do placeholder
    useEffect(() => {
        let termIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        const typingSpeed = 100;

        function typeEffect() {
            const currentTerm = searchTerms[termIndex];

            if (!isDeleting && charIndex < currentTerm.length) {
                setPlaceholderText(currentTerm.substring(0, charIndex + 1));
                charIndex++;
                setTimeout(typeEffect, typingSpeed);
            } 
            else if (isDeleting && charIndex > 0) {
                setPlaceholderText(currentTerm.substring(0, charIndex - 1));
                charIndex--;
                setTimeout(typeEffect, typingSpeed / 2);
            } 
            else {
                if (!isDeleting) {
                    setTimeout(() => {
                        isDeleting = true;
                        typeEffect();
                    }, 1000);
                } else {
                    isDeleting = false;
                    termIndex = (termIndex + 1) % searchTerms.length;
                    setTimeout(typeEffect, 500);
                }
            }
        }

        typeEffect();
    }, []);

    // Handler de busca
    const handleSearchInputChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        handleSearchInput(query);
    };

    // Toggle dropdowns
    const handleUserToggleClick = (e) => {
        e.stopPropagation();
        setIsUserDropdownOpen(!isUserDropdownOpen);
        // setIsNotificationDropdownOpen(false);
    };

    // const handleNotificationToggleClick = (e) => {
    //     e.stopPropagation();
    //     setIsNotificationDropdownOpen(!isNotificationDropdownOpen);
    //     setIsUserDropdownOpen(false);
    // };

    // Menu mobile
    const handleHamburgerClick = () => {
        setIsMobileMenuOpen(true);
        document.body.style.overflow = 'hidden';
    };

    const handleCloseMenu = () => {
        setIsMobileMenuOpen(false);
        document.body.style.overflow = '';
    };

    // Logout
    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                !event.target.closest('.user-dropdown') &&
                !event.target.closest('.search-container') &&
                !event.target.closest('.search-results')
            ) {
                setIsUserDropdownOpen(false);
                // setIsNotificationDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Close search results when clicking on a result
    useEffect(() => {
        const handleSearchResultClick = (event) => {
            if (event.target.closest('.search-result-item')) {
                setSearchQuery('');
                clearResults();
            }
        };

        document.addEventListener('click', handleSearchResultClick);
        return () => {
            document.removeEventListener('click', handleSearchResultClick);
        };
    }, [clearResults]);

    return (
        <header className="main-header">
            <div className="header-container">
                <div className="header-left">
                    <div className="hamburger" id="hamburger" onClick={handleHamburgerClick}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>

                    <NavLink to="/" className="logo-link">
                        <img src={logo} alt="Rescene" className="logo" />
                    </NavLink>

                </div>

                <nav className="main-nav">
                    <a href="/movies" className="nav-link">
                        <FontAwesomeIcon icon={faFilm} />
                        <span>Movies</span>
                    </a>
                    <a href="/tvshows" className="nav-link">
                        <FontAwesomeIcon icon={faTv} />
                        <span>TV Shows</span>
                    </a>
                    <a href="/rankMovies" className="nav-link">
                        <FontAwesomeIcon icon={faChartLine} />
                        <span>Popular</span>
                    </a>
                </nav>

                <div className="search-container">
                    <div className="search-bar">
                        <input 
                            type="text" 
                            id="search-input"
                            ref={searchInputRef}
                            // placeholder=" " 
                            autoComplete="off"
                            value={searchQuery}
                            onChange={handleSearchInputChange}
                        />
                        <button type="submit" className="search-btn-header">
                            <FontAwesomeIcon icon={faSearch} />
                        </button>
                        <div 
                            className="search-results" 
                            id="search-results"
                            style={{ display: searchResults.length > 0 || isLoading ? 'block' : 'none' }}
                        >
                            {isLoading && (
                                <div className="search-loading">
                                    <div className="spinner"></div>
                                    Searching...
                                </div>
                            )}
                            {!isLoading && searchResults.length > 0 ? (
                                searchResults.map((result) => (
                                    <a 
                                        href={result.link} 
                                        className="search-result-item" 
                                        key={result.id}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            navigate(result.link);
                                            setSearchQuery('');
                                            clearResults();
                                        }}
                                    >
                                        <img src={result.image} alt={result.title} onError={(e) => {e.target.src = 'https://via.placeholder.com/40'}} />
                                        <div className="search-result-info">
                                            <h4>{result.title}</h4>
                                            <p>
                                                {result.type} 
                                                {result.year && ` · ${result.year}`}
                                                {result.username && ` · ${result.username}`}
                                            </p>
                                        </div>
                                    </a>
                                ))
                            ) : !isLoading && searchQuery.length > 0 ? (
                                <div className="no-results">No results found</div>
                            ) : null}
                        </div>
                    </div>
                </div>

                <div className="user-area">
                    {userData ? (
                        <>
                    {/* <div className="notification-dropdown">
                        <button 
                            className="icon-btn notification-btn" 
                            id="notification-btn"
                            onClick={handleNotificationToggleClick}
                        >
                            <FontAwesomeIcon icon={faBell} />
                            <span className="notification-count">3</span>
                        </button>
                        <div 
                            className="dropdown-content notification-content"
                            style={{ 
                                display: isNotificationDropdownOpen ? 'block' : 'none',
                                visibility: isNotificationDropdownOpen ? 'visible' : 'hidden',
                                opacity: isNotificationDropdownOpen ? 1 : 0
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="dropdown-header">
                                <h3>Notifications</h3>
                                <a href="#" className="mark-all-read">Mark all as read</a>
                            </div>
                            <div className="notification-list">
                                <div className="notification-item unread">
                                    <div className="notification-avatar">
                                        <img src="src/img/user1.jpg" alt="User" />
                                    </div>
                                    <div className="notification-text">
                                        <p><strong>Maria Silva</strong> liked your review
                                            <strong>Interestelar</strong>
                                        </p>
                                        <span className="notification-time">há 2 minutos</span>
                                    </div>
                                </div>
                                <div className="notification-item unread">
                                    <div className="notification-avatar">
                                        <img src="src/img/user2.jpg" alt="User" />
                                    </div>
                                    <div className="notification-text">
                                        <p><strong>João Santos</strong> followed you</p>
                                        <span className="notification-time">15 minutes ago</span>
                                    </div>
                                </div>
                                <div className="notification-item">
                                    <div className="notification-avatar">
                                        <img src="src/img/user3.jpg" alt="User" />
                                    </div>
                                </div>
                            </div>
                            <div className="dropdown-footer">
                                <a href="notifications.html">View all notifications</a>
                            </div>
                        </div>
                    </div> */}

                    <div className="user-dropdown">
                        <button 
                            className="user-btn" 
                            id="user-btn"
                            onClick={handleUserToggleClick}
                        >
                            <Avatar 
                                src={userData?.avatar} 
                                alt="Avatar" 
                                className="user-avatar"
                                size="medium"
                            />
                            <div className="user-info-short">
                                <span className="username">{userData?.displayName || 'Username'}</span>
                                {/* <span className="user-email">{userData?.email || 'usuario@email.com'}</span> */}
                            </div>
                            <FontAwesomeIcon icon={isUserDropdownOpen ? faChevronUp : faChevronDown} />
                        </button>
                        <div 
                            className="dropdown-content user-content"
                            style={{ 
                                display: isUserDropdownOpen ? 'block' : 'none',
                                visibility: isUserDropdownOpen ? 'visible' : 'hidden',
                                opacity: isUserDropdownOpen ? 1 : 0
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="user-info">
                                <Avatar 
                                    src={userData?.avatar} 
                                    alt="Avatar" 
                                    className="user-avatar-large"
                                    size="large"
                                />
                                <div className="user-details">
                                    <h3>{userData?.displayName || 'NomeUsuário'}</h3>
                                    <p>@{userData?.username || 'username'}</p>
                                    <p className="user-email">{userData?.email || 'usuario@email.com'}</p>
                                </div>
                            </div>
                            <div className="dropdown-links">
                                <a href="/profile">
                                    <FontAwesomeIcon icon={faUser} />
                                    <span>My profile</span>
                                </a>
                                <a href="/settings">
                                    <FontAwesomeIcon icon={faCog} />
                                    <span>Settings</span>
                                </a>
                                <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                                    <FontAwesomeIcon icon={faSignOutAlt} />
                                    <span>Sign Out</span>
                                </a>
                            </div>
                        </div>
                    </div>
                        </>
                    ) : (
                        <NavLink to="/login-en" className="nav-link btn-login">
                           <FontAwesomeIcon icon={faRightToBracket} /> Sign In
                        </NavLink>
                    )}
                </div>
            </div>

            <nav 
                className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`} 
                id="mobileMenu"
            >
                <div className="mobile-menu-header">
                    <div className="mobile-logo">
                        <img src={logo}  className="logo" />
                        <span className="logo-text">Rescene</span>
                    </div>
                    <button className="close-menu" id="closeMenu" onClick={handleCloseMenu}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                {userData ? (
                    <>
                <div className="mobile-user-info">
                    <Avatar 
                        src={userData?.avatar} 
                        alt="Avatar" 
                        className="mobile-user-avatar"
                        size="large"
                    />
                    <div className="mobile-user-details">
                        <h3>{userData?.displayName || 'NomeUsuário'}</h3>
                        <p>{userData?.email || 'usuario@email.com'}</p>
                    </div>
                </div>
                <div className="mobile-menu-content">
                    <a href="/" className="mobile-menu-link">
                        <FontAwesomeIcon icon={faHome} />
                        <span>Home</span>
                    </a>
                    <a href="/profile" className="mobile-menu-link">
                        <FontAwesomeIcon icon={faUser} />
                        <span>My Profile</span>
                    </a>
                    <a href="/movies" className="mobile-menu-link">
                        <FontAwesomeIcon icon={faFilm} />
                        <span>Movies</span>
                    </a>
                    <a href="tvshows" className="mobile-menu-link">
                        <FontAwesomeIcon icon={faTv} />
                        <span>TV Shows</span>
                    </a>
                    <a href="rankMovies" className="mobile-menu-link">
                        <FontAwesomeIcon icon={faChartLine} />
                        <span>Popular</span>
                    </a>
                    <a href="settings/user" className="mobile-menu-link">
                        <FontAwesomeIcon icon={faCog} />
                        <span>Settings</span>
                    </a>
                    {userData ? (
                        <a href="#" className="mobile-menu-link" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                            <FontAwesomeIcon icon={faSignOutAlt} />
                            <span>Sign Out</span>
                        </a>
                    ) : (
                        <NavLink to="/login" className="mobile-menu-link">
                            Sign In
                        </NavLink>
                    )}
                </div>
                    </>
                ) : (
                    <div className="mobile-menu-content">
                        <a href="/" className="mobile-menu-link">
                            <FontAwesomeIcon icon={faHome} />
                            <span>Home</span>
                        </a>
                        <a href="/movies" className="mobile-menu-link">
                            <FontAwesomeIcon icon={faFilm} />
                            <span>Movies</span>
                        </a>
                        <a href="/series" className="mobile-menu-link">
                            <FontAwesomeIcon icon={faTv} />
                            <span>TV Shows</span>
                        </a>
                        <a href="/rankMovies" className="mobile-menu-link">
                            <FontAwesomeIcon icon={faChartLine} />
                            <span>Popular</span>
                        </a>
                        <NavLink to="/login" className="mobile-menu-link">
                            <FontAwesomeIcon icon={faSignOutAlt} />
                            <span>Sign In</span>
                        </NavLink>
                    </div>
                )}
            </nav>
        </header>
    );
}

export default HeaderEN;