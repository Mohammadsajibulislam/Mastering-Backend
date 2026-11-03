# REST API — memory-তে Notes backend

এই ফোল্ডারটি backend শেখার প্রথম ধাপ: Express দিয়ে REST API তৈরি করা, HTTP request নেওয়া, Postman দিয়ে পরীক্ষা করা, এবং আপাতত JavaScript array-তে data রাখা। এখানে কোনো database যুক্ত নেই।

> **এখনকার অবস্থা:** API চালানো ও শেখার জন্য উপযোগী, production-ready নয়। Notes শুধু server-এর memory-তে থাকে; server restart হলে data মুছে যায়।

## শেখার লক্ষ্য

- Node.js-এ Express server চালানো
- `req`, `res`, route ও middleware বোঝা
- JSON request body পড়া
- HTTP method এবং status code ব্যবহার করা
- Postman দিয়ে GET, POST, PATCH ও DELETE পরীক্ষা করা
- database ছাড়া CRUD-এর flow বোঝা

## ফাইল ও দায়িত্ব

```text
REST API/
├── server.js       # app import করে port 3000-এ server চালায়
├── src/
│   └── app.js      # Express app, JSON middleware ও API routes
├── package.json    # project metadata ও dependency list
├── package-lock.json
└── .gitignore      # node_modules ignore করে
```

- **`server.js`** entry point। `src/app.js` থেকে Express app নেয় এবং `app.listen(3000)` দিয়ে HTTP server চালু করে।
- **`src/app.js`**-এ `express()` দিয়ে app তৈরি হয়। `express.json()` JSON body-কে parse করে `req.body`-তে দেয়। এরপর routes তৈরি এবং app export করা হয়।
- **`package.json`** এই project-এর dependency ঘোষণা করে। এই project-এ বর্তমানে `express` আছে। `package-lock.json` dependency-র নির্দিষ্ট resolved version ধরে রাখে।
- `notes` নামে array-টি `src/app.js`-এর process memory-তে থাকে; এটি MongoDB বা অন্য কোনো storage নয়।

## Install ও চালানো

Node.js এবং npm install করা থাকতে হবে। PowerShell বা terminal-এ:

```powershell
cd "D:\My project\Mastering Backend\REST API"
npm install
node server.js
```

Server চালু হলে `http://localhost:3000`-এ request পাঠানো যাবে। বন্ধ করতে terminal-এ `Ctrl+C` চাপো।

এই project-এ `express`-ই API-র runtime dependency। `nodemon` ব্যবহার করতে চাইলে সেটি ঐচ্ছিক:

```powershell
npm install --save-dev nodemon
npx nodemon server.js
```

Postman development dependency নয়; এটি API request পাঠানোর আলাদা client application।

## REST API কী?

REST হলো HTTP-র উপর resource-কেন্দ্রিক API সাজানোর একটি প্রচলিত পদ্ধতি। এখানে resource হলো **notes**:

| কাজ | HTTP method | Endpoint | সফল status |
|---|---|---|---:|
| সব note দেখা | `GET` | `/notes` | `200` |
| note যোগ করা | `POST` | `/notes` | `201` |
| array index দিয়ে note বদলানো | `PATCH` | `/notes/:index` | `200` |
| array index দিয়ে note মুছতে চেষ্টা করা | `DELETE` | `/notes/:index` | `200` |

`:` দিয়ে দেখানো `index` route parameter। যেমন `/notes/0`-এ `req.params.index` হবে `"0"`। এই implementation MongoDB `_id` ব্যবহার করে না।

## Postman দিয়ে পরীক্ষা

প্রথমে server চালু করো। Postman-এ URL হিসেবে `http://localhost:3000` ব্যবহার করো। POST/PATCH-এর ক্ষেত্রে **Body → raw → JSON** নির্বাচন করে `Content-Type: application/json` পাঠাও।

### 1. Note তৈরি — POST `/notes`

```http
POST http://localhost:3000/notes
Content-Type: application/json
```

```json
{
  "title": "Backend revision",
  "description": "Express route ও request body অনুশীলন"
}
```

প্রত্যাশিত response:

```json
{
  "message": "Note created successfully"
}
```

বর্তমান code পুরো `req.body` array-তে push করে। তাই এখানে `title` ও `description` পাঠানোই অনুশীলনের উপযুক্ত format।

### 2. সব note দেখা — GET `/notes`

```http
GET http://localhost:3000/notes
```

Response-এ `notes` property-র ভেতরে memory-তে থাকা সব item আসবে:

```json
{
  "message": "Notes fetched successfully",
  "notes": [
    {
      "title": "Backend revision",
      "description": "Express route ও request body অনুশীলন"
    }
  ]
}
```

