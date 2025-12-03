import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import createError from 'http-errors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import mysql2 from 'mysql2/promise';
import ms from 'ms';
import multer from 'multer';

const app = express();
const port = process.env.PORT || 3001;

// Configurar multer para upload em memória
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Apenas imagens são permitidas'), false);
        }
    }
});

// --- Middlewares ---
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3001',
      'http://localhost:3000',
      'https://rescene-site.vercel.app',
      'https://rescene-site-eq9lwbmlk-henris-projects-2a7fe5d7.vercel.app',
      /\.vercel\.app$/  // Allow any Vercel deployment
    ];
    
    if (!origin || allowedOrigins.some(allowed => 
      allowed instanceof RegExp ? allowed.test(origin) : allowed === origin
    )) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// --- Database ---
const conn = mysql2.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'rescene',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Função para inicializar o banco de dados com os campos necessários
const initializeDatabase = async () => {
    try {
        const connection = await conn.getConnection();
        
        // Adicionar coluna created_at se não existir
        await connection.execute(`
            ALTER TABLE user ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `).catch(() => {
            // Coluna já existe, ignorar erro
        });

        // Adicionar coluna bio se não existir
        await connection.execute(`
            ALTER TABLE user ADD COLUMN IF NOT EXISTS bio VARCHAR(250)
        `).catch(() => {
            // Coluna já existe, ignorar erro
        });
        
        connection.release();
        console.log('✅ Banco de dados inicializado com sucesso');
    } catch (err) {
        console.error('⚠️ Erro ao inicializar banco de dados:', err.message);
    }
};

// Inicializar banco de dados na inicialização do servidor
initializeDatabase();

// --- Função auxiliar para buscar usuário por ID ou username ---
const getUserByIdOrUsername = async (userIdentifier) => {
    let rows = [];
    
    if (!isNaN(userIdentifier) && userIdentifier.trim() !== '') {
        // É um número - buscar por ID
        const [result] = await conn.execute(
            'SELECT id, username, `display-name` as displayName, email, bio, avatar, language FROM user WHERE id = ?',
            [parseInt(userIdentifier)]
        );
        rows = result;
    } else {
        // É um texto (username) - buscar por username
        const [result] = await conn.execute(
            'SELECT id, username, `display-name` as displayName, email, bio, avatar, language FROM user WHERE username = ?',
            [userIdentifier]
        );
        rows = result;
    }
    
    return rows.length > 0 ? rows[0] : null;
};

// --- Middleware de autenticação ---
const auth = async (req, res, next) => {
    console.log('🔐 Auth middleware called');
    console.log('🔐 req.cookies:', req.cookies);
    console.log('🔐 Authorization header:', req.header('authorization') ? `${req.header('authorization').substring(0, 30)}...` : 'MISSING');
    
    const token = req.cookies.token || req.header('authorization')?.replace('Bearer ', '');
    console.log('🔐 Token found via:', req.cookies.token ? 'cookie' : (token ? 'header' : 'NOWHERE'));
    
    if (!token) {
        console.error('❌ No token provided');
        return next(createError(401, 'Nenhum token fornecido'));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        console.log('✅ Token verified successfully. User:', decoded.user);
        req.user = decoded.user;
        next();
    } catch (err) {
        console.error('❌ Token verification failed:', err.message);
        next(createError(401, 'Token inválido'));
    }
};

// --- Rota raiz ---
app.get('/', (req, res) => {
    res.json({ 
        message: 'Servidor Rescene funcionando!',
        version: '1.0.0',
        endpoints: {
            login: 'POST /api/login',
            register: 'POST /api/register',
            user: 'GET /api/user',
            logout: 'POST /api/logout'
        }
    });
});

// ==========================
// 🧩 ROTAS DE USUÁRIO
// ==========================

