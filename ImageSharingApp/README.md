# Image Post Sharing App

**প্রস্তাবিত শেখার project name:** Image Post Sharing App — React, Express, MongoDB ও ImageKit

এই folder-এ একটি ছোট full-stack app আছে: React form থেকে image ও caption পাঠানো হয়, Express backend image-টি ImageKit-এ upload করে, MongoDB-তে image URL ও caption save করে, এবং Feed page-এ post-গুলো দেখায়।

> **নামের বিষয়ে:** folder-এর নাম `Authentication`, কিন্তু বর্তমান code-এ login, register, password, session বা token-based authentication নেই। এখনকার কাজটি image post create ও feed দেখানো। তাই README-তে প্রকৃত feature অনুযায়ী নাম দেওয়া হয়েছে; authentication এই project-এর পরের শেখার ধাপ হতে পারে।

## আগের দুই project-এর সঙ্গে সম্পর্ক

1. [`REST API` project](../REST%20API/README.md)-এ Express route, HTTP method ও Postman দিয়ে CRUD শেখা হয়েছে; data ছিল memory-র array-তে।
2. [`Mongoose and Schema` project](../Mongoose%20and%20Schema/readme.md)-এ Express API-র সঙ্গে Mongoose/MongoDB দিয়ে Notes সংরক্ষণ শেখা হয়েছে।
3. এই project-এ সেই backend ধারণার সঙ্গে React frontend, browser থেকে multipart image upload, Multer, ImageKit cloud storage এবং CORS যোগ হয়েছে।

```text
React form
  ├─ image file
  └─ caption
       ↓ Axios: multipart/form-data
Express API + Multer
       ↓ image buffer
ImageKit: image file store করে, URL দেয়
       ↓ URL + caption
Mongoose Model → MongoDB: post তথ্য রাখে
       ↓ GET /posts
React Feed: image ও caption দেখায়
```

## ফোল্ডার ও ফাইলের দায়িত্ব

```text
Authentication/
├── README.md
├── Backend/
│   ├── .env                         # local secrets; commit করা যাবে না
│   ├── .gitignore                   # .env ignore করে
│   ├── package.json                # backend dependencies
│   ├── server.js                   # environment, DB connection, HTTP server
│   └── src/
│       ├── app.js                  # Express, CORS ও API routes
│       ├── db/
│       │   └── db.js               # MongoDB connection
│       ├── models/
│       │   └── post.model.js       # Post schema ও model
│       └── services/
│           └── storage.service.js  # ImageKit upload
└── Frontend/
    ├── package.json                # React/Vite dependencies ও scripts
    ├── index.html                  # Vite HTML entry
    ├── vite.config.js              # Vite React plugin
    └── src/
        ├── main.jsx                # React app mount
        ├── App.jsx                 # /create-post ও /feed routes
        ├── index.css               # page ও post-card styling
        └── pages/
            ├── CreatePost.jsx      # form, Axios POST, feed-এ navigate
            └── Feed.jsx            # Axios GET ও post list
```

### Backend

- **`server.js`** `.env` load করে, app ও DB connection import করে, `connectDB()` call করে এবং port `3000`-এ server চালায়।
- **`src/app.js`** Express app তৈরি করে। `cors()` browser frontend-কে API call করতে দেয়; `express.json()` JSON body parse করে। Post create ও list করার routes এখানেই।
- **`src/db/db.js`** `MONGO_URI` ব্যবহার করে Mongoose-কে MongoDB-তে connect করে।
- **`src/models/post.model.js`** Post document-এর `image` ও `caption` field-এর schema define করে। Image field-এ image data নয়, ImageKit থেকে পাওয়া URL রাখা হয়।
- **`src/services/storage.service.js`** ImageKit client তৈরি করে, uploaded file buffer-কে Base64-এ রূপান্তর করে ImageKit-এ পাঠায়, result ফেরত দেয়।
- **`Backend/.env`**-এ MongoDB URI ও ImageKit private key থাকে। এর কোনো value source code বা README-তে বসিও না।
- **`Backend/.gitignore`** `.env` file ignore করে। তারপরও commit-এর আগে `git status`-এ secret stage হচ্ছে কি না দেখে নাও।

