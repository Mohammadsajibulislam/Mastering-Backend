# Mongoose and Schema — MongoDB-সহ Notes backend

> **এখনকার অবস্থা:** এটি শেখার project। Schema-তে validation সীমিত, error handling ও authentication নেই। `server.js`-এ port hard-coded, এবং database connection সফল হওয়ার আগে server listen শুরু হতে পারে। তাই এটিকে production-ready বা ইতিমধ্যে deployed ধরে নিও না।

## দুই project-এর সম্পর্ক

1. [`REST API` project](<../REST%20API/README.md>)-এ Express route ও Postman request শেখা হয়েছে; note ছিল process memory-র array-তে।
2. এখানে route ও HTTP request-এর ধারণা একই, কিন্তু array-র বদলে `noteModel` দিয়ে MongoDB document তৈরি, পড়া, update ও delete হয়।
3. REST API project-এর data server restart-এ হারায়। MongoDB-তে সফলভাবে save হওয়া document database-এ থাকে।

```text
Postman / Client
        ↓ HTTP request
Express app (src/app.js)
        ↓ noteModel CRUD query
Mongoose Model (Note)
        ↓ schema অনুসারে
MongoDB collection (notes)
        ↓ result
Express JSON response
```

## ফাইল ও দায়িত্ব

```text
Mongoose and Schema/
├── server.js              # app, database connection ও HTTP listener
├── src/
│   ├── app.js              # JSON middleware এবং Notes CRUD routes
│   ├── db/
│   │   └── db.js           # dotenv load করে MongoDB-তে connect করে
│   └── models/
│       └── note.model.js   # Mongoose schema ও Note model
├── .env                    # গোপন MongoDB URI (local; commit করা যাবে না)
├── .gitignore              # node_modules ও .env ignore করে
├── package.json            # dependencies ও project metadata
├── package-lock.json       # নির্দিষ্ট dependency resolution
└── readme.md               # এই revision guide
```

- **`server.js`** app ও `connectDB` import করে, database connection function call করে, তারপর port `3000`-এ listen শুরু করে। এখানে DNS server-ও hard-code করা আছে।
- **`src/app.js`** Express app তৈরি করে, `express.json()` middleware চালু করে এবং `noteModel`-এর মাধ্যমে CRUD routes চালায়।
- **`src/db/db.js`** `dotenv` দিয়ে `.env` load করে এবং `mongoose.connect(process.env.MONGODB_URI)` চালায়।
- **`src/models/note.model.js`** `title` ও `description`-এর schema তৈরি করে, তারপর `Note` model export করে।
- **`.env`**-এ `MONGODB_URI` নামে connection string রাখা হয়। এর value password/token-সহ secret হতে পারে—কখনো README, source code, screenshot বা public Git-এ দেবে না।
- **`package.json`**-এ বর্তমানে `express`, `mongoose` ও `dotenv` dependencies আছে। আলাদা frontend, router package বা test framework এই project-এ ঘোষিত নেই।

## Install ও চালানো

Node.js/npm এবং MongoDB connection প্রস্তুত রাখো। Project folder-এ:

```powershell
cd "D:\My project\Mastering Backend\Mongoose and Schema"
npm install
node server.js
```

`package-lock.json` আছে বলে `npm install` manifest-এ থাকা package install করবে। এই project-এ `express`, `mongoose`, `dotenv` লাগে। Postman আলাদা client application, npm dependency নয়।

### `.env` তৈরি/যাচাই

Project root-এ `.env` ফাইলে `MONGODB_URI` key থাকতে হবে। Format-এর উদাহরণ:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/notes_db
```

এটি **local MongoDB**-র উদাহরণ। MongoDB service চালু থাকতে হবে। MongoDB Atlas ব্যবহার করলে Atlas থেকে পাওয়া connection string বসাও:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
```

