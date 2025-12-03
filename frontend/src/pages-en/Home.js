import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faFilm,
    faTv,
    faChartLine,
    faHeart,
    faChevronLeft,
    faChevronRight,
    faMagic,
    faClapperboard,
    faTheaterMasks,
    faStar,
    faStarHalf,
    faExplosion,
    faFaceGrinSquintTears,
    faComment,
    faGhost,
    faRocket,
    faTrophy,
    faFire,
    faGift,
    faComments,
    faTags
} from "@fortawesome/free-solid-svg-icons";
import tmdbService from "../services/tmdbService";
import communityReviewService from "../services/communityReviewService";
import Avatar from "../components-en/Avatar";

// Featured movies and series for homepage
const FEATURED_MOVIES = [
    { id: 550, type: "movie" },      // Fight Club
    { id: 278, type: "movie" },      // The Shawshank Redemption
    { id: 238, type: "movie" },      // The Godfather
    { id: 240, type: "movie" },      // The Godfather Part II
    { id: 680, type: "movie" },      // Pulp Fiction
    { id: 109, type: "movie" },      // Interstellar
    { id: 603, type: "movie" },      // The Matrix
    { id: 500, type: "movie" },      // Reservoir Dogs 
];

const FEATURED_MOVIES_EXTENDED = [
    { id: 550, type: "movie" },      // Fight Club
    { id: 1399, type: "tv" },        // Breaking Bad
    { id: 278, type: "movie" },      // The Shawshank Redemption
    { id: 1396, type: "tv" },        // The Office
    { id: 238, type: "movie" },      // The Godfather
    { id: 1438, type: "tv" },        // Game of Thrones
    { id: 240, type: "movie" },      // The Godfather Part II
    { id: 2739, type: "tv" },        // Sherlock
    { id: 680, type: "movie" },      // Pulp Fiction
    { id: 1668, type: "tv" },        // Friends
    { id: 109, type: "movie" },      // Interstellar
    { id: 1100, type: "tv" },        // The Sopranos
    { id: 603, type: "movie" },      // The Matrix
    { id: 2316, type: "tv" },        // The Crown
];

const FEATURED_SERIES = [
    { id: 1399, type: "tv" },        
    { id: 1396, type: "tv" },        
    { id: 1438, type: "tv" },        
    { id: 2739, type: "tv" },        
    { id: 1668, type: "tv" },        
    { id: 1100, type: "tv" },        
    { id: 2316, type: "tv" },        
    { id: 66732, type: "tv" }
];

// Function to render stars based on TMDB rating (0-10 scale)
const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating / 2); // Convert to 5-star scale
    const hasHalfStar = rating % 2 >= 1;

    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            stars.push(<FontAwesomeIcon key={i} icon={faStar} style={{ color: "#ffd700" }} />);
        } else if (i === fullStars && hasHalfStar) {
            stars.push(<FontAwesomeIcon key={i} icon={faStarHalf} style={{ color: "#ffd700" }} />);
        } else {
            stars.push(<FontAwesomeIcon key={i} icon={faStar} style={{ color: "#666" }} />);
        }
    }
    return stars;
};