// Login do Usuário
app.post('/api/login', async (req, res, next) => {
    const { username, email, password } = req.body;

    try {
        // Aceita tanto username quanto email para fazer login
        const loginField = username || email;
        
        if (!loginField) {
            return res.status(400).json({ success: false, message: 'Username or email is required' });
        }

        if (!password) {
            return res.status(400).json({ success: false, message: 'Password is required' });
        }

        // Busca pelo username OU email (qualquer um que foi fornecido)
        const [rows] = await conn.execute(
            'SELECT * FROM user WHERE username = ? OR email = ?',
            [loginField, loginField]
        );

        if (rows.length === 0) {
            return res.status(400).json({ success: false, message: 'User or email not found' });
        }

        const row = rows[0];
        const match = await bcrypt.compare(password, row.password);
        if (!match) {
            return res.status(400).json({ success: false, message: 'Incorrect password' });
        }

        const payload = { user: { id: row.id, username: row.username, email: row.email } };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
            expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: ms(process.env.JWT_EXPIRES_IN || '24h'),
        });

        res.json({ 
            success: true, 
            message: 'Login successful', 
            token,
            user: {
                id: row.id,
                username: row.username,
                email: row.email,
                displayName: row['display-name'] || row.username,
                bio: row.bio || '',
                avatar: row.avatar ? `data:image/png;base64,${row.avatar.toString('base64')}` : null
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Registro de Usuário
app.post('/api/register', async (req, res, next) => {
    const { username, email, password, displayName } = req.body;

    try {
        if (!username || !email || !password) {
            return res.status(400).json({ success: false, message: 'Username, email and password are required' });
        }

        // Validação: username deve ter no mínimo 4 caracteres
        if (username.length < 4) {
            return res.status(400).json({ success: false, message: 'Username must have at least 4 characters' });
        }

        // Verificar se já existe username (case-insensitive)
        const [rows] = await conn.execute(
            'SELECT id FROM user WHERE LOWER(username) = ? OR email = ?',
            [username.toLowerCase(), email]
        );
        if (rows.length > 0) {
            // Check which field already exists
            const [usernameCheck] = await conn.execute(
                'SELECT id FROM user WHERE LOWER(username) = ?',
                [username.toLowerCase()]
            );
            const [emailCheck] = await conn.execute(
                'SELECT id FROM user WHERE email = ?',
                [email]
            );

            const errors = {};
            if (usernameCheck.length > 0) {
                errors.username = 'Username already in use';
            }
            if (emailCheck.length > 0) {
                errors.email = 'Email already in use';
            }

            return res.status(409).json({ success: false, errors });
        }

        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
        const senhaHash = await bcrypt.hash(password, saltRounds);

        const [result] = await conn.execute(
            'INSERT INTO user (username, `display-name`, email, password, language) VALUES (?, ?, ?, ?, ?)',
            [username, displayName || username, email, senhaHash, 'en-US']
        );

        const payload = { user: { id: result.insertId, username, email } };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
            expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: ms(process.env.JWT_EXPIRES_IN || '24h'),
        });

        res.status(201).json({ 
            success: true,
            message: 'Account created successfully', 
            token,
            user: {
                id: result.insertId,
                username,
                email,
                displayName: displayName || username,
                bio: '',
                avatar: null
            }
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Obter usuário autenticado
app.get('/api/user', auth, async (req, res, next) => {
    try {
        const [rows] = await conn.execute(
            'SELECT id, username, `display-name`, email, bio, avatar, language FROM user WHERE id = ?',
            [req.user.id]
        );

        if (rows.length === 0) throw createError(404, 'Usuário não encontrado');

        res.json(rows[0]);
    } catch (err) {
        next(err);
    }
});

// Obter perfil do usuário (alias para /api/user)
app.get('/api/user/profile', auth, async (req, res, next) => {
    try {
        const [rows] = await conn.execute(
            'SELECT id, username, `display-name` as displayName, email, bio, avatar, language FROM user WHERE id = ?',
            [req.user.id]
        );

        if (rows.length === 0) throw createError(404, 'Usuário não encontrado');

        const user = rows[0];
        
        // Converter avatar para base64 se existir
        if (user.avatar) {
            user.avatar = `data:image/png;base64,${user.avatar.toString('base64')}`;
        }

        res.json(user);
    } catch (err) {
        next(err);
    }
});

// Atualizar perfil do usuário
app.put('/api/user/profile', auth, async (req, res, next) => {
    const { displayName, bio, avatar, username } = req.body;

    try {
        // Validar entrada
        if (!displayName && !bio && !avatar && !username) {
            throw createError(400, 'Nenhum campo para atualizar foi fornecido');
        }

        // Se username foi fornecido, verificar se já existe
        if (username) {
            const [existing] = await conn.execute(
                'SELECT id FROM user WHERE username = ? AND id != ?',
                [username, req.user.id]
            );
            if (existing.length > 0) {
                throw createError(409, 'Username already in use');
            }
        }

        // Construir query dinâmico
        let updateQuery = 'UPDATE user SET ';
        const params = [];
        const fields = [];

        if (username) {
            fields.push('username = ?');
            params.push(username);
        }
        if (displayName) {
            fields.push('`display-name` = ?');
            params.push(displayName);
        }
        if (bio !== undefined) {
            fields.push('bio = ?');
            params.push(bio || null);
        }
        if (avatar !== undefined) {
            fields.push('avatar = ?');
            params.push(avatar || null);
        }

        updateQuery += fields.join(', ') + ' WHERE id = ?';
        params.push(req.user.id);

        await conn.execute(updateQuery, params);

        res.json({ 
            success: true,
            message: 'Profile updated successfully'
        });
    } catch (err) {
        next(err);
    }
});

// Rota para upload de avatar
app.post('/api/user/avatar', auth, async (req, res, next) => {
    const { avatar } = req.body;

    try {
        let avatarBuffer = null;

        // Se avatar foi enviado, converter base64 para Buffer
        if (avatar) {
            avatarBuffer = Buffer.from(avatar.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        }
        // Se avatar é null, será removido (set null)

        // Salvar no banco de dados
        await conn.execute(
            'UPDATE user SET avatar = ? WHERE id = ?',
            [avatarBuffer, req.user.id]
        );

        res.json({ 
            success: true,
            message: avatar ? 'Avatar uploaded successfully' : 'Avatar removed successfully',
            avatar: avatar
        });
    } catch (err) {
        next(err);
    }
});

// Rota para obter avatar do usuário (DEVE VIR ANTES de /api/user/:userId)
app.get('/api/user/avatar/:userId', async (req, res, next) => {
    try {
        const { userId } = req.params;
        
        const [rows] = await conn.execute(
            'SELECT avatar FROM user WHERE id = ?',
            [userId]
        );

        if (rows.length === 0 || !rows[0].avatar) {
            throw createError(404, 'Avatar not found');
        }

        // Converter Buffer para base64
        const base64Avatar = rows[0].avatar.toString('base64');
        
        res.json({
            success: true,
            avatar: `data:image/png;base64,${base64Avatar}`
        });
    } catch (err) {
        next(err);
    }
});

// Rota para deletar conta do usuário
app.delete('/api/user/delete', auth, async (req, res, next) => {
    try {
        const userId = req.user.id;
        
        console.log(`🗑️ Deletando usuário ID: ${userId}`);

        // Deletar em cascata: primeiro os dados relacionados
        try {
            // Deletar reviews do usuário
            await conn.execute('DELETE FROM review WHERE user_id = ?', [userId]);
            console.log('✅ Reviews deletadas');
            
            // Deletar listas do usuário
            await conn.execute('DELETE FROM `list` WHERE user_id = ?', [userId]);
            console.log('✅ Listas deletadas');
            
            // Deletar followers/following do usuário
            await conn.execute('DELETE FROM follower WHERE follower_id = ? OR following_id = ?', [userId, userId]);
            console.log('✅ Followers/Following deletados');
            
            // Deletar likes do usuário
            await conn.execute('DELETE FROM review_like WHERE user_id = ?', [userId]);
            console.log('✅ Likes deletados');
            
            // Deletar saved lists do usuário
            await conn.execute('DELETE FROM saved_list WHERE user_id = ?', [userId]);
            console.log('✅ Saved lists deletadas');
        } catch (cascadeErr) {
            console.warn('⚠️ Erro ao deletar dados relacionados:', cascadeErr.message);
        }

        // Deletar usuário do banco de dados
        const [result] = await conn.execute(
            'DELETE FROM user WHERE id = ?',
            [userId]
        );

        if (result.affectedRows === 0) {
            console.log('❌ Usuário não encontrado');
            throw createError(404, 'User not found');
        }

        console.log('✅ Usuário deletado com sucesso');
        res.json({ 
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (err) {
        console.error('❌ Erro ao deletar conta:', err.message);
        next(err);
    }
});

// Obter listas salvas do usuário
app.get('/api/user/saved-lists', auth, async (req, res, next) => {
    try {
        const userId = req.user.id;

        const [lists] = await conn.execute(
            `SELECT 
                l.id, 
                l.\`list-name\` as name, 
                l.\`description\`, 
                l.\`list-cover\`,
                l.\`user_id\` as userId, 
                l.\`createdAt\` as createdAt, 
                l.\`last-update\` as lastUpdate, 
                l.\`media-qtd\` as mediaCount,
                l.\`likes-count\` as likesCount,
                u.\`username\` as ownerName,
                u.\`username\` as ownerUsername,
                u.\`avatar\` as ownerAvatar
             FROM \`saved_list\` sl
             JOIN \`list\` l ON sl.list_id = l.id
             LEFT JOIN \`user\` u ON l.user_id = u.id
             WHERE sl.user_id = ?
             ORDER BY sl.created_at DESC`,
            [userId]
        );

        // Converter avatares e capas de BLOB para base64
        const formattedLists = lists.map(list => {
            if (list.ownerAvatar && Buffer.isBuffer(list.ownerAvatar)) {
                list.ownerAvatar = 'data:image/jpeg;base64,' + list.ownerAvatar.toString('base64');
            }
            if (list['list-cover'] && Buffer.isBuffer(list['list-cover'])) {
                list.listCover = 'data:image/jpeg;base64,' + list['list-cover'].toString('base64');
            } else {
                list.listCover = null;
            }
            return list;
        });

        res.json({ 
            success: true, 
            lists: formattedLists
        });
    } catch (err) {
        console.error('Get saved lists error:', err);
        next(err);
    }
});

// Logout
app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logout realizado com sucesso' });
});

// ==========================
// 🧩 ROTAS DE REVIEWS
// ==========================

// Salvar review
app.post('/api/reviews', auth, async (req, res, next) => {
    try {
        const { movieId, rating, text, mediaType, movieTitle, movieYear, moviePoster } = req.body;
        const userId = req.user.id;

        console.log('📝 Review data received:', { movieId, movieTitle, movieYear, moviePoster });

        // Validação
        if (!movieId || !rating || !text) {
            return res.status(400).json({ 
                success: false, 
                message: 'Campos obrigatórios: movieId, rating, text' 
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ 
                success: false, 
                message: 'Rating deve estar entre 1 e 5' 
            });
        }

        if (text.trim().length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Review não pode estar vazia' 
            });
        }

        // Inserir review com informações do filme
        const [result] = await conn.execute(
            'INSERT INTO review (user_id, media_id, rating, text, movie_title, movie_year, movie_poster, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
            [userId, movieId, rating, text, movieTitle || null, movieYear || null, moviePoster || null]
        );

        // Buscar a review criada com dados do usuário
        const [reviews] = await conn.execute(
            `SELECT r.*, u.username, u.\`display-name\` as displayName, u.avatar 
             FROM review r 
             JOIN user u ON r.user_id = u.id 
             WHERE r.id = ?`,
            [result.insertId]
        );

        const review = reviews[0];
        
        // Converter avatar para base64 se existir
        if (review.avatar) {
            review.avatar = `data:image/png;base64,${review.avatar.toString('base64')}`;
        }

        res.status(201).json({ 
            success: true, 
            message: 'Review salva com sucesso',
            review
        });
    } catch (err) {
        console.error('Review error:', err);
        next(err);
    }
});

// Deletar uma review
app.delete('/api/reviews/:reviewId', auth, async (req, res, next) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user.id;

        // Verificar se a review existe e pertence ao usuário
        const [review] = await conn.execute(
            'SELECT id, likes_count FROM review WHERE id = ? AND user_id = ?',
            [reviewId, userId]
        );

        if (review.length === 0) {
            return res.status(403).json({ 
                success: false, 
                message: 'Você não tem permissão para deletar esta review'
            });
        }

        // Deletar todos os likes da review
        await conn.execute(
            'DELETE FROM review_like WHERE review_id = ?',
            [reviewId]
        );

        // Deletar a review
        await conn.execute(
            'DELETE FROM review WHERE id = ?',
            [reviewId]
        );

        res.json({ 
            success: true, 
            message: 'Review deletada com sucesso'
        });
    } catch (err) {
        console.error('Delete review error:', err);
        next(err);
    }
});

// Obter reviews de um filme
// Endpoint para buscar as reviews recentes da comunidade
app.get('/api/community-reviews', async (req, res, next) => {
    try {
        let limit = 4;
        if (req.query.limit) {
            const parsedLimit = parseInt(req.query.limit, 10);
            if (!isNaN(parsedLimit) && parsedLimit > 0) {
                limit = parsedLimit;
            }
        }
        
        const [reviews] = await conn.execute(
            `SELECT r.id, r.rating, r.text as review_text, r.created_at, r.media_id,
                    r.movie_title, r.movie_year, r.movie_poster, r.likes_count,
                    u.id as userId, u.username, u.\`display-name\` as displayName, u.avatar
             FROM review r 
             JOIN user u ON r.user_id = u.id 
             ORDER BY r.created_at DESC
             LIMIT ` + limit
        );

        // Converter avatares e posters para base64
        const reviewsWithImages = reviews.map(review => {
            if (review.avatar && Buffer.isBuffer(review.avatar)) {
                review.avatar = `data:image/png;base64,${review.avatar.toString('base64')}`;
            }
            if (review.movie_poster && Buffer.isBuffer(review.movie_poster)) {
                review.movie_poster = `data:image/png;base64,${review.movie_poster.toString('base64')}`;
            }
            return review;
        });

        res.json({ success: true, reviews: reviewsWithImages });
    } catch (err) {
        console.error('Get community reviews error:', err);
        next(err);
    }
});

app.get('/api/reviews/:movieId', async (req, res, next) => {
    try {
        const { movieId } = req.params;
        
        const [reviews] = await conn.execute(
            `SELECT r.*, u.username, u.\`display-name\` as displayName, u.avatar 
             FROM review r 
             JOIN user u ON r.user_id = u.id 
             WHERE r.media_id = ? 
             ORDER BY r.created_at DESC`,
            [movieId]
        );

        // Converter avatares para base64
        const reviewsWithAvatars = reviews.map(review => {
            if (review.avatar) {
                review.avatar = `data:image/png;base64,${review.avatar.toString('base64')}`;
            }
            return review;
        });

        res.json(reviewsWithAvatars || []);
    } catch (err) {
        console.error('Get reviews error:', err);
        next(err);
    }
});

// Adicionar ou remover like de uma review (toggle)
app.post('/api/reviews/:reviewId/like', auth, async (req, res, next) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user.id;

        // Verificar se o usuário já curtiu essa review
        const [existingLike] = await conn.execute(
            'SELECT id FROM review_like WHERE user_id = ? AND review_id = ?',
            [userId, reviewId]
        );

        if (existingLike.length > 0) {
            // Já tem like, remover (unlike)
            await conn.execute(
                'DELETE FROM review_like WHERE user_id = ? AND review_id = ?',
                [userId, reviewId]
            );

            // Atualizar likes_count (decrementar)
            await conn.execute(
                'UPDATE review SET likes_count = GREATEST(0, likes_count - 1) WHERE id = ?',
                [reviewId]
            );

            res.json({ 
                success: true, 
                liked: false,
                message: 'Like removido com sucesso'
            });
        } else {
            // Não tem like, adicionar
            await conn.execute(
                'INSERT INTO review_like (user_id, review_id) VALUES (?, ?)',
                [userId, reviewId]
            );

            // Atualizar likes_count (incrementar)
            await conn.execute(
                'UPDATE review SET likes_count = likes_count + 1 WHERE id = ?',
                [reviewId]
            );

            res.json({ 
                success: true, 
                liked: true,
                message: 'Like adicionado com sucesso'
            });
        }
    } catch (err) {
        console.error('Like error:', err);
        next(err);
    }
});

// Verificar se usuário já curtiu uma review
app.get('/api/reviews/:reviewId/liked', auth, async (req, res, next) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user.id;

        const [existingLike] = await conn.execute(
            'SELECT id FROM review_like WHERE user_id = ? AND review_id = ?',
            [userId, reviewId]
        );

        res.json({ 
            success: true, 
            liked: existingLike.length > 0
        });
    } catch (err) {
        console.error('Check like error:', err);
        next(err);
    }
});

// Obter reviews do usuário autenticado (para perfil)
// Função para buscar dados do filme na TMDB
const getMovieDataFromTMDB = async (movieId) => {
    try {
        const apiKey = process.env.TMDB_API_KEY || '75e676add70640aadafcda354ca23a4c';
        
        console.log(`🔍 Buscando dados do filme/série ${movieId} na TMDB...`);
        
        // Primeiro tenta com o ID direto como filme
        let response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&language=pt-BR`);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ Filme encontrado: ${data.title}`);
            return {
                movieTitle: data.title || 'Título não disponível',
                movieYear: data.release_date ? new Date(data.release_date).getFullYear() : 'Ano desconhecido',
                moviePoster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
                movieDuration: data.runtime || null,
                movieGenre: data.genres && data.genres.length > 0 ? data.genres[0].name : 'Gênero desconhecido'
            };
        }
        
        // Se não encontrou como filme, tenta como série
        console.log(`⚠️ Não encontrou como filme, tentando como série...`);
        response = await fetch(`https://api.themoviedb.org/3/tv/${movieId}?api_key=${apiKey}&language=pt-BR`);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ Série encontrada: ${data.name}`);
            return {
                movieTitle: data.name || 'Título não disponível',
                movieYear: data.first_air_date ? new Date(data.first_air_date).getFullYear() : 'Ano desconhecido',
                moviePoster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
                movieDuration: null,
                movieGenre: data.genres && data.genres.length > 0 ? data.genres[0].name : 'Gênero desconhecido'
            };
        }
        
        // Se ainda não encontrou, tenta search genérico
        console.warn(`⚠️ Filme/Série ${movieId} não encontrado. Tentando com search...`);
        
        response = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${movieId}&language=pt-BR`);
        
        if (!response.ok) {
            console.warn(`⚠️ TMDB API retornou status ${response.status} para search do filme ${movieId}`);
            return null;
        }
        
        const searchData = await response.json();
        
        // Se encontrou resultados no search, usar o primeiro
        if (searchData.results && searchData.results.length > 0) {
            const data = searchData.results[0];
            const title = data.title || data.name || 'Título não disponível';
            const year = (data.release_date || data.first_air_date) ? new Date(data.release_date || data.first_air_date).getFullYear() : 'Ano desconhecido';
            
            console.log(`✅ Conteúdo encontrado via search: ${title}`);
            return {
                movieTitle: title,
                movieYear: year,
                moviePoster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
                movieDuration: null,
                movieGenre: 'Gênero desconhecido'
            };
        }
        
        console.warn(`❌ Nenhum resultado encontrado para ${movieId}`);
        return null;
    } catch (err) {
        console.error(`❌ Erro ao buscar dados do filme ${movieId} na TMDB:`, err.message);
        return null;
    }
};

