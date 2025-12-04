import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import BackButton from '../components/BackButton';
import ImageCropper from '../components-en/ImageCropper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCamera,
    faLink,
    faEye,
    faTimes,
    faGlobeAmericas,
    faUpload,
    faSearch,
    faGripVertical,
    faCheckSquare,
    faLock,
    faPlus,
    faFilm,
    faArrowLeft,
    faSave,
    faImage,
    faPen,
    faBroom,
    faTrash,
    faDownload,
    faPenToSquare
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'https://rescene-site.vercel.app/api';

function ListEdit() {
    const { username, listId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    console.log('🟢 COMPONENT ListEdit RENDERED - Em inglês');
    console.log('  listId:', listId);
    console.log('  username:', username);

    const [list, setList] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        cover: null,
        sortOrder: 'custom'
    });
    const [items, setItems] = useState([]);
    const [showImageCropper, setShowImageCropper] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchSuggestions, setSearchSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const fileInputRef = useRef(null);
    const searchTimeoutRef = useRef(null);

    useEffect(() => {
        // Reset modal states when component mounts
        setShowDeleteModal(false);
        setIsDeleting(false);
        setShowImageCropper(false);
    }, []);

    useEffect(() => {
        const fetchListData = async () => {
            try {
                const response = await fetch(`/api/lists/${listId}`);
                if (!response.ok) throw new Error('Failed to fetch list');

                const data = await response.json();
                const listData = data.list || data;

                console.log('List data:', listData);
                console.log('User:', user);
                console.log('Comparison:', listData.userId, '===', user?.id);

                // Check if user owns this list
                if (String(listData.userId) !== String(user?.id)) {
                    setError('You do not have permission to edit this list');
                    return;
                }

                setList(listData);
                console.log('Setting formData with:', {
                    name: listData['list-name'] || listData.name || '',
                    description: listData.description || '',
                    cover: listData.listCover || listData['list-cover'] || listData.cover || null,
                    sortOrder: listData['sort-order'] || listData.sortOrder || 'custom'
                });
                setFormData({
                    name: listData['list-name'] || listData.name || '',
                    description: listData.description || '',
                    cover: listData.listCover || listData['list-cover'] || listData.cover || null,
                    sortOrder: listData['sort-order'] || listData.sortOrder || 'custom'
                });

                // Fetch list items if available
                if (listData.mediaIds) {
                    try {
                        const parsedItems = typeof listData.mediaIds === 'string' 
                            ? JSON.parse(listData.mediaIds) 
                            : listData.mediaIds;
                        setItems(Array.isArray(parsedItems) ? parsedItems : []);
                    } catch (err) {
                        console.error('Error parsing items:', err);
                        setItems([]);
                    }
                } else if (listData.items) {
                    setItems(Array.isArray(listData.items) ? listData.items : []);
                }
            } catch (err) {
                console.error('Error fetching list:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (listId && user?.id) {
            fetchListData();
        }
    }, [listId, user?.id]);

    // Monitor cover changes to force re-render
    useEffect(() => {
        if (formData.cover && typeof formData.cover === 'string') {
            console.log('👁️ useEffect: Cover changed detected');
            console.log('  ├─ Cover type:', typeof formData.cover);
            console.log('  └─ Cover preview:');
            if (formData.cover.startsWith('data:image')) {
                console.log('  └─ Displaying Base64 cover preview');
            } else if (formData.cover.startsWith('http')) {
                console.log('  └─ Displaying URL cover preview');
            }
        } else if (formData.cover && typeof formData.cover === 'object') {
            console.warn('⚠️ Cover is still an object, waiting for conversion...');
        }
    }, [formData.cover]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        console.log(`📝 Input changed: ${name}`);
        console.log(`  └─ New value: ${value ? value.substring(0, 50) + (value.length > 50 ? '...' : '') : '(empty)'}`);
        setFormData(prev => {
            const updated = {
                ...prev,
                [name]: value
            };
            console.log(`✅ formData.${name} updated`);
            return updated;
        });
    };

    const handleCoverClick = () => {
        console.log('Cover clicked, opening file dialog');
        console.log('fileInputRef.current:', fileInputRef.current);
        fileInputRef.current?.click();
    };

    const handleSearchItems = async (query) => {
        setSearchQuery(query);

        if (!query.trim()) {
            setSearchSuggestions([]);
            return;
        }

        // Clear previous timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Debounce the search
        searchTimeoutRef.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                // Detect language based on URL
                const lang = window.location.pathname.includes('/list-edit') ? 'en' : 'pt-BR';
                const url = `${API_URL}/search?q=${encodeURIComponent(query)}&lang=${lang}`;
                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error(`Search failed with status ${response.status}`);
                }
                
                const data = await response.json();
                setSearchSuggestions(data.results || []);
            } catch (err) {
                console.error('❌ Search error:', err.message);
                setSearchSuggestions([]);
            } finally {
                setIsSearching(false);
            }
        }, 500); // 500ms debounce
    };

    const handleAddItemToList = (item) => {
        console.log('✅ Adding item to list:', item);
        
        // Check if item already exists in list
        const itemExists = items.some(existingItem => 
            (existingItem.id === item.id) || (existingItem.movieId === item.id)
        );
        if (itemExists) {
            console.warn('⚠️ Item already exists in list');
            // alert('This item is already in your list');
            return;
        }

        // Add to local state
        setItems(prev => [...prev, item]);
        setSearchQuery('');
        setSearchSuggestions([]);
        console.log('✨ Item added to list');
    };

    const handleRemoveItem = (idx) => {
        console.log('❌ Removing item at index:', idx);
        setItems(prev => prev.filter((_, i) => i !== idx));
    };

    const getMediaTypeEN = (type) => {
        if (type === 'Series') return 'TV Show';
        if (type === 'Movie') return 'Movie';
        return type;
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        console.log('File selected:', file);
        if (file) {
            setSelectedFile(file);
            setShowImageCropper(true);
            console.log('showImageCropper set to true');
        }
    };

    const handleImageCrop = (croppedBlob) => {
        console.log('🔴 handleImageCrop CALLED with blob:', croppedBlob);
        console.log('  ├─ Blob size:', croppedBlob?.size, 'bytes');
        console.log('  └─ Blob type:', croppedBlob?.type);
        
        if (croppedBlob) {
            // Convert blob to Base64 string using Promise for proper async handling
            const reader = new FileReader();
            
            reader.onload = (event) => {
                const base64String = event.target.result;
                console.log('✅ Base64 conversion COMPLETE');
                console.log('  ├─ Base64 length:', base64String.length);
                console.log('  ├─ Starts with:', base64String.substring(0, 30));
                console.log('  └─ Type after conversion:', typeof base64String);
                
                // Update formData with Base64 string
                setFormData(prev => {
                    const updated = {
                        ...prev,
                        cover: base64String
                    };
                    console.log('📝 formData.cover updated to Base64');
                    console.log('  ├─ New cover type:', typeof updated.cover);
                    console.log('  └─ New cover length:', updated.cover.length);
                    return updated;
                });
                
                // Close modal after successful conversion
                setTimeout(() => {
                    console.log('⏰ Closing modal after Base64 conversion...');
                    setShowImageCropper(false);
                    setSelectedFile(null);
                }, 100);
            };
            
            reader.onerror = (error) => {
                console.error('❌ FileReader error:', error);
                setShowImageCropper(false);
                setSelectedFile(null);
            };
            
            console.log('📖 Starting FileReader.readAsDataURL...');
            reader.readAsDataURL(croppedBlob);
        }
    };

    const handleCropCancel = () => {
        setShowImageCropper(false);
        setSelectedFile(null);
    };

    const handleSaveChanges = async () => {
        console.log('🔴 handleSaveChanges CLICKED - ENTRY POINT');
        console.log('📊 Current formData:', {
            name: formData.name,
            description: formData.description,
            cover: formData.cover ? `${typeof formData.cover === 'string' ? formData.cover.substring(0, 50) : '[Blob Object]'}...` : 'null',
            sortOrder: formData.sortOrder
        });
        console.log('📝 Items count:', items.length);
        
        // Check if cover is still a Blob (not converted to Base64)
        if (formData.cover && typeof formData.cover === 'object') {
            console.warn('⚠️ VALIDATION ERROR: Cover is still a Blob object, not Base64 string!');
            console.warn('  ├─ Cover type:', typeof formData.cover);
            console.warn('  └─ Cover constructor:', formData.cover?.constructor?.name);
            // alert('⚠️ Cover image is still processing. Please wait a moment and try again.');
            return;
        }
        
        try {
            const payload = {
                name: formData.name,
                description: formData.description,
                cover: formData.cover,
                sortOrder: formData.sortOrder,
                items: items // Include items in payload
            };
            
            console.log('🚀 Sending PUT request to /api/lists/' + listId);
            console.log('📤 Payload keys:', Object.keys(payload));
            console.log('📤 Cover type:', typeof payload.cover);
            console.log('📤 Cover length:', typeof payload.cover === 'string' ? payload.cover.length : 'N/A');
            console.log('📤 Items included:', payload.items.length, 'items');
            
            const response = await fetch(`/api/lists/${listId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(payload)
            });

            console.log('📨 Response received:', response.status, response.statusText);
            
            if (!response.ok) {
                const errorData = await response.text();
                console.error('❌ Error response:', errorData);
                throw new Error(`Failed to update list: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Update successful:', result);
            
            // alert('List updated successfully!');
            navigate(`/${list.ownerUsername}/list/${listId}`);
        } catch (err) {
            console.error('❌ Error saving list:', err);
            // alert('Error saving changes: ' + err.message);
        }
    };

    const handleDeleteList = async () => {
        try {
            setIsDeleting(true);
            const token = localStorage.getItem('token');
            
            if (!token) {
                throw new Error('You are not authenticated');
            }
            
            console.log('🗑️ Deleting list with ID:', listId);
            
            const response = await fetch(`${API_URL}/lists/${listId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to delete list');
            }

            console.log('✅ List deleted successfully');
            setShowDeleteModal(false);
            navigate(username ? `/${username}/profile` : '/');
        } catch (err) {
            console.error('❌ Error deleting list:', err);
            alert('Error deleting list: ' + err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading list data...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <>
            <BackButton />
            <main className="edit-list-page">

                {/* Formulário de Edição */}
                <section className="edit-content">
                    <div className="container">
                        <div className="edit-grid">
                            {/* Painel de Configurações */}
                            <div className="settings-card">
                                <div className="edit-nav">

                                    <h2> <FontAwesomeIcon icon={faPenToSquare} /> List Settings</h2>
                                    <div className="edit-actions">
                                        <button type="button" className="btn primary" onClick={handleSaveChanges}>
                                            <FontAwesomeIcon icon={faSave} />
                                            Save Changes
                                        </button>
                                    </div>
                                </div>


                                <div className="form-group">
                                    <label htmlFor="listTitle">List name</label>
                                    <input
                                        type="text"
                                        id="listTitle"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Type the name of the list"
                                    />
                                    <span className="char-count">{formData.name.length}/60 characters</span>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="listDescription">Description</label>
                                    <textarea
                                        id="listDescription"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Describe your list..."
                                        rows="4"
                                    />
                                    <span className="char-count">{formData.description.length}/250 characters</span>
                                </div>



                                <div className="form-group">
                                    <label>List Cover</label>
                                    <div className="cover-upload">
                                        <div className="upload-preview" onClick={handleCoverClick}>
                                            {formData.cover && typeof formData.cover === 'string' ? (
                                                <img
                                                    key={formData.cover}
                                                    src={formData.cover}
                                                    alt="Cover Preview"
                                                    id="coverPreview"
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    onLoad={() => console.log('✅ Cover image loaded')}
                                                    onError={() => console.error('❌ Error loading cover image')}
                                                />
                                            ) : (
                                                <div className="upload-placeholder">
                                                    <FontAwesomeIcon icon={faImage} />
                                                    <span>No cover image</span>
                                                </div>
                                            )}
                                            <div className="upload-overlay">
                                                <FontAwesomeIcon icon={faCamera} />
                                                <span>Change Image</span>
                                            </div>
                                        </div>
                                        <input 
                                            type="file" 
                                            ref={fileInputRef}
                                            id="coverUpload" 
                                            accept="image/*" 
                                            hidden 
                                            onChange={handleFileSelect}
                                        />
                                        
                                    </div>
                                </div>

                                <div className="items-management">
                                    <div className="management-header">
                                        <h3>List items (<span id="itemsCount">{items.length}</span>)</h3>
                                    </div>

                                    <div className="search-box search-add-items">
                                        <FontAwesomeIcon icon={faSearch} className="search-icon" />
                                        <input 
                                            type="text" 
                                            placeholder="Search to add items..." 
                                            id="searchItems"
                                            value={searchQuery}
                                            onChange={(e) => handleSearchItems(e.target.value)}
                                        />
                                        {isSearching && <span className="search-loading">Searching...</span>}
                                    </div>

                                    {/* Search Suggestions Dropdown */}
                                    {searchSuggestions.length > 0 && (
                                        <div className="search-suggestions">
                                            {searchSuggestions.map((suggestion, idx) => (
                                                <div key={idx} className="suggestion-item">
                                                    <img 
                                                        src={suggestion.poster || "/img/default-poster.jpg"} 
                                                        alt={suggestion.title}
                                                        className="suggestion-poster"
                                                    />
                                                    <div className="suggestion-info">
                                                        <h4>{suggestion.title}</h4>
                                                        <p>{suggestion.year} • {getMediaTypeEN(suggestion.type)}</p>
                                                    </div>
                                                    <button 
                                                        type="button"
                                                        className="btn-add-item"
                                                        onClick={() => handleAddItemToList(suggestion)}
                                                        title="Add to list"
                                                    >
                                                        <FontAwesomeIcon icon={faPlus} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="sortable-items" id="sortableContainer">
                                        {items.length === 0 ? (
                                            <p className="no-items">No items in this list yet. Add some to get started!</p>
                                        ) : (
                                            items.map((item, idx) => (
                                                <div key={idx} className="sortable-item">
                                                    {/* <div className="item-handle">
                                                        <FontAwesomeIcon icon={faGripVertical} />
                                                    </div> */}
                                                    <img src={item.poster || "/img/default-poster.jpg"} alt={item.title} className="item-thumb" />
                                                    <div className="item-details">
                                                        <h4>{item.title}</h4>
                                                        <p>{item.year} • {getMediaTypeEN(item.type)} • {item.genre}</p>
                                                        <span className="added-date">Added on {new Date().toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="item-actions">
                                                        {/* <button className="action-btn" title="Edit">
                                                            <FontAwesomeIcon icon={faPen} />
                                                        </button> */}
                                                        <button type="button" className="action-btn remove-btn" title="Remove" onClick={() => handleRemoveItem(idx)}>
                                                            <FontAwesomeIcon icon={faTimes} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                </div>

                                <div className="danger-zone">
                                    <h3>Danger Zone</h3>
                                    <div className="danger-actions">
                                        <button 
                                            type="button"
                                            className="btn btn-danger deleteList" 
                                            onClick={() => {
                                                console.log('🔴 ENGLISH PAGE - BOTÃO DE DELETE CLICADO - Modal será aberto');
                                                setShowDeleteModal(true);
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                            Delete List
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>
            </main>

            {showImageCropper && selectedFile && (
                <div className="modal-overlay-cropper">
                    <div className="modal-content-cropper">
                        <ImageCropper 
                            imageFile={selectedFile}
                            onCrop={handleImageCrop}
                            onCancel={handleCropCancel}
                            aspectRatio={2 / 3}
                        />
                    </div>
                </div>
            )}

            {showDeleteModal && createPortal(
                <div className="modal-overlay-delete" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-content-delete" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Delete List?</h2>
                            
                        </div>
                        <div className="modal-body">
                            <p><strong>Warning:</strong> This action cannot be undone.</p>
                            <p>All items and information in this list will be permanently deleted.</p>
                            <p>Are you absolutely sure you want to delete this list?</p>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="btn btn-secondary" 
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn btn-danger" 
                                onClick={handleDeleteList}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

export default ListEdit;