Placeholder-গুলো নিজের Atlas connection তথ্য দিয়ে বদলাবে; angle bracket-সহ placeholder 그대로 রাখবে না। Atlas-এ database user ও network access configuration প্রয়োজন হতে পারে। `.env` ইতিমধ্যে `.gitignore`-এ আছে—তবু `git status` দেখে নিশ্চিত হও যে secret staged/commit হচ্ছে না। `.env.example` বানালে সেখানে শুধু placeholder রাখবে, আসল URI নয়।

Server terminal-এ `Connected to MongoDB` দেখালে connection সফল হয়েছে। URI অনুপস্থিত/ভুল, MongoDB বন্ধ, network বা Atlas access configuration ভুল হলে connection ব্যর্থ হতে পারে।

## Schema, Model, Collection ও Document

### Schema

`src/models/note.model.js`-এ:

```js
const noteSchema = new mongoose.Schema({
  title: String,
  description: String
});
```

Schema একটি document-এ কোন field থাকবে এবং field-এর type কী—তার নিয়ম/blueprint। বর্তমান schema-তে `title` ও `description` `String`, কিন্তু `required: true` নেই; অর্থাৎ code-এ বাধ্যতামূলক validation সংজ্ঞায়িত হয়নি। `timestamps`-ও চালু নেই।

### Model

```js
const noteModel = mongoose.model('Note', noteSchema);
```

Model হলো schema-ভিত্তিক query ও CRUD interface। Mongoose convention অনুযায়ী `Note` model সাধারণত MongoDB-তে plural/lowercase `notes` collection-এর সঙ্গে কাজ করে। MongoDB document-এ স্বয়ংক্রিয়ভাবে `_id` থাকে, যা এই project-এর `:id` route-এ ব্যবহার হয়।

### MongoDB

- **Database**: সম্পর্কিত collection-এর জায়গা।
- **Collection**: একই ধরনের document-এর দল; SQL-এর table-এর সঙ্গে তুলনা করা যায়, তবে একেবারে একই নয়।
- **Document**: BSON আকারে সংরক্ষিত একটি record; JSON-এর মতো field/value structure।
- **Mongoose** database নয়; Node.js application থেকে MongoDB-তে schema-ভিত্তিকভাবে কাজ করার ODM library।

## API ও Postman অনুশীলন

Base URL: `http://localhost:3000`। POST/PATCH-এর জন্য Postman-এ **Body → raw → JSON** বেছে `Content-Type: application/json` পাঠাও।

| কাজ                  | Method     | Endpoint       | সফল status |
| ----------------------- | ---------- | -------------- | ------------: |
| note তৈরি           | `POST`   | `/notes`     |       `201` |
| সব note পড়া        | `GET`    | `/notes`     |       `200` |
| ID দিয়ে note update | `PATCH`  | `/notes/:id` |       `200` |
| ID দিয়ে note delete | `DELETE` | `/notes/:id` |       `200` |

### Create — `POST /notes`

```http
POST http://localhost:3000/notes
Content-Type: application/json
```

```json
{
  "title": "Mongoose revision",
  "description": "Schema, model ও CRUD অনুশীলন"
}
```

Handler `req.body` থেকে দুই field নিয়ে `noteModel.create()` চালায়। এটি asynchronous, তাই `await` ব্যবহার করা হয়েছে। সফল হলে `201` ও success message দেয়।

### Read — `GET /notes`

```http
GET http://localhost:3000/notes
```

`noteModel.find()` সব note ফেরত দেয়। Response-এ result `data` property-তে থাকে:

```json
{
  "message": "Notes fetched successfully",
  "data": [
    {
      "_id": "MongoDB-generated-id",
      "title": "Mongoose revision",
      "description": "Schema, model ও CRUD অনুশীলন"
    }
  ]
}
```

উদাহরণের `_id` নিজের database-এ তৈরি হবে; Postman-এ পাওয়া বাস্তব `_id` কপি করে পরের request-এ ব্যবহার করো।

### Update — `PATCH /notes/:id`

`GET /notes` response থেকে `_id` নিয়ে URL-এ বসাও:

```http
PATCH http://localhost:3000/notes/<real-id>
Content-Type: application/json
```

