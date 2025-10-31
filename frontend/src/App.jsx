import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './pages/login.jsx'
import SignupPage from './pages/signup.jsx'
import EmployeeHome from './pages/employeeHome.jsx'
import ManagerHome from './pages/managerHome.jsx'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        {/* Default route */}
        <Route path="/" element={<Login />} />

        {/* Login page */}
        <Route path="/login" element={<Login />} />


        {/* Signup page */}
        <Route path="/signup" element={<SignupPage />} />

        {/* Employee Home page */}
        <Route path="/employee-home" element={<EmployeeHome />} />

        {/* Manager Home page */}
        <Route path="/manager-home" element={<ManagerHome />} />

      </Routes>
    </Router>
  )
}

export default App
