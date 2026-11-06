import React from 'react'
// import {BrowserRouter as Router, Routes, Route, useNavigate} from 'react-router-dom'
import {BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/home.jsx'
import CreatePost from './pages/CreatePost.jsx'
import Feed from './pages/Feed.jsx'


const App = () => {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/create-post' element={<CreatePost />} />
        <Route path='/feed' element={<Feed />} />
      </Routes>
    </Router>
  )
}

export default App