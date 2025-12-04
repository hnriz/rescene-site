import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BackButtonPTBR from '../componentes-ptbr/BackButtonPTBR';
import AvatarPTBR from '../componentes-ptbr/AvatarPTBR';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import listService from '../services/listService';
import {
    faHeart,
    faPlay,
    faBookmark,
    faCamera,
    faEllipsisH,
    faLink,
    faShareAlt,
    faEdit,
    faList,
    faTh,
    faEye,
    faFlag,
    faInfoCircle,
    faTimes,
    faChevronLeft,
    faChevronRight,
    faStar,
    faChevronDown,
    faChevronUp,
    faClapperboard
} from '@fortawesome/free-solid-svg-icons';

const Lista = () => {
    const { user } = useAuth();
    const { listId, username } = useParams();
    const navigate = useNavigate();
    const [listData, setListData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [selectedSort, setSelectedSort] = useState('recent');
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [loadingLike, setLoadingLike] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [loadingSave, setLoadingSave] = useState(false);

    // Fechar dropdowns ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event) => {
            const filterDropdown = document.querySelector('.filter-dropdown');
            const sortDropdown = document.querySelector('.sort-dropdown');

            if (filterDropdown && !filterDropdown.contains(event.target)) {
                setIsFilterDropdownOpen(false);
            }
            if (sortDropdown && !sortDropdown.contains(event.target)) {
                setIsSortDropdownOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchListData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');

                if (!listId) {
                    console.log('Nenhum ID de lista fornecido');
                    setLoading(false);
                    return;
                }

                console.log('📂 Carregando lista:', listId);

                // Buscar dados da lista
                const API_URL = process.env.REACT_APP_API_URL || 'https://rescene-site.vercel.app/api';
                const response = await fetch(`${API_URL}/lists/${listId}`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });

                if (!response.ok) {
                    throw new Error('Lista não encontrada');
                }

                const data = await response.json();
                console.log('✅ Lista carregada:', data);
                let lista = data.list || data;
                
                // Atualizar posters com idioma correto (PT-BR)
                if (lista.items && lista.items.length > 0) {
                    const updatedItems = await Promise.all(lista.items.map(async (item) => {
                        try {
                            const mediaResponse = await fetch(`${API_URL}/media/${item.id || item.movieId}?lang=pt-BR`);
                            if (mediaResponse.ok) {
                                const mediaData = await mediaResponse.json();
                                return {
                                    ...item,
                                    poster: mediaData.poster || item.poster
                                };
                            }
                        } catch (err) {
                            console.warn('⚠️ Erro ao buscar poster em PT-BR para:', item.title);
                        }
                        return item;
                    }));
                    lista = {
                        ...lista,
                        items: updatedItems
                    };
                }
                
                setListData(lista);
                setLikesCount(lista['likes-count'] || 0);

                // Carregar estado de like se usuário está autenticado
                if (user) {
                    try {
                        const likeStatus = await listService.checkIfListLiked(listId);
                        setIsLiked(likeStatus.liked);
                        
                        const saveStatus = await listService.checkIfListSaved(listId);
                        setIsSaved(saveStatus.saved);
                    } catch (err) {
                        console.error('Erro ao verificar status de like/save:', err);
                    }
                }
            } catch (err) {
                console.error('❌ Erro ao carregar lista:', err);
                setError(err.message);
                if (toast) {
                    toast.error('Erro ao carregar lista: ' + err.message);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchListData();
    }, [listId, user]);

    const getFilterLabel = () => {
        const filterOptions = {
            'all': 'Todos os itens',
            'movies': 'Apenas filmes',
            'series': 'Apenas séries'
        };
        return filterOptions[selectedFilter] || 'Todos os itens';
    };

    const getSortLabel = () => {
        const sortOptions = {
            'recent': 'Mais recentes',
            'oldest': 'Mais antigos',
            'rating': 'Melhor avaliados',
            'title': 'Ordem alfabética'
        };
        return sortOptions[selectedSort] || 'Mais recentes';
    };

    // Filtrar e ordenar itens
    const getFilteredAndSortedItems = () => {
        if (!listData?.items || listData.items.length === 0) return [];

        let filtered = listData.items;

        // Aplicar filtro
        if (selectedFilter === 'movies') {
            filtered = filtered.filter(item => item.type !== 'Series');
        } else if (selectedFilter === 'series') {
            filtered = filtered.filter(item => item.type === 'Series');
        }

        // Aplicar ordenação
        const sorted = [...filtered];
        switch (selectedSort) {
            case 'oldest':
                // Já está em ordem
                break;
            case 'rating':
                sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'title':
                sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
                break;
            case 'recent':
            default:
                // Manter ordem original (mais recente é o último adicionado)
                break;
        }

        return sorted;
    };

    if (loading) {
        return (
            <>
                <BackButtonPTBR />
                <main className="list-page">
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <p>Carregando lista...</p>
                    </div>
                </main>
            </>
        );
    }

    if (error || !listData) {
        return (
            <>
                <BackButtonPTBR />
                <main className="list-page">
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <p>❌ {error || 'Lista não encontrada'}</p>
                    </div>
                </main>
            </>
        );
    }

    const listName = listData.name || 'Minha Lista';
    const description = listData.description || '';
    const mediaCount = listData.mediaCount || listData['media-qtd'] || 0;
    const createdAt = new Date(listData.createdAt).toLocaleDateString('pt-BR');
    const ownerId = listData.userId;
    const ownerName = listData.ownerName || 'Usuário';
    const ownerAvatar = listData.ownerAvatar || '../src/img/icon.jpg';
    const listCover = listData.listCover;

    const handleAvatarClick = () => {
        if (ownerId && listData?.ownerUsername) {
            navigate(`/${listData.ownerUsername}/perfil`);
        }
    };

    // Renderizar capa padrão quando não houver upload
    const renderListCover = (cover) => {
        if (cover) {
            return (
                <img src={cover} alt="Capa da Lista" className="cover-image" />
            );
        } else {
            return (
                <div className="defaultListCover">
                    <FontAwesomeIcon icon={faClapperboard} />
                </div>
            );
        }
    };

    const handleLike = async () => {
        if (!user) {
            return;
        }

        try {
            setLoadingLike(true);
            const result = await listService.likeList(listId);
            
            if (result.liked) {
                setIsLiked(true);
                setLikesCount(likesCount + 1);
            } else {
                setIsLiked(false);
                setLikesCount(Math.max(0, likesCount - 1));
            }
        } catch (err) {
            console.error('Erro ao curtir lista:', err);
        } finally {
            setLoadingLike(false);
        }
    };

    const handleSave = async () => {
        if (!user) {
            return;
        }

        try {
            setLoadingSave(true);
            const result = await listService.saveList(listId);
            setIsSaved(result.saved);
        } catch (err) {
            console.error('Erro ao salvar lista:', err);
        } finally {
            setLoadingSave(false);
        }
    };

    return (
        <>
            <BackButtonPTBR />
            <main className="list-page">
                    {/* <!-- Cabeçalho da Lista --> */}
                    <section className="list-header">
                    <div className="container">
                        <div className="list-hero">
                            <div className="list-cover">
                                {renderListCover(listCover)}
                            </div>

                            <div className="list-info">
                                <div className="list-meta">
                                    <span className="list-stats">
                                        <FontAwesomeIcon icon={faHeart} /> {likesCount} {likesCount === 1 ? 'curtida' : 'curtidas'}
                                    </span>
                                </div>

                                <h1 className="list-title">{listName}</h1>

                                <p className="list-description">
                                    {description}
                                </p>

                                <div className="list-owner">
                                    <div 
                                        className="owner-avatar-wrapper" 
                                        onClick={handleAvatarClick}
                                        style={{ cursor: ownerId ? 'pointer' : 'default' }}
                                    >
                                        <AvatarPTBR src={ownerAvatar} alt="Criador da lista" className="owner-avatar" size="medium" />
                                    </div>
                                    <div className="owner-info">
                                        <span className="owner-name">{ownerName}</span>
                                        <span className="list-date">Criada em {createdAt}</span>
                                    </div>
                                </div>

                                <div className="list-actions">
                                    {user && listData && user.id !== listData.userId && (
                                        <>
                                            <button 
                                                className={`action-btn-list secondary ${isLiked ? 'liked' : ''}`}
                                                onClick={handleLike}
                                                disabled={loadingLike}
                                            >
                                                <FontAwesomeIcon icon={faHeart} style={{color: isLiked ? '#e74c3c' : 'inherit'}} />
                                                {isLiked ? 'Curtida' : 'Curtir'}
                                            </button>
                                            <button 
                                                className={`action-btn-list secondary ${isSaved ? 'saved' : ''}`}
                                                onClick={handleSave}
                                                disabled={loadingSave}
                                            >
                                                <FontAwesomeIcon icon={faBookmark} style={{color: isSaved ? '#f39c12' : 'inherit'}} />
                                                {isSaved ? 'Salva' : 'Salvar'}
                                            </button>
                                        </>
                                    )}
                                    {user && listData && user.id === listData.userId && (
                                        <div className="more-actions">
                                            <button className="action-btn-list more" onClick={() => navigate(`/${listData?.ownerUsername}/lista-editar/${listId}`)}>
                                                <FontAwesomeIcon icon={faEdit} />
                                            </button>
                                            <div className="action-menu">
                                                <a href="#"><FontAwesomeIcon icon={faShareAlt} /> Compartilhar</a>
                                                <a href="#"><FontAwesomeIcon icon={faLink} /> Copiar link</a>
                                                <a href={`/${username}/lista-editar/${listId}`}><FontAwesomeIcon icon={faEdit} /> Editar lista</a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* <!-- Conteúdo da Lista --> */}
                <section className="list-content">
                    <div className="container">
                        <div className="content-header">
                            <div className="content-info">
                                <h2>Conteúdo da Lista <span className="items-count">({mediaCount} itens)</span></h2>
                                <p>Organizados por ordem de adição</p>
                            </div>

                            <div className="content-actions">
                                <div className="filter-sort">
                                    <div className="filter-dropdown">
                                        <button className="filter-dropdown-btn" onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}>
                                            <span>{getFilterLabel()}</span>
                                            <FontAwesomeIcon icon={isFilterDropdownOpen ? faChevronUp : faChevronDown} />
                                        </button>
                                        <div 
                                            className="filter-dropdown-content" 
                                            style={{
                                                display: isFilterDropdownOpen ? 'block' : 'none',
                                                visibility: isFilterDropdownOpen ? 'visible' : 'hidden',
                                                opacity: isFilterDropdownOpen ? 1 : 0
                                            }}
                                        >
                                            {[
                                                { value: 'all', label: 'Todos os itens' },
                                                { value: 'movies', label: 'Apenas filmes' },
                                                { value: 'series', label: 'Apenas séries' }
                                            ].map(option => (
                                                <button
                                                    key={option.value}
                                                    className={`filter-option ${selectedFilter === option.value ? 'selected' : ''}`}
                                                    onClick={() => {
                                                        setSelectedFilter(option.value);
                                                        setIsFilterDropdownOpen(false);
                                                    }}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="sort-dropdown">
                                        <button className="sort-dropdown-btn" onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}>
                                            <span>{getSortLabel()}</span>
                                            <FontAwesomeIcon icon={isSortDropdownOpen ? faChevronUp : faChevronDown} />
                                        </button>
                                        <div 
                                            className="sort-dropdown-content" 
                                            style={{
                                                display: isSortDropdownOpen ? 'block' : 'none',
                                                visibility: isSortDropdownOpen ? 'visible' : 'hidden',
                                                opacity: isSortDropdownOpen ? 1 : 0
                                            }}
                                        >
                                            {[
                                                { value: 'recent', label: 'Mais recentes' },
                                                { value: 'oldest', label: 'Mais antigos' },
                                                { value: 'rating', label: 'Melhor avaliados' },
                                                { value: 'title', label: 'Ordem alfabética' }
                                            ].map(option => (
                                                <button
                                                    key={option.value}
                                                    className={`sort-option ${selectedSort === option.value ? 'selected' : ''}`}
                                                    onClick={() => {
                                                        setSelectedSort(option.value);
                                                        setIsSortDropdownOpen(false);
                                                    }}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="items-grid">
                            {/* Renderizar itens da lista */}
                            {getFilteredAndSortedItems().length > 0 ? (
                                getFilteredAndSortedItems().map((item, idx) => (
                                    <div 
                                        key={idx} 
                                        className="list-item"
                                        onClick={() => {
                                            const mediaType = item.type === 'Series' ? 'tv' : 'movie';
                                            navigate(`/info-ptbr/${mediaType}/${item.externalId || item.id}`);
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="item-image">
                                            <img 
                                                src={item.poster || '/img/default-poster.jpg'} 
                                                alt={item.title}
                                                onLoad={() => console.log('✅ Imagem carregada:', item.title, 'URL:', item.poster)}
                                                onError={() => console.error('❌ Erro ao carregar imagem:', item.title, 'URL:', item.poster)}
                                            />
                                            {item.rating && (
                                                <div className="item-rating-badge">
                                                    <FontAwesomeIcon icon={faStar} /> {item.rating}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
                                    <p>Nenhum item adicionado à esta lista ainda</p>
                                </div>
                            )}

                            {/* Card de Adicionar - Apenas para o dono da lista */}
                            {/* {user && listData && user.id === listData.userId && (
                                <div className="list-item add-item">
                                    <div className="add-item-content">
                                        <i className="fas fa-plus-circle"></i>
                                        <h3>Adicionar item</h3>
                                        <p>Clique para adicionar um novo filme ou série à lista</p>
                                    </div>
                                </div>
                            )} */}
                        </div>

                       
                    </div>
                </section>

                {/* <!-- Listas Relacionadas --> */}
                {/* <section className="related-lists">
                    <div className="container">
                        <h2>Outras listas suas</h2>
                        <div className="related-grid">
                        </div>
                    </div>
                </section> */}
                </main>
            </>
        );
    };

export default Lista;