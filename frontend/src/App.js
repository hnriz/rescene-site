import Home from "./pages-en/Home";
import HeaderEN from "./components-en/HeaderEN.js";
import FooterEN from "./components-en/FooterEN.js";
import Profile from "./pages-en/Profile";
import Privacy from "./pages-en/Privacy";
import About from "./pages-en/About";
import Terms from "./pages-en/Terms";
import Contact from "./pages-en/Contact";
import Search from "./pages-en/Search";
import Movies from "./pages-en/Movies";
import TVShows from "./pages-en/TVShows.js";
import List from "./pages-en/List";
import ListEdit from "./pages-en/ListEdit";
import Info from "./pages-en/Info";
import Settings from "./pages-en/Settings";
import LoginEN from "./pages-en/LoginEN";
import RankMovies from "./pages-en/ranks/Movies.js";
import RankTVShows from "./pages-en/ranks/TVShows.js"
// import RankUsers from "./pages-en/ranks/Users.js"
// import RankComments from "./pages-en/ranks/Comments.js"

import HomePTBR from "./paginas-ptbr/HomePTBR";
import HeaderPTBR from "./componentes-ptbr/HeaderPTBR";
import FooterPTBR from "./componentes-ptbr/FooterPTBR";
import Perfil from "./paginas-ptbr/Perfil";
import Privacidade from "./paginas-ptbr/Privacidade";
import SobreNos from "./paginas-ptbr/SobreNos";
import Termos from "./paginas-ptbr/Termos";
import Contate from "./paginas-ptbr/Contate";
import Pesquisa from "./paginas-ptbr/Pesquisa";
import Filmes from "./paginas-ptbr/CatalogoFilmes";
import SeriesPTBR from "./paginas-ptbr/CatalogoSeries";
import Lista from "./paginas-ptbr/Lista";
import ListaEditar from "./paginas-ptbr/ListaEditar";
import InfoPTBR from "./paginas-ptbr/InfoPTBR";
import Configuracoes from "./paginas-ptbr/Configuracoes";
import LoginPTBR from "./paginas-ptbr/LoginPTBR";
import RankFilmes from "./paginas-ptbr/ranks/Filmes.js";
import RankSeries from "./paginas-ptbr/ranks/Series.js"
// import RankUsuarios from "./paginas-ptbr/ranks/Usuarios.js"
// import RankComentarios from "./paginas-ptbr/ranks/Comentarios.js"
import ErrorPage from "./pages-en/ErrorPage";
import PaginaErro from "./paginas-ptbr/PaginaErro";
import ErrorBoundary from "./components/ErrorBoundary";

import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { ProtectedEnRoute, ProtectedPTBRRoute } from "./hooks/useLanguageRedirect";
import useScrollToTop from "./hooks/useScrollToTop";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import './css/reset.css';
import './css/index.css';
import './css/header.css';
import './css/footer.css';
import './css/profile.css';
import './css/body.css';
import './css/about.css';
import './css/terms.css'
import './css/search.css'
import './css/movies.css'
import './css/series.css'
import './css/list.css'
import './css/listEdit.css'
import './css/info.css';
import './css/settings.css';
import './css/rank.css';
import './css/rankMovies.css';
import './css/rankSeries.css';
import './css/rankUsers.css';
import './css/rankComments.css';
import './css/settingsAvatar.css';
import './css/settingsLanguage.css';
import './css/settingsNotifications.css';
import './css/settingsPrivacy.css';
import './css/settingsSecurity.css';
import './css/login-hub-rescene.css';
import './css/errorPage.css';
import './css/contact.css';
import './css/responsivos.css'

