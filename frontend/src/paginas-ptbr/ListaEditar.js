import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import BackButtonPTBR from '../componentes-ptbr/BackButtonPTBR';
import CortadorImagem from '../componentes-ptbr/CortadorImagem';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCamera,
    faTimes,
    faSearch,
    faGripVertical,
    faSave,
    faImage,
    faPen,
    faTrash,
    faPenToSquare,
    faPlus
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'https://rescene-site.vercel.app/api';

function ListaEditar() {
    const { username, listId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [lista, setLista] = useState(null);
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
    const isMountedRef = useRef(true);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        // Resetar states de modal ao montar o componente
        setShowDeleteModal(false);
        setIsDeleting(false);
        setShowImageCropper(false);
    }, []);

    useEffect(() => {
        const fetchListData = async () => {
            try {
                const response = await fetch(`/api/lists/${listId}`);
                if (!response.ok) throw new Error('Falha ao carregar lista');
                
                const data = await response.json();
                const listData = data.list || data;
                
                console.log('Lista data:', listData);
                console.log('User:', user);
                console.log('Comparação:', listData.userId, '===', user?.id);
                
                // Check if user owns this list
                if (String(listData.userId) !== String(user?.id)) {
                    setError('Você não tem permissão para editar esta lista');
                    return;
                }
                
                setLista(listData);
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
                        console.error('Erro ao fazer parse dos items:', err);
                        setItems([]);
                    }
                } else if (listData.items) {
                    setItems(Array.isArray(listData.items) ? listData.items : []);
                }
            } catch (err) {
                console.error('Erro ao carregar lista:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (listId && user?.id) {
            fetchListData();
        }
    }, [listId, user?.id]);

    // Monitorar mudanças na capa para forçar re-renderização
    useEffect(() => {
        if (formData.cover && typeof formData.cover === 'string') {
            console.log('👁️ useEffect: Mudança de capa detectada');
            console.log('  ├─ Tipo da capa:', typeof formData.cover);
            console.log('  └─ Pré-visualização de capa:');
            if (formData.cover.startsWith('data:image')) {
                console.log('  └─ Exibindo pré-visualização de capa Base64');
            } else if (formData.cover.startsWith('http')) {
                console.log('  └─ Exibindo pré-visualização de capa URL');
            }
        } else if (formData.cover && typeof formData.cover === 'object') {
            console.warn('⚠️ Capa ainda é um objeto, aguardando conversão...');
        }
    }, [formData.cover]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        console.log(`📝 Campo alterado: ${name}`);
        console.log(`  └─ Novo valor: ${value ? value.substring(0, 50) + (value.length > 50 ? '...' : '') : '(vazio)'}`);
        setFormData(prev => {
            const updated = {
                ...prev,
                [name]: value
            };
            console.log(`✅ formData.${name} atualizado`);
            return updated;
        });
    };

    const handleCoverClick = () => {
        fileInputRef.current?.click();
    };

    const handleSearchItems = async (query) => {
        setSearchQuery(query);

        if (!query.trim()) {
            setSearchSuggestions([]);
            return;
        }

        // Limpar timeout anterior
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Debounce a busca
        searchTimeoutRef.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                // Detectar idioma baseado na URL
                const lang = window.location.pathname.includes('/editar-lista') ? 'pt-BR' : 'en';
                const url = `${API_URL}/search?q=${encodeURIComponent(query)}&lang=${lang}`;
                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error(`Busca falhou com status ${response.status}`);
                }
                
                const data = await response.json();
                setSearchSuggestions(data.results || []);
            } catch (err) {
                console.error('❌ Erro na busca:', err.message);
                setSearchSuggestions([]);
            } finally {
                setIsSearching(false);
            }
        }, 500); // 500ms debounce
    };

    const handleAddItemToList = (item) => {
        console.log('✅ Adicionando item à lista:', item);
        
        // Verificar se o item já existe na lista
        const itemExists = items.some(existingItem => 
            (existingItem.id === item.id) || (existingItem.movieId === item.id)
        );
        if (itemExists) {
            console.warn('⚠️ Item já existe na lista');
            // alert('Este item já está na sua lista');
            return;
        }

        // Adicionar ao estado local
        setItems(prev => [...prev, item]);
        setSearchQuery('');
        setSearchSuggestions([]);
        console.log('✨ Item adicionado à lista');
    };

    const handleRemoveItem = (idx) => {
        console.log('❌ Removendo item no índice:', idx);
        setItems(prev => prev.filter((_, i) => i !== idx));
    };

    const getMediaTypePTBR = (type) => {
        if (type === 'Series') return 'Série';
        if (type === 'Movie') return 'Filme';
        return type;
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setShowImageCropper(true);
        }
    };

    const handleImageCrop = (croppedBlob) => {
        console.log('🔴 handleImageCrop CHAMADO com blob:', croppedBlob);
        console.log('  ├─ Tamanho do Blob:', croppedBlob?.size, 'bytes');
        console.log('  └─ Tipo do Blob:', croppedBlob?.type);

        if (croppedBlob) {
            // Converter blob para base64 com tratamento assíncrono apropriado
            const reader = new FileReader();
            
            reader.onload = (event) => {
                const base64String = event.target.result;
                console.log('✅ Conversão Base64 COMPLETA');
                console.log('  ├─ Comprimento Base64:', base64String.length);
                console.log('  ├─ Começa com:', base64String.substring(0, 30));
                console.log('  └─ Tipo após conversão:', typeof base64String);
                
                // Atualizar formData com string Base64
                setFormData(prev => {
                    const updated = {
                        ...prev,
                        cover: base64String
                    };
                    console.log('📝 formData.cover atualizado para Base64');
                    console.log('  ├─ Novo tipo do cover:', typeof updated.cover);
                    console.log('  └─ Novo comprimento do cover:', updated.cover.length);
                    return updated;
                });
                
                // Fechar modal após conversão bem-sucedida
                setTimeout(() => {
                    console.log('⏰ Fechando modal após conversão Base64...');
                    setShowImageCropper(false);
                    setSelectedFile(null);
                }, 100);
            };
            
            reader.onerror = (err) => {
                console.error('❌ Erro ao ler arquivo:', err);
                setShowImageCropper(false);
                setSelectedFile(null);
            };
            
            console.log('📖 Iniciando FileReader.readAsDataURL...');
            reader.readAsDataURL(croppedBlob);
        } else {
            console.warn('⚠️ croppedBlob é null/undefined');
        }
    };

    const handleCropCancel = () => {
        setShowImageCropper(false);
        setSelectedFile(null);
    };

    const handleSaveChanges = async () => {
        console.log('🔴 handleSaveChanges CLICKED - ENTRY POINT');
        try {
            console.log('📋 Current formData state BEFORE sending:');
            console.log('  name:', formData.name);
            console.log('  description:', formData.description ? `${formData.description.substring(0, 30)}...` : '(vazio)');
            console.log('  cover:', formData.cover ? (typeof formData.cover === 'string' ? `${formData.cover.substring(0, 50)}...` : '[Blob Object]') : '❌ NULL/UNDEFINED');
            console.log('  sortOrder:', formData.sortOrder);
            console.log('  items:', items.length, 'itens');

            // Verificar se o cover ainda é um Blob (não convertido para Base64)
            if (formData.cover && typeof formData.cover === 'object') {
                console.warn('⚠️ ERRO DE VALIDAÇÃO: Cover ainda é um Blob object, não string Base64!');
                console.warn('  ├─ Tipo do cover:', typeof formData.cover);
                console.warn('  └─ Constructor do cover:', formData.cover?.constructor?.name);
                // alert('⚠️ A imagem de capa ainda está sendo processada. Por favor, aguarde um momento e tente novamente.');
                return;
            }

            const payload = {
                name: formData.name,
                description: formData.description,
                cover: formData.cover,
                sortOrder: formData.sortOrder,
                items: items // Incluir itens no payload
            };

            console.log('💾 Salvando lista com dados:');
            console.log('  name:', payload.name);
            console.log('  description:', payload.description ? `${payload.description.substring(0, 30)}...` : '(vazio)');
            console.log('  cover:', payload.cover ? (typeof payload.cover === 'string' ? `${payload.cover.substring(0, 50)}...` : '[Blob Object]') : '(vazio)');
            console.log('  sortOrder:', payload.sortOrder);
            console.log('  items:', payload.items.length, 'itens');

            const response = await fetch(`/api/lists/${listId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Falha ao atualizar lista');
            }

            const responseData = await response.json();
            console.log('✅ Response from server:', responseData);
            
            // alert('Lista atualizada com sucesso!');
            navigate(`/${lista.ownerUsername}/lista/${listId}`);
        } catch (err) {
            console.error('Erro ao salvar lista:', err);
            // alert('Erro ao salvar alterações: ' + err.message);
        }
    };

    const handleDeleteList = async () => {
        console.log('🔴 handleDeleteList foi chamado');
        try {
            console.log('📍 Etapa 1: setIsDeleting(true)');
            setIsDeleting(true);
            
            const token = localStorage.getItem('token');
            console.log('📍 Etapa 2: Token obtido:', token ? '✅ Sim' : '❌ Não');
            
            if (!token) {
                throw new Error('Você não está autenticado');
            }
            
            console.log('📍 Etapa 3: Deletando lista com ID:', listId);
            console.log('📍 Lista data:', lista);
            console.log('📍 Owner username:', lista?.ownerUsername);
            console.log('📍 URL completa:', `${API_URL}/lists/${listId}`);
            
            const response = await fetch(`${API_URL}/lists/${listId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📍 Etapa 4: Response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('❌ Erro da API:', errorData);
                throw new Error(errorData.message || 'Falha ao deletar lista');
            }

            const responseData = await response.json();
            console.log('✅ Resposta da API:', responseData);
            console.log('✅ Lista deletada com sucesso');
            
            // Redirecionar para o perfil do usuário
            const redirectPath = username ? `/${username}/perfil` : '/';
            console.log('📍 Etapa 5: Redirecionando para:', redirectPath);
            navigate(redirectPath);
        } catch (err) {
            console.error('❌ Erro ao deletar lista:', err);
            alert('Erro ao deletar lista: ' + err.message);
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    if (loading) {
        return <div className="loading">Carregando dados da lista...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <>
            <BackButtonPTBR />
            <main className="edit-list-page">

                {/* Formulário de Edição */}
                <section className="edit-content">
                    <div className="container">
                        <div className="edit-grid">
                            {/* Painel de Configurações */}
                            <div className="settings-card">
                                <div className="edit-nav">

                                    <h2> <FontAwesomeIcon icon={faPenToSquare} /> Configurações da Lista</h2>
                                    <div className="edit-actions">
                                        <button type="button" className="btn primary" onClick={handleSaveChanges}>
                                            <FontAwesomeIcon icon={faSave} />
                                            Salvar alterações
                                        </button>
                                    </div>
                                </div>


                                <div className="form-group">
                                    <label htmlFor="listTitle">Nome da Lista</label>
                                    <input
                                        type="text"
                                        id="listTitle"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Digite o nome da lista"
                                    />
                                    <span className="char-count">{formData.name.length}/60 caracteres</span>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="listDescription">Descrição</label>
                                    <textarea
                                        id="listDescription"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Descreva sua lista..."
                                        rows="4"
                                    />
                                    <span className="char-count">{formData.description.length}/250 caracteres</span>
                                </div>



                                <div className="form-group">
                                    <label>Capa da Lista</label>
                                    <div className="cover-upload">
                                        <div className="upload-preview" onClick={handleCoverClick}>
                                            {formData.cover && typeof formData.cover === 'string' ? (
                                                <img
                                                    key={formData.cover}
                                                    src={formData.cover}
                                                    alt="Preview da capa"
                                                    id="coverPreview"
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    onLoad={() => console.log('✅ Imagem carregada')}
                                                    onError={() => console.error('❌ Erro ao carregar imagem')}
                                                />
                                            ) : (
                                                <div className="upload-placeholder">
                                                    <FontAwesomeIcon icon={faImage} />
                                                    <span>Sem imagem de capa</span>
                                                </div>
                                            )}
                                            <div className="upload-overlay">
                                                <FontAwesomeIcon icon={faCamera} />
                                                <span>Alterar imagem</span>
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
                                        <h3>Itens da Lista (<span id="itemsCount">{items.length}</span>)</h3>
                                    </div>

                                    <div className="search-box search-add-items">
                                        <FontAwesomeIcon icon={faSearch} className="search-icon" />
                                        <input 
                                            type="text" 
                                            placeholder="Buscar para adicionar itens..." 
                                            id="searchItems"
                                            value={searchQuery}
                                            onChange={(e) => handleSearchItems(e.target.value)}
                                        />
                                        {isSearching && <span className="search-loading">Buscando...</span>}
                                    </div>

                                    {/* Dropdown de Sugestões de Busca */}
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
                                                        <p>{suggestion.year} • {getMediaTypePTBR(suggestion.type)}</p>
                                                    </div>
                                                    <button 
                                                        className="btn-add-item"
                                                        onClick={() => handleAddItemToList(suggestion)}
                                                        title="Adicionar à lista"
                                                    >
                                                        <FontAwesomeIcon icon={faPlus} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="sortable-items" id="sortableContainer">
                                        {items.length === 0 ? (
                                            <p className="no-items">Nenhum item nesta lista ainda. Adicione alguns para começar!</p>
                                        ) : (
                                            items.map((item, idx) => (
                                                <div key={idx} className="sortable-item">
                                                    {/* <div className="item-handle">
                                                        <FontAwesomeIcon icon={faGripVertical} />
                                                    </div> */}
                                                    <img src={item.poster || "/img/default-poster.jpg"} alt={item.title} className="item-thumb" />
                                                    <div className="item-details">
                                                        <h4>{item.title}</h4>
                                                        <p>{item.year} • {getMediaTypePTBR(item.type)} • {item.genre}</p>
                                                        <span className="added-date">Adicionado em {new Date().toLocaleDateString('pt-BR')}</span>
                                                    </div>
                                                    <div className="item-actions">
                                                        {/* <button className="action-btn" title="Editar">
                                                            <FontAwesomeIcon icon={faPen} />
                                                        </button> */}
                                                        <button className="action-btn remove-btn" title="Remover" onClick={() => handleRemoveItem(idx)}>
                                                            <FontAwesomeIcon icon={faTimes} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                </div>

                                <div className="danger-zone">
                                    <h3>Zona de Perigo</h3>
                                    <div className="danger-actions">
                                        <button 
                                            type="button"
                                            className="btn btn-danger deleteList" 
                                            onClick={() => {
                                                console.log('🔴 BOTÃO DE DELETE CLICADO');
                                                console.log('showDeleteModal antes:', showDeleteModal);
                                                setShowDeleteModal(true);
                                                console.log('showDeleteModal depois:', true);
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                            Excluir Lista
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
                        <CortadorImagem 
                            arquivo={selectedFile}
                            aoCortar={handleImageCrop}
                            aoCancel={handleCropCancel}
                            proporçãoAspecto={2 / 3}
                        />
                    </div>
                </div>
            )}

            {console.log('🎯 Renderizando... showDeleteModal:', showDeleteModal)}
            {showDeleteModal && createPortal(
                <div className="modal-overlay-delete" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-content-delete" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Excluir Lista?</h2>
                            
                        </div>
                        <div className="modal-body">
                            <p><strong>Aviso:</strong> Esta ação não pode ser desfeita.</p>
                            <p>Todos os itens e informações desta lista serão permanentemente deletados.</p>
                            <p>Tem certeza que deseja deletar esta lista?</p>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="btn btn-secondary" 
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isDeleting}
                            >
                                Cancelar
                            </button>
                            <button 
                                className="btn btn-danger" 
                                onClick={handleDeleteList}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Excluindo...' : 'Excluir'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

export default ListaEditar;