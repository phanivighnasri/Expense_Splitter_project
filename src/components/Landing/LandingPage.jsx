import React from "react";
import "./LandingPage.css";
import { Link } from "react-router-dom";
import { FaFacebook, FaTwitter, FaInstagram, FaGithub, FaStar, FaStarHalfAlt, FaRocket } from "react-icons/fa";
import splitterLogo from "../../assets/spli.png";
const Landing = () => {
  return (
    <div className="landing-page">
      {/* Header */}
      <header>
       <h1 className="logo">
  <img src={splitterLogo} alt="Expense Splitter Logo" width="100" />
  Expense Splitter
</h1>
        <nav>
          <Link to="/login">Login</Link>
          <Link to="/signup">Signup</Link>
          <Link to="/dashboard">Dashboard</Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h2>Split bills easily with friends & groups</h2>
          <p>Track expenses, make payments, and settle balances in just a few clicks.</p>
          <Link to="/signup" className="btn">
            Get Started <FaRocket />
          </Link>
        </div>
        <img 
          src="https://img.freepik.com/free-vector/business-team-discussing-ideas-startup_74855-4380.jpg" 
          alt="Group Finance Illustration" 
          style={{maxWidth: "400px", borderRadius: "12px", boxShadow: "0 6px 15px rgba(0,0,0,0.2)"}}
        />
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="feature-card">
          <h3>👤 Face Authentication</h3>
          <p>Secure login with face recognition technology.</p>
          <div className="rating">
            <FaStar /><FaStar /><FaStar /><FaStar /><FaStarHalfAlt />
          </div>
        </div>

        <div className="feature-card">
          <h3>👥 Group Management</h3>
          <p>Create groups, add members, and track expenses.</p>
          <div className="rating">
            <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
          </div>
        </div>

        <div className="feature-card">
          <h3>📊 Smart Settlements</h3>
          <p>Minimize transactions with our smart algorithm.</p>
          <div className="rating">
            <FaStar /><FaStar /><FaStar /><FaStar /><FaStarHalfAlt />
          </div>
        </div>

        <div className="feature-card">
          <h3>💳 UPI Payments</h3>
          <p>Pay directly via Razorpay UPI integration.</p>
          <div className="rating">
            <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
          </div>
        </div>
      </section>

   

      {/* Footer */}
      <footer>
        <p>&copy; 2025 Expense Splitter | All Rights Reserved</p>
        <div className="social-icons">
          <a href="/"><FaFacebook /></a>
          <a href="/"><FaTwitter /></a>
          <a href="/"><FaInstagram /></a>
          <a href="/"><FaGithub /></a>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
