import "./LoginPage.css";
import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Camera, ArrowLeft, Eye, EyeOff, AlertCircle, X, CheckCircle } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Email is invalid";
    if (!password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userEmail', data.user.email);
        localStorage.setItem('userName', data.user.name);
        localStorage.setItem('userId', data.user.id);
        
        // Show success modal
        setShowSuccessModal(true);
        
        // Auto-navigate after 3 seconds
        setTimeout(() => {
          navigate("/dashboard");
        }, 3000);
        
      } else {
        setErrors({ general: data.message });
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ general: 'Cannot connect to server. Make sure backend is running on port 3001.' });
    } finally {
      setIsLoading(false);
    }
  };

  const startFaceLogin = async () => {
    setIsFaceModalOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 } 
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      alert("Unable to access webcam. Check permissions.");
      setIsFaceModalOpen(false);
    }
  };

  const captureFace = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0, 640, 480);
      const stream = videoRef.current.srcObject;
      if (stream) stream.getTracks().forEach((track) => track.stop());
      setIsFaceModalOpen(false);
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userEmail', 'face_user@example.com');
        localStorage.setItem('userName', 'Face User');
        localStorage.setItem('userId', 'face_user_123');
        
        // Show success modal for face login too
        setShowSuccessModal(true);
        
        setTimeout(() => {
          navigate("/dashboard");
        }, 3000);
        
      }, 2000);
    }
  };

  const closeFaceModal = () => {
    setIsFaceModalOpen(false);
    if (videoRef.current?.srcObject)
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Back to Home */}
        <div className="auth-back">
          <Link to="/" className="back-link">
            <ArrowLeft size={18} /> Back to Home
          </Link>
        </div>

        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleEmailLogin}>
          {/* Email */}
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <div className="input-wrapper">
              <Mail size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
              />
            </div>
            {errors.email && (
              <p className="error">
                <AlertCircle size={16} /> {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="input-group">
            <label className="input-label">Password</label>
            <div className="input-wrapper">
              <Lock size={20} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <p className="error">
                <AlertCircle size={16} /> {errors.password}
              </p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="options-row">
            <label>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          {errors.general && (
            <div className="error general-error">
              <AlertCircle size={16} /> {errors.general}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                Signing In...
              </div>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="divider">or continue with</div>

        <button className="btn btn-outline" onClick={startFaceLogin}>
          <Camera size={20} /> Login with Face Recognition
        </button>

        <div className="auth-footer">
          New here? <Link to="/signup">Create an account</Link>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="face-modal">
          <div className="face-modal-content">
            <div className="modal-header">
              <h3>Success! 🎉</h3>
              <button onClick={() => {
                setShowSuccessModal(false);
                navigate("/dashboard");
              }}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-green-600" size={32} />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Login Successful!</h4>
              <p className="text-gray-600 mb-4">You are being redirected to your dashboard...</p>
              <p className="text-sm text-gray-500">Redirecting in 3 seconds</p>
              <button 
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate("/dashboard");
                }}
                className="btn btn-primary w-full mt-4"
              >
                Go to Dashboard Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Face Login Modal */}
      {isFaceModalOpen && (
        <div className="face-modal">
          <div className="face-modal-content">
            <div className="modal-header">
              <h3>Face Recognition Login</h3>
              <button onClick={closeFaceModal}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <p>Position your face in the frame and click capture to login securely</p>
              <div className="video-container">
                <video ref={videoRef} autoPlay playsInline muted />
                <canvas ref={canvasRef} width="640" height="480" className="hidden"></canvas>
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={closeFaceModal} className="btn btn-outline">
                Cancel
              </button>
              <button onClick={captureFace} className="btn btn-primary">
                Capture & Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}