# Backend Authentication Note: Express + MongoDB + JWT + Cookie + ImageKit

লক্ষ্য: basic backend setup থেকে শুরু করে ধাপে ধাপে register, login, JWT token, cookie, middleware যোগ করা। শেষে শুধু login করা user-ই image post বানাতে পারবে।

Request flow:

```
Postman/React -> app.js -> routes -> (middleware) -> controller -> model -> MongoDB
```

## শেষ folder structure

```
backend/
├── src/
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   └── post.controller.js
│   ├── db/
│   │   └── db.js
│   ├── middlewares/
│   │   └── auth.middleware.js
│   ├── models/
│   │   ├── user.model.js
│   │   └── post.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   └── post.routes.js
│   ├── services/
│   │   └── storage.service.js
│   └── app.js
├── .env
├── .gitignore
├── package.json
└── server.js
```

---

## ধাপ ১: Basic backend setup

```bash
mkdir backend
cd backend
npm init -y
npm install express mongoose dotenv
npm install -D nodemon
```

**.env**

```
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/<dbName>?retryWrites=true&w=majority
```

**.gitignore**

```
node_modules
.env
```

**src/db/db.js**

```js
const mongoose = require('mongoose');

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Database connected successfully');
    } catch (err) {
        console.error('Database connection error:', err);
    }
}

module.exports = connectDB;
```

**src/app.js**

```js
const express = require('express');

const app = express();

app.use(express.json());

module.exports = app;
```

**server.js**

```js
require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/db/db');

connectDB();

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
```

**package.json (scripts)**

```json
"scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
}
```

চালাও: `npm run dev`

কেন ভাগ করলাম:

- `app.js`: Express app বানায় ও configure করে।
- `server.js`: server চালু করে ও database connect করে।
- `db.js`: শুধু database-এর কাজ।

`express.json()` Postman/React-এর পাঠানো JSON পড়ে `req.body`-তে রাখে।

---

## ধাপ ২: User Model

**src/models/user.model.js**

```js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: true,
            minlength: 6
        }
    },
    { timestamps: true }
);

const userModel = mongoose.model('user', userSchema);

module.exports = userModel;
```

- `unique: true`: একই email/username দুইজন নিতে পারবে না।
- `lowercase: true`: `Sajib@Gmail.com` আর `sajib@gmail.com` একই।
- `timestamps: true`: `createdAt`, `updatedAt` নিজে বসে।

---

## ধাপ ৩: Register API (সরল সংস্করণ)

**src/controllers/auth.controller.js**

```js
const userModel = require('../models/user.model');

async function registerUser(req, res) {
    const { username, email, password } = req.body;

    const user = await userModel.create({
        username,
        email,
        password
    });

    res.status(201).json({
        message: 'User registered successfully',
        user
    });
}

module.exports = { registerUser };
```

**src/routes/auth.routes.js**

```js
const express = require('express');
const authController = require('../controllers/auth.controller');

const router = express.Router();

router.post('/register', authController.registerUser);

module.exports = router;
```

**src/app.js**

```js
const express = require('express');
const authRoutes = require('./routes/auth.routes');

const app = express();

app.use(express.json());

app.use('/api/auth', authRoutes);

module.exports = app;
```

Postman: `POST http://localhost:3000/api/auth/register`, Body > raw > JSON:

```json
{
    "username": "sajib",
    "email": "sajib@example.com",
    "password": "123456"
}
```

`app.use('/api/auth', authRoutes)` মানে সব auth route-এর আগে `/api/auth` বসবে।

সমস্যা: password plain text-এ save হচ্ছে। পরের ধাপে ঠিক করব।

---

## ধাপ ৪: Password hash (bcryptjs)

```bash
npm install bcryptjs
```

Database leak হলে plain password থাকলে সবার account যায়। Hash একমুখী: `123456` থেকে লম্বা অর্থহীন স্ট্রিং হয়, যা থেকে আসল password ফেরত পাওয়া যায় না। Login-এর সময় দেওয়া password-ও hash করে মিলিয়ে দেখি।

**src/controllers/auth.controller.js**

```js
const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');

async function registerUser(req, res) {
    const { username, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
        username,
        email,
        password: hashedPassword
    });

    res.status(201).json({
        message: 'User registered successfully',
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    });
}

module.exports = { registerUser };
```