// Get public reviews for a specific user (no authentication required)
app.get('/api/user/:userId/reviews', async (req, res, next) => {
    try {
        const userIdentifier = req.params.userId;
        const { sortBy = 'recent', limit = 10, offset = 0 } = req.query;

        // Buscar usuário por ID ou username
        const user = await getUserByIdOrUsername(userIdentifier);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        const userId = user.id;

        // Validar e definir ordenação com segurança
        let orderByClause = 'r.created_at DESC';
        const validSortOptions = {
            'recent': 'r.created_at DESC',
            'popular': 'r.likes_count DESC, r.created_at DESC',
            'highest': 'r.rating DESC, r.created_at DESC',
            'lowest': 'r.rating ASC, r.created_at DESC'
        };
        
        if (sortBy && validSortOptions[sortBy]) {
            orderByClause = validSortOptions[sortBy];
        }

        // Construir query com validação
        const limitNum = Math.min(parseInt(limit) || 10, 100); // Máximo 100 por requisição
        const offsetNum = Math.max(parseInt(offset) || 0, 0);

        const query = `SELECT r.*, u.username, u.\`display-name\` as displayName, u.avatar 
                       FROM review r 
                       JOIN user u ON r.user_id = u.id 
                       WHERE r.user_id = ? 
                       ORDER BY ${orderByClause}
                       LIMIT ${limitNum} OFFSET ${offsetNum}`;

        console.log('📊 Query (Public):', query);
        console.log('📊 UserId:', userId);

        const [reviews] = await conn.execute(query, [userId]);

        console.log('✅ Public reviews found:', reviews.length);

        // Converter avatares para base64 e buscar dados dos filmes
        const reviewsWithData = await Promise.all(reviews.map(async (review) => {
            // Converter avatar
            if (review.avatar && Buffer.isBuffer(review.avatar)) {
                review.avatar = `data:image/png;base64,${review.avatar.toString('base64')}`;
            }
            
            // Usar dados armazenados na review ou buscar da TMDB
            if (review.movie_title) {
                // Se já tem dados armazenados, usar esses
                review.movieTitle = review.movie_title;
                review.movieYear = review.movie_year;
                review.moviePoster = review.movie_poster;
            } else {
                // Caso contrário, tentar buscar da TMDB
                const movieData = await getMovieDataFromTMDB(review.media_id);
                
                // Adicionar dados do filme (com fallback se TMDB falhar)
                review.movieTitle = movieData?.movieTitle || `Filme #${review.media_id}`;
                review.movieYear = movieData?.movieYear || '---';
                review.moviePoster = movieData?.moviePoster || null;
                review.movieDuration = movieData?.movieDuration || null;
                review.movieGenre = movieData?.movieGenre || '---';
            }
            
            return review;
        }));

        res.json({ 
            success: true, 
            reviews: reviewsWithData,
            total: reviewsWithData.length
        });
    } catch (err) {
        console.error('❌ Get public user reviews error:', err.message);
        console.error('Stack:', err.stack);
        res.status(500).json({ 
            success: false, 
            message: 'Erro ao carregar reviews',
            error: err.message
        });
    }
});

