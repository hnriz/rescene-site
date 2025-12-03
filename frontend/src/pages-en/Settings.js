import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Avatar from '../components-en/Avatar';
import { api } from '../services/axiosConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus,
    faCog,
    faImage,
    faUser,
    faKey,
    faCamera,
    faSync,
    faTrash,
    faChevronDown,
} from '@fortawesome/free-solid-svg-icons';

function Settings() {
    const { user, updateUser, logout, loading } = useAuth();
    const { language, setLanguage } = useLanguage();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        displayName: '',
        email: '',
        bio: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [editableUsername, setEditableUsername] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [tempLanguage, setTempLanguage] = useState(language);
    const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
    const [languageChanged, setLanguageChanged] = useState(false);

    const scriptsLoaded = useRef({ settings: false, avatar: false });

    useEffect(() => {
        // Load user data
        const loadUserData = async () => {
            if (user) {
                console.log('👤 Updating form with user data:', user);
                setFormData({
                    username: user.username || '',
                    displayName: user.displayName || user.username || '',
                    email: user.email || '',
                    bio: user.bio || '',
                    avatar: user.avatar || '../src/img/icon.jpg'
                });
            } else if (!loading) {
                // If user is null and not loading, try to load from server
                try {
                    console.log('📡 Attempting to load user data from server...');
                    const response = await api.get('/user/profile');
                    console.log('✅ User data loaded:', response.data);
                    setFormData({
                        username: response.data.username || '',
                        displayName: response.data.displayName || response.data.username || '',
                        email: response.data.email || '',
                        bio: response.data.bio || '',
                        avatar: response.data.avatar || '../src/img/icon.jpg'
                    });
                } catch (err) {
                    console.error('❌ Error loading data:', err);
                }
            }
        };
        loadUserData();
    }, [user, loading]);

    useEffect(() => {
        // Set language attribute on body
        document.body.setAttribute('data-language', 'en-US');

        // Carregar scripts
        const scripts = [
            { src: '/js/settings.js', init: 'initSettings' },
            { src: '/js/avatar.js', init: 'initAvatarUpload' }
        ];

        const scriptElements = scripts.map(({ src, init }) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = false; // Não async para garantir que execute em ordem
            
            script.onload = () => {
                console.log(`✅ Script carregado: ${src}`);
                
                // Chamar função de inicialização com um pequeno delay para garantir que o DOM está pronto
                setTimeout(() => {
                    if (typeof window[init] === 'function') {
                        console.log(`🚀 Executando inicialização: ${init}`);
                        window[init]();
                    }
                }, 100);
            };
            
            script.onerror = () => {
                console.error(`❌ Erro ao carregar script: ${src}`);
            };
            
            document.body.appendChild(script);
            return script;
        });

        // Cleanup
        return () => {
            scriptElements.forEach(script => {
                if (document.body.contains(script)) {
                    document.body.removeChild(script);
                }
            });
        };
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            const response = await api.put('/user/profile', {
                username: editableUsername ? formData.username : undefined,
                displayName: formData.displayName,
                bio: formData.bio
            });

            if (response.data.success) {
                // setMessage('✅ Profile updated successfully!');
                updateUser({
                    username: editableUsername ? formData.username : user.username,
                    displayName: formData.displayName,
                    email: formData.email,
                    bio: formData.bio
                });
                setEditableUsername(false);
                
                // Se o idioma foi mudado, atualizar contexto e navegar
                if (languageChanged && tempLanguage !== language) {
                    console.log('🌐 Salvando mudança de idioma para:', tempLanguage);
                    setLanguage(tempLanguage);
                    setLanguageChanged(false);
                    setTimeout(() => {
                        if (tempLanguage === 'pt-br') {
                            navigate('/configuracoes');
                        } else {
                            navigate('/settings');
                        }
                    }, 100);
                } else {
                    setLanguageChanged(false);
                    setTimeout(() => setMessage(''), 3000);
                }
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            const errorMsg = error.response?.data?.message || 'Error updating profile';
            // setMessage('❌ ' + errorMsg);
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tipo de arquivo
        if (!file.type.startsWith('image/')) {
            // setMessage('❌ Please select an image file');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        // Validar tamanho (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
            // setMessage('❌ Image must be smaller than 5MB');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        // Converter para base64 e comprimir
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Criar canvas para redimensionar
                const canvas = document.createElement('canvas');
                const maxWidth = 400;
                const maxHeight = 400;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Converter canvas para base64 com qualidade reduzida
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
                setFormData(prev => ({
                    ...prev,
                    avatar: compressedBase64
                }));
                // setMessage('✅ Image selected. Click "Save changes" to confirm.');
                setTimeout(() => setMessage(''), 3000);
            };
            img.src = event.target?.result;
        };
        reader.readAsDataURL(file);
    };

    const handleSaveAvatar = async () => {
        if (!formData.avatar || formData.avatar === user.avatar) {
            // setMessage('❌ Please select an image first');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        setIsLoading(true);
        setMessage('');

        try {
            const response = await api.post('/user/avatar', {
                avatar: formData.avatar
            });

            if (response.data.success) {
                // setMessage('✅ Avatar updated successfully!');
                updateUser({
                    ...user,
                    avatar: formData.avatar
                });
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            console.error('Error uploading avatar:', error);
            const errorMsg = error.response?.data?.message || 'Error uploading avatar';
            // setMessage('❌ ' + errorMsg);
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveAvatar = async () => {
        setIsLoading(true);
        setMessage('');

        try {
            const response = await api.post('/user/avatar', {
                avatar: null
            });

            if (response.data.success) {
                // setMessage('✅ Avatar removed successfully!');
                setFormData(prev => ({
                    ...prev,
                    avatar: '../src/img/icon.jpg'
                }));
                updateUser({
                    ...user,
                    avatar: null
                });
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            console.error('Error removing avatar:', error);
            // setMessage('❌ Error removing avatar');
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        setIsLoading(true);
        setMessage('');

        try {
            console.log('🗑️ Iniciando exclusão de conta...');
            const response = await api.delete('/user/delete');

            if (response.data.success) {
                console.log('✅ Conta excluída com sucesso');
                setMessage('✅ Account deleted successfully!');
                
                // Logout e redirecionar
                setTimeout(async () => {
                    await logout();
                    navigate('/');
                }, 1500);
            }
        } catch (error) {
            console.error('❌ Erro ao deletar conta:', error);
            const errorMsg = error.response?.data?.message || 'Error deleting account';
            setMessage('❌ ' + errorMsg);
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setIsLoading(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleLanguageChange = (newLang) => {
        console.log('🌐 Selecionando idioma temporário em Settings.js para:', newLang);
        setTempLanguage(newLang);
        setLanguageChanged(true);
        setLanguageDropdownOpen(false);
    };

    return (
        <>
            <BackButton />
            <main class="settings-container">
                {/* <!-- Cabeçalho interno das configurações --> */}
                <div class="settings-header">
                <h1><FontAwesomeIcon icon={faCog} /> Settings</h1>
                <p>Manage your preferences and account settings.</p>
            </div>

            <div class="settings-layout">
                {/* <!-- Navegação lateral --> */}
                <aside class="settings-sidebar">
                    <nav class="settings-nav">
                        <div class="nav-category">
                            <h3>Account</h3>
                            <a href="#profile" class="nav-item active" data-section="profile">
                                <FontAwesomeIcon icon={faUser} />
                                <span>Profile</span>
                            </a>
                            <a href="#avatar" class="nav-item" data-section="avatar">
                                <FontAwesomeIcon icon={faImage} />
                                <span>Avatar</span>
                            </a>
                            <a href="#account" class="nav-item" data-section="account">
                                <FontAwesomeIcon icon={faKey} />
                                <span>Security</span>
                            </a>
                        </div>

                        {/* <div class="nav-category">
                            <h3>Preferences</h3>
                            <a href="#language" class="nav-item" data-section="language">
                                <FontAwesomeIcon icon={faGlobe} />
                                <span>Language and region</span>
                            </a>
                            <a href="#privacy" class="nav-item" data-section="privacy">
                                <FontAwesomeIcon icon={faLock} />
                                <span>Privacy</span>
                            </a>
                            <a href="#notifications" class="nav-item" data-section="notifications">
                                <FontAwesomeIcon icon={faBell} />
                                <span>Notifications</span>
                            </a>

                        </div> */}

                        {/* <div class="nav-category">
                            <h3>Sistema</h3>
                            <a href="#accessibility" class="nav-item" data-section="accessibility">
                                <i class="fas fa-universal-access"></i>
                                <span>Acessibilidade</span>
                            </a>
                        </div> */}
                    </nav>


                </aside>

                {/* <!-- Conteúdo principal --> */}
                <div class="settings-content">
                    {/* <!-- Seção de Perfil --> */}
                    <section id="profile-section" class="content-section active" data-section="profile">
                        <div class="section-header-settings">
                            <h2><FontAwesomeIcon icon={faUser} /> Profile</h2>
                            <p>Manage your public information.</p>
                        </div>

                        <form id="profile-form" class="settings-form" onSubmit={handleSaveProfile}>
                            <div class="form-grid">
                                <div class="form-group-settings">
                                    <label for="username">Username</label>
                                    <div class="username-input-wrapper">
                                        <input type="text" id="username" name="username" class="form-input-settings" value={formData.username} onChange={handleInputChange} disabled={!editableUsername} required />
                                        <button 
                                            type="button" 
                                            class="btn-edit-username"
                                            onClick={() => setEditableUsername(!editableUsername)}
                                        >
                                            {editableUsername ? 'Cancel' : 'Edit'}
                                        </button>
                                    </div>
                                    <div class="form-hint">Your own identifier on Rescene.</div>
                                </div>

                                <div class="form-group-settings">
                                    <label for="displayname">Display name</label>
                                    <input type="text" id="displayname" name="displayName" class="form-input-settings" value={formData.displayName} onChange={handleInputChange} required />
                                    <div class="form-hint">How other users will see you.</div>
                                </div>

                                <div class="form-group-settings">
                                    <label for="email">E-mail</label>
                                    <input type="email" id="email" name="email" class="form-input-settings" value={formData.email} onChange={handleInputChange} disabled />
                                    <div class="form-hint">Your main e-mail adress.</div>
                                </div>

                                {/* <div class="form-group-settings">
                                    <label for="pronouns">Pronomes</label>
                                    <select id="pronouns" class="form-select">
                                        <option value="">Selecionar pronomes</option>
                                        <option value="ele/dele">Ele/Dele</option>
                                        <option value="ela/dela">Ela/Dela</option>
                                        <option value="elu/delu">Elu/Delu</option>
                                        <option value="outro">Outro</option>
                                    </select>
                                    <div class="form-hint">Como você gostaria de ser tratado</div>
                                </div> */}

                                <div class="form-group-settings">
                                    <label>Interface language</label>
                                    <div class="interface-language-dropdown">
                                        <button 
                                            class="interface-language-btn" 
                                            onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}
                                            type="button"
                                        >
                                            <span>
                                                {tempLanguage === 'pt-br' ? 'Português (Brasil)' : 'English (US)'}
                                                {languageChanged && <span style={{marginLeft: '8px', color: '#ff9800'}}>*</span>}
                                            </span>
                                            <FontAwesomeIcon icon={faChevronDown} />
                                        </button>
                                        {languageDropdownOpen && (
                                            <div class="interface-language-menu">
                                                <button 
                                                    class={`interface-language-option ${tempLanguage === 'pt-br' ? 'selected' : ''}`}
                                                    onClick={() => handleLanguageChange('pt-br')}
                                                    type="button"
                                                >
                                                    Português (Brasil)
                                                </button>
                                                <button 
                                                    class={`interface-language-option ${tempLanguage === 'en' ? 'selected' : ''}`}
                                                    onClick={() => handleLanguageChange('en')}
                                                    type="button"
                                                >
                                                    English (US)
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div class="form-group-settings full-width">
                                    <label for="bio">Bio</label>
                                    <textarea id="bio" name="bio" class="form-textarea" rows="4" maxlength="500"
                                        placeholder="Tell us a bit about you..."
                                        value={formData.bio}
                                        onChange={handleInputChange}></textarea>
                                    <div class="form-hint">Maximum: 500 characters</div>
                                    {/* <div class="char-count"><span id="bio-chars">{formData.bio.length}</span>/500</div> */}
                                </div>

                                {/* <div class="form-group-settings full-width">
                                    <label>Favorite</label>
                                    <div class="favorites-grid">
                                        <div class="favorite-item add-favorite" data-type="movie">
                                            <FontAwesomeIcon icon={faPlus} />
                                            <span>Add movie</span>
                                        </div>
                                        <div class="favorite-item add-favorite" data-type="series">
                                            <FontAwesomeIcon icon={faPlus} />
                                            <span>Add TV Show</span>
                                        </div>
                                         <div class="favorite-item add-favorite" data-type="director">
                                            <FontAwesomeIcon icon={faPlus} />
                                            <span>Add director</span>
                                        </div>
                                    </div>
                                </div> */}
                            </div>

                            <div class="form-actions">
                                {message && <div class="form-message">{message}</div>}
                                <button type="reset" class="btn btn-secondary">Discard changes</button>
                                <button type="submit" class="btn btn-primary" disabled={isLoading}>
                                    {isLoading ? 'Saving...' : 'Save changes'}
                                </button>
                            </div>
                        </form>
                    </section>

                    {/* <!-- Seção de Avatar --> */}
                    <section id="avatar-section" class="content-section" data-section="avatar">
                        <div class="section-header-settings">
                            <h2><FontAwesomeIcon icon={faImage} /> Avatar</h2>
                            <p>Customize your profile picture.</p>
                        </div>

                        <div class="avatar-content">
                            <div class="avatar-preview">
                                <div class="current-avatar">
                                    <Avatar 
                                        src={formData.avatar} 
                                        alt="Current Avatar" 
                                        className="avatar-img"
                                        id="avatar-preview"
                                        size="xlarge"
                                    />
                                    <div class="avatar-overlay">
                                        <label for="avatar-upload" class="avatar-upload-btn">
                                            <FontAwesomeIcon icon={faCamera} />
                                            Change
                                        </label>
                                        <input 
                                            type="file" 
                                            id="avatar-upload" 
                                            name="avatar" 
                                            accept="image/*" 
                                            hidden 
                                            onChange={handleAvatarUpload}
                                        />
                                    </div>
                                </div>

                                <div class="avatar-actions">
                                    <button 
                                        type="button" 
                                        class="btn btn-secondary" 
                                        id="remove-avatar"
                                        onClick={handleRemoveAvatar}
                                    >
                                        <FontAwesomeIcon icon={faTrash} /> Remove
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="form-actions">
                            {message && <div class="form-message">{message}</div>}
                            <button 
                                type="button" 
                                class="btn btn-secondary"
                                onClick={() => {
                                    setFormData(prev => ({
                                        ...prev,
                                        avatar: user.avatar || '../src/img/icon.jpg'
                                    }));
                                    setMessage('');
                                }}
                            >
                                Discard changes
                            </button>
                            <button 
                                type="button" 
                                class="btn btn-primary" 
                                disabled={isLoading}
                                onClick={handleSaveAvatar}
                            >
                                {isLoading ? 'Saving...' : 'Save changes'}
                            </button>
                        </div>
                    </section>

                    {/* <!-- Seção de Idioma e Região --> */}
                    {/* <section id="language-section" class="content-section">
                        <div class="section-header-settings">
                            <h2><FontAwesomeIcon icon={faGlobe} />Language and region</h2>
                            <p>Customize the language and date format.</p>
                        </div>

                        <form id="language-form" class="settings-form">
                            <div class="form-grid">
                                <div class="form-group-settings">
                                    <label>Interface language</label>
                                    <div class="interface-language-dropdown">
                                        <button 
                                            class="interface-language-btn" 
                                            onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}
                                            type="button"
                                        >
                                            <span>
                                                {selectedLanguage === 'pt-BR' ? 'Português (Brasil)' : 'English (US)'}
                                            </span>
                                            <FontAwesomeIcon icon={faChevronDown} />
                                        </button>
                                        {languageDropdownOpen && (
                                            <div class="interface-language-menu">
                                                <button 
                                                    class={`interface-language-option ${selectedLanguage === 'pt-BR' ? 'selected' : ''}`}
                                                    onClick={() => {
                                                        setSelectedLanguage('pt-BR');
                                                        setLanguageDropdownOpen(false);
                                                    }}
                                                    type="button"
                                                >
                                                    Português (Brasil)
                                                </button>
                                                <button 
                                                    class={`interface-language-option ${selectedLanguage === 'en-US' ? 'selected' : ''}`}
                                                    onClick={() => {
                                                        setSelectedLanguage('en-US');
                                                        setLanguageDropdownOpen(false);
                                                    }}
                                                    type="button"
                                                >
                                                    English (US)
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div class="form-group-settings">
                                    <label for="content-language">Content language</label>
                                    <select id="content-language" class="form-select">
                                        <option value="pt-BR" selected>Português</option>
                                        <option value="en">English</option>
                                        <option value="original">Original language</option>
                                        <option value="multiple">Multiple language</option>
                                    </select>
                                </div>

                                <div class="form-group-settings">
                                    <label for="subtitle-language">Subtitle language</label>
                                    <select id="subtitle-language" class="form-select">
                                        <option value="pt-BR" selected>Português (Brasil)</option>
                                        <option value="en">English</option>
                                        <option value="none">None</option>
                                        <option value="auto">Automatic</option>
                                    </select>
                                </div>

                                <div class="form-group-settings">
                                    <label for="date-format">Date format</label>
                                    <select id="date-format" class="form-select">
                                        <option value="dd/MM/yyyy" selected>DD/MM/AAAA</option>
                                        <option value="MM/dd/yyyy">MM/DD/AAAA</option>
                                        <option value="yyyy-MM-dd">AAAA-MM-DD</option>
                                    </select>
                                </div>

                                <div class="form-group-settings">
                                    <label for="time-format">Time format</label>
                                    <select id="time-format" class="form-select">
                                        <option value="24" selected>24 hours</option>
                                        <option value="12">12 hours (AM/PM)</option>
                                    </select>
                                </div>
                            </div>

                            <div class="form-actions">
                                <button type="reset" class="btn btn-secondary">Discard changes</button>
                                <button type="submit" class="btn btn-primary">Save changes</button>
                            </div>
                        </form>
                    </section> */}

                    {/* <!-- Seção de Segurança --> */}
                    <section id="account-section" class="content-section" data-section="account">
                        <div class="section-header-settings">
                            <h2><FontAwesomeIcon icon={faKey} />Account security</h2>
                            <p>Manage your security.</p>
                        </div>

                        <div class="account-sections">
                            {/* <!-- Alteração de senha --> */}
                            <div class="account-subsection">
                                <h3>Change password</h3>

                                <form id="password-form" class="settings-form">
                                    <div class="form-group-settings">
                                        <label for="current-password">Current password *</label>
                                        <input type="password" id="current-password" class="form-input-settings" required />
                                    </div>

                                    <div class="form-group-settings">
                                        <label for="new-password">New password *</label>
                                        <input type="password" id="new-password" class="form-input-settings" required minlength="8" />
                                        <div class="form-hint">Minimum: 8 characters, with letters and numbers.</div>
                                    </div>

                                    <div class="form-group-settings">
                                        <label for="confirm-password">Confirm new password *</label>
                                        <input type="password" id="confirm-password" class="form-input-settings" required />
                                    </div>

                                    <div class="form-actions">
                                        <button type="submit" class="btn btn-primary">Change password</button>
                                    </div>
                                </form>
                            </div>

                            {/* <!-- Autenticação de dois fatores --> */}
                            {/* <div class="account-subsection">
                                <h3>Autenticação de dois fatores</h3>

                                <div class="two-factor-status">
                                    <div class="status-indicator inactive"></div>
                                    <span>Autenticação de dois fatores desativada</span>
                                </div>

                                <p>Adicione uma camada extra de segurança à sua conta ativando a autenticação de dois fatores.</p>

                                <button class="btn btn-secondary" id="enable-2fa">Ativar autenticação de dois fatores</button>
                            </div> */}

                            {/* <!-- Sessões ativas --> */}
                            {/* <div class="account-subsection">
                                <h3>Sessões ativas</h3>

                                <div class="sessions-list">
                                    <div class="session-item current">
                                        <div class="session-info">
                                            <h4>Esta sessão</h4>
                                            <p>Chrome no Windows · Agora</p>
                                        </div>
                                        <button class="btn btn-secondary" disabled>Atual</button>
                                    </div>

                                    <div class="session-item">
                                        <div class="session-info">
                                            <h4>iPhone 13 Pro</h4>
                                            <p>Safari no iOS · 2 horas atrás</p>
                                        </div>
                                        <button class="btn btn-secondary session-terminate">Encerrar sessão</button>
                                    </div>

                                    <div class="session-item">
                                        <div class="session-info">
                                            <h4>Firefox no Mac</h4>
                                            <p>Firefox no macOS · 2 dias atrás</p>
                                        </div>
                                        <button class="btn btn-secondary session-terminate">Encerrar sessão</button>
                                    </div>
                                </div>
                            </div> */}

                            {/* <!-- Zona de perigo --> */}
                            <div class="account-subsection danger-zone">
                                <h3>Danger zone</h3>

                                <div class="danger-actions">
                                    {/* <div class="danger-action">
                                        <div class="danger-info">
                                            <h4>Disable account</h4>
                                            <p>Your account will be temporarilly disabled until next login.</p>   
                                        </div>
                                        <button class="btn btn-danger" data-action="deactivate">Disable account</button>
                                    </div> */}

                                    <div class="danger-action">
                                        <div class="danger-info">
                                            <h4>Delete acount</h4>
                                            <p>All your data will be permanently removed. This action cannot be undone.</p>
                                        </div>
                                        <button 
                                            class="btn btn-danger" 
                                            onClick={() => setShowDeleteConfirm(true)}
                                        >
                                            Delete account
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    {/* <!-- Seção de Privacidade --> */}
                    {/* <section id="privacy-section" class="content-section">
                        <div class="section-header-settings">
                            <h2><FontAwesomeIcon icon={faLock} /> Privacy</h2>
                            <p>Control who sees your information</p>
                        </div>

                        <form class="settings-form">
                            <div class="privacy-category">
                                <h3>Profile visibility</h3>

                                <div class="form-group-settings">
                                    <label for="profile-visibility">Who sees your profile</label>
                                    <select id="profile-visibility" class="form-select">
                                        <option value="public" selected>Public</option>
                                        <option value="followers">Only followers</option>
                                        <option value="private">Only me</option>
                                    </select>
                                </div>

                                <div class="form-group-settings">
                                    <label for="activity-visibility">Who sees your activity</label>
                                    <select id="activity-visibility" class="form-select">
                                        <option value="public" selected>Public</option>
                                        <option value="followers">Only followers</option>
                                        <option value="private">Only me</option>
                                    </select>
                                </div>
                            </div>

                            <div class="privacy-category">
                                <h3>Content control</h3>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="show-watched" checked />
                                        <span class="checkmark"></span>
                                        Show watched movies and TV shows.
                                    </label>
                                </div>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="show-ratings" checked />
                                        <span class="checkmark"></span>
                                        Show reviews on profile.
                                    </label>
                                </div>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="show-lists" checked />
                                        <span class="checkmark"></span>
                                        Show lists on profile.
                                    </label>
                                </div>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="show-favorites" checked />
                                        <span class="checkmark"></span>
                                        Show favorites on profile.
                                    </label>
                                </div>
                            </div>

                            <div class="privacy-category">
                                <h3>Interactions</h3>

                                <div class="form-group-settings">
                                    <label for="comment-permissions">Who can comments</label>
                                    <select id="comment-permissions" class="form-select">
                                        <option value="anyone" selected>Everyone</option>
                                        <option value="followers">Only followers</option>
                                        <option value="none">No one</option>
                                    </select>
                                </div>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="filter-comments" checked />
                                        <span class="checkmark"></span>
                                        Filter offensive comments
                                    </label>
                                </div>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="hide-activity" checked />
                                        <span class="checkmark"></span>
                                        Hide my activity from blocked users.
                                    </label>
                                </div>
                            </div>

                            <div class="privacy-category">
                                <h3>Blocked users</h3>
                                <div class="blocked-users">
                                    <h4>Blocked users (3)</h4>
                                    <div class="blocked-list">
                                        <div class="blocked-user">
                                            <img src="../src/img/user1.jpg" alt="Blocked user" class="blocked-avatar" />
                                            <div class="blocked-info">
                                                <span class="blocked-name">Unwanted user</span>
                                                <span class="blocked-date">Blocked at 12/12/2023</span>
                                            </div>
                                            <button class="btn btn-secondary">Unblock</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="form-actions">
                                <button type="reset" class="btn btn-secondary">Discard changes</button>
                                <button type="submit" class="btn btn-primary">Save changes</button>
                            </div>
                        </form>
                    </section> */}

                    {/* <!-- Seção de Notificações --> */}
                    {/* <section id="notifications-section" class="content-section">
                        <div class="section-header-settings">
                            <h2><FontAwesomeIcon icon={faBell} /> Notification</h2>
                            <p>Control how and when you receive notification</p>
                        </div>

                        <form class="settings-form">
                            <div class="notifications-category">
                                <h3>E-mail</h3>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="email-newsletter" checked />
                                        <span class="checkmark"></span>
                                        Receive our newsletter
                                    </label>
                                </div>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="email-recommendations" checked />
                                        <span class="checkmark"></span>
                                        Receive recommendations
                                    </label>
                                </div>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="email-activity" />
                                        <span class="checkmark"></span>
                                        Receive week activity summary
                                    </label>
                                </div>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="email-promotions" checked />
                                        <span class="checkmark"></span>
                                        Receive promotions
                                    </label>
                                </div>
                            </div>

                            <div class="notifications-category">
                                <h3>Platform notification</h3>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="notif-likes" checked />
                                        <span class="checkmark"></span>
                                        Likes
                                    </label>
                                </div>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="notif-comments" checked />
                                        <span class="checkmark"></span>
                                        Comments
                                    </label>
                                </div>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="notif-follows" checked />
                                        <span class="checkmark"></span>
                                        New Followers
                                    </label>
                                </div>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="notif-mentions" checked />
                                        <span class="checkmark"></span>
                                        Mentions
                                    </label>
                                </div>
                            </div>

                            <div class="notifications-category">
                                <h3>Push notification</h3>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="push-releases" checked />
                                        <span class="checkmark"></span>
                                        New releases from your favorite content
                                    </label>
                                </div>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="push-live" checked />
                                        <span class="checkmark"></span>
                                        Live events and premieres
                                    </label>
                                </div>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="push-updates" checked />
                                        <span class="checkmark"></span>
                                        Updates on TV Shows
                                    </label>
                                </div>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="push-premiere" checked />
                                        <span class="checkmark"></span>
                                        Programmed premiere reminders
                                    </label>
                                </div>
                            </div> */}

                            {/* <div class="notifications-category">
                                <h3>Preferências de som</h3>

                                <div class="form-group-settings">
                                    <label for="notification-sound">Som de notificação</label>
                                    <select id="notification-sound" class="form-select">
                                        <option value="default" selected>Padrão</option>
                                        <option value="soft">Suave</option>
                                        <option value="classic">Clássico</option>
                                        <option value="none">Sem som</option>
                                    </select>
                                </div>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="vibration" checked />
                                        <span class="checkmark"></span>
                                        Vibrar para notificações (dispositivos móveis)
                                    </label>
                                </div>
                            </div> */}

                            {/* <div class="form-actions">
                                <button type="reset" class="btn btn-secondary">Discard changes</button>
                                <button type="submit" class="btn btn-primary">Save changes</button>
                            </div> */}
                        {/* </form>
                    </section> */}


                    {/* <!-- Seção de Acessibilidade --> */}
                    {/* <section id="accessibility-section" class="content-section">
                        <div class="section-header-settings">
                            <h2><i class="fas fa-universal-access"></i> Acessibilidade</h2>
                            <p>Personalize a experiência de acordo com suas necessidades</p>
                        </div>

                        <form class="settings-form">
                            <div class="accessibility-category">
                                <h3>Visão</h3>

                                <div class="form-group-settings">
                                    <label for="text-size">Tamanho do texto</label>
                                    <select id="text-size" class="form-select">
                                        <option value="small">Pequeno</option>
                                        <option value="medium" selected>Médio</option>
                                        <option value="large">Grande</option>
                                        <option value="x-large">Extra Grande</option>
                                    </select>
                                </div>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="high-contrast" />
                                        <span class="checkmark"></span>
                                        Modo de alto contraste
                                    </label>
                                </div>



                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="dark-mode" checked />
                                        <span class="checkmark"></span>
                                        Modo escuro sempre ativo
                                    </label>
                                </div>
                            </div>


                            <div class="accessibility-category">
                                <h3>Navegação</h3>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="keyboard-nav" checked />
                                        <span class="checkmark"></span>
                                        Navegação por teclado
                                    </label>
                                </div>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="focus-indicator" checked />
                                        <span class="checkmark"></span>
                                        Indicador de foco ampliado
                                    </label>
                                </div>

                                <div class="form-group-settings">
                                    <label for="cursor-size">Tamanho do cursor</label>
                                    <select id="cursor-size" class="form-select">
                                        <option value="normal" selected>Normal</option>
                                        <option value="large">Grande</option>
                                        <option value="x-large">Extra Grande</option>
                                    </select>
                                </div>
                            </div>

                            <div class="form-actions">
                                <button type="reset" class="btn btn-secondary">Descartar</button>
                                <button type="submit" class="btn btn-primary">Salvar configurações</button>
                            </div>
                        </form>
                    </section> */}

                    
                </div>
            </div>

            {/* Modal de Confirmação de Deleção */}
            {showDeleteConfirm && (
                <div class="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
                    <div class="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div class="modal-header">
                            <h2>Delete Account?</h2>
                            <button 
                                class="modal-close" 
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div class="modal-body">
                            <p><strong>Warning:</strong> This action cannot be undone.</p>
                            <p>All your data, reviews, lists, and account information will be permanently deleted from our servers.</p>
                            <p>Are you absolutely sure you want to delete your account?</p>
                        </div>
                        <div class="modal-footer">
                            <button 
                                class="btn btn-secondary" 
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                            <button 
                                class="btn btn-danger" 
                                onClick={handleDeleteAccount}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Deleting...' : 'Delete Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </main>
        </>
    );
}


export default Settings;