- `bcrypt.hash(password, 10)`: `10` হলো salt rounds।
- Response-এ শুধু দরকারি field পাঠাই, hashed password বাইরে যায় না।

---

## ধাপ ৫: Token কেন লাগে

HTTP-তে server প্রতিটা request আলাদাভাবে দেখে, আগের request মনে রাখে না। তুমি ১০ সেকেন্ড আগে login করলেও পরের request-এ server জানে না তুমি কে।

সমাধান: Token। সিনেমা হলের টিকিটের মতো:

1. Login করলে (কাউন্টারে টাকা দিলে)।
2. Server তোমাকে token (টিকিট) দিল।
3. প্রতিটা request-এ তুমি টিকিট দেখাও।
4. Server টিকিট যাচাই করে বোঝে তুমি বৈধ user।

JWT-এর তিন অংশ:

```
header.payload.signature
```

- payload: ভেতরের তথ্য, যেমন `{ id: "user-এর _id" }`
- signature: server-এর `JWT_SECRET` দিয়ে করা সই

কেউ payload বদলে অন্য user-এর id বসালে signature মিলবে না, কারণ সে `JWT_SECRET` জানে না। তাই server প্রত্যাখ্যান করবে।

সতর্কতা: payload encrypt না, শুধু encode। পড়া যায়। তাই password বা গোপন তথ্য token-এ রাখবে না, শুধু `id`।

---

## ধাপ ৬: Token তৈরি

```bash
npm install jsonwebtoken
```

**.env**-এ যোগ করো:

```
JWT_SECRET=এখানে_অনেক_লম্বা_র‍্যান্ডম_স্ট্রিং
```

Secret বানানো:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Secret কোডে লিখলে GitHub-এ গিয়ে যে কেউ নকল token বানাতে পারবে, তাই `.env`-এ।

```js
const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
);
```

`expiresIn` না দিলে চুরি হওয়া token চিরকাল চলবে। পুরো ফাইল ধাপ ৮-এ আছে।

---

## ধাপ ৭: Cookie-তে token রাখা

| জায়গা    | সমস্যা                                                                                 |
| --------------- | -------------------------------------------------------------------------------------------- |
| React state     | refresh দিলে হারিয়ে যায়                                                     |
| localStorage    | JavaScript পড়তে পারে, XSS-এ চুরি হতে পারে                              |
| httpOnly cookie | JavaScript পড়তে পারে না, browser নিজে প্রতিটা request-এ পাঠায় |

Cookie কীভাবে কাজ করে:

1. Login/register সফল হলে server বলে "এই cookie সেভ করো"।
2. Browser সংরক্ষণ করে।
3. পরের প্রতিটা request-এ browser নিজে cookie জুড়ে দেয়।
4. Server cookie থেকে token পড়ে।

```bash
npm install cookie-parser
```

`cookie-parser` কাঁচা `Cookie` header ভেঙে `req.cookies` object বানায়।

**src/app.js**

```js
const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth.routes');

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);

module.exports = app;
```

Cookie options:

```js
res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
});
```

- `httpOnly: true`: `document.cookie` দিয়ে পড়া যায় না।
- `secure`: production-এ শুধু HTTPS-এ যাবে।
- `sameSite: 'lax'`: অন্য সাইট থেকে আসা অনুরোধে cookie যাওয়া সীমিত করে (CSRF সুরক্ষা)।
- `maxAge`: মিলিসেকেন্ডে, এখানে ৭ দিন।

---

## ধাপ ৮: Login ও Logout সহ সম্পূর্ণ auth.controller.js

**src/controllers/auth.controller.js**

```js
const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
};

function createToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });
}

async function registerUser(req, res) {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                message: 'username, email ও password দিতে হবে'
            });
        }

        const existingUser = await userModel.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(409).json({
                message: 'এই email বা username আগে থেকেই আছে'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            username,
            email,
            password: hashedPassword
        });

        const token = createToken(user._id);
        res.cookie('token', token, cookieOptions);

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
}

async function loginUser(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'email ও password দিতে হবে'
            });
        }

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = createToken(user._id);
        res.cookie('token', token, cookieOptions);

        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
}

async function logoutUser(req, res) {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });

    res.status(200).json({ message: 'Logout successful' });
}

async function getMe(req, res) {
    res.status(200).json({ user: req.user });
}

module.exports = { registerUser, loginUser, logoutUser, getMe };
```