### Frontend

- **`src/main.jsx`** React app-কে HTML-এর `root` element-এ render করে।
- **`src/App.jsx`** React Router দিয়ে `/create-post` ও `/feed` page নির্বাচন করে। অন্য path-এর জন্য route নেই।
- **`CreatePost.jsx`** form submit আটকায়, `FormData` তৈরি করে Axios দিয়ে `/create-post`-এ পাঠায়; সফল হলে `/feed`-এ যায়।
- **`Feed.jsx`** page mount হলে `/posts` থেকে post আনে এবং image ও caption দেখায়। শুরুতে একটি sample post state-এ আছে; API request সফল হলে response দিয়ে সেটি প্রতিস্থাপিত হয়।
- **`index.css`** create form, feed ও post card-এর basic style-গুলো রাখে։
- **`Frontend/README.md`**-টি Vite template-এর README; full-stack project-এর setup নির্দেশনা এই root README-তে আছে।

## Packages: কোনটি কোথায় লাগে?

### Backend `Backend/package.json`

| Package | ব্যবহার |
|---|---|
| `express` | HTTP server ও API route তৈরি |
| `mongoose` | MongoDB connection, schema, model ও query |
| `dotenv` | `.env` থেকে environment variable load |
| `cors` | browser frontend থেকে cross-origin API call অনুমতি |
| `multer` | `multipart/form-data` file upload parse; এখানে memory storage |
| `@imagekit/nodejs` | ImageKit-এ image upload |

### Frontend `Frontend/package.json`

| Package | ব্যবহার |
|---|---|
| `react`, `react-dom` | UI component তৈরি ও browser-এ render |
| `react-router-dom` | `/create-post`, `/feed` client-side routes |
| `axios` | backend HTTP request পাঠানো |
| `vite` | frontend development server ও production build |
| `@vitejs/plugin-react` | Vite-এ React support |
| `eslint` ও config/plugins | JavaScript/React lint |

Package-গুলো আগেই `package.json`-এ declare করা আছে। আলাদা করে সব install করার বদলে দুই project folder-এ `npm install` চালাও। Postman ঐচ্ছিক API testing tool, npm dependency নয়।

## Local setup

Node.js/npm, MongoDB (local বা Atlas), এবং ImageKit account/key প্রয়োজন।

### 1. Environment variables

`Backend/.env` file-এ:

```env
MONGO_URI=mongodb://127.0.0.1:27017/image_posts
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
```

- উপরের Mongo URI local MongoDB-র উদাহরণ। Atlas ব্যবহার করলে নিজের Atlas connection URI দাও।
- ImageKit account/dashboard থেকে private key নিয়ে `IMAGEKIT_PRIVATE_KEY`-এ বসাও।
- উদাহরণের value-গুলো placeholder; এগুলো বাস্তব credential নয়।
- Secret শুধু local `.env` বা hosting provider-এর secret environment variables-এ রাখো। Git-এ `.env` আছে কি না যাচাই করো, public-এ key পাঠিও না।

### 2. Backend install ও start

PowerShell-এর প্রথম terminal:

```powershell
cd "D:\My project\Mastering Backend\Authentication\Backend"
npm install
node server.js
```

সফল MongoDB connection হলে `Connected to DB` log হওয়ার কথা। API বর্তমানে `http://localhost:3000`-এ চলে।

### 3. Frontend install ও start

দ্বিতীয় terminal:

```powershell
cd "D:\My project\Mastering Backend\Authentication\Frontend"
npm install
npm run dev
```

Vite terminal-এ যে local URL দেখায় সেটি browser-এ খোলো—সাধারণত `http://localhost:5173`।

## Browser-এ app ব্যবহার

1. Backend ও frontend—দুটিই চালু রাখো।
2. `http://localhost:5173/create-post` খোলো।
3. Image select করে caption লিখে Submit চাপো।
4. Browser form-কে `FormData` করে backend-এ পাঠায়।
5. Backend ImageKit-এ image upload করে URL পায়, তারপর URL ও caption MongoDB-তে save করে।
6. সফল হলে frontend `/feed` page-এ যায়।
7. Feed `/posts` endpoint call করে MongoDB-তে থাকা post-গুলো দেখায়।

