import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Avatar from '../components-en/Avatar';
import ProfileReviews from '../components-en/ProfileReviews';
import ProfileFavorites from '../components-en/ProfileFavorites';
import ProfileWatched from "../components-en/ProfileWatched";
import ProfileLists from "../components-en/ProfileLists";
import ProfileStats from "../components-en/ProfileStats";
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


const Profile = () => {
  const { user, loading } = useAuth();
  const { username } = useParams();
  const navigate = useNavigate();
  const [activeButton, setActiveButton] = useState("reviews");
  const [profileUser, setProfileUser] = useState(null);
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
            console.error('Error fetching profile:', response.status);
            setProfileError('Profile not found');
            setLoadingProfile(false);
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
          setProfileError('Error loading profile');
          setLoadingProfile(false);
        }
      };
      fetchUserProfile();
    } else if (user) {
      // Perfil próprio (sem username na URL) - acessado via /profile
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

  // Mock watched data - should match ProfileWatched.js allCards
  const watchedData = useMemo(() => [
    { id: 1, type: 'movie', title: 'Interestelar', year: '2014', duration: '169 min', date: '2023-10-15', rating: 4.8, poster: '../src/img/poster1.jpg' },
    { id: 2, type: 'series', title: 'Breaking Bad', year: '2008-2013', duration: '5 temporadas', date: '2023-09-22', rating: 4.9, poster: '../src/img/poster11.jpg' },
    { id: 3, type: 'movie', title: 'O Poderoso Chefão', year: '1972', duration: '175 min', date: '2023-08-05', rating: 4.7, poster: '../src/img/poster15.jpeg' }
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
      console.error('Error updating follow:', error);
      alert(error.message || 'Error updating follow');
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
      console.log('🔹 followers received:', followers);
      setFollowersList(followers || []);
      console.log('🔹 setShowFollowersModal(true)');
      setShowFollowersModal(true);
    } catch (error) {
      console.error('❌ Error loading followers:', error);
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
      console.log('🔹 following received:', following);
      setFollowingList(following || []);
      console.log('🔹 setShowFollowingModal(true)');
      setShowFollowingModal(true);
    } catch (error) {
      console.error('❌ Error loading following:', error);
      setFollowingList([]);
      setShowFollowingModal(true);
    } finally {
      setLoadingFollowersList(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#fff' }}>Loading...</div>;
  }

  // Se está tentando acessar perfil próprio e não está autenticado, redireciona para login
  if (!username && !user) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#fff' }}>
        <h2>You need to be authenticated to access this page.</h2>
        <Link to="/login">Go to login</Link>
      </div>
    );
  }

  // Se está acessando perfil de outro usuário mas ainda não carregou, mostra loading
  if (username && loadingProfile) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#fff' }}>Loading profile...</div>;
  }

  // Se houve erro ao carregar perfil
  if (profileError) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#fff' }}>
        <h2>{profileError}</h2>
        <Link to="/">Go back to home</Link>
      </div>
    );
  }

  const displayName = profileUser?.displayName || profileUser?.username || 'User';
  const userAvatar = profileUser?.avatar || null;
  console.log('👤 Profile user:', profileUser);
  console.log('✅ Is own profile:', isOwnProfile);

  return (
    <>
      <BackButton />
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
              <Avatar src={userAvatar} alt={displayName} className="profileAvatar" size="xlarge" />
              {/* <div className="avatarStatus online"></div> */}
            </div>

            <div className="userDetails">
              <div className="nameAndBadge">
                <h1 className="displayName">{displayName}</h1>
              </div>

              <span className="username">@{profileUser?.username}</span>

              <div className="userBio">
                <p>{profileUser?.bio || 'No biography added yet.'}</p>
              </div>

              <div className="userStatsMini">
                <div className="statMini" id="statMini-reviews">
                  <FontAwesomeIcon icon={faComment} />
                  <span>{totalReviews} <small>Reviews</small></span>
                </div>
                {totalReviews > 0 && (
                  <div className="statMini" id="statMini-average">
                    <FontAwesomeIcon icon={faStar} />
                    <span>{stats.averageRating} <small>Average</small></span>
                  </div>
                )}
              </div>
            </div>

            <div className="profileActions">

              <div className="rightSideProfile">
                {isOwnProfile ? (
                  <Link to="/settings" className="followButton">
                    <FontAwesomeIcon icon={faPencilAlt} /> Edit Profile
                  </Link>
                ) : (
                  <button 
                    className={`followButton ${isFollowing ? 'following' : ''}`}
                    onClick={handleFollowClick}
                    disabled={loadingFollow}
                  >
                    <FontAwesomeIcon icon={faUserPlus} /> 
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
              <div className="profileSecondaryInfo">
                <div className="followStats">
                  <div className="followStat" onClick={handleShowFollowers} style={{ cursor: 'pointer' }}>
                    <strong>{followersCount}</strong>
                    <span>Followers</span>
                  </div>
                  <div className="followStat" onClick={handleShowFollowing} style={{ cursor: 'pointer' }}>
                    <strong>{followingCount}</strong>
                    <span>Following</span>
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
          <span>Reviews</span>
        </button>

        <button
          className={`navItem ${activeButton === "favorites" ? "active" : ""}`}
          onClick={() => handleClick("favorites")}
        >
          <FontAwesomeIcon icon={faHeart} />
          <span>Favorites</span>
        </button>

        <button
          className={`navItem ${activeButton === "watched" ? "active" : ""}`}
          onClick={() => handleClick("watched")}
        >
          <FontAwesomeIcon icon={faEye} />
          <span>Watched</span>
        </button>

        <button
          className={`navItem ${activeButton === "lists" ? "active" : ""}`}
          onClick={() => handleClick("lists")}
        >
          <FontAwesomeIcon icon={faList} />
          <span>Lists</span>
        </button>

        {/* <button
          className={`navItem ${activeButton === "stats" ? "active" : ""}`}
          onClick={() => handleClick("stats")}
        >
          <FontAwesomeIcon icon={faChartPie} />
          <span>Stats</span>
        </button> */}
      </nav>

      {activeButton === "reviews" && <ProfileReviews userId={profileUser?.id} isOwnProfile={isOwnProfile} />}
      {activeButton === "favorites" && <ProfileFavorites userId={profileUser?.id} />}
      {activeButton === "watched" && <ProfileWatched userId={profileUser?.id} />}
      {activeButton === "lists" && <ProfileLists userId={profileUser?.id} isOwnProfile={isOwnProfile} />}
      {activeButton === "stats" && <ProfileStats />}

      {/* Followers Modal */}
      {showFollowersModal && (
        <>
          {console.log('🔹 Rendering followers modal. showFollowersModal:', showFollowersModal)}
          {createPortal(
            <div className="modal-overlay-followers-profile" onClick={() => setShowFollowersModal(false)}>
              <div className="modal-content-followers-profile" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header-followers-profile">
                  <h2>Followers</h2>
                  <button className="modal-close-followers-profile" onClick={() => setShowFollowersModal(false)}>✕</button>
                </div>
                <div className="modal-body-followers-profile">
                  {loadingFollowersList ? (
                    <p>Loading...</p>
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
                          <Avatar 
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
                    <p>No followers found</p>
                  )}
                </div>
              </div>
            </div>,
            document.body
          )}
        </>
      )}

      {/* Following Modal */}
      {showFollowingModal && (
        <>
          {console.log('🔹 Rendering following modal. showFollowingModal:', showFollowingModal)}
          {createPortal(
            <div className="modal-overlay-followers-profile" onClick={() => setShowFollowingModal(false)}>
              <div className="modal-content-followers-profile" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header-followers-profile">
                  <h2>Following</h2>
                  <button className="modal-close-followers-profile" onClick={() => setShowFollowingModal(false)}>✕</button>
                </div>
                <div className="modal-body-followers-profile">
                  {loadingFollowersList ? (
                    <p>Loading...</p>
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
                          <Avatar 
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
                    <p>Not following any users</p>
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

export default Profile;
