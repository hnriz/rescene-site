import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Link, useNavigate } from 'react-router-dom';
import BackButtonPTBR from '../componentes-ptbr/BackButtonPTBR';
import AvatarPTBR from '../componentes-ptbr/AvatarPTBR';
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

function Configuracoes() {
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
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState(language);
    const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);

    const scriptsLoaded = useRef({ settings: false, avatar: false });

    useEffect(() => {
        // Carregar dados do usuário
        const loadUserData = async () => {
            if (user) {
                console.log('👤 Atualizando formulário com dados do usuário:', user);
                setFormData({
                    username: user.username || '',
                    displayName: user.displayName || user.username || '',
                    email: user.email || '',
                    bio: user.bio || ''
                });
            } else if (!loading) {
                // Se user é null e não está carregando, tenta carregar do servidor
                try {
                    console.log('📡 Tentando carregar dados do usuário do servidor...');
                    const response = await api.get('/user/profile');
                    console.log('✅ Dados do usuário carregados:', response.data);
                    setFormData({
                        username: response.data.username || '',
                        displayName: response.data.displayName || response.data.username || '',
                        email: response.data.email || '',
                        bio: response.data.bio || ''
                    });
                } catch (err) {
                    console.error('❌ Erro ao carregar dados:', err);
                }
            }
        };
        loadUserData();
    }, [user, loading]);

    useEffect(() => {
        // Definir atributo de idioma no body
        document.body.setAttribute('data-language', 'pt-BR');

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
            const response = await api.put(
                '/user/profile',
                {
                    displayName: formData.displayName,
                    bio: formData.bio
                }
            );

            // setMessage('✅ Perfil atualizado com sucesso!');
            updateUser({
                displayName: formData.displayName,
                bio: formData.bio
            });

            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            // setMessage('❌ Erro ao atualizar perfil. Tente novamente.');
            console.error('Erro:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        console.log('🗑️ handleDeleteAccount chamado');
        console.log('showDeleteConfirm:', showDeleteConfirm);
        
        setIsLoading(true);
        setMessage('');

        try {
            console.log('🗑️ Iniciando exclusão de conta...');
            const response = await api.delete('/user/delete');

            if (response.data.success) {
                console.log('✅ Conta excluída com sucesso');
                setMessage('✅ Conta excluída com sucesso!');
                
                // Logout e redirecionar
                setTimeout(async () => {
                    await logout();
                    navigate('/');
                }, 1500);
            }
        } catch (error) {
            console.error('❌ Erro ao deletar conta:', error);
            const errorMsg = error.response?.data?.message || 'Erro ao excluir conta';
            setMessage('❌ ' + errorMsg);
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setIsLoading(false);
            setShowDeleteConfirm(false);
        }
    };

    if (loading) {
        return <div>Carregando...</div>;
    }

    if (!user) {
        return (
            <div style={{ textAlign: 'center', padding: '40px', color: '#fff' }}>
                <h2>Você precisa estar autenticado para acessar esta página.</h2>
                <Link to="/login-ptbr">Ir para login</Link>
            </div>
        );
    }

    return (
        <>
            <BackButtonPTBR />
            <main className="settings-container">
                {/* <!-- Cabeçalho interno das configurações --> */}
                <div class="settings-header">
                <h1><FontAwesomeIcon icon={faCog} /> Configurações</h1>
                <p>Gerencie suas preferências e configurações da conta</p>
            </div>

            <div class="settings-layout">
                {/* <!-- Navegação lateral --> */}
                <aside class="settings-sidebar">
                    <nav class="settings-nav">
                        <div class="nav-category">
                            <h3>Conta</h3>
                            <a href="#" onClick={(e) => e.preventDefault()} class="nav-item active" data-section="profile">
                                <FontAwesomeIcon icon={faUser} />
                                <span>Perfil</span>
                            </a>
                            <a href="#" onClick={(e) => e.preventDefault()} class="nav-item" data-section="avatar">
                                <FontAwesomeIcon icon={faImage} />
                                <span>Avatar</span>
                            </a>
                            <a href="#" onClick={(e) => e.preventDefault()} class="nav-item" data-section="account">
                                <FontAwesomeIcon icon={faKey} />
                                <span>Segurança</span>
                            </a>
                        </div>

                        {/* <div class="nav-category">
                            <h3>Preferências</h3>
                            <a href="#language" class="nav-item" data-section="language">
                                <FontAwesomeIcon icon={faGlobe} />
                                <span>Idioma & Região</span>
                            </a>
                            <a href="#privacy" class="nav-item" data-section="privacy">
                                <FontAwesomeIcon icon={faLock} />
                                <span>Privacidade</span>
                            </a>
                            <a href="#notifications" class="nav-item" data-section="notifications">
                                <FontAwesomeIcon icon={faBell} />
                                <span>Notificações</span>
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
                            <h2><FontAwesomeIcon icon={faUser} /> Perfil</h2>
                            <p>Gerencie suas informações públicas</p>
                        </div>

                        {/* {message && (
                            <div className="message-alert">
                                {message}
                            </div>
                        )} */}

                        <form id="profile-form" class="settings-form" onSubmit={handleSaveProfile}>
                            <div class="form-grid">
                                <div class="form-group-settings">
                                    <label for="username">Nome de usuário *</label>
                                    <input 
                                        type="text" 
                                        id="username" 
                                        name="username"
                                        class="form-input-settings" 
                                        value={formData.username}
                                        disabled
                                        required 
                                    />
                                    <div class="form-hint">Seu identificador único na plataforma</div>
                                </div>

                                <div class="form-group-settings">
                                    <label for="displayName">Nome de exibição *</label>
                                    <input 
                                        type="text" 
                                        id="displayName" 
                                        name="displayName"
                                        class="form-input-settings" 
                                        value={formData.displayName}
                                        onChange={handleInputChange}
                                        required 
                                    />
                                    <div class="form-hint">Como outros usuários te verão</div>
                                </div>

                                <div class="form-group-settings">
                                    <label for="email">Email *</label>
                                    <input 
                                        type="email" 
                                        id="email" 
                                        name="email"
                                        class="form-input-settings" 
                                        value={formData.email}
                                        disabled
                                        required 
                                    />
                                    <div class="form-hint">Seu endereço de email principal</div>
                                </div>

                                <div class="form-group-settings">
                                    <label>Idioma da interface</label>
                                    <div class="interface-language-dropdown">
                                        <button 
                                            class="interface-language-btn" 
                                            onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}
                                            type="button"
                                        >
                                            <span>
                                                {selectedLanguage === 'pt-br' ? 'Português (Brasil)' : 'English (US)'}
                                            </span>
                                            <FontAwesomeIcon icon={faChevronDown} />
                                        </button>
                                        {languageDropdownOpen && (
                                            <div class="interface-language-menu">
                                                <button 
                                                    class={`interface-language-option ${selectedLanguage === 'pt-br' ? 'selected' : ''}`}
                                                    onClick={() => {
                                                        setSelectedLanguage('pt-br');
                                                        setLanguage('pt-br');
                                                        setLanguageDropdownOpen(false);
                                                        // Permanecer na página de configurações PT-BR
                                                        navigate('/configuracoes');
                                                    }}
                                                    type="button"
                                                >
                                                    Português (Brasil)
                                                </button>
                                                <button 
                                                    class={`interface-language-option ${selectedLanguage === 'en' ? 'selected' : ''}`}
                                                    onClick={() => {
                                                        setSelectedLanguage('en');
                                                        setLanguage('en');
                                                        setLanguageDropdownOpen(false);
                                                        // Navegar para versão em inglês
                                                        navigate('/settings');
                                                    }}
                                                    type="button"
                                                >
                                                    English (US)
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div class="form-group-settings full-width">
                                    <label for="bio">Biografia</label>
                                    <textarea 
                                        id="bio" 
                                        name="bio"
                                        class="form-textarea" 
                                        rows="4" 
                                        maxlength="500"
                                        placeholder="Conte um pouco sobre você e seus gostos cinematográficos..."
                                        value={formData.bio}
                                        onChange={handleInputChange}
                                    />
                                    <div class="form-hint">Máximo de 500 caracteres</div>
                                    {/* <div class="char-count"><span id="bio-chars">{formData.bio.length}</span>/500</div> */}
                                </div>

                                {/* <div class="form-group-settings full-width">
                                    <label>Favoritos</label>
                                    <div class="favorites-grid">
                                        <div class="favorite-item add-favorite" data-type="movie">
                                            <FontAwesomeIcon icon={faPlus} />
                                            <span>Adicionar filme</span>
                                        </div>
                                        <div class="favorite-item add-favorite" data-type="series">
                                            <FontAwesomeIcon icon={faPlus} />
                                            <span>Adicionar série</span>
                                        </div>
                                         <div class="favorite-item add-favorite" data-type="director">
                                            <FontAwesomeIcon icon={faPlus} />
                                            <span>Adicionar diretor</span>
                                        </div> 
                                    </div>
                                </div> */}
                            </div>

                            <div class="form-actions">
                                <button 
                                    type="button" 
                                    class="btn btn-secondary"
                                    onClick={() => {
                                        if (user) {
                                            setFormData({
                                                username: user.username || '',
                                                displayName: user.displayName || user.username || '',
                                                email: user.email || '',
                                                bio: user.bio || ''
                                            });
                                        }
                                    }}
                                >
                                    Descartar alterações
                                </button>
                                <button 
                                    type="submit" 
                                    class="btn btn-primary"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Salvando...' : 'Salvar alterações'}
                                </button>
                            </div>
                        </form>
                    </section>

                    {/* <!-- Seção de Avatar --> */}
                    <section id="avatar-section" class="content-section" data-section="avatar">
                        <div class="section-header-settings">
                            <h2><FontAwesomeIcon icon={faImage} /> Avatar</h2>
                            <p>Personalize sua imagem de perfil</p>
                        </div>

                        <form id="avatar-form" class="settings-form">
                            <div class="avatar-content">
                                <div class="avatar-preview">
                                    <div class="current-avatar">
                                        <AvatarPTBR src={user?.avatar} alt="Avatar atual" className="avatar-img" id="avatar-preview" size="xlarge" />
                                        <div class="avatar-overlay">
                                            <label for="avatar-upload" class="avatar-upload-btn">
                                                <FontAwesomeIcon icon={faCamera} />
                                                Alterar
                                            </label>
                                            <input type="file" id="avatar-upload" name="avatar" accept="image/*" hidden />
                                        </div>
                                    </div>

                                    <div class="avatar-actions">
                                        {/* <button type="button" class="btn btn-secondary" id="reset-avatar">
                                            <FontAwesomeIcon icon={faSync} /> Redefinir
                                        </button> */}
                                        <button type="button" class="btn btn-secondary" id="remove-avatar">
                                            <FontAwesomeIcon icon={faTrash} /> Remover
                                        </button>
                                    </div>
                                </div>

                                {/* <div class="avatar-options">
                                    <h3>Avatar pré-definidos</h3>
                                    <div class="preset-avatars">
                                        <div class="preset-avatar" data-avatar="avatar1">
                                            <img src="../src/img/avatar1.jpg" alt="Avatar 1" />
                                        </div>
                                        <div class="preset-avatar" data-avatar="avatar2">
                                            <img src="../src/img/avatar2.jpg" alt="Avatar 2" />
                                        </div>
                                        <div class="preset-avatar" data-avatar="avatar3">
                                            <img src="../src/img/avatar3.jpg" alt="Avatar 3" />
                                        </div>
                                        <div class="preset-avatar" data-avatar="avatar4">
                                            <img src="../src/img/avatar4.jpg" alt="Avatar 4" />
                                        </div>
                                        <div class="preset-avatar" data-avatar="avatar5">
                                            <img src="../src/img/avatar5.jpg" alt="Avatar 5" />
                                        </div>
                                        <div class="preset-avatar" data-avatar="avatar6">
                                            <img src="../src/img/avatar6.jpg" alt="Avatar 6" />
                                        </div>
                                    </div>
                                </div> */}
                            </div>

                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary">Cancelar</button>
                                <button type="submit" class="btn btn-primary">Aplicar avatar</button>
                            </div>
                        </form>
                    </section>

                    {/* <!-- Seção de Idioma e Região --> */}
                    {/* <section id="language-section" class="content-section">
                        <div class="section-header-settings">
                            <h2><FontAwesomeIcon icon={faGlobe} />Idioma & Região</h2>
                            <p>Personalize o idioma e formato regional</p>
                        </div>

                        <form id="language-form" class="settings-form">
                            <div class="form-grid">
                                <div class="form-group-settings">
                                    <label for="interface-language">Idioma da interface</label>
                                    <select id="interface-language" class="form-select">
                                        <option value="pt-BR" selected>Português (Brasil)</option>
                                        <option value="en-US">English (US)</option>
                                        <option value="es-ES">Español (España)</option>
                                        <option value="fr-FR">Français (France)</option>
                                        <option value="de-DE">Deutsch (Deutschland)</option>
                                    </select>
                                </div>

                                <div class="form-group-settings">
                                    <label for="content-language">Idioma preferido para conteúdo</label>
                                    <select id="content-language" class="form-select">
                                        <option value="pt-BR" selected>Português</option>
                                        <option value="en">English</option>
                                        <option value="original">Idioma original</option>
                                        <option value="multiple">Múltiplos idiomas</option>
                                    </select>
                                </div>

                                <div class="form-group-settings">
                                    <label for="subtitle-language">Idioma preferido para legendas</label>
                                    <select id="subtitle-language" class="form-select">
                                        <option value="pt-BR" selected>Português (Brasil)</option>
                                        <option value="en">English</option>
                                        <option value="none">Sem legendas</option>
                                        <option value="auto">Automático</option>
                                    </select>
                                </div>

                                <div class="form-group-settings">
                                    <label for="date-format">Formato de data</label>
                                    <select id="date-format" class="form-select">
                                        <option value="dd/MM/yyyy" selected>DD/MM/AAAA</option>
                                        <option value="MM/dd/yyyy">MM/DD/AAAA</option>
                                        <option value="yyyy-MM-dd">AAAA-MM-DD</option>
                                    </select>
                                </div>

                                <div class="form-group-settings">
                                    <label for="time-format">Formato de hora</label>
                                    <select id="time-format" class="form-select">
                                        <option value="24" selected>24 horas</option>
                                        <option value="12">12 horas (AM/PM)</option>
                                    </select>
                                </div>
                            </div>

                            <div class="form-actions">
                                <button type="reset" class="btn btn-secondary">Descartar alterações</button>
                                <button type="submit" class="btn btn-primary">Salvar alterações</button>
                            </div>
                        </form>
                    </section> */}

                    {/* <!-- Seção de Segurança --> */}
                    <section id="account-section" class="content-section" data-section="account">
                        <div class="section-header-settings">
                            <h2><FontAwesomeIcon icon={faKey} /> Segurança da Conta</h2>
                            <p>Gerencie a segurança e as sessões da sua conta</p>
                        </div>

                        <div class="account-sections">
                            {/* <!-- Alteração de senha --> */}
                            <div class="account-subsection">
                                <h3>Alterar senha</h3>

                                <form id="password-form" class="settings-form">
                                    <div class="form-group-settings">
                                        <label for="current-password">Senha atual *</label>
                                        <input type="password" id="current-password" class="form-input-settings" required />
                                    </div>

                                    <div class="form-group-settings">
                                        <label for="new-password">Nova senha *</label>
                                        <input type="password" id="new-password" class="form-input-settings" required minlength="8" />
                                        <div class="form-hint">Mínimo de 8 caracteres, com letras e números</div>
                                    </div>

                                    <div class="form-group-settings">
                                        <label for="confirm-password">Confirmar nova senha *</label>
                                        <input type="password" id="confirm-password" class="form-input-settings" required />
                                    </div>

                                    <div class="form-actions">
                                        <button type="submit" class="btn btn-primary">Alterar senha</button>
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
                                <h3>Zona de perigo</h3>

                                <div class="danger-actions">
                                    {/* <div class="danger-action">
                                        <div class="danger-info">
                                            <h4>Desativar conta</h4>
                                            <p>Sua conta será temporariamente desativada até o próximo login</p>
                                        </div>
                                        <button class="btn btn-danger" data-action="deactivate">Desativar conta</button>
                                    </div> */}

                                    <div class="danger-action">
                                        <div class="danger-info">
                                            <h4>Excluir conta permanentemente</h4>
                                            <p>Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.</p>
                                        </div>
                                        <button 
                                            class="btn btn-danger" 
                                            onClick={() => {
                                                console.log('🔴 Botão Excluir Conta clicado');
                                                setShowDeleteConfirm(true);
                                            }}
                                        >
                                            Excluir conta
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    {/* <!-- Seção de Privacidade --> */}
                    {/* <section id="privacy-section" class="content-section">
                        <div class="section-header-settings">
                            <h2><FontAwesomeIcon icon={faLock} /> Privacidade</h2>
                            <p>Controle quem pode ver suas informações e atividades</p>
                        </div>

                        <form class="settings-form">
                            <div class="privacy-category">
                                <h3>Visibilidade do perfil</h3>

                                <div class="form-group-settings">
                                    <label for="profile-visibility">Quem pode ver seu perfil</label>
                                    <select id="profile-visibility" class="form-select">
                                        <option value="public" selected>Público</option>
                                        <option value="followers">Apenas seguidores</option>
                                        <option value="private">Apenas eu</option>
                                    </select>
                                </div>

                                <div class="form-group-settings">
                                    <label for="activity-visibility">Quem pode ver sua atividade</label>
                                    <select id="activity-visibility" class="form-select">
                                        <option value="public" selected>Público</option>
                                        <option value="followers">Apenas seguidores</option>
                                        <option value="private">Apenas eu</option>
                                    </select>
                                </div>
                            </div>

                            <div class="privacy-category">
                                <h3>Controle de conteúdo</h3>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="show-watched" checked />
                                        <span class="checkmark"></span>
                                        Mostrar filmes e séries assistidos no perfil
                                    </label>
                                </div>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="show-ratings" checked />
                                        <span class="checkmark"></span>
                                        Mostrar avaliações no perfil
                                    </label>
                                </div>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="show-lists" checked />
                                        <span class="checkmark"></span>
                                        Mostrar listas no perfil
                                    </label>
                                </div>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="show-favorites" checked />
                                        <span class="checkmark"></span>
                                        Mostrar favoritos no perfil
                                    </label>
                                </div>
                            </div>

                            <div class="privacy-category">
                                <h3>Interações</h3>

                                <div class="form-group-settings">
                                    <label for="comment-permissions">Quem pode comentar</label>
                                    <select id="comment-permissions" class="form-select">
                                        <option value="anyone" selected>Qualquer pessoa</option>
                                        <option value="followers">Apenas seguidores</option>
                                        <option value="none">Ninguém</option>
                                    </select>
                                </div>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="filter-comments" checked />
                                        <span class="checkmark"></span>
                                        Filtrar comentários ofensivos
                                    </label>
                                </div>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="hide-activity" checked />
                                        <span class="checkmark"></span>
                                        Ocultar minha atividade de usuários bloqueados
                                    </label>
                                </div>
                            </div>

                            <div class="privacy-category">
                                <h3>Bloqueios</h3>
                                <div class="blocked-users">
                                    <h4>Usuários bloqueados (3)</h4>
                                    <div class="blocked-list">
                                        <div class="blocked-user">
                                            <img src="../src/img/user1.jpg" alt="Usuário bloqueado" class="blocked-avatar" />
                                            <div class="blocked-info">
                                                <span class="blocked-name">Usuário Indesejado</span>
                                                <span class="blocked-date">Bloqueado em 12/12/2023</span>
                                            </div>
                                            <button class="btn btn-secondary">Desbloquear</button>
                                        </div>
                                        <div class="blocked-user">
                                            <img src="../src/img/user2.jpg" alt="Usuário bloqueado" class="blocked-avatar" />
                                            <div class="blocked-info">
                                                <span class="blocked-name">Outro Usuário</span>
                                                <span class="blocked-date">Bloqueado em 05/11/2023</span>
                                            </div>
                                            <button class="btn btn-secondary">Desbloquear</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="form-actions">
                                <button type="reset" class="btn btn-secondary">Descartar alterações</button>
                                <button type="submit" class="btn btn-primary">Salvar alterações</button>
                            </div>
                        </form>
                    </section> */}

                    {/* <!-- Seção de Notificações --> */}
                    {/* <section id="notifications-section" class="content-section">
                        <div class="section-header-settings">
                            <h2><FontAwesomeIcon icon={faBell} /> Notificações</h2>
                            <p>Controle como e quando você recebe notificações</p>
                        </div>

                        <form class="settings-form">
                            <div class="notifications-category">
                                <h3>Email</h3>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="email-newsletter" checked />
                                        <span class="checkmark"></span>
                                        Receber newsletter com novidades
                                    </label>
                                </div>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="email-recommendations" checked />
                                        <span class="checkmark"></span>
                                        Receber recomendações personalizadas
                                    </label>
                                </div>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="email-activity" />
                                        <span class="checkmark"></span>
                                        Receber resumo de atividade semanal
                                    </label>
                                </div>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="email-promotions" checked />
                                        <span class="checkmark"></span>
                                        Receber promoções e ofertas especiais
                                    </label>
                                </div>
                            </div>

                            <div class="notifications-category">
                                <h3>Notificações na plataforma</h3>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="notif-likes" checked />
                                        <span class="checkmark"></span>
                                        Quando alguém curtir suas avaliações
                                    </label>
                                </div>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="notif-comments" checked />
                                        <span class="checkmark"></span>
                                        Quando alguém comentar em suas avaliações
                                    </label>
                                </div>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="notif-follows" checked />
                                        <span class="checkmark"></span>
                                        Quando alguém começar a te seguir
                                    </label>
                                </div>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="notif-mentions" checked />
                                        <span class="checkmark"></span>
                                        Quando alguém te mencionar
                                    </label>
                                </div>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="notif-replies" checked />
                                        <span class="checkmark"></span>
                                        Quando alguém responder seus comentários
                                    </label>
                                </div>
                            </div>

                            <div class="notifications-category">
                                <h3>Notificações por push</h3>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="push-releases" checked />
                                        <span class="checkmark"></span>
                                        Novos lançamentos de filmes/séries que acompanho
                                    </label>
                                </div>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="push-live" checked />
                                        <span class="checkmark"></span>
                                        Eventos ao vivo e estreias
                                    </label>
                                </div>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="push-updates" checked />
                                        <span class="checkmark"></span>
                                        Atualizações de séries em andamento
                                    </label>
                                </div>

                                <div class="form-group-settings">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="push-premiere" checked />
                                        <span class="checkmark"></span>
                                        Lembretes de estreias programadas
                                    </label>
                                </div>
                            </div>

                            <div class="notifications-category">
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
                            </div>

                            <div class="form-actions">
                                <button type="reset" class="btn btn-secondary">Descartar alterações</button>
                                <button type="submit" class="btn btn-primary">Salvar alterações</button>
                            </div>
                        </form>
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
            {console.log('📋 showDeleteConfirm:', showDeleteConfirm)}
            {showDeleteConfirm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    backdropFilter: 'blur(5px)'
                }} onClick={() => setShowDeleteConfirm(false)}>
                    <div style={{
                        backgroundColor: '#2b2a33',
                        borderRadius: '12px',
                        padding: '30px',
                        width: '90%',
                        maxWidth: '500px',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        position: 'relative'
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px',
                            paddingBottom: '15px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#fff' }}>Excluir Conta?</h2>
                            <button 
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'rgba(255, 255, 255, 0.8)',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer'
                                }}
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div style={{
                            marginBottom: '25px',
                            lineHeight: '1.6'
                        }}>
                            <p style={{ margin: '0 0 12px 0', color: 'rgba(255, 255, 255, 0.8)' }}><strong>Aviso:</strong> Esta ação não pode ser desfeita.</p>
                            <p style={{ margin: '0 0 12px 0', color: 'rgba(255, 255, 255, 0.8)' }}>Todos os seus dados, reviews, listas e informações da conta serão permanentemente deletados de nossos servidores.</p>
                            <p style={{ margin: '0 0 12px 0', color: 'rgba(255, 255, 255, 0.8)' }}>Tem certeza absoluta que deseja deletar sua conta?</p>
                        </div>
                        <div style={{
                            display: 'flex',
                            gap: '15px',
                            justifyContent: 'flex-end',
                            paddingTop: '20px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                            <button 
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '12px 20px',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    opacity: isLoading ? 0.5 : 1
                                }}
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isLoading}
                            >
                                Cancelar
                            </button>
                            <button 
                                style={{
                                    background: '#e74c3c',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '12px 20px',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    opacity: isLoading ? 0.5 : 1
                                }}
                                onClick={handleDeleteAccount}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Deletando...' : 'Deletar Conta'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </main>
        </>
    )
}


export default Configuracoes;