function Home() {
    const navigate = useNavigate();
    const [movies, setMovies] = useState([]);
    const [popularItems, setPopularItems] = useState([]);
    const [series, setSeries] = useState([]);
    const [featuredMovies, setFeaturedMovies] = useState([]);
    const [loadingMovies, setLoadingMovies] = useState(true);
    const [loadingPopular, setLoadingPopular] = useState(true);
    const [loadingSeries, setLoadingSeries] = useState(true);
    const [loadingFeaturedMovies, setLoadingFeaturedMovies] = useState(true);
    const [topRatedMovie, setTopRatedMovie] = useState(null);
    const [hotTopicMovie, setHotTopicMovie] = useState(null);
    const [newMovie, setNewMovie] = useState(null);
    const [communityReviews, setCommunityReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(true);

    // Scroll to top on component mount with delay to override other scroll operations
    useEffect(() => {
        const scrollTimer = setTimeout(() => {
            window.scrollTo(0, 0);
        }, 100);
        return () => clearTimeout(scrollTimer);
    }, []);

    // Load featured movies
    useEffect(() => {
        const loadMovies = async () => {
            try {
                setLoadingMovies(true);
                const moviesData = await Promise.all(
                    FEATURED_MOVIES.map(item =>
                        tmdbService.getMovieDetails(item.id, "en-US")
                    )
                );
                const formatted = moviesData.map(movie =>
                    tmdbService.formatTMDBItem(movie, "movie")
                );

                // Use only the first 6 movies in the carousel
                setMovies(formatted.slice(0, 6));

                // Set floating posters based on topics
                if (formatted.length >= 3) {
                    // Best rated - movie with highest rating
                    const bestRated = formatted.reduce((prev, current) =>
                        (prev.rating || 0) > (current.rating || 0) ? prev : current
                    );
                    setTopRatedMovie(bestRated);

                    // Hot topic - get trending movie
                    let hotMovie = formatted[3];
                    try {
                        const trendingMovies = await tmdbService.getTrendingMovies("en-US");
                        if (trendingMovies.length > 0) {
                            // Find trending movie not in carousel and not the best
                            const carouselIds = new Set(formatted.slice(0, 6).map(m => m.id));
                            let foundTrending = trendingMovies.find(m => !carouselIds.has(m.id) && m.id !== bestRated.id);
                            if (foundTrending) {
                                hotMovie = tmdbService.formatTMDBItem(foundTrending, "movie");
                            }
                        }
                    } catch (err) {
                        console.error("Error fetching trending:", err);
                    }
                    setHotTopicMovie(hotMovie);

                    // New - get recently released movie
                    let newMovieData = null;
                    try {
                        const recentMovies = await tmdbService.getRecentlyReleasedMovies("en-US");
                        if (recentMovies.length > 0) {
                            // Find recent movie not in carousel, not best rated, not hot topic
                            const carouselIds = new Set(formatted.slice(0, 6).map(m => m.id));
                            let foundRecent = recentMovies.find(m =>
                                !carouselIds.has(m.id) && m.id !== bestRated.id && m.id !== hotMovie.id
                            );
                            if (foundRecent) {
                                newMovieData = tmdbService.formatTMDBItem(foundRecent, "movie");
                            }
                        }
                    } catch (err) {
                        console.error("Error fetching recent movies:", err);
                    }

                    // Fallback
                    if (!newMovieData) {
                        const carouselIds = new Set(formatted.slice(0, 6).map(m => m.id));
                        newMovieData = formatted.find(f => !carouselIds.has(f.id) && f.id !== bestRated.id && f.id !== hotMovie.id);
                    }
                    setNewMovie(newMovieData);
                }
            } catch (err) {
                console.error("Error loading movies:", err);
            } finally {
                setLoadingMovies(false);
            }
        };
        loadMovies();
    }, []);

    // Load featured series
    useEffect(() => {
        const loadSeries = async () => {
            try {
                setLoadingSeries(true);
                const seriesData = await Promise.all(
                    FEATURED_SERIES.map(item =>
                        tmdbService.getTVShowDetails(item.id, "en-US")
                    )
                );
                const formatted = seriesData.map(show =>
                    tmdbService.formatTMDBItem(show, "tv")
                );
                setSeries(formatted);
            } catch (err) {
                console.error("Error loading series:", err);
            } finally {
                setLoadingSeries(false);
            }
        };
        loadSeries();
    }, []);

    // Load featured movies (for Featured Movies section)
    useEffect(() => {
        const loadFeaturedMovies = async () => {
            try {
                setLoadingFeaturedMovies(true);
                const moviesData = await Promise.all(
                    FEATURED_MOVIES.map(item =>
                        tmdbService.getMovieDetails(item.id, "en-US")
                    )
                );
                const formatted = moviesData.map(movie =>
                    tmdbService.formatTMDBItem(movie, "movie")
                );
                setFeaturedMovies(formatted);
            } catch (err) {
                console.error("Error loading featured movies:", err);
            } finally {
                setLoadingFeaturedMovies(false);
            }
        };
        loadFeaturedMovies();
    }, []);

    // Load popular items (mix of movies and series for the carousel)
    useEffect(() => {
        const loadPopularItems = async () => {
            try {
                setLoadingPopular(true);
                
                // Get IDs from featured sections to exclude them
                const featuredMovieIds = new Set(FEATURED_MOVIES.map(m => m.id));
                const featuredSeriesIds = new Set(FEATURED_SERIES.map(s => s.id));
                
                // Fetch popular movies and TV shows from TMDB
                const [popularMovies, popularSeries] = await Promise.all([
                    tmdbService.getPopularMovies(1, "en-US"),
                    tmdbService.getPopularTVShows(1, "en-US")
                ]);
                
                console.log("Popular Movies:", popularMovies);
                console.log("Popular Series:", popularSeries);
                console.log("Featured Movie IDs:", Array.from(featuredMovieIds));
                console.log("Featured Series IDs:", Array.from(featuredSeriesIds));
                
                // Filter out items that are already in featured sections
                const filteredMovies = popularMovies.filter(m => !featuredMovieIds.has(m.id));
                const filteredSeries = popularSeries.filter(s => !featuredSeriesIds.has(s.id));
                
                console.log("Filtered Movies:", filteredMovies);
                console.log("Filtered Series:", filteredSeries);
                
                // Interleave movies and series (alternating)
                const mixed = [];
                const maxLength = Math.max(filteredMovies.length, filteredSeries.length);
                
                for (let i = 0; i < maxLength; i++) {
                    if (i < filteredMovies.length) {
                        mixed.push({
                            ...filteredMovies[i],
                            type: "movie"
                        });
                    }
                    if (i < filteredSeries.length) {
                        mixed.push({
                            ...filteredSeries[i],
                            type: "tv"
                        });
                    }
                }
                
                // Format and limit to reasonable number (14 items for the carousel)
                const formatted = mixed.slice(0, 14).map(item =>
                    tmdbService.formatTMDBItem(item, item.type)
                );
                
                console.log("Final Popular Items:", formatted);
                setPopularItems(formatted);
            } catch (err) {
                console.error("Error loading popular items:", err);
                // Fallback to featured movies extended if API fails
                try {
                    const moviesData = await Promise.all(
                        FEATURED_MOVIES_EXTENDED.map(item => {
                            if (item.type === "movie") {
                                return tmdbService.getMovieDetails(item.id, "en-US");
                            } else {
                                return tmdbService.getTVShowDetails(item.id, "en-US");
                            }
                        })
                    );
                    const formatted = moviesData.map((item, index) => {
                        const itemType = FEATURED_MOVIES_EXTENDED[index].type;
                        return tmdbService.formatTMDBItem(item, itemType);
                    });
                    setPopularItems(formatted);
                } catch (fallbackErr) {
                    console.error("Error loading fallback items:", fallbackErr);
                }
            } finally {
                setLoadingPopular(false);
            }
        };
        loadPopularItems();
    }, []);

    // Initialize carousel after render
    useEffect(() => {
        if (!loadingPopular && popularItems.length > 0) {
            initializeCarousel();
        }
    }, [loadingPopular, popularItems]);

    // Function to initialize carousel
    const initializeCarousel = () => {
        setTimeout(() => {
            const carousel = document.getElementById("popular-carousel");
            const prevBtn = document.getElementById("carousel-prev");
            const nextBtn = document.getElementById("carousel-next");
            const dotsContainer = document.getElementById("carousel-dots");

            if (!carousel) return;

            const CAROUSEL_ITEMS_PER_PAGE = 4;
            let currentPage = 0;

            // Create dots
            const totalItems = carousel.children.length;
            const maxPage = Math.ceil(totalItems / CAROUSEL_ITEMS_PER_PAGE) - 1;

            if (dotsContainer) {
                dotsContainer.innerHTML = "";
                for (let i = 0; i <= maxPage; i++) {
                    const dot = document.createElement("div");
                    dot.className = `carousel-dot ${i === 0 ? "active" : ""}`;
                    dot.onclick = () => {
                        currentPage = i;
                        updateCarousel(currentPage);
                        updateDots();
                    };
                    dotsContainer.appendChild(dot);
                }
            }

            const updateDots = () => {
                const dots = document.querySelectorAll(".carousel-dot");
                dots.forEach((dot, index) => {
                    dot.classList.toggle("active", index === currentPage);
                });
            };

            const updateCarousel = (page) => {
                const itemWidth = carousel.querySelector(".carousel-item")?.offsetWidth || 280;
                carousel.scrollLeft = page * itemWidth * CAROUSEL_ITEMS_PER_PAGE;
                updateDots();
                updateButtonVisibility();
            };

            const updateButtonVisibility = () => {
                if (prevBtn) {
                    prevBtn.style.visibility = currentPage === 0 ? "hidden" : "visible";
                }
                if (nextBtn) {
                    nextBtn.style.visibility = currentPage === maxPage ? "hidden" : "visible";
                }
            };

            if (prevBtn) {
                prevBtn.onclick = (e) => {
                    e.preventDefault();
                    currentPage = Math.max(0, currentPage - 1);
                    updateCarousel(currentPage);
                };
            }

            if (nextBtn) {
                nextBtn.onclick = (e) => {
                    e.preventDefault();
                    currentPage = Math.min(maxPage, currentPage + 1);
                    updateCarousel(currentPage);
                };
            }

            updateButtonVisibility();
        }, 100);
    };

    // Load community reviews
    useEffect(() => {
        const loadReviews = async () => {
            try {
                setLoadingReviews(true);
                // TODO: Fix community-reviews endpoint 500 error
                // const reviews = await communityReviewService.getCommunityReviews(4);
                // setCommunityReviews(reviews);
                setCommunityReviews([]);
            } catch (err) {
                console.error("Error loading community reviews:", err);
            } finally {
                setLoadingReviews(false);
            }
        };
        loadReviews();
    }, []);

    // Helper function to render stars based on user rating
    const renderUserStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating || 0);
        const hasHalf = (rating || 0) % 1 !== 0;
        for (let i = 0; i < fullStars; i++) {
            stars.push(<FontAwesomeIcon key={`full-${i}`} icon={faStar} />);
        }
        if (hasHalf) {
            stars.push(<FontAwesomeIcon key="half" icon={faStarHalf} />);
        }
        return stars;
    };

    // Helper function to format time ago
    const getTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000); // Difference in seconds

        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };

        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(diff / secondsInUnit);
            if (interval >= 1) {
                return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
            }
        }

        return 'just now';
    };

    return (
        <main className="home-page">
            <section className="hero-section">
                <div className="hero-background">
                    <div className="hero-overlay"></div>
                </div>
                <div className="container-header">
                    <div className="hero-content">
                        <div className="hero-text">
                            <h1 style={{ lineHeight: "75px" }}>Welcome to Rescene</h1>
                            <p>
                                Your home to discover, rate and share your cinematic experiences.
                                Connect with other cinema lovers and expand your cinematic universe.
                            </p>
                            <div className="hero-cta-index">
                                <button
                                    className="cta-btn primary"
                                    onClick={() => navigate("/movies")}
                                >
                                    <FontAwesomeIcon icon={faFilm} />
                                    Explore Movies
                                </button>
                                <button
                                    className="cta-btn secondary"
                                    onClick={() => navigate("/series")}
                                >
                                    <FontAwesomeIcon icon={faTv} />
                                    Discover Series
                                </button>
                            </div>
                        </div>

                        <div className="hero-visual">
                            <div className="floating-elements">
                                <div 
                                    className="floating-element element-1" 
                                    id="top-rated-poster"
                                    onClick={() => {
                                        if (topRatedMovie) {
                                            navigate(`/info/movie/${topRatedMovie.id}`);
                                        }
                                    }}
                                    style={{ cursor: topRatedMovie ? "pointer" : "default" }}
                                >
                                    {topRatedMovie ? (
                                        <>
                                            <img src={topRatedMovie.poster} alt={topRatedMovie.title} />
                                            <div className="floating-badge">
                                                <FontAwesomeIcon icon={faTrophy} /> {(topRatedMovie.rating / 2).toFixed(1)}
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>Loading...</div>
                                    )}
                                </div>
                                <div 
                                    className="floating-element element-2" 
                                    id="hot-topic-poster"
                                    onClick={() => {
                                        if (hotTopicMovie) {
                                            navigate(`/info/movie/${hotTopicMovie.id}`);
                                        }
                                    }}
                                    style={{ cursor: hotTopicMovie ? "pointer" : "default" }}
                                >
                                    {hotTopicMovie ? (
                                        <>
                                            <img src={hotTopicMovie.poster} alt={hotTopicMovie.title} />
                                            <div className="floating-badge">
                                                <FontAwesomeIcon icon={faFire} /> Trending
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>Loading...</div>
                                    )}
                                </div>
                                <div 
                                    className="floating-element element-3" 
                                    id="new-poster"
                                    onClick={() => {
                                        if (newMovie) {
                                            navigate(`/info/movie/${newMovie.id}`);
                                        }
                                    }}
                                    style={{ cursor: newMovie ? "pointer" : "default" }}
                                >
                                    {newMovie ? (
                                        <>
                                            <img src={newMovie.poster} alt={newMovie.title} />
                                            <div className="floating-badge">
                                                <FontAwesomeIcon icon={faGift} /> New
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>Loading...</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Popular Movies Carousel */}
            <section className="carousel-section">
                <div className="container">
                    <div className="section-header-home">
                        <h2><FontAwesomeIcon icon={faFire}/> Popular on Rescene</h2>
                        <p>What the community is watching and rating</p>
                    </div>

                    <div className="carousel-container">
                        <button className="carousel-arrow prev" id="carousel-prev">
                            <FontAwesomeIcon icon={faChevronLeft} />
                        </button>

                        <div className="carousel" id="popular-carousel">
                            {loadingPopular ? (
                                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "#fff" }}>
                                    <p>Loading popular items...</p>
                                </div>
                            ) : (
                                popularItems.map(item => (
                                    <div key={item.id} className="carousel-item">
                                        <div
                                            className="movie-card"
                                            onClick={() => {
                                                const route = item.type === 'tv' ? 'tv' : 'movie';
                                                console.log(`${item.type === 'tv' ? '📺' : '🎬'} Navigating to ${route} ID:`, item.id, "Title:", item.title);
                                                navigate(`/info/${route}/${item.id}`);
                                            }}
                                        >
                                            <div className="movie-poster">
                                                <img src={item.poster} alt={item.title} />
                                                <div className="movie-rating-badge">
                                                    <FontAwesomeIcon icon={faStar} style={{fontSize: "13"}} /> {(item.rating / 2).toFixed(1)}
                                                    <FontAwesomeIcon icon={item.type === 'tv' ? faTv : faFilm} style={{fontSize: "13", marginLeft: "6px"}} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <button className="carousel-arrow next" id="carousel-next">
                            <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                    </div>

                    <div className="carousel-dots" id="carousel-dots"></div>
                </div>
            </section>

            {/* Mascot Call-to-Action */}
            {/* <section className="mascote-cta">
                <div className="mascote-content">
                    <div className="mascote-character">
                        <div className="star-mascot">
                            <div className="star-body"></div>
                            <div className="shine"></div>

                            <div className="star-face">
                                <div className="star-eyes">
                                    <div className="eye">
                                        <div className="pupil"></div>
                                        <div className="eye-shine"></div>
                                    </div>
                                    <div className="eye">
                                        <div className="pupil"></div>
                                        <div className="eye-shine"></div>
                                    </div>
                                </div>
                            </div>

                            <div className="director-bowtie"></div>

                            <div className="film-roll"></div>
                            <div className="film-strip"></div>

                            <div className="clapboard">
                                <div className="clapboard-top"></div>
                                <div className="clapboard-detail"></div>
                                <div className="clapboard-detail"></div>
                                <div className="clapboard-detail"></div>
                            </div>

                            <div className="camera">
                                <div className="camera-lens"></div>
                            </div>

                            <div className="movie-tape"></div>
                        </div>

                        <div className="mascote-decoration decoration-1"></div>
                        <div className="mascote-decoration decoration-2"></div>
                        <div className="mascote-decoration decoration-3"></div>

                        <div className="sparkle sparkle-1"></div>
                        <div className="sparkle sparkle-2"></div>
                        <div className="sparkle sparkle-3"></div>

                        <div className="speech-bubble">
                            <p>Hey! Ready to discover your next favorite movie? 🎬</p>
                            <div className="typing-indicator">
                                <div className="typing-dot"></div>
                                <div className="typing-dot"></div>
                                <div className="typing-dot"></div>
                            </div>
                        </div>
                    </div>

                    <div className="mascote-info">
                        <h2>Cinema Star at your service!</h2>
                        <p>
                            Our star director is here to guide you through the best movie recommendations based on your tastes!
                        </p>

                        <div className="mascote-actions">
                            <button
                                className="mascote-btn primary"
                                onClick={() => navigate("/movies")}
                            >
                                <FontAwesomeIcon icon={faFilm} />
                                Explore Movies
                            </button>
                            <button
                                className="mascote-btn primary"
                                onClick={() => navigate("/tvshows")}
                            >
                                <FontAwesomeIcon icon={faFilm} />
                                Explore TV Shows
                            </button>
                             <button className="mascote-btn secondary" id="personalized-recommendations">
                                <FontAwesomeIcon icon={faMagic} />
                                Personalized Recommendations
                            </button> 
                        </div>

                         <div className="mascote-features">
                            <div className="feature">
                                <div className="feature-icon">
                                    <FontAwesomeIcon icon={faStar} />
                                </div>
                                <span className="feature-text">Walk of Fame Star</span>
                            </div>
                            <div className="feature">
                                <div className="feature-icon">
                                    <FontAwesomeIcon icon={faClapperboard} />
                                </div>
                                <span className="feature-text">Cinema Director</span>
                            </div>
                            <div className="feature">
                                <div className="feature-icon">
                                    <FontAwesomeIcon icon={faTheaterMasks} />
                                </div>
                                <span className="feature-text">Genre Specialist</span>
                            </div>
                        </div> 
                    </div>
                </div>
            </section> */}

            {/* Featured TV Shows */}
            <section className="new-releases">
                <div className="container">
                    <div className="section-header-home">
                        <h2><FontAwesomeIcon icon={faTv}/> Featured TV Shows</h2>
                        <p>The best series to watch</p>
                    </div>

                    <div className="releases-grid">
                        {loadingSeries ? (
                            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "#fff" }}>
                                <p>Loading series...</p>
                            </div>
                        ) : (
                            series.map(show => (
                                <div key={show.id} className="release-card">
                                    <div
                                        className="release-poster"
                                        onClick={() => {
                                            console.log("📺 Navigating to series ID:", show.id, "Title:", show.title);
                                            navigate(`/info/tv/${show.id}`);
                                        }}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <img src={show.poster} alt={show.title} />
                                        <div className="movie-rating-badge"><FontAwesomeIcon icon={faStar} style={{fontSize: "13px"}} /> {(show.rating / 2).toFixed(1)}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="loadMoreContainer">
                        <button className="cta-btn outline" onClick={() => navigate("/tvshows")}>See more TV Shows</button>
                    </div>
                    
                </div>
            </section>

            {/* Featured Movies */}
            <section className="new-releases">
                <div className="container">
                    <div className="section-header-home">
                        <h2><FontAwesomeIcon icon={faFilm}/> Featured Movies</h2>
                        <p>The best movies to watch</p>
                    </div>

                    <div className="releases-grid">
                        {loadingFeaturedMovies ? (
                            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "#fff" }}>
                                <p>Loading movies...</p>
                            </div>
                        ) : (
                            featuredMovies.map(movie => (
                                <div key={movie.id} className="release-card">
                                    <div
                                        className="release-poster"
                                        onClick={() => {
                                            console.log("🎬 Navigating to movie ID:", movie.id, "Title:", movie.title);
                                            navigate(`/info/movie/${movie.id}`);
                                        }}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <img src={movie.poster} alt={movie.title} />
                                        <div className="movie-rating-badge"><FontAwesomeIcon icon={faStar} style={{fontSize: "13px"}} /> {(movie.rating / 2).toFixed(1)}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="loadMoreContainer">
                        <button className="cta-btn outline" onClick={() => navigate("/movies")}>See more Movies</button>
                    </div>
                    
                </div>
            </section>

            {/* Featured Reviews */}
            <section className="featured-reviews">
                <div className="container">
                    <div className="section-header-home">
                        <h2><FontAwesomeIcon icon={faComments}/> Community Reviews</h2>
                        <p>See what other movie lovers are saying</p>
                    </div>

                    <div className="reviews-grid">
                        {loadingReviews ? (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#fff' }}>
                                Loading reviews...
                            </div>
                        ) : communityReviews.length === 0 ? (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#fff' }}>
                                No reviews available at the moment.
                            </div>
                        ) : (
                            communityReviews.map((review) => (
                                <div 
                                    key={review.id} 
                                    className="review-card-index"
                                    onClick={() => navigate(`/info/movie/${review.media_id}`)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="review-header-index">
                                        <div className="reviewer">
                                            <Avatar 
                                                src={review.avatar} 
                                                alt={review.displayName} 
                                                className="reviewer-avatar" 
                                                size="medium"
                                            />
                                            <div className="reviewer-info">
                                                <h4>{review.displayName || review.username}</h4>
                                                <span>@{review.username}</span>
                                            </div>
                                        </div>
                                        <div className="review-rating">
                                            <div className="stars">
                                                {renderUserStars(review.rating)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="review-content">
                                        <h3>{review.movie_title || 'No title'}</h3>
                                        <p>
                                            {review.review_text}
                                        </p>
                                    </div>
                                    <div className="review-footer">
                                        <span className="review-date">{getTimeAgo(review.created_at)}</span>
                                        <div className="review-actions">
                                            <button className="like-btn">
                                                <FontAwesomeIcon icon={faHeart} />
                                                <span>{review.likes_count || 0}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* Promo Banner */}
            {/* <section className="promo-banner">
                <div className="container"></div>
            </section> */}

            {/* Popular Categories */}
            <section className="categories-section">
                <div className="container">
                    <div className="section-header-home">
                        <h2><FontAwesomeIcon icon={faTags}/> Explore by Category</h2>
                        <p>Discover movies and series by genre</p>
                    </div>

                    <div className="categories-grid">
                        <a href="/movies?genre=28" className="category-card">
                            <div className="category-icon">
                                <FontAwesomeIcon icon={faExplosion} />
                            </div>
                            <h3>Action</h3>
                            <p>1,245 titles</p>
                        </a>

                        <a href="/movies?genre=35" className="category-card">
                            <div className="category-icon">
                                <FontAwesomeIcon icon={faFaceGrinSquintTears} />
                            </div>
                            <h3>Comedy</h3>
                            <p>987 titles</p>
                        </a>

                        <a href="/movies?genre=18" className="category-card">
                            <div className="category-icon">
                                <FontAwesomeIcon icon={faTheaterMasks} />
                            </div>
                            <h3>Drama</h3>
                            <p>1,532 titles</p>
                        </a>

                        <a href="/movies?genre=878" className="category-card">
                            <div className="category-icon">
                                <FontAwesomeIcon icon={faRocket} />
                            </div>
                            <h3>Science Fiction</h3>
                            <p>654 titles</p>
                        </a>

                        <a href="/movies?genre=27" className="category-card">
                            <div className="category-icon">
                                <FontAwesomeIcon icon={faGhost} />
                            </div>
                            <h3>Horror</h3>
                            <p>432 titles</p>
                        </a>

                        <a href="/movies?genre=10749" className="category-card">
                            <div className="category-icon">
                                <FontAwesomeIcon icon={faHeart} />
                            </div>
                            <h3>Romance</h3>
                            <p>765 titles</p>
                        </a>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default Home;
