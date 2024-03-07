CREATE TABLE user (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    tag VARCHAR(255) NOT NULL,
    image VARCHAR(512) DEFAULT NULL,
    bg_color VARCHAR(255) DEFAULT "#f7f7f7",
    admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME DEFAULT NOW(),
    updated_at DATETIME DEFAULT NOW() ON UPDATE NOW(),
    CONSTRAINT unique_username_tag UNIQUE (username, tag)
);

CREATE TABLE scene (
    scene_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(512) NOT NULL,
    base_url VARCHAR(512) NOT NULL,
    created_at DATETIME DEFAULT NOW(),
    updated_at DATETIME DEFAULT NOW() ON UPDATE NOW(),
    fk_user_id INT,
    FOREIGN KEY (fk_user_id) REFERENCES user(user_id)
);

CREATE TABLE tag (
    tag_id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(255) NOT NULL
);

CREATE TABLE scene_tags (
    PRIMARY KEY (fk_scene_id, fk_tag_id),
    CONSTRAINT unique_scene_tag UNIQUE (fk_scene_id, fk_tag_id),
    fk_scene_id INT,
    fk_tag_id INT,
    FOREIGN KEY (fk_scene_id) REFERENCES scene(scene_id),
    FOREIGN KEY (fk_tag_id) REFERENCES tag(tag_id)
);

CREATE TABLE upvote (
    PRIMARY KEY (fk_user_id, fk_scene_id),
    CONSTRAINT unique_upvote UNIQUE (fk_user_id, fk_scene_id),
    fk_user_id INT,
    fk_scene_id INT,
    FOREIGN KEY (fk_user_id) REFERENCES user(user_id),
    FOREIGN KEY (fk_scene_id) REFERENCES scene(scene_id)
);