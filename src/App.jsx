import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import WelcomePage from './components/WelcomePage'
import LoginPage from './components/LoginPage'
import SignupPage from './components/SignupPage'
import PlansPage from './components/PlansPage'
import Dashboard from './components/Dashboard'
import AllDesignSystems from './components/AllDesignSystems';
import AllDesigns from './components/AllDesigns';
import AllProjects from './components/AllProjects';
import CreateDesignSystem from './components/CreateDesignSystem';
import Review from './components/Review';
import MassBalanceReport from './components/MassBalanceReport';
import Profile from './components/Profile'
import ProjectReport from './components/ProjectReport'
import Reports from './pages/Reports'
import ProtectedRoute from "./components/ProtectedRoute";
const App = () => {
  return (
    <Router>
      

      <Routes>
          {/* Public */}
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<h2>Forgot Password</h2>} />

        {/* Protected */}
        <Route path="/plans" element={<ProtectedRoute><PlansPage /></ProtectedRoute>} />
        {/* <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} /> */}
        <Route path="/dashboard" element={<Dashboard/>} />
        {/* <Route path="/design-systems" element={<ProtectedRoute><AllDesignSystems /></ProtectedRoute>} /> */}
<Route path="/design-systems" element={<AllDesignSystems />} />
        <Route path="/all-designs" element={<AllDesigns />} />
        <Route path="/all-projects" element={<AllProjects />} />
        <Route path="/design-systems/new" element={<CreateDesignSystem />}/>
        <Route path="/review" element={<Review />} />
        <Route path="/reports/:id" element={<MassBalanceReport />} />
        <Route path="/project-reports/:id" element={<ProtectedRoute><ProjectReport /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><h2>Projects</h2></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile/></ProtectedRoute>} />
        <Route path="/consultation" element={<ProtectedRoute><h2>Consultation</h2></ProtectedRoute>} />
      </Routes>
    </Router>
  );
};

export default App;