- `bcrypt.compare(plain, hashed)`: hash থেকে password ফেরত আনা যায় না, তাই compare করে মেলায়।
- email ভুল বা password ভুল, একই message দিই। আলাদা দিলে আক্রমণকারী জানবে কোন email সিস্টেমে আছে।
- `$or`: email অথবা username মিললেই duplicate।
- Logout মানে server-এ cookie মুছে দেওয়া।

**src/routes/auth.routes.js**

```js
const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.post('/logout', authController.logoutUser);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
```

---

## ধাপ ৯: Server কীভাবে বোঝে user login করা (Middleware)

প্রতিটা সুরক্ষিত route-এর আগে একজন পাহারাদার (middleware) বসাই:

```
Request আসে
   |
cookie-তে token আছে?  -- না --> 401
   | হ্যাঁ
signature ঠিক আছে ও মেয়াদ ফুরায়নি?  -- না --> 401
   | হ্যাঁ
token-এর id দিয়ে database-এ user আছে?  -- না --> 401
   | হ্যাঁ
req.user = সেই user, next() দিয়ে controller-এ যাও
```

**src/middlewares/auth.middleware.js**

```js
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');

async function authMiddleware(req, res, next) {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({
                message: 'Unauthorized: login করা নেই'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({
                message: 'Unauthorized: user পাওয়া যায়নি'
            });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({
            message: 'Unauthorized: token সঠিক নয় বা মেয়াদ শেষ'
        });
    }
}

module.exports = authMiddleware;
```

- `req.cookies.token`: `cookie-parser` আছে বলেই পাওয়া যায়।
- `jwt.verify`: signature ও মেয়াদ দুটোই যাচাই করে, ভুল হলে error ছোড়ে।
- `.select('-password')`: password field বাদ দেয়।
- `req.user = user`: পরের controller জানে কে request করছে।
- `next()`: পরের ধাপে যাও।

Test: login করে `GET /api/auth/me` দিলে user আসবে। logout করে আবার দিলে `401`।

---

## ধাপ ১০: Post model ও সুরক্ষিত route (imageUrl সরাসরি দিয়ে)

আগে authentication test করার জন্য `imageUrl` সরাসরি body-তে পাঠাই। ImageKit upload ধাপ ১১-তে।

**src/models/post.model.js**

```js
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
    {
        imageUrl: {
            type: String,
            required: true
        },
        caption: {
            type: String,
            default: '',
            trim: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true
        }
    },
    { timestamps: true }
);

const postModel = mongoose.model('post', postSchema);

module.exports = postModel;
```

`user` field-এ post-এর মালিকের `_id` থাকে। `ref: 'user'` দিয়ে `populate` করা যায়।

**src/controllers/post.controller.js**

```js
const postModel = require('../models/post.model');

async function createPost(req, res) {
    try {
        const { imageUrl, caption } = req.body;

        if (!imageUrl) {
            return res.status(400).json({ message: 'imageUrl দিতে হবে' });
        }

        const post = await postModel.create({
            imageUrl,
            caption,
            user: req.user._id
        });

        res.status(201).json({
            message: 'Post created successfully',
            post
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
}

async function getPosts(req, res) {
    try {
        const posts = await postModel
            .find()
            .populate('user', 'username')
            .sort({ createdAt: -1 });

        res.status(200).json({ posts });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
}

module.exports = { createPost, getPosts };
```

`user: req.user._id` middleware থেকে আসে, body থেকে না। Body থেকে নিলে যে কেউ অন্যের নামে post বানাতে পারত।

**src/routes/post.routes.js**

```js
const express = require('express');
const postController = require('../controllers/post.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/', authMiddleware, postController.createPost);
router.get('/', postController.getPosts);

module.exports = router;
```

**src/app.js (চূড়ান্ত, ধাপ ১২-এর CORS সহ)**

```js
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const postRoutes = require('./routes/post.routes');

const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

module.exports = app;
```

