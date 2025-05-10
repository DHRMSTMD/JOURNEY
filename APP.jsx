// src/App.jsx
import React, { useState, useEffect } from 'react';
import { db, storage, auth } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { Link } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';

function App() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const postsRef = collection(db, 'posts');

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    fetchPosts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return alert('로그인 후 글을 작성할 수 있습니다.');
    if (title.trim() === '' || content.trim() === '') return;

    let imageUrl = '';
    if (image) {
      const imageRef = ref(storage, `images/${uuidv4()}`);
      await uploadBytes(imageRef, image);
      imageUrl = await getDownloadURL(imageRef);
    }

    await addDoc(postsRef, {
      title,
      content,
      imageUrl,
      createdAt: new Date(),
      user: currentUser.email || currentUser.uid,
    });

    setTitle('');
    setContent('');
    setImage(null);
    fetchPosts();
  };

  const fetchPosts = async () => {
    const q = query(postsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const result = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setPosts(result);
  };

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1> 게시판</h1>

      <div style={{ marginBottom: '1rem' }}>
        {currentUser ? (
          <>
            <span style={{ marginRight: '1rem' }}>👤 {currentUser.email}</span>
            <button onClick={handleLogout}>로그아웃</button>
          </>
        ) : (
          <Link to="/login">🔐 로그인</Link>
        )}
      </div>

      {currentUser ? (
        <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
          <input
            type="text"
            placeholder="제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem' }}
          />
          <textarea
            placeholder="내용"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows="4"
            style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem' }}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
            style={{ marginBottom: '0.5rem' }}
          />
          <button type="submit">게시글 작성</button>
        </form>
      ) : (
        <p>✋ 로그인 후 게시글을 작성할 수 있습니다.</p>
      )}

      <div>
        {posts.map((post) => (
          <div key={post.id} style={{ marginBottom: '2rem', borderBottom: '1px solid #ccc' }}>
            <Link
              to={`/post/${post.id}`}
              style={{ fontSize: '18px', textDecoration: 'none', color: 'blue' }}
            >
              {post.title}
            </Link>
            <div style={{ fontSize: '12px', color: '#888' }}>
              {post.createdAt?.seconds &&
                new Date(post.createdAt.seconds * 1000).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
