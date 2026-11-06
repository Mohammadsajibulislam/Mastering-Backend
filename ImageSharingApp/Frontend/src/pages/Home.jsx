import {BrowserRouter as Router, Routes, Route, useNavigate} from 'react-router-dom'

const Home = () => {
  const navigate = useNavigate()

  return (
    <main className="home-section">
      <button
        className="home-button"
        type="button"
        aria-label="Open feed"
        onClick={() => navigate('/feed')}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <rect x="3" y="3" width="8" height="8" rx="1" />
          <rect x="13" y="3" width="8" height="8" rx="1" />
          <rect x="3" y="13" width="8" height="8" rx="1" />
          <rect x="13" y="13" width="8" height="8" rx="1" />
        </svg>
      </button>
      <button
        className="home-button"
        type="button"
        aria-label="Create a post"
        onClick={() => navigate('/create-post')}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </main>
  )
}

export default Home