```json
{
  "title": "Mongoose updated",
  "description": "Update request পরীক্ষা"
}
```

বর্তমান code `findByIdAndUpdate()`-এ `title` ও `description` পাঠায়। Update validator চালু করা হয়নি (`runValidators` নেই), updated document response-এ ফেরত দেওয়া হয়নি, এবং handler সব field একসঙ্গে update করতে চায়।

### Delete — `DELETE /notes/:id`

```http
DELETE http://localhost:3000/notes/<real-id>
```

`findByIdAndDelete()` নির্দিষ্ট `_id`-এর document মুছে দেয়। বর্তমান handler deleted document পাওয়া গেছে কি না পরীক্ষা না করেও success message পাঠায়।

## REST API project-এর সঙ্গে মূল পার্থক্য

| বিষয়          | `REST API`                        | `Mongoose and Schema`                                           |
| ----------------- | ----------------------------------- | ----------------------------------------------------------------- |
| Data store        | `src/app.js`-এর in-memory array | MongoDB collection                                                |
| Record locator    | array `index`                     | MongoDB `_id`                                                   |
| Data থাকে?    | server restart-এ হারায়        | successful database write-এর পর থাকে                      |
| CRUD handler      | JavaScript array access             | Mongoose Model methods                                            |
| Schema/validation | নেই                              | Schema আছে, তবে বর্তমান validation খুব সীমিত |
| Config            | port `3000` hard-coded            | Mongo URI `.env`-এর `MONGODB_URI`; port এখনও hard-coded |

## Code-এ থাকা সীমাবদ্ধতা ও কী শেখা উচিত

নিচেরগুলো বর্তমান code-এর আচরণ/পরবর্তী উন্নতির জায়গা—এগুলো ইতিমধ্যে সমাধান করা হয়েছে এমন দাবি নয়।

1. **Connection lifecycle:** `server.js` `connectDB()` call করে কিন্তু `await` করে না। ফলে MongoDB connection নিশ্চিত হওয়ার আগে HTTP listener শুরু হতে পারে। Robust setup-এ DB connect সফল হলে তারপর server listen শুরু করো; connection failure স্পষ্টভাবে handle করো।
2. **Error handling:** `create`, `find`, `findByIdAndUpdate`, `findByIdAndDelete`-এর database error route-এ সামলানো হয়নি। Express 5 async rejection forwarding দিতে পারে, কিন্তু এখানে custom JSON error response/centralized handler নেই।
3. **Input validation:** Schema-তে field `required`, length/type constraints বা custom validation নেই। Request body-ও validate হয় না।
4. **Update validation ও response:** `findByIdAndUpdate()`-এ `{ new: true, runValidators: true }` দেওয়া হয়নি। ফলে validation প্রয়োগ হয় না এবং updated document response-এ ফেরত আসে না।
5. **Not-found/invalid ID:** update/delete-এর ফল পরীক্ষা করা হয় না। ভুল-format ID বা না-পাওয়া ID-র উপযুক্ত `400`/`404` response সংজ্ঞায়িত নেই।
6. **Security:** authentication/authorization নেই; যে কেউ endpoint পেলে note পরিবর্তন/মুছতে পারে। Public deployment-এর আগে access control, validation, rate limiting ও নিরাপদ configuration ভাবতে হবে।
7. **Port hard-coded:** `app.listen(3000)` deployment hosting provider-এর `PORT` মান ব্যবহার করে না।
8. **DNS override:** `server.js` Google DNS server hard-code করে (`8.8.8.8`, `8.8.4.4`)। সাধারণত app code-এ এটি দরকার হয় না; বিশেষ network issue সমাধানের জন্য যোগ করা হয়ে থাকতে পারে। Deployment-এ চালু রাখার আগে প্রয়োজন যাচাই করো।
9. **Automated tests নেই:** `npm test` placeholder script; এটি প্রকৃত test চালায় না।

## Deploy বলতে কী বোঝায়?