## API ও Postman দিয়ে পরীক্ষা

API base URL: `http://localhost:3000`

| কাজ | Method | Endpoint | সফল status |
|---|---|---|---:|
| Image ও caption-সহ post তৈরি | `POST` | `/create-post` | `201` |
| সব post পড়া | `GET` | `/posts` | `200` |

### `POST /create-post`

Postman-এ:

1. Method `POST`, URL `http://localhost:3000/create-post` নির্বাচন করো।
2. **Body → form-data** নির্বাচন করো।
3. `image` নামে key যোগ করে type **File** করো এবং image select করো।
4. `caption` নামে key যোগ করে type **Text** করো এবং caption দাও।
5. Send চাপো।

Backend-এ `upload.single("image")` field-এর নাম `image` হতে হবে। Multer file-টি `req.file`-এ রাখে; caption `req.body.caption`-এ পাওয়া যায়। সফল হলে `201` response-এ তৈরি post ফেরত আসে।

> Postman-এ `multipart/form-data` manually `Content-Type` header লিখতে হয় না; Postman boundary-সহ header নিজে তৈরি করতে দেয়।

### `GET /posts`

```http
GET http://localhost:3000/posts
```

সফল response-এ `posts` array আসে:

```json
{
  "message": "Posts fetched successfully",
  "posts": [
    {
      "_id": "MongoDB-generated-id",
      "image": "https://imagekit-url/example.jpg",
      "caption": "আমার প্রথম post"
    }
  ]
}
```

`_id` ও image URL উদাহরণ; বাস্তবে database ও ImageKit যে value তৈরি করে তা আসবে।

## কোন storage-এ কোন data থাকে?

- **Browser/Form:** submit-এর আগে user-এর নির্বাচিত file ও caption।
- **Multer memory storage:** request চলাকালীন image-এর buffer RAM-এ থাকে; local disk-এ upload করা হয় না।
- **ImageKit:** image file রাখে এবং image URL ফেরত দেয়।
- **MongoDB:** `post` document-এ `image` URL ও `caption` রাখে; image binary রাখে না।

এই design-এর সুবিধা—MongoDB document-এ বড় image binary না রেখে hosted URL রাখা যায়। এর জন্য ImageKit key ও MongoDB connection দুটোই ঠিকভাবে configure থাকতে হয়।

## আগের project-গুলোর থেকে কী নতুন?

| বিষয় | REST API | Mongoose and Schema | এই project |
|---|---|---|---|
| Client | Postman | Postman | React page এবং Postman |
| Data | process memory | MongoDB Notes | MongoDB post metadata |
| File upload | নেই | নেই | Multer দিয়ে image request নেওয়া |
| Image storage | নেই | নেই | ImageKit |
| Browser API call | নেই | নেই | Axios |
| UI routing | নেই | নেই | React Router |
| CORS | প্রয়োজন হয়নি | প্রয়োজন হয়নি | Frontend/backend আলাদা origin হওয়ায় চালু |
| Authentication | নেই | নেই | নেই—folder-এর নাম দেখে ধরে নেওয়া যাবে না |

## শেখার সীমাবদ্ধতা ও উন্নতির জায়গা

এগুলো repository-তে এখনকার implementation-এর অবস্থা; README-তে লেখা আছে বলে feature সম্পন্ন—এমন নয়।