app.get('/api/user/reviews', auth, async (req, res, next) => {
    try {
        console.log('🔍 GET /api/user/reviews called');
        console.log('🔍 req.user:', req.user);
        console.log('🔍 req.query:', req.query);
        
        const userId = req.user?.id;
        
        if (!userId) {
            console.error('❌ No userId found in req.user');
            return res.status(400).json({ 
                success: false, 
                message: 'No user ID found in token',
                receivedUser: req.user
            });
        }
        
        const { sortBy = 'recent', limit = 10, offset = 0 } = req.query;

        // Validar e definir ordenação com segurança
        let orderByClause = 'r.created_at DESC';
        const validSortOptions = {
            'recent': 'r.created_at DESC',
            'popular': 'r.likes_count DESC, r.created_at DESC',
            'highest': 'r.rating DESC, r.created_at DESC',
            'lowest': 'r.rating ASC, r.created_at DESC'
        };
        
        if (sortBy && validSortOptions[sortBy]) {
            orderByClause = validSortOptions[sortBy];
        }

        // Construir query com validação
        const limitNum = Math.min(parseInt(limit) || 10, 100); // Máximo 100 por requisição
        const offsetNum = Math.max(parseInt(offset) || 0, 0);

        const query = `SELECT r.*, u.username, u.\`display-name\` as displayName, u.avatar 
                       FROM review r 
                       JOIN user u ON r.user_id = u.id 
                       WHERE r.user_id = ? 
                       ORDER BY ${orderByClause}
                       LIMIT ${limitNum} OFFSET ${offsetNum}`;

        console.log('📊 Query:', query);
        console.log('📊 UserId:', userId);

        const [reviews] = await conn.execute(query, [userId]);

        console.log('✅ Reviews found:', reviews.length);

        // Converter avatares para base64 e buscar dados dos filmes
        const reviewsWithData = await Promise.all(reviews.map(async (review) => {
            // Converter avatar
            if (review.avatar && Buffer.isBuffer(review.avatar)) {
                review.avatar = `data:image/png;base64,${review.avatar.toString('base64')}`;
            }
            
            // Usar dados armazenados na review ou buscar da TMDB
            if (review.movie_title) {
                // Se já tem dados armazenados, usar esses
                review.movieTitle = review.movie_title;
                review.movieYear = review.movie_year;
                review.moviePoster = review.movie_poster;
            } else {
                // Caso contrário, tentar buscar da TMDB
                const movieData = await getMovieDataFromTMDB(review.media_id);
                
                // Adicionar dados do filme (com fallback se TMDB falhar)
                review.movieTitle = movieData?.movieTitle || `Filme #${review.media_id}`;
                review.movieYear = movieData?.movieYear || '---';
                review.moviePoster = movieData?.moviePoster || null;
                review.movieDuration = movieData?.movieDuration || null;
                review.movieGenre = movieData?.movieGenre || '---';
            }
            
            return review;
        }));

        res.json({ 
            success: true, 
            reviews: reviewsWithData,
            total: reviewsWithData.length
        });
    } catch (err) {
        console.error('❌ Get user reviews error:', err.message);
        console.error('Stack:', err.stack);
        res.status(500).json({ 
            success: false, 
            message: 'Erro ao carregar reviews',
            error: err.message
        });
    }
});

// ===== FOLLOWERS ENDPOINTS =====

// Obter média de ratings de um usuário
app.get('/api/user/:userId/average-rating', async (req, res, next) => {
    try {
        const userIdentifier = req.params.userId;
        
        // Buscar usuário por ID ou username
        const user = await getUserByIdOrUsername(userIdentifier);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        const [rows] = await conn.execute(
            'SELECT AVG(rating) as averageRating, COUNT(*) as totalReviews FROM review WHERE user_id = ?',
            [user.id]
        );
        
        const averageRating = rows[0].averageRating ? parseFloat(rows[0].averageRating).toFixed(1) : 0;
        const totalReviews = rows[0].totalReviews || 0;
        
        res.json({ 
            success: true, 
            averageRating: parseFloat(averageRating),
            totalReviews
        });
    } catch (err) {
        console.error('❌ Get average rating error:', err.message);
        res.status(500).json({ success: false, message: 'Erro ao obter média de ratings' });
    }
});

