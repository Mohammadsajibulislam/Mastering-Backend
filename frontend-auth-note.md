# Frontend Note: React + Vite দিয়ে Authentication (Cookie + JWT)

এই নোট backend-এর (`backend-auth-note.md`) সাথে মিলিয়ে বানানো। Backend `http://localhost:3000`-এ চলবে, frontend `http://localhost:5173`-এ।

## ফ্রন্টএন্ডের কাজ কী

Backend যা করে: token বানায়, cookie সেট করে, token যাচাই করে।
Frontend যা করে:

1. Login/Register form দেখায় ও backend-এ পাঠায়।
2. Page খুলতেই `/api/auth/me` ডেকে জানে user login করা কি না।
3. Login থাকলে Create Post দেখায়, না থাকলে Login page-এ পাঠায়।
4. প্রতিটা request-এ `withCredentials: true` দেয়, যাতে browser cookie পাঠায়।

গুরুত্বপূর্ণ: frontend token নিজে দেখে না, রাখেও না। Cookie `httpOnly`, তাই JavaScript পড়তে পারে না। Frontend শুধু জানে "user আছে" বা "user নেই" (`/me`-এর উত্তর থেকে)।

## Folder structure

```
frontend/
├── src/
│   ├── api/
│   │   └── axios.js
│   ├── components/
│   │   ├── Navbar.jsx
│   │   └── ProtectedRoute.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Feed.jsx
│   │   └── CreatePost.jsx
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .env
├── .gitignore
└── package.json
```

---

## ধাপ ১: প্রজেক্ট তৈরি

```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install axios react-router-dom react-icons
npm run dev
```

| প্যাকেজ       | কাজ                                                               |
| -------------------- | -------------------------------------------------------------------- |
| `axios`            | backend-এ request পাঠানো                                      |
| `react-router-dom` | page-এর মধ্যে যাওয়া (`/login`, `/register`, `/`) |
| `react-icons`      | icon                                                                 |

**.env**

```
VITE_API_URL=http://localhost:3000/api
```

**.gitignore** এ `.env` আছে কি না দেখে নাও।

Backend-এ CORS ঠিক আছে কি না নিশ্চিত করো (`src/app.js`):

```js
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
```

---

## ধাপ ২: Axios instance

**src/api/axios.js**

```js
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    withCredentials: true
});

export default api;
```

কেন আলাদা ফাইল? `withCredentials: true` প্রতিটা request-এ দিতে হয়। এটা ছাড়া browser cookie সেভও করে না, পাঠায়ও না। একবার এখানে দিলে সব জায়গায় কাজ করে।

---

## ধাপ ৩: AuthContext (login অবস্থা সব page-এ জানানো)

সমস্যা: Navbar, Feed, CreatePost সবার জানা দরকার user কে। প্রতিটা component-এ আলাদা করে `/me` ডাকা বোকামি। তাই একবার ডেকে Context-এ রাখি।

**src/context/AuthContext.jsx**

```jsx
import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkAuth() {
            try {
                const res = await api.get('/auth/me');
                setUser(res.data.user);
            } catch (err) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        }

        checkAuth();
    }, []);

    async function register(username, email, password) {
        const res = await api.post('/auth/register', {
            username,
            email,
            password
        });
        setUser(res.data.user);
    }

    async function login(email, password) {
        const res = await api.post('/auth/login', { email, password });
        setUser(res.data.user);
    }

    async function logout() {
        await api.post('/auth/logout');
        setUser(null);
    }

    const value = { user, loading, register, login, logout };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}
```

ব্যাখ্যা:

- Page খুললে (refresh দিলেও) `useEffect` `/auth/me` ডাকে। Cookie থাকলে backend user দেয়, না থাকলে `401` দেয়।
- `401` এখানে error না, স্বাভাবিক উত্তর (login করা নেই)। তাই `catch`-এ `setUser(null)`।
- `loading` কেন? `/me`-এর উত্তর আসার আগে `user` থাকে `null`। তখন "login নেই" ভেবে Login page-এ পাঠিয়ে দিলে ভুল হবে। তাই উত্তর আসা পর্যন্ত অপেক্ষা।
- Refresh দিলেও login থাকে, কারণ cookie browser-এ আছে ও `/me` আবার user ফেরত দেয়।

---

## ধাপ ৪: ProtectedRoute (পাহারাদার, frontend সংস্করণ)

**src/components/ProtectedRoute.jsx**

```jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return <p className="center-text">Loading...</p>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default ProtectedRoute;
```

সতর্কতা: এটা শুধু UX-এর জন্য (user-কে ভুল page দেখানো থেকে বাঁচায়)। আসল নিরাপত্তা backend-এর `authMiddleware`-এ। কেউ frontend পাশ কাটালেও backend `401` দেবে।

---

## ধাপ ৫: Navbar

**src/components/Navbar.jsx**

```jsx
import { Link, useNavigate } from 'react-router-dom';
import { FiLogOut, FiPlusSquare, FiHome } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        try {
            await logout();
            navigate('/login');
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <nav className="navbar">
            <Link to="/" className="brand">
                PostApp
            </Link>

            <div className="nav-links">
                <Link to="/" className="nav-link">
                    <FiHome /> Feed
                </Link>

                {user ? (
                    <>
                        <Link to="/create" className="nav-link">
                            <FiPlusSquare /> New Post
                        </Link>
                        <span className="nav-user">{user.username}</span>
                        <button onClick={handleLogout} className="btn btn-outline">
                            <FiLogOut /> Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="nav-link">
                            Login
                        </Link>
                        <Link to="/register" className="nav-link">
                            Register
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}

export default Navbar;
```

`user` থাকলে New Post ও Logout দেখায়, না থাকলে Login ও Register। `user` Context থেকে আসে।

---

## ধাপ ৬: Register page

**src/pages/Register.jsx**

```jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            await register(form.username, form.email, form.password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Register failed');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="card auth-card">
            <h2>Register</h2>

            {error && <p className="error">{error}</p>}

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={form.username}
                    onChange={handleChange}
                    required
                />
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    required
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Password (min 6 characters)"
                    value={form.password}
                    onChange={handleChange}
                    minLength={6}
                    required
                />
                <button type="submit" className="btn" disabled={submitting}>
                    {submitting ? 'Please wait...' : 'Register'}
                </button>
            </form>

            <p className="muted">
                Already have an account? <Link to="/login">Login</Link>
            </p>
        </div>
    );
}

export default Register;
```

ব্যাখ্যা:

- একটা `form` state-এ তিনটা field। `name` attribute ও state-এর key এক হওয়ায় একটা `handleChange` দিয়ে সব সামলায়।
- `e.preventDefault()`: form submit-এ page reload আটকায়।
- `err.response?.data?.message`: backend-এর পাঠানো message (যেমন "এই email বা username আগে থেকেই আছে") দেখায়।
- সফল হলে backend cookie সেট করে দেয়, আমরা শুধু `navigate('/')` করি।

---

## ধাপ ৭: Login page

**src/pages/Login.jsx**

```jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            await login(form.email, form.password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="card auth-card">
            <h2>Login</h2>

            {error && <p className="error">{error}</p>}

            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    required
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                    required
                />
                <button type="submit" className="btn" disabled={submitting}>
                    {submitting ? 'Please wait...' : 'Login'}
                </button>
            </form>

            <p className="muted">
                New here? <Link to="/register">Create an account</Link>
            </p>
        </div>
    );
}

export default Login;
```

---

## ধাপ ৮: Feed page (সবার জন্য খোলা)

**src/pages/Feed.jsx**

```jsx
import { useEffect, useState } from 'react';
import api from '../api/axios';

function Feed() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchPosts() {
            try {
                const res = await api.get('/posts');
                setPosts(res.data.posts);
            } catch (err) {
                setError('Posts load করা যায়নি');
            } finally {
                setLoading(false);
            }
        }

        fetchPosts();
    }, []);

    if (loading) return <p className="center-text">Loading...</p>;
    if (error) return <p className="error center-text">{error}</p>;
    if (posts.length === 0) {
        return <p className="center-text">এখনো কোনো post নেই।</p>;
    }

    return (
        <div className="feed">
            {posts.map((post) => (
                <div className="card post" key={post._id}>
                    <div className="post-header">
                        {post.user?.username || 'Unknown'}
                    </div>
                    <img src={post.imageUrl} alt={post.caption || 'post image'} />
                    {post.caption && <p className="caption">{post.caption}</p>}
                    <small className="muted">
                        {new Date(post.createdAt).toLocaleString()}
                    </small>
                </div>
            ))}
        </div>
    );
}

export default Feed;
```

`key={post._id}`: React list-এ প্রতিটা item চিনতে unique key লাগে। `post.user?.username`: backend `populate('user', 'username')` করায় `user` object আসে।

