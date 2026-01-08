// Это файл сервера - он обрабатывает все запросы от пользователей

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
// На хостинге порт задается автоматически, локально используем 3000
const PORT = process.env.PORT || 3000;

// Файл где хранятся все посты
const DATA_FILE = 'data.json';

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

// Получить все посты
app.get('/api/posts', (req, res) => {
  const data = readData();
  res.json(data.posts);
});

// Добавить новый пост
app.post('/api/posts', (req, res) => {
  const { text, author } = req.body;
  
  if (!text || !author) {
    return res.status(400).json({ error: 'Нужен текст и автор' });
  }

  const data = readData();
  const newPost = {
    id: Date.now().toString(),
    text: text,
    author: author,
    date: new Date().toISOString()
  };

  data.posts.unshift(newPost); // Добавляем в начало
  writeData(data);

  res.json(newPost);
});

// Удалить пост
app.delete('/api/posts/:id', (req, res) => {
  const data = readData();
  data.posts = data.posts.filter(post => post.id !== req.params.id);
  writeData(data);
  res.json({ success: true });
});

// Запускаем сервер
app.listen(PORT, () => {
  console.log(`Сервер работает на http://localhost:${PORT}`);
  console.log('Открой браузер и перейди по этому адресу!');
});