// Obter contagem de seguidores de um usuário
app.get('/api/user/:userId/followers/count', async (req, res, next) => {
    try {
        const userIdentifier = req.params.userId;
        
        // Buscar usuário por ID ou username
        const user = await getUserByIdOrUsername(userIdentifier);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        const [rows] = await conn.execute(
            'SELECT COUNT(*) as count FROM follower WHERE following_id = ?',
            [user.id]
        );
        
        res.json({ success: true, followersCount: rows[0].count });
    } catch (err) {
        console.error('❌ Get followers count error:', err.message);
        res.status(500).json({ success: false, message: 'Erro ao obter contagem de seguidores' });
    }
});

// Obter contagem de seguindo de um usuário
app.get('/api/user/:userId/following/count', async (req, res, next) => {
    try {
        const userIdentifier = req.params.userId;
        
        // Buscar usuário por ID ou username
        const user = await getUserByIdOrUsername(userIdentifier);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        const [rows] = await conn.execute(
            'SELECT COUNT(*) as count FROM follower WHERE follower_id = ?',
            [user.id]
        );
        
        res.json({ success: true, followingCount: rows[0].count });
    } catch (err) {
        console.error('❌ Get following count error:', err.message);
        res.status(500).json({ success: false, message: 'Erro ao obter contagem de seguindo' });
    }
});

// Obter lista de seguidores de um usuário
app.get('/api/user/:userId/followers', async (req, res, next) => {
    try {
        const userIdentifier = req.params.userId;
        
        // Buscar usuário por ID ou username
        const user = await getUserByIdOrUsername(userIdentifier);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        const [rows] = await conn.execute(
            'SELECT u.id, u.username, u.avatar FROM user u INNER JOIN follower f ON u.id = f.follower_id WHERE f.following_id = ? ORDER BY u.username',
            [user.id]
        );
        
        // Converter avatares para base64
        const followers = rows.map(follower => ({
            id: follower.id,
            username: follower.username,
            avatar: follower.avatar && Buffer.isBuffer(follower.avatar) 
                ? 'data:image/png;base64,' + follower.avatar.toString('base64')
                : null
        }));
        
        res.json({ success: true, followers });
    } catch (err) {
        console.error('❌ Get followers list error:', err.message);
        res.status(500).json({ success: false, message: 'Erro ao obter lista de seguidores' });
    }
});

// Obter lista de seguindo de um usuário
app.get('/api/user/:userId/following', async (req, res, next) => {
    try {
        const userIdentifier = req.params.userId;
        
        // Buscar usuário por ID ou username
        const user = await getUserByIdOrUsername(userIdentifier);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        const [rows] = await conn.execute(
            'SELECT u.id, u.username, u.avatar FROM user u INNER JOIN follower f ON u.id = f.following_id WHERE f.follower_id = ? ORDER BY u.username',
            [user.id]
        );
        
        // Converter avatares para base64
        const following = rows.map(user => ({
            id: user.id,
            username: user.username,
            avatar: user.avatar && Buffer.isBuffer(user.avatar) 
                ? 'data:image/png;base64,' + user.avatar.toString('base64')
                : null
        }));
        
        res.json({ success: true, following });
    } catch (err) {
        console.error('❌ Get following list error:', err.message);
        res.status(500).json({ success: false, message: 'Erro ao obter lista de seguindo' });
    }
});

// Verificar se usuário autenticado segue outro usuário
app.get('/api/user/:userId/is-following', auth, async (req, res, next) => {
    try {
        const userIdentifier = req.params.userId;
        const followerId = req.user.id;
        
        // Buscar usuário por ID ou username
        const user = await getUserByIdOrUsername(userIdentifier);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        const [rows] = await conn.execute(
            'SELECT id FROM follower WHERE follower_id = ? AND following_id = ?',
            [followerId, user.id]
        );
        
        res.json({ success: true, isFollowing: rows.length > 0 });
    } catch (err) {
        console.error('❌ Check following error:', err.message);
        res.status(500).json({ success: false, message: 'Erro ao verificar se está seguindo' });
    }
});

// Seguir um usuário
app.post('/api/user/:userId/follow', auth, async (req, res, next) => {
    try {
        const userIdentifier = req.params.userId;
        const followerId = req.user.id;
        
        // Buscar usuário por ID ou username
        const user = await getUserByIdOrUsername(userIdentifier);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        const userId = user.id;
        
        if (userId === followerId) {
            return res.status(400).json({ success: false, message: 'Não é possível seguir a si mesmo' });
        }
        
        // Verificar se usuário já segue
        const [existing] = await conn.execute(
            'SELECT id FROM follower WHERE follower_id = ? AND following_id = ?',
            [followerId, userId]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Já está seguindo este usuário' });
        }
        
        // Adicionar follow
        const [result] = await conn.execute(
            'INSERT INTO follower (follower_id, following_id) VALUES (?, ?)',
            [followerId, userId]
        );
        
        // Obter nova contagem de seguidores
        const [followers] = await conn.execute(
            'SELECT COUNT(*) as count FROM follower WHERE following_id = ?',
            [userId]
        );
        
        res.json({ 
            success: true, 
            message: 'Agora está seguindo este usuário',
            followersCount: followers[0].count
        });
    } catch (err) {
        console.error('❌ Follow user error:', err.message);
        res.status(500).json({ success: false, message: 'Erro ao seguir usuário' });
    }
});

// Deixar de seguir um usuário
app.delete('/api/user/:userId/follow', auth, async (req, res, next) => {
    try {
        const userIdentifier = req.params.userId;
        const followerId = req.user.id;
        
        // Buscar usuário por ID ou username
        const user = await getUserByIdOrUsername(userIdentifier);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        const userId = user.id;
        
        // Remover follow
        const [result] = await conn.execute(
            'DELETE FROM follower WHERE follower_id = ? AND following_id = ?',
            [followerId, userId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(400).json({ success: false, message: 'Não está seguindo este usuário' });
        }
        
        // Obter nova contagem de seguidores
        const [followers] = await conn.execute(
            'SELECT COUNT(*) as count FROM follower WHERE following_id = ?',
            [userId]
        );
        
        res.json({ 
            success: true, 
            message: 'Deixou de seguir este usuário',
            followersCount: followers[0].count
        });
    } catch (err) {
        console.error('❌ Unfollow user error:', err.message);
        res.status(500).json({ success: false, message: 'Erro ao deixar de seguir usuário' });
    }
});

// Rota para obter perfil público de um usuário (deve ser depois de /api/user/:userId/reviews para não interceptar)
app.get('/api/user/:userId', async (req, res, next) => {
    try {
        const { userId } = req.params;
        
        const user = await getUserByIdOrUsername(userId);

        if (!user) {
            throw createError(404, 'User not found');
        }
        
        // Converter avatar para base64 se existir
        if (user.avatar && Buffer.isBuffer(user.avatar)) {
            user.avatar = `data:image/png;base64,${user.avatar.toString('base64')}`;
        }

        res.json(user);
    } catch (err) {
        next(err);
    }
});

// ===== LISTS ENDPOINTS =====
// Rastrear requisições em progresso por usuário
let usersCreatingLists = new Set();

// Criar lista
app.post('/api/lists', auth, upload.single('cover'), async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const userId = req.user.id;
        const coverBuffer = req.file ? req.file.buffer : null;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'List name is required' });
        }

        // Verificar se o usuário já está criando uma lista
        if (usersCreatingLists.has(userId)) {
            console.log(`⏳ Usuário ${userId} já está criando uma lista`);
            return res.status(429).json({ 
                success: false, 
                message: 'Você já está criando uma lista. Por favor, aguarde a conclusão.' 
            });
        }

        // Marcar que este usuário está criando uma lista
        usersCreatingLists.add(userId);

        try {
            const [result] = await conn.execute(
                'INSERT INTO `list` (`list-name`, `description`, `list-cover`, `user_id`, `createdAt`, `last-update`, `media-qtd`) VALUES (?, ?, ?, ?, NOW(), NOW(), 0)',
                [name, description || '', coverBuffer, userId]
            );

            res.status(201).json({
                success: true,
                list: {
                    id: result.insertId,
                    name: name,
                    description: description || '',
                    createdAt: new Date(),
                    mediaCount: 0
                }
            });
        } finally {
            // Remover o usuário da lista de criação após 1 segundo
            setTimeout(() => {
                usersCreatingLists.delete(userId);
            }, 1000);
        }
    } catch (err) {
        console.error('Create list error:', err);
        next(err);
    }
});