---

## ধাপ ৯: Create Post page (শুধু login থাকলে)

**src/pages/CreatePost.jsx**

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

function CreatePost() {
    const navigate = useNavigate();

    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState('');
    const [caption, setCaption] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    function handleFileChange(e) {
        const selected = e.target.files[0];
        if (!selected) return;

        setFile(selected);
        setPreview(URL.createObjectURL(selected));
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!file) {
            setError('একটা ছবি বেছে নাও');
            return;
        }

        setError('');
        setSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('caption', caption);

            await api.post('/posts', formData);
            navigate('/');
        } catch (err) {
            if (err.response?.status === 401) {
                navigate('/login');
                return;
            }
            setError(err.response?.data?.message || 'Post করা যায়নি');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="card auth-card">
            <h2>New Post</h2>

            {error && <p className="error">{error}</p>}

            <form onSubmit={handleSubmit}>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                />

                {preview && (
                    <img src={preview} alt="preview" className="preview" />
                )}

                <textarea
                    placeholder="Caption লেখো..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={3}
                />

                <button type="submit" className="btn" disabled={submitting}>
                    {submitting ? 'Uploading...' : 'Post'}
                </button>
            </form>
        </div>
    );
}

export default CreatePost;
```

ব্যাখ্যা:

- `FormData`: ফাইল পাঠাতে JSON চলে না, `multipart/form-data` লাগে। `formData.append('image', file)`-এর `'image'` নাম backend-এর `upload.single('image')`-এর সাথে হুবহু মিলতে হবে।
- `Content-Type` header নিজে বসাবো না। Axios ও browser সঠিক boundary সহ নিজে বসায়। হাতে লিখলে ফাইল আর যায় না।
- `URL.createObjectURL`: upload করার আগেই ছবির preview দেখায়।
- `401` এলে (cookie-র মেয়াদ শেষ) Login page-এ পাঠাই।

---

## ধাপ ১০: App, main ও CSS

**src/App.jsx**

```jsx
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Feed from './pages/Feed';
import Login from './pages/Login';
import Register from './pages/Register';
import CreatePost from './pages/CreatePost';

