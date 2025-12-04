import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import BackButtonPTBR from '../componentes-ptbr/BackButtonPTBR';
import AvatarPTBR from '../componentes-ptbr/AvatarPTBR';
import ProfileReviews from '../componentes-ptbr/PerfilReviews';
import ProfileFavorites from '../componentes-ptbr/PerfilFavoritos';
import ProfileWatched from "../componentes-ptbr/PerfilAssistidos";
import PerfilListas from "../componentes-ptbr/PerfilListas";
import ProfileStats from "../componentes-ptbr/PerfilEstatisticas";
import followerService from '../services/followerService';
import userStatsService from '../services/userStatsService';

import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilm,
  faTv,
  faStar,
  faUserPlus,
  faCalendarAlt,
  faPencilAlt,
  faHeart,
  faEye,
  faList,
  faChartPie,
  faComment
} from '@fortawesome/free-solid-svg-icons';
import '../css/profile.css';
import profileBg from '../img/profile-bg.jpg';


const Perfil = () => {
  const { user, loading } = useAuth();
  const { username } = useParams();
  const navigate = useNavigate();
  const [activeButton, setActiveButton] = useState("reviews");
  const [profileUser, setProfileUser] = useState(null);
  // If username is in URL, it's a public profile view, so isOwnProfile starts as false
  // If no username, it's own profile, so isOwnProfile starts as true
  const [isOwnProfile, setIsOwnProfile] = useState(!username);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [loadingFollowersList, setLoadingFollowersList] = useState(false);

  // Se username está na URL, é um perfil de outro usuário
  useEffect(() => {
    if (username) {
      setLoadingProfile(true);
      setProfileError(null);
      
      // Buscar dados do usuário via endpoint público
      const fetchUserProfile = async () => {
        try {
          const API_URL = process.env.REACT_APP_API_URL || 'https://rescene-site.vercel.app/api';
          const response = await fetch(`${API_URL}/user/${username}`);
          if (response.ok) {
            const data = await response.json();
            setProfileUser(data);
            setLoadingProfile(false);
            
            // Verificar se é o perfil do próprio usuário autenticado
            const isOwnProfile = user && user.username && user.username.toLowerCase() === username.toLowerCase();
            setIsOwnProfile(isOwnProfile);
            
            if (!isOwnProfile) {
              // Carregar dados de followers/following apenas se for outro usuário
              const followersCount = await followerService.getFollowersCount(username);
              const followingCount = await followerService.getFollowingCount(username);
              const isFollowing = await followerService.isFollowing(username);
              const stats = await userStatsService.getAverageRating(username);
              
              setFollowersCount(followersCount);
              setFollowingCount(followingCount);
              setIsFollowing(isFollowing);
              setAverageRating(stats.averageRating);
              setTotalReviews(stats.totalReviews);
            } else {
              // Se é o próprio perfil, carregar dados do próprio usuário
              const followersCount = await followerService.getFollowersCount(user.id);
              const followingCount = await followerService.getFollowingCount(user.id);
              const stats = await userStatsService.getAverageRating(user.id);
              
              setFollowersCount(followersCount);
              setFollowingCount(followingCount);
              setAverageRating(stats.averageRating);
              setTotalReviews(stats.totalReviews);
            }
          } else {
            console.error('Erro ao buscar perfil:', response.status);
            setProfileError('Perfil não encontrado');
            setLoadingProfile(false);
          }
        } catch (err) {
          console.error('Erro ao buscar perfil do usuário:', err);
          setProfileError('Erro ao carregar perfil');
          setLoadingProfile(false);
        }
      };
      fetchUserProfile();
    } else if (user) {
      // Perfil próprio (sem username na URL) - acessado via /perfil
      setProfileUser(user);
      setIsOwnProfile(true);
      setLoadingProfile(false);
      
      // Carregar dados de followers/following do usuário autenticado
      const loadOwnFollowData = async () => {
        const followersCount = await followerService.getFollowersCount(user.id);
        const followingCount = await followerService.getFollowingCount(user.id);
        const stats = await userStatsService.getAverageRating(user.id);
        
        setFollowersCount(followersCount);
        setFollowingCount(followingCount);
        setAverageRating(stats.averageRating);
        setTotalReviews(stats.totalReviews);
      };
      loadOwnFollowData();
    }
  }, [username, user]);

  // Mock watched data - should match PerfilAssistidos.js allCards
  const watchedData = useMemo(() => [
    { id: 1, type: 'movie', title: 'Interestelar', year: '2014', duration: '169 min', date: '15/10/2023', rating: 4.8, userRating: 4.5, poster: '../src/img/poster1.jpg' },
    { id: 2, type: 'series', title: 'Breaking Bad', year: '2008-2013', duration: '5 temporadas', date: '22/09/2023', rating: 4.9, userRating: 5, poster: '../src/img/poster11.jpg' },
    { id: 3, type: 'movie', title: 'O Poderoso Chefão', year: '1972', duration: '175 min', date: '05/08/2023', rating: 4.7, userRating: 5, poster: '../src/img/poster15.jpeg' }
  ], []);

  // Calculate stats dynamically
  const stats = useMemo(() => ({
    totalWatched: watchedData.length,
    totalMovies: watchedData.filter(c => c.type === 'movie').length,
    totalSeries: watchedData.filter(c => c.type === 'series').length,
    averageRating: averageRating > 0 ? averageRating.toFixed(1) : (watchedData.length > 0 ? (watchedData.reduce((sum, c) => sum + c.rating, 0) / watchedData.length).toFixed(1) : 0)
  }), [watchedData, averageRating]);

  const handleClick = (buttonName) => {
    setActiveButton(buttonName);
  };

  const handleFollowClick = async () => {
    try {
      setLoadingFollow(true);
      if (isFollowing) {
        await followerService.unfollowUser(username);
        setIsFollowing(false);
        setFollowersCount(followersCount - 1);
      } else {
        const result = await followerService.followUser(username);
        setIsFollowing(true);
        setFollowersCount(result.followersCount || followersCount + 1);
      }
    } catch (error) {
      console.error('Erro ao atualizar follow:', error);
      alert(error.message || 'Erro ao atualizar follow');
    } finally {
      setLoadingFollow(false);
    }
  };

  const handleShowFollowers = async () => {
    console.log('🔹 handleShowFollowers called');
    setLoadingFollowersList(true);
    try {
      const userId = username ? username : user?.id;
      console.log('🔹 userId:', userId);
      const followers = await followerService.getFollowersList(userId);
      console.log('🔹 followers recebidos:', followers);
      setFollowersList(followers || []);
      console.log('🔹 setShowFollowersModal(true)');
      setShowFollowersModal(true);
    } catch (error) {
      console.error('❌ Erro ao carregar seguidores:', error);
      setFollowersList([]);
      setShowFollowersModal(true);
    } finally {
      setLoadingFollowersList(false);
    }
  };

  const handleShowFollowing = async () => {
    console.log('🔹 handleShowFollowing called');
    setLoadingFollowersList(true);
    try {
      const userId = username ? username : user?.id;
      console.log('🔹 userId:', userId);
      const following = await followerService.getFollowingList(userId);
      console.log('🔹 following recebido:', following);
      setFollowingList(following || []);
      console.log('🔹 setShowFollowingModal(true)');
      setShowFollowingModal(true);
    } catch (error) {
      console.error('❌ Erro ao carregar seguindo:', error);
      setFollowingList([]);
      setShowFollowingModal(true);
    } finally {
      setLoadingFollowersList(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#fff' }}>Carregando...</div>;
  }

  // Se está tentando acessar perfil próprio e não está autenticado, redireciona para login
  if (!username && !user) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#fff' }}>
        <h2>Você precisa estar autenticado para acessar esta página.</h2>
        <Link to="/login-ptbr">Ir para login</Link>
      </div>
    );
  }

  // Se está acessando perfil de outro usuário mas ainda não carregou, mostra loading
  if (username && loadingProfile) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#fff' }}>Carregando perfil...</div>;
  }

  // Se houve erro ao carregar perfil
  if (profileError) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#fff' }}>
        <h2>{profileError}</h2>
        <Link to="/PTBR/">Voltar para home</Link>
      </div>
    );
  }

  const displayName = profileUser?.displayName || profileUser?.username || 'Usuário';
  const userAvatar = profileUser?.avatar || null;
  console.log('👤 Profile user:', profileUser);
  console.log('✅ Is own profile:', isOwnProfile);

  return (
    <>
      <BackButtonPTBR />
      <main className="profilePage">
        <section className="profileHeader">
        <div
          className="profileBackground"
        >
          <div className="profileOverlay"></div>
        </div>

        <div className="profileContent container">
          <div className="profileMainInfo">
            <div className="avatarContainer">
              <AvatarPTBR src={userAvatar} alt={displayName} className="profileAvatar" size="xlarge" />
              {/* <div className="avatarStatus online"></div> */}
            </div>

            <div className="userDetails">
              <div className="nameAndBadge">
                <h1 className="displayName">{displayName}</h1>
              </div>

              <span className="username">@{profileUser?.username}</span>

              <div className="userBio">
                <p>{profileUser?.bio || 'Nenhuma biografia adicionada ainda.'}</p>
              </div>

              <div className="userStatsMini">
                <div className="statMini" id="statMini-reviews">
                  <FontAwesomeIcon icon={faComment} />
                  <span>{totalReviews} <small>Reviews</small></span>
                </div>
                {totalReviews > 0 && (
                  <div className="statMini" id="statMini-average">
                    <FontAwesomeIcon icon={faStar} />
                    <span>{stats.averageRating} <small>média</small></span>
                  </div>
                )}
              </div>
            </div>

            <div className="profileActions">

              <div className="rightSideProfile">
                {isOwnProfile ? (
                  <Link to="/configuracoes" className="followButton">
                    <FontAwesomeIcon icon={faPencilAlt} /> Editar Perfil
                  </Link>
                ) : (
                  <button 
                    className={`followButton ${isFollowing ? 'following' : ''}`}
                    onClick={handleFollowClick}
                    disabled={loadingFollow}
                  >
                    <FontAwesomeIcon icon={faUserPlus} /> 
                    {isFollowing ? 'Seguindo' : 'Seguir'}
                  </button>
                )}
              </div>
              <div className="profileSecondaryInfo">
                <div className="followStats">
                  <div className="followStat" onClick={handleShowFollowers} style={{ cursor: 'pointer' }}>
                    <strong>{followersCount}</strong>
                    <span>Seguidores</span>
                  </div>
                  <div className="followStat" onClick={handleShowFollowing} style={{ cursor: 'pointer' }}>
                    <strong>{followingCount}</strong>
                    <span>Seguindo</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      <nav className="profileNav container">
        <button
          className={`navItem ${activeButton === "reviews" ? "active" : ""}`}
          onClick={() => handleClick("reviews")}
        >
          <FontAwesomeIcon icon={faStar} />
          <span>Avaliações</span>
        </button>

        <button
          className={`navItem ${activeButton === "favorites" ? "active" : ""}`}
          onClick={() => handleClick("favorites")}
        >
          <FontAwesomeIcon icon={faHeart} />
          <span>Favoritos</span>
        </button>

        <button
          className={`navItem ${activeButton === "watched" ? "active" : ""}`}
          onClick={() => handleClick("watched")}
        >
          <FontAwesomeIcon icon={faEye} />
          <span>Assistidos</span>
        </button>

        <button
          className={`navItem ${activeButton === "lists" ? "active" : ""}`}
          onClick={() => handleClick("lists")}
        >
          <FontAwesomeIcon icon={faList} />
          <span>Listas</span>
        </button>

        {/* <button
          className={`navItem ${activeButton === "stats" ? "active" : ""}`}
          onClick={() => handleClick("stats")}
        >
          <FontAwesomeIcon icon={faChartPie} />
          <span>Estatísticas</span>
        </button> */}
      </nav>

      {activeButton === "reviews" && (
        <>
          {console.log('🔍 Perfil Debug:', { username, isOwnProfile, userIdFromAuth: user?.id, userObject: user })}
          <ProfileReviews userId={profileUser?.id} isOwnProfile={isOwnProfile} />
        </>
      )}
      {activeButton === "favorites" && <ProfileFavorites userId={profileUser?.id} />}
      {activeButton === "watched" && <ProfileWatched userId={profileUser?.id} />}
      {activeButton === "lists" && <PerfilListas userId={profileUser?.id} isOwnProfile={isOwnProfile} />}
      {activeButton === "stats" && <ProfileStats />}

      {/* Modal de Seguidores */}
      {showFollowersModal && (
        <>
          {console.log('🔹 Renderizando modal de seguidores. showFollowersModal:', showFollowersModal)}
          {createPortal(
            <div className="modal-overlay-followers-profile" onClick={() => setShowFollowersModal(false)}>
              <div className="modal-content-followers-profile" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header-followers-profile">
                  <h2>Seguidores</h2>
                  <button className="modal-close-followers-profile" onClick={() => setShowFollowersModal(false)}>✕</button>
                </div>
                <div className="modal-body-followers-profile">
                  {loadingFollowersList ? (
                    <p>Carregando...</p>
                  ) : followersList.length > 0 ? (
                    <div className="followers-list-profile">
                      {followersList.map(follower => (
                        <div 
                          key={follower.id} 
                          className="follower-item-profile"
                          onClick={() => {
                            setShowFollowersModal(false);
                            navigate(`/user/${follower.username}`);
                          }}
                        >
                          <AvatarPTBR 
                            src={follower.avatar}
                            alt={follower.username}
                            className="follower-avatar-profile"
                            size="small"
                          />
                          <div className="follower-info-profile">
                            <p className="follower-display-name-profile">{follower.displayName || follower.username}</p>
                            <p className="follower-username-profile">@{follower.username}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>Nenhum seguidor encontrado</p>
                  )}
                </div>
              </div>
            </div>,
            document.body
          )}
        </>
      )}

      {/* Modal de Seguindo */}
      {showFollowingModal && (
        <>
          {console.log('🔹 Renderizando modal de seguindo. showFollowingModal:', showFollowingModal)}
          {createPortal(
            <div className="modal-overlay-followers-profile" onClick={() => setShowFollowingModal(false)}>
              <div className="modal-content-followers-profile" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header-followers-profile">
                  <h2>Seguindo</h2>
                  <button className="modal-close-followers-profile" onClick={() => setShowFollowingModal(false)}>✕</button>
                </div>
                <div className="modal-body-followers-profile">
                  {loadingFollowersList ? (
                    <p>Carregando...</p>
                  ) : followingList.length > 0 ? (
                    <div className="followers-list-profile">
                      {followingList.map(following => (
                        <div 
                          key={following.id} 
                          className="follower-item-profile"
                          onClick={() => {
                            setShowFollowingModal(false);
                            navigate(`/user/${following.username}`);
                          }}
                        >
                          <AvatarPTBR 
                            src={following.avatar}
                            alt={following.username}
                            className="follower-avatar-profile"
                            size="small"
                          />
                          <div className="follower-info-profile">
                            <p className="follower-display-name-profile">{following.displayName || following.username}</p>
                            <p className="follower-username-profile">@{following.username}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>Nenhum usuário sendo seguido</p>
                  )}
                </div>
              </div>
            </div>,
            document.body
          )}
        </>
      )}
      </main>
    </>
  );
};

export default Perfil