### 3. Note update — PATCH `/notes/:index`

প্রথম item-এর index `0`, তাই:

```http
PATCH http://localhost:3000/notes/0
Content-Type: application/json
```

```json
{
  "title": "Updated title",
  "description": "Updated description"
}
```

এই route দুটি field-ই সরাসরি বদলায়। আংশিক update করতে চাইলে বর্তমান handler-টি যথেষ্ট robust নয়।

### 4. Note delete — DELETE `/notes/:index`

```http
DELETE http://localhost:3000/notes/0
```

এখানে একটি শেখার মতো implementation detail আছে: `delete notes[index]` array item-টি সরিয়ে array ছোট করে না; ওই জায়গায় empty slot রেখে দেয়। JSON response-এ সেই slot `null` হিসেবে দেখা যেতে পারে। বাস্তবে সাধারণত `splice()` বা ID-ভিত্তিক storage ব্যবহার করা হয়।

## Request-এর ভেতরের data কোথা থেকে আসে?

- `req.body`: JSON request body — এই app-এ `express.json()` middleware চালু করার পর পাওয়া যায়।
- `req.params`: URL-এর dynamic অংশ — যেমন `/notes/2` থেকে `index`।
- `res.status(201).json(...)`: HTTP status এবং JSON response পাঠায়।
- `app.post`, `app.get`, `app.patch`, `app.delete`: method ও path অনুযায়ী handler চালায়।

## গুরুত্বপূর্ণ সীমাবদ্ধতা ও পরের উন্নতি

এগুলো বর্তমান code-এর শেখার সীমা; README-তে লিখে রাখা মানে feature-গুলো ইতিমধ্যে তৈরি আছে—এমন নয়।

1. **Persistence নেই:** memory array server বন্ধ বা restart হলে খালি হয়ে যায়। পরের project-এ একই API-কে Mongoose/MongoDB-র সঙ্গে যুক্ত করা হয়েছে—দেখো [`Mongoose and Schema` project](../Mongoose%20and%20Schema/readme.md)।
2. **Validation নেই:** empty বা ভুল type-এর body-ও গ্রহণ হতে পারে। `title` ও `description` validate করা শেখার ভালো পরের ধাপ।
3. **Index fragile:** array-তে নতুন item যোগ/মোছার সঙ্গে index বদলে যেতে পারে। `404` বা invalid index-এর handling-ও নেই।
4. **Error handling সীমিত:** route-এ try/catch বা centralized error middleware নেই।
5. **Update আচরণ:** PATCH handler `title` ও `description` দুটিই পড়তে চায়; কোনো field না পাঠালে সেটি `undefined` হতে পারে।
6. **Production configuration নেই:** port hard-coded `3000`; deployment-এ সাধারণত `process.env.PORT` ব্যবহার করা হয়।
7. **Automated test নেই:** `npm test` script-টি এখন placeholder; এটি আসল test চালায় না এবং error দিয়ে শেষ হয়।

## Backend request flow — মনে রাখার ছক

```text
Postman / client
    ↓ HTTP method + URL + JSON
Express middleware (express.json)
    ↓ req.body / req.params
Route handler (src/app.js)
    ↓ array-তে কাজ (এই project-এ)
HTTP status + JSON response
    ↓
Postman / client
```

এই project-এ database ধাপটি নেই। পরের project-এ array-র জায়গায় Mongoose model ও MongoDB বসে।

## Revision checklist

- [ ] `server.js`-এ app import ও listen-এর ভূমিকা বলতে পারি।
- [ ] `express.json()` কেন `app.use()` দিয়ে আগে চালাতে হয় বুঝি।
- [ ] GET, POST, PATCH, DELETE-এর পার্থক্য বলতে পারি।
- [ ] `req.body` এবং `req.params`-এর পার্থক্য বুঝি।
- [ ] Postman-এ JSON body পাঠিয়ে CRUD routes পরীক্ষা করতে পারি।
- [ ] বুঝি কেন array-তে রাখা data restart-এর পর থাকে না।
- [ ] `DELETE`-এ `delete` বনাম array item সরানোর পার্থক্য জানি।

## নিজে অনুশীলন

1. দ্বিতীয় note যোগ করে GET দিয়ে দুটো note দেখো।
2. ভুল index দিয়ে PATCH/DELETE পাঠিয়ে বর্তমান আচরণ লক্ষ্য করো।
3. validation ও not-found response কীভাবে যোগ করা যায় পরিকল্পনা করো।
4. একই API-তে in-memory array-র বদলে MongoDB model যুক্ত করার আগে Mongoose project-এর flow পড়ো।