Deploy হলো server code-কে এমন hosting platform-এ চালানো, যেখানে client internet দিয়ে API-তে request পাঠাতে পারে। এই repository-তে deployment platform/configuration বা live URL নেই; নিচে শেখার checklist:

1. Git repository-তে source code ও lockfile রাখো, কিন্তু `.env`, MongoDB password/URI বা অন্য secret push কোরো না।
2. Hosting platform-এ Node.js service তৈরি করে install command `npm install` এবং start command `node server.js` নির্ধারণ করো।
3. Hosting platform-এর environment variables-এ `MONGODB_URI` সেট করো। Secret value README-তে নয়, hosting dashboard-এর secret configuration-এ রাখো।
4. MongoDB Atlas ব্যবহার করলে hosting server থেকে connection অনুমোদনের network access, database user permission, database name ও URI যাচাই করো।
5. Code-কে hosting-এর `PORT` মানে listen করাতে হবে; বর্তমান code-এর hard-coded `3000` deploy-এর আগে বদলানোর বিষয়।
6. Database connect না হলে application যেন স্পষ্টভাবে startup failure দেখায়—connection নিশ্চিত হওয়ার আগে request accept না করে—এটি ঠিক করো।
7. Deploy-এর পর live URL-এ Postman দিয়ে GET/POST/PATCH/DELETE পরীক্ষা করো এবং logs-এ connection/error দেখো। Secret log-এ print কোরো না।
8. HTTPS, authentication/authorization, validation, error response, logging ও automated test যোগ না করে real user data-সহ public production service চালিও না।

## Revision: request থেকে database পর্যন্ত

1. Client HTTP method, URL এবং দরকার হলে JSON body পাঠায়।
2. `express.json()` body parse করে `req.body` তৈরি করে।
3. Express route handler `req.params.id` বা `req.body` পড়ে।
4. Handler `noteModel`-এর method call করে।
5. Model schema অনুসারে MongoDB collection-এ query পাঠায়।
6. Mongoose result ফেরত দিলে Express status code ও JSON response পাঠায়।

### CRUD method মনে রাখার উপায়

- **Create:** `noteModel.create(data)`
- **Read many:** `noteModel.find()`
- **Read one:** `noteModel.findById(id)` (বর্তমান route-এ ব্যবহার করা হয়নি)
- **Update by ID:** `noteModel.findByIdAndUpdate(id, changes, options)`
- **Delete by ID:** `noteModel.findByIdAndDelete(id)`

## Revision checklist

- [ ] Express, Mongoose, MongoDB ও dotenv-এর আলাদা দায়িত্ব বলতে পারি।
- [ ] Schema, Model, Collection ও Document-এর পার্থক্য বুঝি।
- [ ] `.env`-এ `MONGODB_URI` কেন রাখা হয় এবং secret কেন commit করা যাবে না জানি।
- [ ] `express.json()`-এর পরে `req.body` কীভাবে পাওয়া যায় বুঝি।
- [ ] Postman-এ CRUD request পাঠাতে পারি এবং GET response থেকে `_id` কপি করতে পারি।
- [ ] `find()`, `create()`, `findByIdAndUpdate()` ও `findByIdAndDelete()`-এর কাজ বলতে পারি।
- [ ] In-memory array ও MongoDB persistence-এর পার্থক্য ব্যাখ্যা করতে পারি।
- [ ] বর্তমান code-এ validation, error handling, not-found, connection startup ও deployment-এর সীমাবদ্ধতা চিহ্নিত করতে পারি।

## নিজে অনুশীলন

1. `title`-কে required করা ও validation error পরীক্ষা করার পরিকল্পনা করো।
2. ভুল ID এবং database connection বন্ধ থাকলে কী response হওয়া উচিত ঠিক করো।
3. Update route-এ শুধু পাঠানো field বদলানোর আচরণ অনুশীলন করো।
4. Server restart করে MongoDB-তে রাখা note আবার GET দিয়ে পাওয়া যায় কি না পরীক্ষা করো।
5. REST API README-র route flow-এর সঙ্গে এই project-এর Mongoose query flow মিলিয়ে দেখো।
