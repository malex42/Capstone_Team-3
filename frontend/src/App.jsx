import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './pages/login.jsx'
import SignupPage from './pages/signup.jsx'
import CreateBusiness from './pages/createBusiness.jsx'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        {/* Default route */}
        <Route path="/" element={<Login />} />

        {/* Signup page */}
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/create-business" element={<CreateBusiness />} />
      </Routes>
    </Router>
  )
}

export default App
