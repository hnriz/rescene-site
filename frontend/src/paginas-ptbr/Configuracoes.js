import { useEffect, useState } from 'react';
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
    const [tempLanguage, setTempLanguage] = useState(language);
    const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
    const [languageChanged, setLanguageChanged] = useState(false);
    const [activeSection, setActiveSection] = useState('profile');

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

        // Carregar scripts desativado - usando React state management em vez disso
        // Scripts legados causam erros de DOM não encontrado

        // Cleanup
        return () => {
            // Cleanup não necessário
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
        console.log('💾 handleSaveProfile acionado!');
        console.log('   languageChanged:', languageChanged);
        console.log('   tempLanguage:', tempLanguage);
        console.log('   language:', language);
        setIsLoading(true);
        setMessage('');

        try {
            const response = await api.put(
                '/user/profile',
                {
                    displayName: formData.displayName,
                    bio: formData.bio,
                    // Incluir idioma se foi alterado
                    ...(languageChanged && { preferredLanguage: tempLanguage })
                }
            );

            if (response.data.success) {
                // setMessage('✅ Perfil atualizado com sucesso!');
                updateUser({
                    displayName: formData.displayName,
                    bio: formData.bio,
                    ...(languageChanged && { preferredLanguage: tempLanguage })
                });

                // Se o idioma foi mudado, atualizar contexto e navegar
                if (languageChanged) {
                    console.log('🌐 Mudança de idioma detectada!');
                    console.log('   Idioma selecionado:', tempLanguage);
                    console.log('   Idioma atual da página: /configuracoes (PT-BR)');
                    
                    // Atualizar o contexto de idioma
                    setLanguage(tempLanguage);
                    setLanguageChanged(false);
                    setTempLanguage(tempLanguage);
                    
                    // Aguardar um pouco e depois fazer o reload com a nova rota
                    setTimeout(() => {
                        if (tempLanguage === 'pt-br') {
                            console.log('🔄 Redirecionando para /configuracoes');
                            window.location.href = '/configuracoes';
                        } else {
                            console.log('🔄 Redirecionando para /settings');
                            window.location.href = '/settings';
                        }
                    }, 500);
                } else {
                    setTimeout(() => setMessage(''), 3000);
                }
            }
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

    const handleLanguageChange = (newLang) => {
        console.log('🌐 Selecionando idioma temporário em Configuracoes.js para:', newLang);
        setTempLanguage(newLang);
        setLanguageChanged(true);
        setLanguageDropdownOpen(false);
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
                {/* Cabeçalho interno das configurações */}
                <div class="settings-header">
                    <h1><FontAwesomeIcon icon={faCog} /> Configurações</h1>
                    <p>Gerencie suas preferências e configurações da conta</p>
                </div>

                <div class="settings-layout">
                    {/* Navegação lateral */}
                    <aside class="settings-sidebar">
                        <nav class="settings-nav">
                            <div class="nav-category">
                                <h3>Conta</h3>
                                <button
                                    onClick={() => setActiveSection('profile')}
                                    class={`nav-item ${activeSection === 'profile' ? 'active' : ''}`}
                                >
                                    <FontAwesomeIcon icon={faUser} />
                                    <span>Perfil</span>
                                </button>
                                <button
                                    onClick={() => setActiveSection('avatar')}
                                    class={`nav-item ${activeSection === 'avatar' ? 'active' : ''}`}
                                >
                                    <FontAwesomeIcon icon={faImage} />
                                    <span>Avatar</span>
                                </button>
                                <button
                                    onClick={() => setActiveSection('account')}
                                    class={`nav-item ${activeSection === 'account' ? 'active' : ''}`}
                                >
                                    <FontAwesomeIcon icon={faKey} />
                                    <span>Segurança</span>
                                </button>
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

                    {/* Conteúdo principal */}
                    <div class="settings-content">
                        {/* Seção de Perfil */}
                        {activeSection === 'profile' && (
                            <section id="profile-section" class="content-section active" data-section="profile">
                                <div class="section-header-settings">
                                    <h2><FontAwesomeIcon icon={faUser} /> Perfil</h2>
                                    <p>Gerencie suas informações públicas</p>
                                </div>

                              

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
                                                        {tempLanguage === 'pt-br' ? 'Português (Brasil)' : 'English (US)'}
                                                        {languageChanged && <span style={{ marginLeft: '8px', color: '#ff9800' }}>*</span>}
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
                        )}

                        {/* Seção de Avatar */}
                        {activeSection === 'avatar' && (
                            <section id="avatar-section" class="content-section active" data-section="avatar">
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

                                       
                                    </div>

                                    <div class="form-actions">
                                        <button type="button" class="btn btn-secondary">Cancelar</button>
                                        <button type="submit" class="btn btn-primary">Aplicar avatar</button>
                                    </div>
                                </form>
                            </section>
                        )}

                        {/* Seção de Segurança */}
                        {activeSection === 'account' && (
                            <section id="account-section" class="content-section active" data-section="account">
                                <div class="section-header-settings">
                                    <h2><FontAwesomeIcon icon={faKey} /> Segurança da Conta</h2>
                                    <p>Gerencie a segurança e as sessões da sua conta</p>
                                </div>

                                <div class="account-sections">
                                    {/* Alteração de senha */}
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

                                    {/* Autenticação de dois fatores */}
                                    {/* <div class="account-subsection">
                                <h3>Autenticação de dois fatores</h3>

                                <div class="two-factor-status">
                                    <div class="status-indicator inactive"></div>
                                    <span>Autenticação de dois fatores desativada</span>
                                </div>

                                <p>Adicione uma camada extra de segurança à sua conta ativando a autenticação de dois fatores.</p>

                                <button class="btn btn-secondary" id="enable-2fa">Ativar autenticação de dois fatores</button>
                            </div> */}

                                    {/* Sessões ativas */}
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

                                    {/* Zona de perigo */}
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
                        )}
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