(`npm install cors` লাগবে। শুধু Postman-এ test করলে CORS ছাড়াও চলে।)

### Postman test ক্রম

| # | Request                                                                                       | প্রত্যাশিত     |
| - | --------------------------------------------------------------------------------------------- | ------------------------ |
| 1 | `POST /api/posts` (login ছাড়া)                                                        | 401                      |
| 2 | `POST /api/auth/register`                                                                   | 201, cookie সেট       |
| 3 | `POST /api/posts` body: `{ "imageUrl": "https://example.com/a.jpg", "caption": "first" }` | 201                      |
| 4 | `GET /api/posts`                                                                            | post-এর তালিকা   |
| 5 | `POST /api/auth/logout`                                                                     | cookie মুছে যায় |
| 6 | আবার `POST /api/posts`                                                                  | 401                      |

---

## ধাপ ১১: ImageKit + multer দিয়ে আসল image upload

Flow:

```
React form (image + caption) -> multer (ফাইল memory-তে) -> ImageKit upload -> URL -> MongoDB
```

```bash
npm install multer imagekit
```

নোট: এখানে `imagekit` package ধরেছি। তোমার আগের প্রজেক্টে অন্য ImageKit package (যেমন `@imagekit/nodejs`) থাকলে সেটাই ব্যবহার করো এবং শুধু `storage.service.js` ফাইলের upload অংশ বদলাও। বাকি কিছু বদলাতে হবে না।

**.env**-এ যোগ করো (ImageKit dashboard > API keys থেকে):

```
IMAGEKIT_PUBLIC_KEY=your_public_key
IMAGEKIT_PRIVATE_KEY=your_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
```

Private key কখনো GitHub, চ্যাট বা screenshot-এ দেবে না।

**src/services/storage.service.js**

```js
const ImageKit = require('imagekit');

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

async function uploadImage(buffer, fileName) {
    const result = await imagekit.upload({
        file: buffer,
        fileName,
        folder: '/posts'
    });

    return result.url;
}

module.exports = { uploadImage };
```

**src/controllers/post.controller.js (ImageKit সহ সম্পূর্ণ)**

```js
const postModel = require('../models/post.model');
const { uploadImage } = require('../services/storage.service');

async function createPost(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'image ফাইল দিতে হবে' });
        }

        const { caption } = req.body;

        const imageUrl = await uploadImage(
            req.file.buffer,
            req.file.originalname
        );

        const post = await postModel.create({
            imageUrl,
            caption,
            user: req.user._id
        });

        res.status(201).json({
            message: 'Post created successfully',
            post
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
}

async function getPosts(req, res) {
    try {
        const posts = await postModel
            .find()
            .populate('user', 'username')
            .sort({ createdAt: -1 });

        res.status(200).json({ posts });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
}

module.exports = { createPost, getPosts };
```

**src/routes/post.routes.js (multer সহ সম্পূর্ণ)**

```js
const express = require('express');
const multer = require('multer');
const postController = require('../controllers/post.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('শুধু image ফাইল দেওয়া যাবে'));
        }
    }
});

router.post(
    '/',
    authMiddleware,
    upload.single('image'),
    postController.createPost
);
router.get('/', postController.getPosts);

module.exports = router;
```

ব্যাখ্যা:

- `express.json()` ফাইল পড়তে পারে না। ফাইল আসে `multipart/form-data` হিসেবে, সেটা multer পড়ে।
- `memoryStorage()`: ফাইল disk-এ না রেখে RAM-এ (`req.file.buffer`) রাখে, তারপর সরাসরি ImageKit-এ যায়।
- `upload.single('image')`: form-এর field-এর নাম `image` হতে হবে। নাম না মিললে `req.file` undefined থাকবে।
- Middleware ক্রম গুরুত্বপূর্ণ: আগে `authMiddleware`, তারপর `upload`। এতে login না থাকলে ফাইল প্রসেসই হয় না।
- `limits.fileSize`: ৫MB-র বেশি ফাইল আটকায়।
- Text field (`caption`) multer-এর পরে `req.body`-তে আসে।

Postman test: `POST /api/posts`, Body > form-data:

- key `image` (type: File): একটা ছবি
- key `caption` (type: Text): `my first post`

আগে login করা থাকতে হবে।