// Obter listas do usuário
app.get('/api/lists', auth, async (req, res, next) => {
    try {
        const userId = req.user.id;

        const [lists] = await conn.execute(
            `SELECT 
                l.id, 
                l.\`list-name\` as name, 
                l.\`description\`, 
                l.\`list-cover\`,
                l.\`user_id\` as userId,
                l.\`createdAt\` as createdAt, 
                l.\`last-update\` as lastUpdate, 
                l.\`media-qtd\` as mediaCount,
                u.\`username\` as ownerUsername
             FROM \`list\` l
             LEFT JOIN \`user\` u ON l.user_id = u.id
             WHERE l.user_id = ? 
             ORDER BY l.\`createdAt\` DESC`,
            [userId]
        );

        // Converter BLOB para base64
        const listsWithImages = lists.map(list => ({
            ...list,
            listCover: list['list-cover'] && Buffer.isBuffer(list['list-cover']) 
                ? 'data:image/jpeg;base64,' + list['list-cover'].toString('base64')
                : null
        }));

        res.json({ success: true, lists: listsWithImages });
    } catch (err) {
        console.error('Get lists error:', err);
        next(err);
    }
});

// Obter listas públicas de um usuário (para exibir no perfil)
app.get('/api/user/:userId/lists', async (req, res, next) => {
    try {
        const { userId } = req.params;

        const [lists] = await conn.execute(
            `SELECT 
                l.id, 
                l.\`list-name\` as name, 
                l.\`description\`, 
                l.\`list-cover\`,
                l.\`user_id\` as userId,
                l.\`createdAt\` as createdAt, 
                l.\`last-update\` as lastUpdate, 
                l.\`media-qtd\` as mediaCount,
                u.\`username\` as ownerUsername
             FROM \`list\` l
             LEFT JOIN \`user\` u ON l.user_id = u.id
             WHERE l.user_id = ? 
             ORDER BY l.\`createdAt\` DESC`,
            [userId]
        );

        // Converter BLOB para base64
        const listsWithImages = lists.map(list => ({
            ...list,
            listCover: list['list-cover'] && Buffer.isBuffer(list['list-cover']) 
                ? 'data:image/jpeg;base64,' + list['list-cover'].toString('base64')
                : null
        }));

        res.json({ success: true, lists: listsWithImages });
    } catch (err) {
        console.error('Get user lists error:', err);
        next(err);
    }
});

// Obter detalhes de uma lista específica
app.get('/api/lists/:listId', async (req, res, next) => {
    try {
        const { listId } = req.params;

        const [lists] = await conn.execute(
            `SELECT 
                l.id, 
                l.\`list-name\` as name, 
                l.\`description\`, 
                l.\`list-cover\`,
                l.\`user_id\` as userId, 
                l.\`createdAt\` as createdAt, 
                l.\`last-update\` as lastUpdate, 
                l.\`media-qtd\` as mediaCount,
                l.\`media-ids\` as mediaIds,
                u.\`username\` as ownerName,
                u.\`username\` as ownerUsername,
                u.\`avatar\` as ownerAvatar
             FROM \`list\` l
             LEFT JOIN \`user\` u ON l.user_id = u.id
             WHERE l.id = ?`,
            [listId]
        );

        if (lists.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'List not found' 
            });
        }

        let listData = lists[0];
        
        // Converter capa BLOB para base64 se existir
        if (listData['list-cover'] && Buffer.isBuffer(listData['list-cover'])) {
            listData.listCover = 'data:image/jpeg;base64,' + listData['list-cover'].toString('base64');
        } else {
            listData.listCover = null;
        }
        
        // Converter avatar BLOB para base64 se existir
        if (listData.ownerAvatar && Buffer.isBuffer(listData.ownerAvatar)) {
            listData.ownerAvatar = 'data:image/jpeg;base64,' + listData.ownerAvatar.toString('base64');
        } else if (!listData.ownerAvatar) {
            listData.ownerAvatar = null;
        }
        
        // Fornecer valores padrão se forem NULL
        if (!listData.ownerName) {
            listData.ownerName = 'Usuário';
        }
        
        if (!listData.description) {
            listData.description = '';
        }

        // Parse items from JSON
        let items = [];
        if (listData.mediaIds) {
            try {
                items = JSON.parse(listData.mediaIds);
            } catch (err) {
                console.error('Error parsing mediaIds:', err);
                items = [];
            }
        }
        
        console.log('📊 GET /api/lists/:listId - Data to send:', {
            id: listData.id,
            name: listData.name,
            description: listData.description,
            ownerName: listData.ownerName,
            ownerAvatar: listData.ownerAvatar ? 'base64 image' : null,
            itemsCount: items.length
        });
        
        res.json({ success: true, list: { ...listData, items } });
    } catch (err) {
        console.error('Get list details error:', err);
        next(err);
    }
});

// Deletar lista
app.delete('/api/lists/:listId', auth, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { listId } = req.params;

        // Verificar se a lista pertence ao usuário
        const [lists] = await conn.execute(
            'SELECT id FROM `list` WHERE id = ? AND user_id = ?',
            [listId, userId]
        );

        if (lists.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Lista não encontrada ou não autorizada' 
            });
        }

        // Deletar a lista
        await conn.execute(
            'DELETE FROM `list` WHERE id = ? AND user_id = ?',
            [listId, userId]
        );

        res.json({ success: true, message: 'Lista deletada com sucesso' });
    } catch (err) {
        console.error('Delete list error:', err);
        next(err);
    }
});