// Componente que renderiza header/footer e conteúdo
function AppContent() {
  useScrollToTop();
  const location = useLocation();
  console.log('🔍 Current pathname:', location.pathname);
  
  const isPTBR = location.pathname.includes('/PTBR/') || location.pathname.startsWith('/perfil') || 
                  location.pathname.startsWith('/usuario') || location.pathname.startsWith('/privacidade') || 
                  location.pathname.startsWith('/sobre-nos') || location.pathname.startsWith('/termos') || 
                  location.pathname.startsWith('/contate') || location.pathname.startsWith('/pesquisa') || 
                  location.pathname.startsWith('/filmes') || location.pathname.startsWith('/series') || 
                  location.pathname.startsWith('/lista') || location.pathname.startsWith('/editar-lista') || 
                  location.pathname.startsWith('/info-ptbr') || location.pathname.startsWith('/top-') || 
                  location.pathname.startsWith('/configuracoes') || location.pathname.startsWith('/login-ptbr') || 
                  location.pathname.startsWith('/erro');
  
  console.log('🌐 isPTBR:', isPTBR);
  console.log('📦 Rendering header:', isPTBR ? 'HeaderPTBR' : 'HeaderEN');
  
  return (
    <>
      <ErrorBoundary>
        {isPTBR ? <HeaderPTBR /> : <HeaderEN />}
        <Routes>
          <Route path="/" element={<ProtectedEnRoute element={<Home />} />} />
          <Route path="/profile" element={<ProtectedEnRoute element={<Profile />} />} />
          <Route path="/user/:username" element={<ProtectedEnRoute element={<Profile />} />} />
          <Route path="/:username/profile" element={<ProtectedEnRoute element={<Profile />} />} />
          <Route path="/privacy" element={<ProtectedEnRoute element={<Privacy />} />} />
          <Route path="/about" element={<ProtectedEnRoute element={<About />} />} />
          <Route path="/terms" element={<ProtectedEnRoute element={<Terms />} />} />
          <Route path="/contact" element={<ProtectedEnRoute element={<Contact />} />} />
          <Route path="/search" element={<ProtectedEnRoute element={<Search />} />} />
          <Route path="/movies" element={<ProtectedEnRoute element={<Movies />} />} />
          <Route path="/tvshows" element={<ProtectedEnRoute element={<TVShows />} />} />
          <Route path="/list" element={<ProtectedEnRoute element={<List />} />} />
          <Route path="/list/:listId" element={<ProtectedEnRoute element={<List />} />} />
          <Route path="/:username/list/:listId" element={<ProtectedEnRoute element={<List />} />} />
          <Route path="/listEdit" element={<ProtectedEnRoute element={<ListEdit />} />} />
          <Route path="/list-edit/:listId" element={<ProtectedEnRoute element={<ListEdit />} />} />
          <Route path="/:username/list-edit/:listId" element={<ProtectedEnRoute element={<ListEdit />} />} />
          <Route path="/rankMovies" element={<ProtectedEnRoute element={<RankMovies />} />} />
          <Route path="/rankTVShows" element={<ProtectedEnRoute element={<RankTVShows />} />} />
          {/* <Route path="/rankUsers" element={<ProtectedEnRoute element={<RankUsers />} />} />
          <Route path="/rankComments" element={<ProtectedEnRoute element={<RankComments />} />} /> */}
          <Route path="/settings" element={<ProtectedEnRoute element={<Settings />} />} />
          <Route path="/login-en" element={<LoginEN />} />

          <Route path="/info/:movieId" element={<ProtectedEnRoute element={<Info />} />} />
          <Route path="/info/:type/:movieId" element={<ProtectedEnRoute element={<Info />} />} />

          <Route path="/PTBR/" element={<ProtectedPTBRRoute element={<HomePTBR />} />} />
          <Route path="/perfil" element={<ProtectedPTBRRoute element={<Perfil />} />} />
          <Route path="/usuario/:username" element={<ProtectedPTBRRoute element={<Perfil />} />} />
          <Route path="/:username/perfil" element={<ProtectedPTBRRoute element={<Perfil />} />} />
          <Route path="/privacidade" element={<ProtectedPTBRRoute element={<Privacidade />} />} />
          <Route path="/sobre-nos" element={<ProtectedPTBRRoute element={<SobreNos />} />} />
          <Route path="/termos" element={<ProtectedPTBRRoute element={<Termos />} />} />
          <Route path="/contate" element={<ProtectedPTBRRoute element={<Contate />} />} />
          <Route path="/pesquisa" element={<ProtectedPTBRRoute element={<Pesquisa />} />} />
          <Route path="/filmes" element={<ProtectedPTBRRoute element={<Filmes />} />} />
          <Route path="/series" element={<ProtectedPTBRRoute element={<SeriesPTBR />} />} />
          <Route path="/lista" element={<ProtectedPTBRRoute element={<Lista />} />} />
          <Route path="/lista/:listId" element={<ProtectedPTBRRoute element={<Lista />} />} />
          <Route path="/:username/lista/:listId" element={<ProtectedPTBRRoute element={<Lista />} />} />
          <Route path="/editar-lista" element={<ProtectedPTBRRoute element={<ListaEditar />} />} />
          <Route path="/lista-editar/:listId" element={<ProtectedPTBRRoute element={<ListaEditar />} />} />
          <Route path="/:username/lista-editar/:listId" element={<ProtectedPTBRRoute element={<ListaEditar />} />} />
          <Route path="/info-ptbr/:movieId" element={<ProtectedPTBRRoute element={<InfoPTBR />} />} />
          <Route path="/info-ptbr/:type/:movieId" element={<ProtectedPTBRRoute element={<InfoPTBR />} />} />
          <Route path="/top-filmes" element={<ProtectedPTBRRoute element={<RankFilmes />} />} />
          <Route path="/top-series" element={<ProtectedPTBRRoute element={<RankSeries />} />} />
          {/* <Route path="/top-usuarios" element={<ProtectedPTBRRoute element={<RankUsuarios />} />} />
          <Route path="/top-comentarios" element={<ProtectedPTBRRoute element={<RankComentarios />} />} /> */}
          <Route path="/configuracoes" element={<ProtectedPTBRRoute element={<Configuracoes />} />} />
          <Route path="/login-ptbr" element={<LoginPTBR />} />

          {/* Error Pages */}
          <Route path="/error" element={<ErrorPage />} />
          <Route path="/erro" element={<PaginaErro />} />

          {/* Catch-all route */}
          <Route path="*" element={<ErrorPage />} />
        </Routes>
      </ErrorBoundary>
      {isPTBR ? <FooterPTBR /> : <FooterEN />}
    </>
  );
}

function App() {
  console.log('✅ App component rendering');
  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter>
          <AppContent />
          <ToastContainer
            position="bottom-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;

