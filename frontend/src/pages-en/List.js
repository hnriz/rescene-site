import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Avatar from '../components-en/Avatar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
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

function List() {
    const { listId, username } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [list, setList] = useState(null);
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

    // Close dropdowns when clicking outside
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

    // Extract owner info
    const ownerId = list?.userId;
    const ownerName = list?.ownerName || 'Your Profile';
    const ownerAvatar = list?.ownerAvatar || '../src/img/icon.jpg';
    const mediaCount = list?.mediaCount || list?.['media-qtd'] || 0;
    const description = list?.description || '';
    const listCover = list?.listCover;

    const handleAvatarClick = () => {
        if (ownerId && list?.ownerUsername) {
            navigate(`/${list.ownerUsername}/profile`);
        }
    };

    useEffect(() => {
        const fetchList = async () => {
            try {
                setLoading(true);
                setError(null);

                if (!listId) {
                    setError('List ID was not provided');
                    setLoading(false);
                    return;
                }

                const token = localStorage.getItem('token');
                
                // Fetch list data
                const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
                const response = await fetch(`${API_URL}/lists/${listId}`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });

                if (!response.ok) {
                    throw new Error('List not found');
                }

                const data = await response.json();
                console.log('✅ List loaded:', data);
                let listData = data.list || data;
                
                // Update posters with correct language (EN)
                if (listData.items && listData.items.length > 0) {
                    const updatedItems = await Promise.all(listData.items.map(async (item) => {
                        try {
                            const mediaResponse = await fetch(`${API_URL}/media/${item.id || item.movieId}?lang=en`);
                            if (mediaResponse.ok) {
                                const mediaData = await mediaResponse.json();
                                return {
                                    ...item,
                                    poster: mediaData.poster || item.poster
                                };
                            }
                        } catch (err) {
                            console.warn('⚠️ Error fetching poster in EN for:', item.title);
                        }
                        return item;
                    }));
                    listData = {
                        ...listData,
                        items: updatedItems
                    };
                }
                
                setList(listData);
                setLikesCount(listData['likes-count'] || 0);

                // Carregar estado de like se usuário está autenticado
                if (user) {
                    try {
                        const likeStatus = await listService.checkIfListLiked(listId);
                        setIsLiked(likeStatus.liked);
                        
                        const saveStatus = await listService.checkIfListSaved(listId);
                        setIsSaved(saveStatus.saved);
                    } catch (err) {
                        console.error('Error checking like/save status:', err);
                    }
                }
            } catch (err) {
                console.error('❌ Error loading list:', err);
                setError(err.message);
                if (toast) {
                    toast.error('Error loading list: ' + err.message);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchList();
    }, [listId, user]);

    const getFilterLabel = () => {
        const filterOptions = {
            'all': 'All items',
            'movies': 'Movies only',
            'series': 'Series only'
        };
        return filterOptions[selectedFilter] || 'All items';
    };

    const getSortLabel = () => {
        const sortOptions = {
            'recent': 'Most recent',
            'oldest': 'Oldest',
            'rating': 'Top rated',
            'title': 'Alphabetical order'
        };
        return sortOptions[selectedSort] || 'Most recent';
    };

    // Filter and sort items
    const getFilteredAndSortedItems = () => {
        if (!list?.items || list.items.length === 0) return [];

        let filtered = list.items;

        // Apply filter
        if (selectedFilter === 'movies') {
            filtered = filtered.filter(item => item.type !== 'Series');
        } else if (selectedFilter === 'series') {
            filtered = filtered.filter(item => item.type === 'Series');
        }

        // Apply sort
        const sorted = [...filtered];
        switch (selectedSort) {
            case 'oldest':
                // Already in order, reverse if needed
                break;
            case 'rating':
                sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'title':
                sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
                break;
            case 'recent':
            default:
                // Keep original order (most recent is last added)
                break;
        }

        return sorted;
    };

    // Render default list cover when no upload
    const renderListCover = (cover) => {
        if (cover) {
            return (
                <img src={cover} alt="List Cover" className="cover-image" />
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
            console.error('Error liking list:', err);
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
            console.error('Error saving list:', err);
        } finally {
            setLoadingSave(false);
        }
    };

    if (loading) {
        return (
            <>
                <BackButton />
                <main className="list-page">
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <p>Loading list...</p>
                    </div>
                </main>
            </>
        );
    }

    if (error || !list) {
        return (
            <>
                <BackButton />
                <main className="list-page">
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <p style={{ color: 'red' }}>❌ {error || 'List not found'}</p>
                    </div>
                </main>
            </>
        );
    }

    return (
        <>
            <BackButton />
            <main className="list-page">
                {/* List Header */}
                <section className="list-header">
                    <div className="container">
                        <div className="list-hero">
                            <div className="list-cover">
                                {renderListCover(listCover)}
                            </div>

                            <div className="list-info">
                                <div className="list-meta">
                                    <span className="list-stats">
                                        <FontAwesomeIcon icon={faHeart} /> {likesCount} {likesCount === 1 ? 'like' : 'likes'}
                                    </span>
                                </div>

                                <h1 className="list-title">{list.name || 'My List'}</h1>

                                <p className="list-description">
                                    {description}
                                </p>

                                <div className="list-owner">
                                    <div 
                                        className="owner-avatar-wrapper" 
                                        onClick={handleAvatarClick}
                                        style={{ cursor: ownerId ? 'pointer' : 'default' }}
                                    >
                                        <Avatar src={ownerAvatar} alt="List Creator" className="owner-avatar" size="medium" />
                                    </div>
                                    <div className="owner-info">
                                        <span className="owner-name">{ownerName}</span>
                                        <span className="list-date">
                                            Created on {new Date(list.createdAt).toLocaleDateString('en-US')}
                                        </span>
                                    </div>
                                </div>

                                <div className="list-actions">
                                    {user && list && user.id !== list.userId && (
                                        <>
                                            <button 
                                                className={`action-btn-list secondary ${isLiked ? 'liked' : ''}`}
                                                onClick={handleLike}
                                                disabled={loadingLike}
                                            >
                                                <FontAwesomeIcon icon={faHeart} style={{color: isLiked ? '#e74c3c' : 'inherit'}} />
                                                {isLiked ? 'Liked' : 'Like'}
                                            </button>
                                            <button 
                                                className={`action-btn-list secondary ${isSaved ? 'saved' : ''}`}
                                                onClick={handleSave}
                                                disabled={loadingSave}
                                            >
                                                <FontAwesomeIcon icon={faBookmark} style={{color: isSaved ? '#f39c12' : 'inherit'}} />
                                                {isSaved ? 'Saved' : 'Save'}
                                            </button>
                                        </>
                                    )}
                                    {user && list && user.id === list.userId && (
                                        <div className="more-actions">
                                            <button className="action-btn-list more" onClick={() => navigate(`/${list?.ownerUsername}/list-edit/${listId}`)}>
                                                <FontAwesomeIcon icon={faEdit} />
                                            </button>
                                            <div className="action-menu">
                                                <a href="#"><FontAwesomeIcon icon={faShareAlt} /> Share</a>
                                                <a href="#"><FontAwesomeIcon icon={faLink} /> Copy link</a>
                                                <a href={`/${username}/list-edit/${listId}`}><FontAwesomeIcon icon={faEdit} /> Edit list</a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* List Content */}
                <section className="list-content">
                    <div className="container">
                        <div className="content-header">
                            <div className="content-info">
                                <h2>List Content <span className="items-count">({mediaCount} items)</span></h2>
                                <p>Organized by addition order</p>
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
                                                { value: 'all', label: 'All items' },
                                                { value: 'movies', label: 'Movies only' },
                                                { value: 'series', label: 'Series only' }
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
                                                { value: 'recent', label: 'Most recent' },
                                                { value: 'oldest', label: 'Oldest' },
                                                { value: 'rating', label: 'Top rated' },
                                                { value: 'title', label: 'Alphabetical order' }
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
                           {/* Render list items */}
                            {getFilteredAndSortedItems().length > 0 ? (
                                getFilteredAndSortedItems().map((item, idx) => (
                                    <div 
                                        key={idx} 
                                        className="list-item"
                                        onClick={() => {
                                            const mediaType = item.type === 'Series' ? 'tv' : 'movie';
                                            navigate(`/info/${mediaType}/${item.externalId || item.id}`);
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="item-image">
                                            <img 
                                                src={item.poster || '/img/default-poster.jpg'} 
                                                alt={item.title}
                                                onLoad={() => console.log('✅ Image loaded:', item.title, 'URL:', item.poster)}
                                                onError={() => console.error('❌ Image failed to load:', item.title, 'URL:', item.poster)}
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
                                    <p>No items in this list yet</p>
                                </div>
                            )}

                            {/* Add Item Card - Only for list owner */}
                            {/* {user && list && user.id === list.userId && (
                                <div className="list-item add-item">
                                    <div className="add-item-content">
                                        <i className="fas fa-plus-circle"></i>
                                        <h3>Add item</h3>
                                        <p>Click to add a new movie or series to the list</p>
                                    </div>
                                </div>
                            )} */}
                        </div>
                    </div>
                </section>

                {/* Related Lists */}
                {/* <section className="related-lists">
                    <div className="container">
                        <h2>Related lists</h2>
                        <div className="related-grid">
                            <p>No related lists available</p>
                        </div>
                    </div>
                </section> */}
            </main>
        </>
    );
}

export default List;