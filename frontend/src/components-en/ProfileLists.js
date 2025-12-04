import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAuth } from "../context/AuthContext";
import ImageCropper from "./ImageCropper";
import {
  faSearch,
  faFilm,
  faEye,
  faHeart,
  faList,
  faTh,
  faPlus,
  faPlusCircle,
  faShareAlt,
  faEdit,
  faClock,
  faChevronLeft,
  faChevronRight,
  faImage,
  faChevronDown,
  faChevronUp,
  faClapperboard,
} from "@fortawesome/free-solid-svg-icons";

import "../css/profile.css";
import "../css/profileLists.css";

function ProfileLists({ userId, isOwnProfile }) {
  const { user } = useAuth();
  const [userLists, setUserLists] = useState([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState('recent');
  const [showCropper, setShowCropper] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [savedLists, setSavedLists] = useState([]);

  console.log('🔍 ProfileLists received props:', { userId, isOwnProfile, userLists, savedLists });

  // Carregar listas do usuário
  useEffect(() => {
    const loadUserLists = async () => {
      try {
        setLoadingLists(true);
        const token = localStorage.getItem('token');

        // Se é o perfil do próprio usuário, usar /api/lists
        // Se é outro usuário, usar /api/user/:userId/lists
        const API_URL = process.env.REACT_APP_API_URL || 'https://rescene-site.vercel.app/api';
        const endpoint = isOwnProfile 
          ? `${API_URL}/lists`
          : `${API_URL}/user/${userId}/lists`;

        const response = await fetch(endpoint, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });

        if (!response.ok) {
          throw new Error('Error loading lists');
        }

        const data = await response.json();
        console.log('✅ Lists loaded:', data.lists);
        setUserLists(data.lists || []);
      } catch (err) {
        console.error('❌ Error loading lists:', err);
        setUserLists([]);
      } finally {
        setLoadingLists(false);
      }
    };

    loadUserLists();
  }, [userId, isOwnProfile]);

  // Carregar listas salvas (apenas para o próprio perfil)
  useEffect(() => {
    const loadSavedLists = async () => {
      if (!isOwnProfile) return;

      try {
        const token = localStorage.getItem('token');
        const API_URL = process.env.REACT_APP_API_URL || 'https://rescene-site.vercel.app/api';
        const response = await fetch(`${API_URL}/user/saved-lists`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });

        if (!response.ok) {
          throw new Error('Error loading saved lists');
        }

        const data = await response.json();
        console.log('✅ Saved lists loaded:', data.lists);
        console.log('📊 Number of saved lists:', data.lists?.length);
        setSavedLists(data.lists || []);
      } catch (err) {
        console.error('❌ Error loading saved lists:', err);
        setSavedLists([]);
      }
    };

    loadSavedLists();
  }, [isOwnProfile]);

  // Carregar script lists.js
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/js/lists.js';
    script.async = true;
    script.onload = () => {
      if (window.initLists) {
        window.initLists();
      }
    };
    document.body.appendChild(script);
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [userLists]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdown = document.querySelector('.sort-dropdown');
      if (dropdown && !dropdown.contains(event.target)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const getSortLabel = () => {
    const options = {
      'recent': 'Recents',
      'popular': 'Populars',
      'name': 'Name (A-Z)'
    };
    return options[selectedSort] || 'Recents';
  };

  // Render default list cover when no upload
  const renderListCover = (list) => {
    if (list.listCover) {
      return (
        <img
          src={list.listCover}
          alt={list.name}
        />
      );
    } else {
      return (
        <div className="defaultListCover">
          <FontAwesomeIcon icon={faClapperboard} />
        </div>
      );
    }
  };

  const handleCoverSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setShowCropper(true);
    }
  };

  const handleCropComplete = (blob) => {
    // Atualizar o preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const coverUploadPreview = document.querySelector('.coverUploadPreview');
      if (coverUploadPreview) {
        coverUploadPreview.style.backgroundImage = `url(${e.target.result})`;
        coverUploadPreview.style.backgroundSize = 'cover';
        coverUploadPreview.style.backgroundPosition = 'center';
        const placeholder = coverUploadPreview.querySelector('.uploadPlaceholder');
        if (placeholder) {
          placeholder.style.display = 'none';
        }
      }
    };
    reader.readAsDataURL(blob);

    // Atualizar o input file
    const coverInput = document.getElementById('listCover');
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(new File([blob], 'list-cover.jpg', { type: 'image/jpeg' }));
    coverInput.files = dataTransfer.files;

    setShowCropper(false);
    setImageFile(null);
  };

  return (
    <>

      {/* Seção de Listas do Usuário */}
      <section className="userListsContent container">
        <div className="listsHeader">
          <div className="headerInfo">
            <h2 className="sectionTitle">My Lists</h2>
            {/* <p className="sectionSubtitle">Organize your favorite movies and shows into personalized collections</p> */}


          </div>
          {/* <div className="headerStats">
            <div className="statBubble">
              <span className="statNumber">{userLists.length}</span>
              <span className="statLabel">Lists</span>
            </div>
            <div className="statBubble">
              <span className="statNumber">
                {userLists.reduce((sum, list) => sum + (list.mediaCount || 0), 0)}
              </span>
              <span className="statLabel">Items</span>
            </div>
            <div className="statBubble">
              <span className="statNumber">1.2K</span>
              <span className="statLabel">Views</span>
            </div>
          </div> */}
        </div>

        <div className="listsControls">
          <div className="controlsLeft">
            <div className="filterGroup">
              <label>Order by:</label>
              <div className="sort-dropdown">
                <button 
                  className="sort-btn"
                  onClick={() => setIsSortOpen(!isSortOpen)}
                >
                  {getSortLabel()}
                  <FontAwesomeIcon icon={isSortOpen ? faChevronUp : faChevronDown} />
                </button>
                {isSortOpen && (
                  <div className="filter-type-dropdown-content">
                    <button className={`filter-option ${selectedSort === 'recent' ? 'selected' : ''}`} onClick={() => { setSelectedSort('recent'); setIsSortOpen(false); }}>
                      Recents
                    </button>
                    <button className={`filter-option ${selectedSort === 'popular' ? 'selected' : ''}`} onClick={() => { setSelectedSort('popular'); setIsSortOpen(false); }}>
                      Populars
                    </button>
                    <button className={`filter-option ${selectedSort === 'name' ? 'selected' : ''}`} onClick={() => { setSelectedSort('name'); setIsSortOpen(false); }}>
                      Name (A-Z)
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* <div className="viewOptions">
              <button className="viewButton active" data-view="grid">
                <FontAwesomeIcon icon={faTh} />
              </button>
              <button className="viewButton" data-view="list">
                <FontAwesomeIcon icon={faList} />
              </button>
            </div> */}
          </div>

          <div className="controlsRight">
            {/* <div className="searchBox">
              <input type="text" placeholder="Find lists..." />
              <button type="submit">
                <FontAwesomeIcon icon={faSearch} />
              </button>
            </div> */}
           
          </div>
        </div>

        <div className="contentGrid">
          {/* Card de Criar Lista - Mostrar apenas se for o próprio perfil */}
          {isOwnProfile && (
            <div className="listCard createCard" id="createListCard">
              <div className="cardContent">
                <div className="createIcon">
                  <FontAwesomeIcon icon={faPlusCircle} />
                </div>
                <h3>Create a New List</h3>
                <p>Start a new custom collection</p>
              </div>
            </div>
          )}

          {/* Renderizar listas carregadas */}
          {loadingLists ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
              <p>Loading lists...</p>
            </div>
          ) : (userLists.length === 0 && savedLists.length === 0) ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
              <p>You haven't created or saved any lists yet.</p>
            </div>
          ) : (
            (() => {
              const allLists = [...userLists, ...savedLists];
              console.log('🔄 Rendering all lists:', allLists);
              return allLists.map((list) => (
              <a href={`/${list.ownerUsername}/list/${list.id}`} key={list.id}>
                <div
                  className="listCard"
                  data-list-id={list.id}
                  data-items={list.mediaCount || 0}
                  data-date={list.createdAt}
                >
                  <div className="cardImage">
                    {renderListCover(list)}
                    <div className="cardOverlay">
                      <div className="cardStats">
                        <span className="stat">
                          <FontAwesomeIcon icon={faFilm} /> {list.mediaCount || 0}
                        </span>
                      </div>
                      {/* <div className="cardActions">
                         <button
                          className="actionButton"
                          onClick={(e) => {
                            e.preventDefault();
                            // Share list
                          }}
                        >
                          <FontAwesomeIcon icon={faShareAlt} />
                        </button> 
                         <button
                          className="actionButton"
                          data-action="delete"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Delete will be handled by lists.js script
                          }}
                          title="Delete list"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button> 
                      </div> */}
                    </div>
                  </div>
                  <div className="cardInfoLists">
                    <h3 className="cardTitle">{list.name}</h3>
                    <div className="cardMeta">
                      <span className="metaItem">
                        <FontAwesomeIcon icon={faClock} /> Created on{' '}
                        {new Date(list.createdAt).toLocaleDateString('en-US')}
                      </span>
                    </div>
                    <div className="cardFooter">
                      <div className="engagement">
                        {/* <span className="views">
                          <FontAwesomeIcon icon={faEye} /> 0
                        </span> */}
                      </div>
                    </div>
                  </div>
                </div>
              </a>
              ));
            })()
          )}
        </div>

        {/* <div className="pagination">
          <button className="paginationButton" disabled>
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <button className="paginationButton active">1</button>
          <button className="paginationButton">2</button>
          <button className="paginationButton">3</button>
          <button className="paginationButton">
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div> */}
      </section>

      {/* Modal de Criação de Lista */}
      <div className="modal" id="createListModal">
        <div className="modal-overlay"></div>
        <div className="modal-content">
          {/* <button className="close-modal">&times;</button> */}

          <div className="modal-header">
            <h2>
              <FontAwesomeIcon icon={faPlusCircle} /> Create New List
            </h2>
            <p>
              Organize your favorite movies and shows into custom collections.
            </p>
          </div>

          <form className="listForm">
            <div className="formGroup">
              <label htmlFor="listName">List Name</label>
              <input
                type="text"
                id="listName"
                placeholder="Ex: Best Action Movies"
                required
              />
            </div>

            <div className="formGroup">
              <label htmlFor="listDescription">Description</label>
              <textarea
                id="listDescription"
                placeholder="Describe your list..."
                rows="3"
              ></textarea>
            </div>

            {/* <div className="formGroup">
              <label htmlFor="listPrivacy">List Privacy</label>
              <select id="listPrivacy">
                <option value="public">
                  Public (anyone can see)
                </option>
                <option value="private">Private (only me)</option>
                <option value="unlisted">
                  Unlisted (access by link only)
                </option>
              </select>
            </div> */}

            <div className="formGroup">
              <label htmlFor="listCover" className="coverLabel">
                <div className="coverUploadPreview">
                  <div className="uploadPlaceholder">
                    <FontAwesomeIcon icon={faImage} />
                    <span>Click to add a cover</span>
                  </div>
                </div>
                {/* <FontAwesomeIcon icon={faImage} />
                List Cover */}
              </label>
              <input
                type="file"
                id="listCover"
                name="cover"
                accept="image/*"
                hidden
                onChange={handleCoverSelect}
              />
            </div>

            {/* <div className="formGroup">
              <label htmlFor="listCover">List Cover</label>
              <div className="coverUpload">
                <div className="uploadPlaceholder">
                  <FontAwesomeIcon icon={faImage} />
                  <span>Click to add a cover</span>
                </div>
              </div>
              <input
                type="file"
                id="listCover"
                accept="image/*"
                hidden
              />
            </div> */}

            <div className="formActions">
              <button type="button" className="cancelButton">
                Cancel
              </button>
              <button type="submit" className="createButton">
                Create List
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Image Cropper Modal */}
      {showCropper && imageFile && (
        <ImageCropper
          imageFile={imageFile}
          onCrop={handleCropComplete}
          onCancel={() => {
            setShowCropper(false);
            setImageFile(null);
          }}
          aspectRatio={16 / 9}
        />
      )}
    </>
  );
}


export default ProfileLists;