// Atualizar lista
app.put('/api/lists/:listId', auth, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { listId } = req.params;
        let { name, description, cover, items } = req.body;

        console.log('🔴 PUT /api/lists/:listId - INÍCIO');
        console.log('📋 Dados recebidos:');
        console.log('  ├─ listId:', listId);
        console.log('  ├─ name:', name || '(não fornecido)');
        console.log('  ├─ description:', description ? `${description.substring(0, 30)}...` : '(não fornecido)');
        console.log('  ├─ items:', items ? `Array com ${items.length} itens` : '(não fornecido)');
        console.log('  └─ cover:', cover ? `${cover.substring(0, 50)}... (${cover.length} chars)` : '(não fornecido)');

        if (!name || name.trim() === '') {
            console.warn('⚠️ Nome da lista vazio ou não fornecido');
            return res.status(400).json({ 
                success: false, 
                message: 'Nome da lista é obrigatório' 
            });
        }

        // Verificar se a lista pertence ao usuário
        console.log('🔍 Verificando propriedade da lista...');
        const [lists] = await conn.execute(
            'SELECT id FROM `list` WHERE id = ? AND user_id = ?',
            [listId, userId]
        );

        if (lists.length === 0) {
            console.warn('❌ Lista não encontrada ou não autorizada para userId:', userId);
            return res.status(404).json({ 
                success: false, 
                message: 'Lista não encontrada ou não autorizada' 
            });
        }
        console.log('✅ Lista pertence ao usuário');

        // Converter Base64 para Buffer se fornecido
        let coverBuffer = null;
        if (cover) {
            if (typeof cover === 'string' && cover.startsWith('data:image')) {
                try {
                    console.log('🖼️ Processando imagem de capa...');
                    // Extrair a parte Base64 após "data:image/...;base64,"
                    const base64Data = cover.split(',')[1];
                    coverBuffer = Buffer.from(base64Data, 'base64');
                    console.log('✅ Cover convertida Base64 → Buffer');
                    console.log('  ├─ Tamanho original:', cover.length, 'chars');
                    console.log('  └─ Tamanho Buffer:', coverBuffer.length, 'bytes');
                } catch (err) {
                    console.error('❌ Erro ao converter cover:', err.message);
                    coverBuffer = null;
                }
            } else {
                const coverType = typeof cover;
                const coverDisplay = coverType === 'object' ? `[Object ${cover?.constructor?.name}]` : String(cover).substring(0, 30);
                console.log('⚠️ Cover recebida mas formato inválido.');
                console.log('  ├─ Tipo:', coverType);
                console.log('  ├─ Valor:', coverDisplay);
                console.log('  └─ Esperado: string começando com "data:image"');
                console.log('  ℹ️ Cover NÃO será atualizada');
            }
        }

        // Preparar dados para atualizar
        console.log('📝 Preparando atualização...');
        let updateQuery = 'UPDATE `list` SET `list-name` = ?, `last-update` = NOW()';
        let params = [name.trim()];
        const updateFields = ['nome'];

        // Adicionar descrição se fornecida
        if (description !== undefined) {
            updateQuery += ', description = ?';
            params.push(description);
            updateFields.push('descrição');
            console.log('  ├─ Descrição será atualizada');
        }

        // Adicionar capa se fornecida
        if (coverBuffer !== null) {
            updateQuery += ', `list-cover` = ?';
            params.push(coverBuffer);
            updateFields.push('capa');
            console.log('  ├─ Capa será atualizada');
        } else if (cover !== undefined) {
            console.log('  ├─ Capa NÃO será atualizada (inválida ou não fornecida)');
        }

        // Adicionar itens se fornecidos
        if (items && Array.isArray(items) && items.length > 0) {
            // Serializar array de itens como JSON
            const itemsJson = JSON.stringify(items);
            updateQuery += ', `media-ids` = ?, `media-qtd` = ?';
            params.push(itemsJson, items.length);
            updateFields.push('items');
            console.log('  ├─ Itens serão atualizados:', items.length, 'itens');
        }

        updateQuery += ' WHERE id = ? AND user_id = ?';
        params.push(listId, userId);

        console.log('🔄 SQL Query:');
        console.log('  ├─ Query:', updateQuery);
        console.log('  └─ Campos atualizados:', updateFields.join(', '));

        // Atualizar a lista
        console.log('💾 Executando atualização...');
        const [result] = await conn.execute(updateQuery, params);
        console.log('✅ Atualização executada:');
        console.log('  ├─ Rows affected:', result.affectedRows);
        console.log('  └─ Lista:', { listId, name, updateFields });

        // Retornar lista atualizada
        console.log('📡 Buscando dados atualizados...');
        const [updatedList] = await conn.execute(
            'SELECT id, `list-name` as name, description, `list-cover` as listCover, `createdAt` as createdAt, `last-update` as lastUpdate, `media-qtd` as mediaCount FROM `list` WHERE id = ?',
            [listId]
        );

        // Converter BLOB para Base64 se existir
        if (updatedList[0] && updatedList[0].listCover && Buffer.isBuffer(updatedList[0].listCover)) {
            updatedList[0].listCover = 'data:image/jpeg;base64,' + updatedList[0].listCover.toString('base64');
            console.log('🖼️ Cover na resposta: Buffer → Base64 (', updatedList[0].listCover.length, 'chars)');
        } else {
            console.log('⏭️ Nenhuma capa para converter');
        }

        console.log('🟢 PUT /api/lists/:listId - SUCESSO');
        res.json({ success: true, list: updatedList[0] });
    } catch (err) {
        console.error('🔥 Erro ao atualizar lista:', err);
        next(err);
    }
});

// Like/Unlike lista
app.post('/api/lists/:listId/like', auth, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { listId } = req.params;
        console.log(`❤️ Like endpoint - userId: ${userId}, listId: ${listId}`);

        // Verificar se a lista existe
        console.log('🔍 Checking if list exists...');
        const [lists] = await conn.execute(
            'SELECT id FROM `list` WHERE id = ?',
            [listId]
        );

        if (lists.length === 0) {
            console.warn(`⚠️ List ${listId} not found`);
            return res.status(404).json({ 
                success: false, 
                message: 'Lista não encontrada' 
            });
        }

        // Verificar se usuário já curtiu
        console.log('🔍 Checking if user already liked...');
        const [existingLike] = await conn.execute(
            'SELECT id FROM `list_like` WHERE user_id = ? AND list_id = ?',
            [userId, listId]
        );

        if (existingLike.length > 0) {
            // Se já curtiu, remover like
            console.log('➖ Removing like...');
            await conn.execute(
                'DELETE FROM `list_like` WHERE user_id = ? AND list_id = ?',
                [userId, listId]
            );

            // Decrementar contador de likes na lista
            await conn.execute(
                'UPDATE `list` SET `likes-count` = CASE WHEN `likes-count` > 0 THEN `likes-count` - 1 ELSE 0 END WHERE id = ?',
                [listId]
            );

            console.log('✅ Like removed');
            return res.json({ 
                success: true, 
                liked: false,
                message: 'Like removido' 
            });
        } else {
            // Se não curtiu, adicionar like
            console.log('➕ Adding like...');
            await conn.execute(
                'INSERT INTO `list_like` (user_id, list_id, created_at) VALUES (?, ?, NOW())',
                [userId, listId]
            );

            // Incrementar contador de likes na lista
            await conn.execute(
                'UPDATE `list` SET `likes-count` = `likes-count` + 1 WHERE id = ?',
                [listId]
            );

            console.log('✅ Like added');
            return res.json({ 
                success: true, 
                liked: true,
                message: 'Like adicionado' 
            });
        }
    } catch (err) {
        console.error('❌ Like list error:', err.message);
        console.error('📋 Error details:', err);
        next(err);
    }
});

// Verificar se usuário curtiu lista
app.get('/api/lists/:listId/liked', auth, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { listId } = req.params;
        console.log(`❤️ Check liked endpoint - userId: ${userId}, listId: ${listId}`);

        const [likes] = await conn.execute(
            'SELECT id FROM `list_like` WHERE user_id = ? AND list_id = ?',
            [userId, listId]
        );

        console.log(`✅ Check liked - Found: ${likes.length > 0 ? 'yes' : 'no'}`);
        res.json({ 
            success: true, 
            liked: likes.length > 0 
        });
    } catch (err) {
        console.error('❌ Check list like error:', err.message);
        console.error('📋 Error details:', err);
        next(err);
    }
});

