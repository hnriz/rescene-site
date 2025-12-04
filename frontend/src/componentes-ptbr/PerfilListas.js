import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAuth } from "../context/AuthContext";
import CortadorImagem from "../componentes-ptbr/CortadorImagem";
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
  faListUl,
  faClapperboard,
} from "@fortawesome/free-solid-svg-icons";

import "../css/profile.css";
import "../css/profileLists.css";

function PerfilListas({ userId, isOwnProfile }) {
  const { user } = useAuth();
  const [userLists, setUserLists] = useState([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState('recent');
  const [showCropper, setShowCropper] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [savedLists, setSavedLists] = useState([]);

  console.log('🔍 PerfilListas recebeu props:', { userId, isOwnProfile, userLists, savedLists });

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      const sortDropdown = document.querySelector('.sort-dropdown');

      if (sortDropdown && !sortDropdown.contains(event.target)) {
        setIsSortDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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
          throw new Error('Erro ao carregar listas');
        }

        const data = await response.json();
        console.log('✅ Listas carregadas:', data.lists);
        setUserLists(data.lists || []);
      } catch (err) {
        console.error('❌ Erro ao carregar listas:', err);
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
          throw new Error('Erro ao carregar listas salvas');
        }

        const data = await response.json();
        console.log('✅ Listas salvas carregadas:', data.lists);
        console.log('📊 Número de listas salvas:', data.lists?.length);
        setSavedLists(data.lists || []);
      } catch (err) {
        console.error('❌ Erro ao carregar listas salvas:', err);
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

  const getSortLabel = () => {
    const sortOptions = {
      'recent': 'Recentes',
      'popular': 'Populares',
      'name': 'Nome (A-Z)',
      'items': 'Mais itens'
    };
    return sortOptions[selectedSort] || 'Recentes';
  };

  // Renderizar capa padrão quando não houver upload
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
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setShowCropper(true);
    }
  };

  const handleCropComplete = (blob) => {
    // Armazenar o blob cropped para enviar com o formulário
    const croppedFile = new File([blob], 'list-cover.jpg', { type: 'image/jpeg' });
    
    // Salvar em um hidden input ou state para usar no submit
    const coverInput = document.getElementById('listCover');
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(croppedFile);
    coverInput.files = dataTransfer.files;
    
    // Mostrar preview
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
    
    setShowCropper(false);
    setImageFile(null);
  };

  return (
    <>

      {/* Seção de Listas do Usuário */}
      <section className="userListsContent container">
        <div className="listsHeader">
          <div className="headerInfo">
            <h2 className="sectionTitle">Minhas Listas</h2>
            {/* <p className="sectionSubtitle">
              Organize seus filmes e séries em coleções personalizadas
            </p> */}
          </div>
          {/* <div className="headerStats">
            <div className="statBubble">
              <span className="statNumber">{userLists.length}</span>
              <span className="statLabel">Listas</span>
            </div>
            <div className="statBubble">
              <span className="statNumber">
                {userLists.reduce((sum, list) => sum + (list.mediaCount || 0), 0)}
              </span>
              <span className="statLabel">Itens</span>
            </div>
            <div className="statBubble">
              <span className="statNumber">-</span>
              <span className="statLabel">Visualizações</span>
            </div>
          </div> */}
        </div>

        <div className="listsControls">
          <div className="controlsLeft">
            <div className="filterGroup">
              <label>Ordenar por:</label>
              <div className="sort-dropdown">
                <button className="sort-btn" onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}>
                  <span>{getSortLabel()}</span>
                  <FontAwesomeIcon icon={isSortDropdownOpen ? faChevronUp : faChevronDown} />
                </button>
                {isSortDropdownOpen && (
                  <div className="filter-type-dropdown-content">
                    {[
                      { value: 'recent', label: 'Recentes' },
                      { value: 'popular', label: 'Populares' },
                      { value: 'name', label: 'Nome (A-Z)' },
                      { value: 'items', label: 'Mais itens' }
                    ].map(option => (
                      <button
                        key={option.value}
                        className={`filter-option ${selectedSort === option.value ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedSort(option.value);
                          setIsSortDropdownOpen(false);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
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
              <input type="text" placeholder="Buscar listas..." />
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
                <h3>Criar Nova Lista</h3>
                <p>Comece uma nova coleção personalizada</p>
              </div>
            </div>
          )}

          {/* Renderizar listas carregadas */}
          {loadingLists ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
              <p>Carregando listas...</p>
            </div>
          ) : (userLists.length === 0 && savedLists.length === 0) ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
              <p>Você ainda não criou ou salvou nenhuma lista.</p>
            </div>
          ) : (
            (() => {
              const allLists = [...userLists, ...savedLists];
              console.log('🔄 Renderizando todas as listas:', allLists);
              return allLists.map((list) => (
              <a href={`/${list.ownerUsername || user?.username}/lista/${list.id}`} key={list.id}>
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
                            // Compartilhar lista
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
                            // Delete será tratado pelo script lists.js
                          }}
                          title="Deletar lista"
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
                        <FontAwesomeIcon icon={faClock} /> Criada em{' '}
                        {new Date(list.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    {/* <div className="cardFooter">
                      <div className="engagement">
                        <span className="views">
                          <FontAwesomeIcon icon={faEye} /> 0
                        </span>
                      </div>
                    </div> */}
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
          <button className="close-modal">&times;</button>

          <div className="modal-header">
            <h2>
              <FontAwesomeIcon icon={faPlusCircle} /> Criar Nova Lista
            </h2>
            <p>
              Organize seus filmes e séries em uma coleção personalizada
            </p>
          </div>

          <form className="listForm">
            <div className="formGroup">
              <label htmlFor="listName">Nome da Lista *</label>
              <input
                type="text"
                id="listName"
                placeholder="Ex: Melhores Filmes de Ação"
                required
              />
            </div>

            <div className="formGroup">
              <label htmlFor="listDescription">Descrição</label>
              <textarea
                id="listDescription"
                placeholder="Descreva o tema ou propósito da sua lista..."
                rows="3"
              ></textarea>
            </div>

            {/* <div className="formGroup">
              <label htmlFor="listPrivacy">Privacidade</label>
              <select id="listPrivacy">
                <option value="public">
                  Pública (qualquer um pode ver)
                </option>
                <option value="private">Privada (somente eu)</option>
                <option value="unlisted">
                  Não listada (acesso por link)
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

            <div className="formActions">
              <button type="button" className="cancelButton">
                Cancelar
              </button>
              <button type="submit" className="createButton">
                Criar Lista
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de Ajuste de Imagem */}
      {showCropper && imageFile && (
        <CortadorImagem
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


export default PerfilListas;