function App() {
    return (
        <>
            <Navbar />
            <main className="container">
                <Routes>
                    <Route path="/" element={<Feed />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                        path="/create"
                        element={
                            <ProtectedRoute>
                                <CreatePost />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </main>
        </>
    );
}

export default App;
```

**src/main.jsx**

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <App />
            </AuthProvider>
        </BrowserRouter>
    </StrictMode>
);
```

ক্রম গুরুত্বপূর্ণ: `AuthProvider` `BrowserRouter`-এর ভেতরে ও `App`-এর বাইরে, যাতে সব component `useAuth()` পায়।

**src/index.css**

```css
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
    background: #f4f5f7;
    color: #1f2937;
}

a {
    color: inherit;
    text-decoration: none;
}

.navbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 24px;
    background: #ffffff;
    border-bottom: 1px solid #e5e7eb;
    position: sticky;
    top: 0;
    z-index: 10;
}

.brand {
    font-size: 20px;
    font-weight: 700;
}

.nav-links {
    display: flex;
    align-items: center;
    gap: 16px;
}

.nav-link {
    display: flex;
    align-items: center;
    gap: 6px;
}

.nav-user {
    font-weight: 600;
}

.container {
    max-width: 560px;
    margin: 24px auto;
    padding: 0 16px;
}

.card {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 20px;
}

.auth-card h2 {
    margin-bottom: 16px;
}

form {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

input,
textarea {
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 15px;
    font-family: inherit;
}

.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 16px;
    border: none;
    border-radius: 6px;
    background: #2563eb;
    color: #ffffff;
    font-size: 15px;
    cursor: pointer;
}

.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn-outline {
    background: transparent;
    color: #1f2937;
    border: 1px solid #d1d5db;
}

.error {
    color: #b91c1c;
    margin-bottom: 12px;
}

.muted {
    color: #6b7280;
    margin-top: 12px;
}

.center-text {
    text-align: center;
    margin-top: 40px;
}

.feed {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.post img {
    width: 100%;
    border-radius: 8px;
    margin: 12px 0;
    display: block;
}

.post-header {
    font-weight: 600;
}

.caption {
    margin-bottom: 8px;
}

.preview {
    width: 100%;
    max-height: 300px;
    object-fit: cover;
    border-radius: 8px;
}
```

---

## ধাপ ১১: সম্পূর্ণ flow পরীক্ষা

দুইটা terminal চালাও:

- `backend/` এ `npm run dev` (port 3000)
- `frontend/` এ `npm run dev` (port 5173)

| # | কাজ                                                                    | প্রত্যাশিত                                |
| - | ------------------------------------------------------------------------- | --------------------------------------------------- |
| 1 | `http://localhost:5173/create` সরাসরি খোলো (login ছাড়া) | `/login`-এ চলে যাবে                       |
| 2 | Register করো                                                           | Feed-এ যাবে, Navbar-এ username দেখাবে   |
| 3 | Browser refresh দাও                                                    | এখনো login থাকবে (`/me` কাজ করছে) |
| 4 | New Post-এ ছবি ও caption দাও                                      | Feed-এ নতুন post দেখাবে                  |
| 5 | Logout করো                                                             | Navbar-এ Login/Register ফিরবে                 |
| 6 | আবার `/create` খোলো                                             | `/login`-এ পাঠাবে                          |

Browser DevTools > Application > Cookies > `localhost`-এ `token` দেখা যাবে, `HttpOnly` টিক দেওয়া থাকবে। Console-এ `document.cookie` লিখলে token দেখাবে না, এটাই `httpOnly`-র প্রমাণ।

---

## ধাপ ১২: User login করা কি না, frontend কীভাবে বোঝে (সারসংক্ষেপ)

```
Page load
  -> AuthProvider: GET /api/auth/me (browser নিজে cookie পাঠায়)
       -> backend authMiddleware token যাচাই করে
            -> বৈধ হলে user পাঠায -> setUser(user)  (login আছে)
            -> না হলে 401 -> setUser(null)           (login নেই)
  -> সব component useAuth() থেকে user পায়
  -> Navbar, ProtectedRoute সেই অনুযায়ী UI বদলায়
```

Token-এর কাজ: প্রতিটা request-এ প্রমাণ দেওয়া "আমি সেই user যে আগে login করেছিল"। Cookie-র কাজ: সেই token browser-এ নিরাপদে রাখা ও নিজে পাঠানো।

---

## সাধারণ ভুল ও কারণ

| সমস্যা                                       | কারণ                                                                                                                   |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Login সফল, কিন্তু `/me`-এ `401`      | `withCredentials: true` নেই, বা backend CORS-এ `credentials: true` নেই                                        |
| CORS error                                         | backend `origin` আর frontend ঠিকানা মেলেনি (`localhost` বনাম `127.0.0.1` আলাদা ধরা হয়) |
| Cookie DevTools-এ দেখা যাচ্ছে না      | CORS credentials ভুল, বা response-এ `Set-Cookie` আসেনি                                                        |
| Post করলে `req.file` undefined               | `formData.append('image', file)`-এর নাম backend-এর সাথে মেলেনি                                          |
| Post করলে Content-Type নিয়ে সমস্যা | হাতে `Content-Type: multipart/form-data` বসানো হয়েছে, মুছে ফেলো                                  |
| Refresh দিলে logout হয়ে যায়          | `AuthProvider`-এ `/me` ডাকা হচ্ছে না, বা `loading` সামলানো হয়নি                           |
| `useAuth` থেকে `null` পড়ছে           | `AuthProvider` দিয়ে `App` মোড়ানো হয়নি                                                              |
| `import.meta.env.VITE_API_URL` undefined         | `.env` ফাইলে `VITE_` প্রিফিক্স নেই, বা `.env` বদলে dev server restart করা হয়নি       |

---

## Deploy করলে মনে রাখবে

- Frontend ও backend আলাদা domain-এ হলে cookie-তে `sameSite: 'none'` ও `secure: true` লাগে, এবং HTTPS বাধ্যতামূলক।
- Backend-এ CORS `origin` বদলে frontend-এর আসল domain দাও।
- Backend-এ proxy-র পেছনে চললে `app.set('trust proxy', 1)` লাগতে পারে।
- Frontend-এর `.env`-এ `VITE_API_URL` production backend-এর ঠিকানা দাও।

## পরের ধাপে শেখার বিষয়

1. শুধু নিজের post-এ Delete বাটন (`post.user._id === user.id` মিলিয়ে দেখানো, backend-এও যাচাই)।
2. Feed-এ pagination বা infinite scroll।
3. Form validation লাইব্রেরি (`react-hook-form`)।
4. Toast message (`react-hot-toast`)।
