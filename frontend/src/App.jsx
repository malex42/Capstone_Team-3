import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './pages/login.jsx'
import SignupPage from './pages/signup.jsx'
import CreateBusiness from './pages/createBusiness.jsx'
import EmployeeHome from './pages/employeeHome.jsx'
import ManagerHome from './pages/managerHome.jsx'
import Monitoring from './pages/monitoring.jsx'
import ManagerScheduleEditor from './pages/schedTools.jsx'
import PostShift from './pages/postShift.jsx'
import TakeShift from './pages/takeShift.jsx'   // <-- add this import
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

        {/* Create Business page */}
        <Route path="/create-business" element={<CreateBusiness />} />

        {/* Employee Home page */}
        <Route path="/employee-home" element={<EmployeeHome />} />

        {/* Manager Home page */}
        <Route path="/manager-home" element={<ManagerHome />} />

        {/* Manager Schedule tools page */}
        <Route path="/schedules" element={<ManagerScheduleEditor />} />

        {/* Post Shift page */}
        <Route path="/post-shift" element={<PostShift />} />
        {/* Take Shift page */}
        <Route path="/take-shift" element={<TakeShift />} />

        {/* Monitoring page */}
        <Route path="/monitoring" element={<Monitoring />} />

      </Routes>
    </Router>
  )
}

export default App