// Endpoint: Top 10 Usuários Mais Ativos (com mais comentários/reviews)
app.get('/api/top-users', async (req, res, next) => {
    try {
        console.log('📥 Buscando top 10 usuários...');
        
        // Query com avatar
        const [users] = await conn.execute(`
            SELECT 
                u.id,
                u.username,
                u.\`display-name\` as displayName,
                u.avatar,
                COUNT(r.id) as commentCount
            FROM user u
            LEFT JOIN review r ON u.id = r.user_id
            GROUP BY u.id, u.username, u.\`display-name\`, u.avatar
            ORDER BY commentCount DESC
            LIMIT 10
        `);

        console.log('✅ Usuários encontrados:', users.length);
        console.log('📋 Dados brutos:', users);

        const formattedUsers = users.map((user, index) => {
            let avatar = null;
            
            // Converter avatar BLOB para base64
            if (user.avatar && Buffer.isBuffer(user.avatar)) {
                avatar = `data:image/png;base64,${user.avatar.toString('base64')}`;
            }
            
            return {
                rank: index + 1,
                id: user.id,
                username: user.username,
                displayName: user.displayName || user.username,
                avatar: avatar,
                commentCount: parseInt(user.commentCount) || 0
            };
        });

        console.log('📤 Respondendo com:', formattedUsers);

        res.json({
            success: true,
            users: formattedUsers
        });
    } catch (err) {
        console.error('❌ Top users error:', err);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar usuários',
            error: err.message
        });
    }
});

// Endpoint: Top 10 Comentários Mais Liked
app.get('/api/top-comments', async (req, res, next) => {
    try {
        console.log('📥 Buscando top 10 comentários...');
        
        // Query com JOIN para pegar nome do usuário, poster, ano, rating e media_id
        const query = `
            SELECT 
                r.id, 
                r.user_id, 
                r.media_id,
                r.text, 
                r.rating,
                r.likes_count,
                r.movie_poster,
                r.movie_title,
                r.movie_year,
                u.username
            FROM review r
            JOIN user u ON r.user_id = u.id
            WHERE r.text IS NOT NULL AND r.media_id IS NOT NULL
            ORDER BY r.likes_count DESC
            LIMIT 10
        `;
        console.log('🔍 Executando query...');
        
        const [comments] = await conn.execute(query);

        console.log('✅ Comentários encontrados:', comments.length);

        if (!comments || comments.length === 0) {
            console.log('⚠️ Nenhum comentário encontrado');
            return res.json({
                success: true,
                comments: []
            });
        }

        // Formatar comentários
        const formattedComments = comments.map((comment, index) => ({
            rank: index + 1,
            id: comment.id,
            mediaId: comment.media_id,
            username: comment.username || `User ${comment.user_id}`,
            text: comment.text || 'Sem texto',
            rating: parseFloat(comment.rating) || 0,
            likes: parseInt(comment.likes_count || 0),
            moviePoster: comment.movie_poster,
            movieTitle: comment.movie_title,
            movieYear: comment.movie_year || ''
        }));

        console.log('📤 Respondendo com:', formattedComments.length, 'comentários');

        res.json({
            success: true,
            comments: formattedComments
        });
    } catch (err) {
        console.error('❌ Top comments error:', err.message);
        console.error('❌ Stack:', err.stack);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar comentários',
            error: err.message
        });
    }
});

// Salvar/remover lista (toggle)
app.post('/api/lists/:listId/save', auth, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { listId } = req.params;
        console.log(`💾 Save endpoint - userId: ${userId}, listId: ${listId}`);

        // Verificar se já está salvo
        console.log('🔍 Checking if already saved...');
        const [saved] = await conn.execute(
            'SELECT id FROM `saved_list` WHERE list_id = ? AND user_id = ?',
            [listId, userId]
        );

        if (saved.length > 0) {
            // Remover save
            console.log('➖ Removing save...');
            await conn.execute(
                'DELETE FROM `saved_list` WHERE list_id = ? AND user_id = ?',
                [listId, userId]
            );
            console.log('✅ Removed from saved');
            res.json({ 
                success: true, 
                saved: false,
                message: 'List removed from saved'
            });
        } else {
            // Adicionar save
            console.log('➕ Adding save...');
            await conn.execute(
                'INSERT INTO `saved_list` (list_id, user_id, created_at) VALUES (?, ?, NOW())',
                [listId, userId]
            );
            console.log('✅ Added to saved');
            res.json({ 
                success: true, 
                saved: true,
                message: 'List saved'
            });
        }
    } catch (err) {
        console.error('❌ Save list error:', err.message);
        console.error('📋 Error details:', err);
        next(err);
    }
});

// Verificar se lista está salva
app.get('/api/lists/:listId/saved', auth, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { listId } = req.params;
        console.log(`💾 Check saved endpoint - userId: ${userId}, listId: ${listId}`);

        const [saved] = await conn.execute(
            'SELECT id FROM `saved_list` WHERE list_id = ? AND user_id = ?',
            [listId, userId]
        );

        console.log(`✅ Check saved - Found: ${saved.length > 0 ? 'yes' : 'no'}`);
        res.json({ 
            success: true, 
            saved: saved.length > 0 
        });
    } catch (err) {
        console.error('❌ Check list saved error:', err.message);
        console.error('📋 Error details:', err);
        next(err);
    }
});

// --- Search for movies/series to add to lists ---
app.get('/api/search', async (req, res, next) => {
    try {
        const { q, lang = 'en-US' } = req.query;

        if (!q || q.trim().length === 0) {
            return res.json({ results: [] });
        }

        const tmdbApiKey = process.env.TMDB_API_KEY;
        if (!tmdbApiKey) {
            console.error('❌ TMDB_API_KEY não configurada');
            return res.json({ results: [], error: 'API não configurada' });
        }

        console.log(`🔍 Buscando na TMDB (${lang}): "${q}"`);

        // Buscar em TMDB (multi search retorna filmes e séries)
        const tmdbResponse = await fetch(
            `https://api.themoviedb.org/3/search/multi?api_key=${tmdbApiKey}&query=${encodeURIComponent(q)}&language=${lang}&page=1`
        );

        if (!tmdbResponse.ok) {
            throw new Error(`TMDB API error: ${tmdbResponse.status}`);
        }

        const tmdbData = await tmdbResponse.json();
        console.log(`📺 TMDB retornou: ${tmdbData.results?.length || 0} resultados`);

        // Filtrar apenas filmes e séries (remover pessoas)
        const results = (tmdbData.results || [])
            .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
            .slice(0, 20)
            .map(item => {
                const isMovie = item.media_type === 'movie';
                const title = isMovie ? item.title : item.name;
                const year = isMovie ? item.release_date?.split('-')[0] : item.first_air_date?.split('-')[0];
                let posterUrl = null;

                // Construir URL do poster se existir
                if (item.poster_path) {
                    posterUrl = `https://image.tmdb.org/t/p/w780${item.poster_path}`;
                }

                return {
                    id: `tmdb_${item.id}_${item.media_type}`,
                    title: title || 'Unknown',
                    type: isMovie ? 'Movie' : 'Series',
                    year: year || 'N/A',
                    poster: posterUrl,
                    description: item.overview || '',
                    externalId: item.id,
                    mediaType: item.media_type,
                    rating: item.vote_average ? Math.round(item.vote_average * 10) / 10 : 'N/A'
                };
            });

        console.log(`✅ Formatados ${results.length} resultados`);

        res.json({ 
            success: true, 
            results: results 
        });
    } catch (err) {
        console.error('❌ Search error:', err.message);
        res.json({ success: false, results: [], message: err.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    const status = err.statusCode || 500;
    const message = err.message || 'Erro no servidor';

    console.error('Erro:', {
        status,
        message,
        stack: err.stack
    });

    res.status(status).json({ success: false, message });
});

app.listen(port, () => {
    console.log(`Servidor rescene rodando na porta ${port}`);
});
