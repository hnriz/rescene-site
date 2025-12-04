import { useState, useEffect } from "react";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFilm,
    faTv,
    faStar,
    faUsers,
    faFilter,
    faUserGroup,
    faComment,
    faBolt,
    faTrophy,
    faPlus
} from '@fortawesome/free-solid-svg-icons';

function RankFilmes() {
    useEffect(() => {
        const scripts = [
            '/js/ranks.js',
            '/js/rankMovies.js'
        ];

        const scriptElements = scripts.map(src => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            document.body.appendChild(script);
            return script;
        });

        // Cleanup
        return () => {
            scriptElements.forEach(script => {
                document.body.removeChild(script);
            });
        };
    }, []);


    return (
        <main className="rankingPage rank-films">
            {/* <!-- Cabeçalho inspirado no profile --> */}
            <section className="rankingHeader">
                <div className="rankingBackground"></div>

                <div className="rankingContent containerRanks">
                    <div className="rankingMainInfo">
                        <div className="rankingIconcontainerRanks">
                            <div className="rankingIcon">
                                <FontAwesomeIcon icon={faTrophy} />
                            </div>
                        </div>

                        <div className="rankingDetails">
                            <h1 className="rankingDisplayName">Top 100 Filmes</h1>

                            <span className="rankingSubtitle">Os filmes mais bem avaliados pela comunidade Rescene</span>

                            
                        </div>
                    </div>
                </div>
            </section>


        <div className="rankingContainer">

            {/* <!-- Navegação entre rankings --> */}
            <nav className="rankingNav container">
                <a href="/top-filmes" className="navItem active">
                    <FontAwesomeIcon icon={faFilm} />
                    <span>Top Filmes</span>
                </a>
                <a href="/top-series" className="navItem ">
                    <FontAwesomeIcon icon={faTv} />
                    <span>Top Séries</span>
                </a>
                {/* <a href="/top-usuarios" className="navItem">
                    <FontAwesomeIcon icon={faUserGroup} />
                    <span>Top Usuários</span>
                </a>
                <a href="/top-comentarios" className="navItem">
                    <FontAwesomeIcon icon={faComment} />
                    <span>Top Comentários</span>
                </a> */}
            </nav>

            {/* <!-- Conteúdo principal do ranking --> */}
            <section className="rankingcontainerRanks containerRanks">
                <div className="ranking-table-container">
                    <table className="ranking-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Filme</th>
                                <th>Nota</th>
                            </tr>
                        </thead>
                        <tbody id="ranking-body">
                            {/* Itens serão inseridos via JavaScript */}
                        </tbody>
                    </table>
                </div>

                <div className="loadMorecontainerRanks">
                    <button className="loadMoreButton" id="see-more-btn">
                        <FontAwesomeIcon icon={faPlus} /> Carregar mais
                    </button>
                </div>

                {/* Botão Ver Menos (oculto inicialmente) */}
                <div className="loadMorecontainerRanks" style={{ display: 'none' }} id="see-less-container">
                    <button className="loadMoreButton" id="see-less-btn">
                        Ver Menos
                    </button>
                </div>
            </section>

            </div>
        </main>
    )
}

export default RankFilmes;