1. **Authentication নেই:** user account, login, password hashing, access token, protected route—কোনোটিই implement করা হয়নি। পরের ধাপে authentication যোগ করলে post-কে user-এর সঙ্গে associate করাও শেখা যাবে।
2. **Image বাধ্যতামূলক নয়:** frontend file input-এ `required` নেই, কিন্তু backend সরাসরি `req.file.buffer` ব্যবহার করে। Image না পাঠালে handler ব্যর্থ হতে পারে।
3. **Upload validation/limit নেই:** `accept="image/*"` browser-এর hint মাত্র। Backend file type ও file size enforce করে না; Multer memory storage-এ বড় upload RAM ব্যবহার বাড়াতে পারে।
4. **Error handling সীমিত:** ImageKit/MongoDB error-এর জন্য route-এ স্পষ্ট status/centralized handler নেই। Feed request-এও `.catch()` নেই।
5. **DB connection lifecycle:** `server.js` `connectDB()` call করে কিন্তু `await` করে না; connection নিশ্চিত হওয়ার আগে server listen হতে পারে।
6. **CORS খোলা:** `cors()`-এ origin restriction দেওয়া নেই। Production-এ frontend domain অনুমোদন করে configure করা উচিত।
7. **ImageKit file metadata:** upload-এ filename hard-coded `image.jpg`; extension/name uniqueness, file cleanup, delete/update flow নেই।
8. **Feed sample data:** `Feed.jsx`-এ initial mock post আছে। API request fail হলে sample post state-এ থেকে যেতে পারে; loading/error state-ও নেই।
9. **Buffer log হচ্ছে:** `storage.service.js` upload-এর আগে `buffer` console-এ print করে। Production-এ uploaded file-এর bytes log করা উচিত নয়।
10. **Port/API URL hard-coded:** frontend API URL `http://localhost:3000`; backend port `3000`-এ hard-coded। Deploy-এ environment-specific configuration লাগবে।
11. **Automated tests নেই:** backend `npm test` placeholder; frontend-এ test script নেই। Frontend-এর `npm run lint` ও `npm run build` script আছে।
12. **UI সীমিত:** `/` বা অচেনা path-এর route নেই; user experience এখন শেখার demo-র পর্যায়ে।

## Deployment শেখার checklist

এই repository-তে কোনো hosting setup বা live URL নেই। Deploy করার আগে:

1. Backend ও frontend hosting target বেছে নিয়ে তাদের build/start command যাচাই করো।
2. Backend-এ `MONGO_URI` ও `IMAGEKIT_PRIVATE_KEY` hosting secrets হিসেবে সেট করো; `.env` deploy artifact বা Git-এ দিও না।
3. Backend port-কে hosting-এর `PORT` environment variable থেকে নিতে শেখো এবং database connection সফল হওয়ার পর server start করো।
4. Frontend-এর localhost API URL-কে deployed backend URL-র configuration-এ বদলানোর ব্যবস্থা করো।
5. Backend CORS-এ deployed frontend origin অনুমোদন করো।
6. Image upload size/type validation, error responses, logging ও authentication/access control যোগ করো।
7. Deploy-পরবর্তী live URL-এ post upload ও feed fetch Postman/browser-এ যাচাই করো। Secret console log-এ রেখো না।

## Revision checklist

- [ ] Frontend form কীভাবে `FormData` তৈরি করে API-তে পাঠায় বুঝি।
- [ ] `multipart/form-data` আর JSON body-র পার্থক্য জানি।
- [ ] `upload.single("image")` কেন form-এর `image` field name-এর সঙ্গে মেলাতে হয় বুঝি।
- [ ] Multer buffer, ImageKit upload ও ফেরত আসা URL-এর flow বলতে পারি।
- [ ] MongoDB-তে image file নয়, URL ও caption save হয়—ব্যাখ্যা করতে পারি।
- [ ] Mongoose model দিয়ে `POST /create-post` ও `GET /posts` কীভাবে কাজ করে বলতে পারি।
- [ ] Axios, React Router, CORS, dotenv, Multer, ImageKit-এর ভূমিকা বলতে পারি।
- [ ] `Authentication` folder-এ authentication code এখনো নেই—চিহ্নিত করতে পারি।

## নিজে অনুশীলন

1. Postman-এ `/create-post`-এ `image` ও `caption` পাঠিয়ে response পরীক্ষা করো।
2. MongoDB-তে তৈরি post দেখে `image` field-এ ImageKit URL আছে কি না যাচাই করো।
3. Browser-এ `/feed` খুলে backend-এর `GET /posts` response-এর সঙ্গে মিলিয়ে দেখো।
4. Image না পাঠালে API-র কী করা উচিত ঠিক করে validation ও error response পরিকল্পনা করো।
5. পরের ধাপে user-ভিত্তিক post সংরক্ষণের জন্য authentication flow নকশা করো।
