import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './pages/login.jsx'
import SignupPage from './pages/signup.jsx'
<<<<<<< HEAD
import EmployeeHome from './pages/employeeHome.jsx'
import ManagerHome from './pages/managerHome.jsx'
function App() {
  return (
    <div>
      <ManagerHome />
    </div>
=======
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        {/* Default route */}
        <Route path="/" element={<Login />} />

        {/* Signup page */}
        <Route path="/signup" element={<SignupPage />} />
      </Routes>
    </Router>
>>>>>>> 56bcbd91b0b2bcd0e5cfbb6e6bc5fda370d158cd
  )
}

export default App
