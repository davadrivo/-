// Это файл сервера - он обрабатывает все запросы от пользователей

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
// На хостинге порт задается автоматически, локально используем 3000
const PORT = process.env.PORT || 3000;

// Файлы где хранятся данные
const DATA_FILE = 'data.json';
const USERS_FILE = 'users.json';
const ADMIN_CODE = 'часы'; // Кодовое слово для админа

// Разрешаем серверу отдавать статические файлы (HTML, CSS, JS)
app.use(express.static('public'));
app.use(express.json());

// Функция для чтения данных из файла
function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
    return { posts: [] };
  } catch (error) {
    return { posts: [] };
  }
}

// Функция для записи данных в файл
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Функция для чтения пользователей
function readUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      return JSON.parse(data);
    }
    return { users: [] };
  } catch (error) {
    return { users: [] };
  }
}

// Функция для записи пользователей
function writeUsers(data) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

// Регистрация нового пользователя
app.post('/api/register', (req, res) => {
  const { username, adminCode } = req.body;
  
  if (!username || username.trim().length === 0) {
    return res.status(400).json({ error: 'Нужен никнейм' });
  }

  const usersData = readUsers();
  const usernameLower = username.trim().toLowerCase();

  // Проверяем что ник не занят
  if (usersData.users.some(u => u.username.toLowerCase() === usernameLower)) {
    return res.status(400).json({ error: 'Этот ник уже занят' });
  }

  // Проверяем кодовое слово для админа
  const isAdmin = adminCode === ADMIN_CODE;

  const newUser = {
    id: Date.now().toString(),
    username: username.trim(),
    isAdmin: isAdmin,
    date: new Date().toISOString()
  };

  usersData.users.push(newUser);
  writeUsers(usersData);

  res.json({ 
    id: newUser.id,
    username: newUser.username,
    isAdmin: newUser.isAdmin
  });
});

// Получить всех пользователей (для проверки ников)
app.get('/api/users', (req, res) => {
  const usersData = readUsers();
  res.json(usersData.users.map(u => ({ id: u.id, username: u.username, isAdmin: u.isAdmin })));
});

// Получить все посты
app.get('/api/posts', (req, res) => {
  const data = readData();
  res.json(data.posts);
});

// Добавить новый пост
app.post('/api/posts', (req, res) => {
  const { text, authorId, author } = req.body;
  
  if (!text || !authorId || !author) {
    return res.status(400).json({ error: 'Нужен текст и автор' });
  }

  const data = readData();
  const newPost = {
    id: Date.now().toString(),
    text: text,
    author: author,
    authorId: authorId,
    date: new Date().toISOString(),
    comments: []
  };

  data.posts.unshift(newPost); // Добавляем в начало
  writeData(data);

  res.json(newPost);
});

// Добавить комментарий к посту
app.post('/api/posts/:id/comments', (req, res) => {
  const { text, authorId, author } = req.body;
  const postId = req.params.id;

  if (!text || !authorId || !author) {
    return res.status(400).json({ error: 'Нужен текст и автор' });
  }

  const data = readData();
  const post = data.posts.find(p => p.id === postId);

  if (!post) {
    return res.status(404).json({ error: 'Пост не найден' });
  }

  const newComment = {
    id: Date.now().toString(),
    text: text,
    author: author,
    authorId: authorId,
    date: new Date().toISOString()
  };

  post.comments = post.comments || [];
  post.comments.push(newComment);
  writeData(data);

  res.json(newComment);
});

// Удалить пост
app.delete('/api/posts/:id', (req, res) => {
  const { userId, isAdmin } = req.body;
  const postId = req.params.id;

  const data = readData();
  const post = data.posts.find(p => p.id === postId);

  if (!post) {
    return res.status(404).json({ error: 'Пост не найден' });
  }

  // Проверяем права: только админ или создатель поста может удалить
  const canDelete = isAdmin === true || post.authorId === userId;

  if (!canDelete) {
    return res.status(403).json({ error: 'Нет прав на удаление этого поста' });
  }

  data.posts = data.posts.filter(post => post.id !== postId);
  writeData(data);
  res.json({ success: true });
});

// Запускаем сервер
app.listen(PORT, () => {
  console.log(`Сервер работает на http://localhost:${PORT}`);
  console.log('Открой браузер и перейди по этому адресу!');
});
