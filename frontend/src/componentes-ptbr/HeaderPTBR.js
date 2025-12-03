import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../hooks/useSearch';
import AvatarPTBR from './AvatarPTBR';
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
    faSignInAlt,
    faHome,
    faTimes,
    faChevronDown,
    faChevronUp
} from '@fortawesome/free-solid-svg-icons';

function HeaderPTBR() {
    const { user, logout, loading } = useAuth();
    const navigate = useNavigate();
    const { searchResults, isLoading, handleSearchInput, clearResults } = useSearch();
    const [userData, setUserData] = useState(user);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [placeholderText, setPlaceholderText] = useState('');

    const searchInputRef = useRef(null);
    const searchTerms = [
        "Buscar filmes, séries ou usuários...",
        "Encontrar críticas e avaliações...",
        "Descobrir novos conteúdos...",
        "Pesquisar por atores ou diretores..."
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
        setIsNotificationDropdownOpen(false);
    };

    const handleNotificationToggleClick = (e) => {
        e.stopPropagation();
        setIsNotificationDropdownOpen(!isNotificationDropdownOpen);
        setIsUserDropdownOpen(false);
    };

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
            navigate('/login-ptbr');
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    };

    // Fechar dropdowns ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.user-dropdown') && !event.target.closest('.notification-dropdown')) {
                setIsUserDropdownOpen(false);
                setIsNotificationDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const userAvatar = userData?.avatar;
    const displayName = userData?.displayName;

    return (
        <header className="main-header">
            <div className="header-container">
                <div className="header-left">
                    <div className="hamburger" id="hamburger" onClick={handleHamburgerClick}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>

                    <NavLink to="/PTBR/" className="logo-link">
                        <img src={logo} alt="Rescene" className="logo" />
                    </NavLink>

                </div>

                <nav className="main-nav">
                    <a href="/filmes" className="nav-link">
                        <FontAwesomeIcon icon={faFilm} />
                        <span>Filmes</span>
                    </a>
                    <a href="/series" className="nav-link">
                        <FontAwesomeIcon icon={faTv} />
                        <span>Séries</span>
                    </a>
                    <a href="/top-filmes" className="nav-link">
                        <FontAwesomeIcon icon={faChartLine} />
                        <span>Populares</span>
                    </a>
                </nav>

                <div className="search-container">
                    <div className="search-bar">
                        <input
                            type="text"
                            id="search-input"
                            ref={searchInputRef}
                            placeholder="Buscar filmes, séries ou usuários..."
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
                                    Buscando...
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
                                <div className="no-results">Nenhum resultado encontrado</div>
                            ) : null}
                        </div>
                    </div>
                </div>

                <div className="user-area">
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
                                <h3>Notificações</h3>
                                <a href="#" className="mark-all-read">Marcar todas como lida</a>
                            </div>
                            <div className="notification-list">
                                <div className="notification-item unread">
                                    <div className="notification-avatar">
                                        <img src="src/img/user1.jpg" alt="Usuário" />
                                    </div>
                                    <div className="notification-text">
                                        <p><strong>Maria Silva</strong> curtiu sua avaliação de
                                            <strong>Interestelar</strong>
                                        </p>
                                        <span className="notification-time">há 2 minutos</span>
                                    </div>
                                </div>
                                <div className="notification-item unread">
                                    <div className="notification-avatar">
                                        <img src="src/img/user2.jpg" alt="Usuário" />
                                    </div>
                                    <div className="notification-text">
                                        <p><strong>João Santos</strong> começou a seguir você</p>
                                        <span className="notification-time">há 15 minutos</span>
                                    </div>
                                </div>
                                <div className="notification-item">
                                    <div className="notification-avatar">
                                        <img src="src/img/user3.jpg" alt="Usuário" />
                                    </div>
                                    <div className="notification-text">
                                        <p>Novo episódio de <strong>The Last of Us</strong> disponível</p>
                                        <span className="notification-time">há 1 hora</span>
                                    </div>
                                </div>
                            </div>
                            <div className="dropdown-footer">
                                <a href="notifications.html">Ver todas as notificações</a>
                            </div>
                        </div>
                    </div> */}

                    <div className="user-dropdown">
                        {user ? (
                            <>
                                <button
                                    className="user-btn"
                                    id="user-btn"
                                    onClick={handleUserToggleClick}
                                >
                                    <AvatarPTBR src={userAvatar} alt="Avatar" className="user-avatar" size="medium" />
                                    <div className="user-info-short">
                                        <span className="username">{displayName}</span>
                                        {/* <span className="user-email">{user.email}</span> */}
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
                                        <AvatarPTBR src={userAvatar} alt="Avatar" className="user-avatar-large" size="large" />
                                        <div className="user-details">
                                            <h3>{displayName}</h3>
                                            <p>@{user.username}</p>
                                            <p className="user-email">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="dropdown-links">
                                        <a href="/perfil">
                                            <FontAwesomeIcon icon={faUser} />
                                            <span>Meu Perfil</span>
                                        </a>
                                        <a href="/configuracoes">
                                            <FontAwesomeIcon icon={faCog} />
                                            <span>Configurações</span>
                                        </a>
                                        <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                                            <FontAwesomeIcon icon={faSignOutAlt} />
                                            <span>Sair</span>
                                        </a>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <NavLink to="/login-ptbr" className="nav-link btn-login">
                                <FontAwesomeIcon icon={faSignInAlt} />
                                Entrar
                            </NavLink>
                        )}
                    </div>
                </div>
            </div>

            <nav
                className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}
                id="mobileMenu"
            >
                <div className="mobile-menu-header">
                    <div className="mobile-logo">
                        <img src={logo} className="logo" />
                        <span className="logo-text">Rescene</span>
                    </div>
                    <button className="close-menu" id="closeMenu" onClick={handleCloseMenu}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                {user && (
                    <div className="mobile-user-info">
                        <AvatarPTBR src={userAvatar} alt="Avatar" className="mobile-user-avatar" size="large" />
                        <div className="mobile-user-details">
                            <h3>{displayName}</h3>
                            <p>{user.email}</p>
                        </div>
                    </div>
                )}
                <div className="mobile-menu-content">
                    <a href="/" className="mobile-menu-link">
                        <FontAwesomeIcon icon={faHome} />
                        <span>Página Inicial</span>
                    </a>
                    <a href="/perfil" className="mobile-menu-link">
                        <FontAwesomeIcon icon={faUser} />
                        <span>Meu Perfil</span>
                    </a>
                    <a href="/filmes" className="mobile-menu-link">
                        <FontAwesomeIcon icon={faFilm} />
                        <span>Filmes</span>
                    </a>
                    <a href="/series" className="mobile-menu-link">
                        <FontAwesomeIcon icon={faTv} />
                        <span>Séries</span>
                    </a>
                    <a href="/top-filmes" className="mobile-menu-link">
                        <FontAwesomeIcon icon={faChartLine} />
                        <span>Populares</span>
                    </a>
                    <a href="configuracoes" className="mobile-menu-link">
                        <FontAwesomeIcon icon={faCog} />
                        <span>Configurações</span>
                    </a>
                    {user ? (
                        <a href="#" className="mobile-menu-link" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                            <FontAwesomeIcon icon={faSignOutAlt} />
                            <span>Sair</span>
                        </a>
                    ) : (
                        <NavLink to="/login-ptbr" className="mobile-menu-link">
                            <FontAwesomeIcon icon={faSignInAlt} />
                            <span>Entrar</span>
                        </NavLink>
                    )}
                </div>
            </nav>
        </header>
    );
}

export default HeaderPTBR;