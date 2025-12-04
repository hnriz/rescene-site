CREATE DATABASE IF NOT EXISTS rescene;
USE rescene;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS `user` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(15) NOT NULL UNIQUE,
  `display-name` VARCHAR(30) NOT NULL,
  `password` VARCHAR(100) NOT NULL,
  `bio` VARCHAR(250) NULL,
  `avatar` LONGBLOB NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `language` CHAR(5) NOT NULL DEFAULT 'pt-BR',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB;

-- Tabela de catálogo de séries
CREATE TABLE IF NOT EXISTS `series-catalog` (
  `id` INT NOT NULL,
  `popular-id` INT NULL,
  `recommended-id` INT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB;

-- Tabela de catálogo de filmes
CREATE TABLE IF NOT EXISTS `movie-catalog` (
  `id` INT NOT NULL,
  `popular-id` INT NULL,
  `recommended-id` INT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB;

-- Tabela de mídia
CREATE TABLE IF NOT EXISTS `media` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NULL,
  `type` BIT NULL,
  `synopsis` VARCHAR(500) NULL,
  `cover` BLOB NULL,
  `poster_path` VARCHAR(500) NULL,
  `rating` DECIMAL(3,1) NULL,
  `overview` TEXT NULL,
  `released-at` DATE NULL,
  `director` VARCHAR(50) NULL,
  `series-catalog_id` INT NULL,
  `movie-catalog_id` INT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_media_series-catalog1_idx` (`series-catalog_id` ASC),
  INDEX `fk_media_movie-catalog1_idx` (`movie-catalog_id` ASC),
  INDEX `idx_poster_path` (`poster_path` ASC),
  CONSTRAINT `fk_media_series-catalog1`
    FOREIGN KEY (`series-catalog_id`)
    REFERENCES `series-catalog` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_media_movie-catalog1`
    FOREIGN KEY (`movie-catalog_id`)
    REFERENCES `movie-catalog` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- Tabela de avaliações
CREATE TABLE IF NOT EXISTS `review` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `rating` DECIMAL(3,1) NOT NULL CHECK (`rating` >= 0 AND `rating` <= 10),
  `text` VARCHAR(1000) NULL,
  `likes_count` INT NOT NULL DEFAULT 0,
  `user_id` INT NOT NULL,
  `media_id` INT NOT NULL,
  `movie_title` VARCHAR(255) NULL,
  `movie_year` INT NULL,
  `movie_poster` VARCHAR(500) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `fk_review_user1_idx` (`user_id` ASC),
  INDEX `idx_media_id` (`media_id` ASC),
  CONSTRAINT `fk_review_user1`
    FOREIGN KEY (`user_id`)
    REFERENCES `user` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE = InnoDB;

-- Tabela de likes nas reviews
CREATE TABLE IF NOT EXISTS `review_like` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `review_id` INT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_like` (`user_id`, `review_id`),
  INDEX `fk_review_like_user_idx` (`user_id` ASC),
  INDEX `fk_review_like_review_idx` (`review_id` ASC),
  CONSTRAINT `fk_review_like_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `user` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_review_like_review`
    FOREIGN KEY (`review_id`)
    REFERENCES `review` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE = InnoDB;

-- Tabela de listas
CREATE TABLE IF NOT EXISTS `list` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `list-name` VARCHAR(50) NULL,
  `description` VARCHAR(500) NULL,
  `list-cover` LONGBLOB NULL,
  `createdAt` DATE NULL,
  `last-update` DATE NULL,
  `media-qtd` INT NULL,
  `media-ids` LONGTEXT NULL,
  `likes-count` INT NOT NULL DEFAULT 0,
  `user_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_list_user_idx` (`user_id` ASC),
  CONSTRAINT `fk_list_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `user` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- Tabela de likes nas listas
CREATE TABLE IF NOT EXISTS `list_like` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `list_id` INT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_like` (`user_id`, `list_id`),
  INDEX `fk_list_like_user_idx` (`user_id` ASC),
  INDEX `fk_list_like_list_idx` (`list_id` ASC),
  CONSTRAINT `fk_list_like_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `user` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_list_like_list`
    FOREIGN KEY (`list_id`)
    REFERENCES `list` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE = InnoDB;

-- Tabela de relacionamentos de followers/following
CREATE TABLE IF NOT EXISTS `follower` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `follower_id` INT NOT NULL,
  `following_id` INT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_follow` (`follower_id`, `following_id`),
  INDEX `idx_following_id` (`following_id` ASC),
  CONSTRAINT `fk_follower_user_follower`
    FOREIGN KEY (`follower_id`)
    REFERENCES `user` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_follower_user_following`
    FOREIGN KEY (`following_id`)
    REFERENCES `user` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE = InnoDB;

-- Tabela de listas salvas
CREATE TABLE IF NOT EXISTS `saved_list` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `list_id` INT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_saved` (`user_id`, `list_id`),
  INDEX `fk_saved_list_user_idx` (`user_id` ASC),
  INDEX `fk_saved_list_list_idx` (`list_id` ASC),
  CONSTRAINT `fk_saved_list_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `user` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_saved_list_list`
    FOREIGN KEY (`list_id`)
    REFERENCES `list` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE = InnoDB;

-- Tabela de idiomas
CREATE TABLE IF NOT EXISTS `language` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `language` VARCHAR(45) NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB;

-- Tabela de mídias assistidas
CREATE TABLE IF NOT EXISTS `watched` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `media_id` INT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_watched` (`user_id`, `media_id`),
  INDEX `fk_watched_user_idx` (`user_id` ASC),
  INDEX `fk_watched_media_idx` (`media_id` ASC),
  CONSTRAINT `fk_watched_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `user` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_watched_media`
    FOREIGN KEY (`media_id`)
    REFERENCES `media` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE = InnoDB;

-- Tabela de favoritos
CREATE TABLE IF NOT EXISTS `favorite` (
  `user_id` INT NOT NULL,
  `media_id` INT NOT NULL,
  PRIMARY KEY (`user_id`, `media_id`),
  INDEX `fk_user_has_media_media1_idx` (`media_id` ASC),
  INDEX `fk_user_has_media_user1_idx` (`user_id` ASC),
  CONSTRAINT `fk_user_has_media_user1`
    FOREIGN KEY (`user_id`)
    REFERENCES `user` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_user_has_media_media1`
    FOREIGN KEY (`media_id`)
    REFERENCES `media` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- ========================================
-- VERIFICAÇÕES E AJUSTES DE COLUNAS
-- ========================================
-- Adicionar colunas à tabela user (se não existirem)
ALTER TABLE `user` ADD COLUMN IF NOT EXISTS `bio` VARCHAR(250) NULL;

-- Adicionar colunas à tabela media (se não existirem)
ALTER TABLE `media` ADD COLUMN IF NOT EXISTS `rating` DECIMAL(3,1) NULL;
ALTER TABLE `media` ADD COLUMN IF NOT EXISTS `overview` TEXT NULL;

-- Adicionar índices de performance (se não existirem)
ALTER TABLE `media` ADD INDEX IF NOT EXISTS `idx_poster_path` (`poster_path` ASC);
ALTER TABLE `review` ADD INDEX IF NOT EXISTS `idx_media_id` (`media_id` ASC);
ALTER TABLE `review` ADD INDEX IF NOT EXISTS `idx_user_id` (`user_id` ASC);
ALTER TABLE `list` ADD INDEX IF NOT EXISTS `idx_user_id` (`user_id` ASC);
ALTER TABLE `favorite` ADD INDEX IF NOT EXISTS `idx_media_id` (`media_id` ASC);
ALTER TABLE `favorite` ADD INDEX IF NOT EXISTS `idx_user_id` (`user_id` ASC);
ALTER TABLE `watched` ADD INDEX IF NOT EXISTS `idx_user_id` (`user_id` ASC);
ALTER TABLE `watched` ADD INDEX IF NOT EXISTS `idx_media_id` (`media_id` ASC);

-- ========================================
-- DADOS INICIAIS (SEED)
-- ========================================
-- Dados de teste para a tabela media
INSERT IGNORE INTO `media` (`id`, `name`, `type`, `synopsis`, `released-at`) VALUES
(1, 'The Matrix', 0, 'A hacker discovers the truth about his reality and his role in the war against its controllers.', '1999-03-31'),
(2, 'The Matrix Reloaded', 0, 'Neo and his allies race against time before the machines discover the city of Zion and destroy it.', '2003-05-15'),
(3, 'The Matrix Revolutions', 0, 'The final chapter of the Matrix saga.', '2003-11-05'),
(4, 'Breaking Bad', 1, 'A high school chemistry teacher diagnosed with inoperable lung cancer turns to cooking methamphetamine.', '2008-01-20'),
(5, 'Game of Thrones', 1, 'Nine noble families fight for control over the lands of Westeros.', '2011-04-17'),
(6, 'Inception', 0, 'A skilled thief who steals corporate secrets through dream-sharing technology.', '2010-07-16'),
(7, 'The Dark Knight', 0, 'Batman faces off against the Joker, a criminal mastermind who wants to plunge Gotham into anarchy.', '2008-07-18'),
(8, 'The Dark Knight Rises', 0, 'Batman must face a powerful new threat.', '2012-07-20'),
(9, 'Pulp Fiction', 0, 'Multiple interconnected stories of Los Angeles criminals, framed around a central story.', '1994-10-14'),
(10, 'Stranger Things', 1, 'When a young boy disappears, his friends, family and local police unravel a mystery.', '2016-07-15'),
(11, 'Interstellar', 0, 'A team of astronauts travel through a wormhole near Saturn in search of a new home for humanity.', '2014-11-07'),
(12, 'The Office', 1, 'A mockumentary on a group of typical office workers, where the workday consists of ego clashes.', '2005-03-24'),
(13, 'Friends', 1, 'Six friends living in New York City.', '1994-09-22'),
(14, 'The Crown', 1, 'Follows the political rivalries and romance of Queen Elizabeth II\'s reign and the events that shaped the second half of the 20th century.', '2016-11-04'),
(15, 'Sherlock', 1, 'A brilliant detective solving complex mysteries.', '2010-07-25'),
(16, 'Dune', 0, 'Paul Atreides, a brilliant young man, must travel to the dangerous planet Dune to ensure the future of his family and people.', '2021-10-22'),
(17, 'Avatar', 0, 'A paraplegic Marine dispatched to infiltrate an alien world.', '2009-12-18'),
(18, 'Avatar: The Way of Water', 0, 'Jake Sully explores Pandora with his family.', '2022-12-16'),
(19, 'Titanic', 0, 'A romance story aboard the ill-fated ship.', '1997-12-19'),
(20, 'The Shawshank Redemption', 0, 'Two imprisoned men bond over a number of years, finding solace and eventual redemption.', '1994-10-14'),
(21, 'Parasite', 0, 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.', '2019-05-30'),
(22, 'Chernobyl', 1, 'An account of the disaster at the Chernobyl nuclear power plant and subsequent clean-up efforts.', '2019-05-06'),
(23, 'The Mandalorian', 1, 'A lone bounty hunter in the Star Wars universe.', '2019-11-12'),
(24, 'House of the Dragon', 1, 'The history of House Targaryen.', '2022-08-21'),
(25, 'The Last of Us', 1, 'A fungal pandemic devastates humanity.', '2023-01-09'),
(26, 'Oppenheimer', 0, 'The story of the Manhattan Project scientist.', '2023-07-21'),
(27, 'Barbie', 0, 'Barbie explores the real world.', '2023-07-21'),
(28, 'Killers of the Flower Moon', 0, 'A crime saga in 1920s Oklahoma.', '2023-10-20'),
(29, 'Mission: Impossible Dead Reckoning', 0, 'Ethan Hunt faces his most dangerous mission yet.', '2023-07-12'),
(30, 'Wednesday', 1, 'Wednesday Addams attends Nevermore Academy.', '2022-11-23');