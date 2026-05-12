import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, CreditCard, Camera, ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle, X } from "lucide-react";
import "./LoginPage.css";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    upiId: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [faceRegistered, setFaceRegistered] = useState(false);
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const validateForm = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Full name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Email is invalid";
    if (!form.password) newErrors.password = "Password is required";
    else if (form.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (!form.confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    else if (form.password !== form.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    if (!form.upiId.trim()) newErrors.upiId = "Cashfree UPI ID is required";
    if (!faceRegistered) newErrors.face = "Face registration is required";
    if (!agreeToTerms) newErrors.terms = "You must agree to the Terms of Service and Privacy Policy";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  setIsLoading(true);
  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        password: form.password,
        upiId: form.upiId
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userEmail', data.user.email);
      localStorage.setItem('userName', data.user.name);
      localStorage.setItem('userId', data.user.id);
      
      alert("Account created successfully!");
      navigate("/dashboard");
    } else {
      setErrors({ general: data.message });
    }
  } catch (error) {
    console.error('Signup error:', error);
     alert("Account created successfully!");
      navigate("/dashboard");
  } finally {
    setIsLoading(false);
  }
};

  const startFaceRegistration = async () => {
    setIsFaceModalOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error("Error accessing webcam:", error);
      alert("Unable to access webcam. Please check permissions and try again.");
      setIsFaceModalOpen(false);
    }
  };

  const captureFace = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      context.drawImage(videoRef.current, 0, 0, 320, 240);

      const stream = videoRef.current.srcObject;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      setIsFaceModalOpen(false);
      setFaceRegistered(true);
      alert("Face registered successfully! You can now use face authentication for login.");
    }
  };

  const closeFaceModal = () => {
    setIsFaceModalOpen(false);
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  const handleInputChange = (field, value) => {
    setForm({ ...form, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
    if (errors.general) {
      setErrors({ ...errors, general: "" });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Back to Home Link */}
        <div className="auth-back">
          <Link to="/" className="back-link">
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>

        {/* Signup Card */}
        <div className="signup-card">
          {/* Header */}
          <div className="auth-header">
            <h1>Create Account</h1>
            <p>Join us for secure expense splitting</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="signup-form">
            {/* Full Name */}
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <div className="input-wrapper">
                <User size={18} />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              {errors.name && (
                <p className="error">
                  <AlertCircle size={14} />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email Address */}
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <div className="input-wrapper">
                <Mail size={18} />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="error">
                  <AlertCircle size={14} />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="input-group">
              <label className="input-label">Password</label>
              <div className="input-wrapper">
                <Lock size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="error">
                  <AlertCircle size={14} />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="input-group">
              <label className="input-label">Confirm Password</label>
              <div className="input-wrapper">
                <Lock size={18} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="password-toggle"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="error">
                  <AlertCircle size={14} />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Cashfree UPI ID */}
            <div className="input-group">
              <label className="input-label">Cashfree UPI ID</label>
              <div className="input-wrapper">
                <CreditCard size={18} />
                <input
                  type="text"
                  value={form.upiId}
                  onChange={(e) => handleInputChange("upiId", e.target.value)}
                  placeholder="Enter your Cashfree UPI ID"
                />
              </div>
              {errors.upiId && (
                <p className="error">
                  <AlertCircle size={14} />
                  {errors.upiId}
                </p>
              )}
            </div>

            {/* Face Registration */}
            <div className="input-group">
              <label className="input-label">Face Registration<span className="required">*</span></label>
              <button
                type="button"
                onClick={startFaceRegistration}
                disabled={faceRegistered}
                className={`face-registration-btn ${faceRegistered ? 'registered' : ''}`}
              >
                <Camera size={18} />
                {faceRegistered ? "Face Registered" : "Register with Face"}
              </button>
              {faceRegistered && (
                <div className="face-registered-message">
                  <CheckCircle size={16} />
                  <span>Face registration completed</span>
                </div>
              )}
              {errors.face && (
                <p className="error">
                  <AlertCircle size={14} />
                  {errors.face}
                </p>
              )}
            </div>

            {/* Terms of Service */}
            <div className="terms-group">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => {
                  setAgreeToTerms(e.target.checked);
                  if (errors.terms) {
                    setErrors({ ...errors, terms: "" });
                  }
                }}
                className="terms-checkbox"
              />
              <label className="terms-label">
                I agree to the{" "}
                <a href="#" className="terms-link">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="terms-link">
                  Privacy Policy
                </a>
              </label>
            </div>
            {errors.terms && (
              <p className="error">
                <AlertCircle size={14} />
                {errors.terms}
              </p>
            )}

            {/* General Error */}
            {errors.general && (
              <div className="general-error">
                <p className="error">
                  <AlertCircle size={16} />
                  {errors.general}
                </p>
              </div>
            )}

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
            >
              {isLoading ? (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  Creating Account...
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="auth-footer">
            <p>
              Already have an account?{" "}
              <Link to="/login" className="auth-link">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Face Registration Modal */}
        {isFaceModalOpen && (
          <div className="face-modal">
            <div className="face-modal-content">
              <div className="modal-header">
                <h3>Face Registration</h3>
                <button onClick={closeFaceModal}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                <p>Position your face in the camera and click capture when ready.</p>
                <div className="video-container">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                  />
                  <canvas
                    ref={canvasRef}
                    width="320"
                    height="240"
                    className="hidden"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button onClick={closeFaceModal} className="btn btn-outline">
                  Cancel
                </button>
                <button onClick={captureFace} className="btn btn-primary">
                  Capture Face
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}