---

## ধাপ ১২: React-এর সাথে জুড়লে

Cookie ব্যবহার করলে দুই জায়গায় সেটিং লাগে।

Backend:

```bash
npm install cors
```

```js
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
```

`origin`-এ React app-এর আসল ঠিকানা দাও। `origin: '*'` আর `credentials: true` একসাথে চলে না।

Frontend (axios):

```js
axios.post('http://localhost:3000/api/auth/login', data, {
    withCredentials: true
});
```

`fetch` হলে `credentials: 'include'`। এটা ছাড়া browser cookie পাঠায়ও না, সেভও করে না। প্রতিটা request-এ দিতে হবে।

Image post পাঠানো:

```js
const formData = new FormData();
formData.append('image', file);
formData.append('caption', caption);

axios.post('http://localhost:3000/api/posts', formData, {
    withCredentials: true
});
```

`Content-Type` header নিজে বসাবে না, browser সঠিক boundary সহ বসিয়ে দেয়।

---

## পুরো flow এক নজরে

```
[Login]
React -> POST /api/auth/login (email, password)
  -> password মেলায় (bcrypt.compare)
  -> jwt.sign({id}) দিয়ে token বানায়
  -> res.cookie('token', ...) দিয়ে cookie সেট করে

[Post তৈরি]
React -> POST /api/posts (browser নিজে cookie জুড়ে দেয়)
  -> cookieParser: req.cookies.token পড়ে
  -> authMiddleware: jwt.verify -> user খুঁজে -> req.user সেট
  -> multer: ফাইল req.file-এ
  -> controller: ImageKit-এ upload -> URL সহ MongoDB-তে save
```

---

## সাধারণ ভুল ও কারণ

| সমস্যা                             | কারণ                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------- |
| `req.cookies` undefined                | `cookieParser()` লাগানো হয়নি, বা route-এর পরে লাগানো |
| `req.body` undefined                   | `express.json()` নেই (form-data হলে multer লাগে)                    |
| `req.file` undefined                   | form field নাম `image` না, বা Postman-এ type `File` না            |
| `secretOrPrivateKey must have a value` | `.env`-এ `JWT_SECRET` নেই, বা `dotenv.config()` আগে চলেনি   |
| React থেকে cookie যাচ্ছে না  | `withCredentials: true` নেই, বা CORS-এ `credentials: true` নেই     |
| `jwt malformed`                        | cookie-তে ভুল বা ফাঁকা token                                        |
| `E11000 duplicate key`                 | একই email/username আবার register                                         |
| ImageKit `Authentication` error        | `.env`-এর key বা URL endpoint ভুল                                      |

---

## কোন ফাইল কী কাজ করে

| ফাইল                               | কাজ                                                         |
| -------------------------------------- | -------------------------------------------------------------- |
| `server.js`                          | server চালু ও DB connect                                  |
| `src/app.js`                         | middleware ও route জোড়া                                 |
| `src/db/db.js`                       | MongoDB connection                                             |
| `src/models/user.model.js`           | user-এর নকশা                                             |
| `src/models/post.model.js`           | post-এর নকশা                                             |
| `src/controllers/auth.controller.js` | register, login, logout, me                                    |
| `src/controllers/post.controller.js` | post তৈরি ও feed                                          |
| `src/middlewares/auth.middleware.js` | token যাচাই                                               |
| `src/routes/auth.routes.js`          | auth URL                                                       |
| `src/routes/post.routes.js`          | post URL (create সুরক্ষিত)                             |
| `src/services/storage.service.js`    | ImageKit upload                                                |
| `.env`                               | `MONGO_URI`, `JWT_SECRET`, ImageKit key                    |
| `.gitignore`                         | `.env`, `node_modules` GitHub-এ যাওয়া আটকায় |

---

## পরের ধাপে শেখার বিষয়

1. React-এ Login/Register form ও `/api/auth/me` দিয়ে login অবস্থা চেনা।
2. শুধু নিজের post delete করা (`post.user.equals(req.user._id)` মিলিয়ে)।
3. `express-validator` দিয়ে input যাচাই।
4. Production-এ cookie: `secure: true`, `sameSite: 'none'` (frontend ও backend আলাদা domain হলে) ও HTTPS।
