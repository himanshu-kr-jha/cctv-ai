import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Eye, EyeOff, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const { login, loading } = useAuthStore();
  const navigate = useNavigate();

  // Animation Refs
  const leftPanelRef = useRef(null);
  const pupilRefs = useRef([
    { L: null, R: null },
    { L: null, R: null },
    { L: null, R: null },
    { L: null, R: null },
  ]);

  const mousePos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const rafId = useRef(null);
  const easing = 0.15;

  const eyeData = [
    { eyeL: { x: 70, y: 190 }, eyeR: { x: 110, y: 190 }, radius: 10 },
    { eyeL: { x: 215, y: 380 }, eyeR: { x: 285, y: 380 }, radius: 13 },
    { eyeL: { x: 330, y: 215 }, eyeR: { x: 370, y: 215 }, radius: 9 },
    { eyeL: { x: 390, y: 200 }, eyeR: { x: 430, y: 200 }, radius: 9 },
  ];
  const svgViewBox = { width: 500, height: 600 };

  const movePupilSVG = useCallback((pupilEl, eyePos, targetX, targetY, maxDist) => {
    if (!pupilEl || !leftPanelRef.current) return;
    const svgEl = leftPanelRef.current.querySelector('svg');
    if (!svgEl) return;

    const rect = svgEl.getBoundingClientRect();
    const svgX = eyePos.x * (rect.width / svgViewBox.width);
    const svgY = eyePos.y * (rect.height / svgViewBox.height);
    const screenEyeX = rect.left + svgX;
    const screenEyeY = rect.top + svgY;

    const dx = targetX - screenEyeX;
    const dy = targetY - screenEyeY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const ratio = Math.min(1, maxDist / (dist || 1));
    const ox = dx * ratio;
    const oy = dy * ratio;

    const offsetX = (ox / rect.width) * svgViewBox.width;
    const offsetY = (oy / rect.height) * svgViewBox.height;

    const newCx = eyePos.x + offsetX;
    const newCy = eyePos.y + offsetY;

    pupilEl.setAttribute('cx', newCx.toFixed(1));
    pupilEl.setAttribute('cy', newCy.toFixed(1));
  }, []);

  const trackEyes = useCallback(() => {
    if (isPasswordFocused && !showPass) return; // Stop tracking when pass hidden and focused

    pupilRefs.current.forEach((pupilPair, idx) => {
      const eye = eyeData[idx];
      const maxDist = eye.radius * 0.35;
      movePupilSVG(pupilPair.L, eye.eyeL, mousePos.current.x, mousePos.current.y, maxDist);
      movePupilSVG(pupilPair.R, eye.eyeR, mousePos.current.x, mousePos.current.y, maxDist);
    });
  }, [isPasswordFocused, showPass, movePupilSVG]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      mousePos.current.x += (e.clientX - mousePos.current.x) * easing;
      mousePos.current.y += (e.clientY - mousePos.current.y) * easing;
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(trackEyes);
    };

    document.addEventListener('mousemove', handleMouseMove);
    rafId.current = requestAnimationFrame(trackEyes);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId.current);
    };
  }, [trackEyes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* LEFT PANEL */}
      <div 
        ref={leftPanelRef}
        className="hidden lg:flex flex-1 relative bg-[#eef0f5] items-center justify-center overflow-hidden"
      >
        {/* Deco shapes */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 border-[12px] border-white rounded-full opacity-40 animate-[float1_5s_ease-in-out_infinite]" />
        <div className="absolute bottom-1/4 right-1/4 w-16 h-16 bg-white opacity-40 rounded-xl rotate-45 animate-[float2_6s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 right-1/3 w-6 h-6 border-4 border-white border-t-transparent rounded-full opacity-60 animate-spin" style={{ animationDuration: '4s' }} />
        
        {/* SVG ANIMATION STAGE */}
        <svg 
          className={`stage w-full max-w-[500px] h-full max-h-[500px] block transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-10 
            ${isPasswordFocused && !showPass ? '-scale-x-100' : ''}`} 
          viewBox="0 0 500 600" 
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Character 1 (Purple - Back left) */}
          <g className="character animate-float1" id="char1">
            <rect className="char-body fill-[#8b84ff]" x="45" y="280" width="90" height="180" rx="12" />
            <circle className="char-head fill-[#8b84ff]" cx="90" cy="210" r="50" />
            <circle className="eye" cx="70" cy="190" r="10" fill="white" />
            <circle className="eye" cx="110" cy="190" r="10" fill="white" />
            <circle ref={el => pupilRefs.current[0].L = el} className="pupil" cx="72" cy="193" r="5" fill="black" />
            <circle ref={el => pupilRefs.current[0].R = el} className="pupil" cx="112" cy="193" r="5" fill="black" />
            <path className="mouth" d="M 80 220 Q 90 230 100 220" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
          </g>

          {/* Character 2 (Red - Bottom center) */}
          <g className="character animate-float2" id="char2">
            <rect className="char-body fill-[#ff6b6b]" x="190" y="450" width="120" height="150" rx="12" />
            <circle className="char-head fill-[#ff6b6b]" cx="250" cy="400" r="60" />
            <circle className="eye" cx="215" cy="380" r="13" fill="white" />
            <circle className="eye" cx="285" cy="380" r="13" fill="white" />
            <circle ref={el => pupilRefs.current[1].L = el} className="pupil" cx="215" cy="380" r="6" fill="black" />
            <circle ref={el => pupilRefs.current[1].R = el} className="pupil" cx="285" cy="380" r="6" fill="black" />
            <circle className="mouth" cx="250" cy="420" r="8" fill="white" />
          </g>

          {/* Character 3 (Cyan - Middle right) */}
          <g className="character animate-float3" id="char3">
            <rect className="char-body fill-[#4ecdc4]" x="310" y="280" width="80" height="160" rx="12" />
            <circle className="char-head fill-[#4ecdc4]" cx="350" cy="225" r="45" />
            <circle className="eye" cx="330" cy="215" r="9" fill="white" />
            <circle className="eye" cx="370" cy="215" r="9" fill="white" />
            <circle ref={el => pupilRefs.current[2].L = el} className="pupil" cx="330" cy="215" r="4.5" fill="black" />
            <circle ref={el => pupilRefs.current[2].R = el} className="pupil" cx="370" cy="215" r="4.5" fill="black" />
            <path className="mouth" d="M 340 240 Q 350 245 360 240" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
          </g>

          {/* Character 4 (Yellow - Top right) */}
          <g className="character animate-float4" id="char4">
            <rect className="char-body fill-[#ffe66d]" x="375" y="240" width="70" height="120" rx="12" />
            <circle className="char-head fill-[#ffe66d]" cx="410" cy="200" r="40" />
            <circle className="eye" cx="390" cy="200" r="9" fill="white" />
            <circle className="eye" cx="430" cy="200" r="9" fill="white" />
            <circle ref={el => pupilRefs.current[3].L = el} className="pupil" cx="390" cy="200" r="4.5" fill="black" />
            <circle ref={el => pupilRefs.current[3].R = el} className="pupil" cx="430" cy="200" r="4.5" fill="black" />
            <line className="mouth" x1="400" y1="215" x2="420" y2="215" stroke="white" strokeWidth="3" strokeLinecap="round" />
          </g>
        </svg>
      </div>

      {/* RIGHT PANEL - LOGIN FORM */}
      <div className="flex-1 flex flex-col items-center justify-center relative p-6 sm:p-12">
        <div className="w-full max-w-md mx-auto">
          {/* Header */}
          <div className="mb-10 text-center animate-[slideIn_0.4s_ease-out]">
            <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center shadow-lg shadow-accent/5 mx-auto mb-6 transform hover:scale-105 transition-transform">
              <Shield className="w-7 h-7 text-accent" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight leading-none mb-2">Welcome back</h1>
            <p className="text-[15px] font-medium text-[#94a3b8]">Please enter your details</p>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="input-wrap relative animate-[slideIn_0.5s_ease-out] group">
              <label className="block text-xs font-bold text-[#94a3b8] uppercase tracking-widest mb-2 transition-colors group-focus-within:text-accent">
                Email
              </label>
              <input
                type="email"
                className="w-full py-3 bg-transparent border-b-2 border-[#e0e0e0] text-gray-800 font-semibold focus:outline-none transition-colors"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div className="input-line" />
            </div>

            <div className="input-wrap relative animate-[slideIn_0.6s_ease-out] group">
              <label className="block text-xs font-bold text-[#94a3b8] uppercase tracking-widest mb-2 transition-colors group-focus-within:text-accent">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="w-full py-3 bg-transparent border-b-2 border-[#e0e0e0] text-gray-800 font-semibold focus:outline-none transition-colors pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-accent transition-colors outline-none"
                >
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <div className="input-line" />
              </div>
            </div>

            <div className="flex items-center justify-between animate-[slideIn_0.7s_ease-out] pt-2">
              <label className="remember flex items-center cursor-pointer group">
                <input type="checkbox" className="hidden" defaultChecked />
                <div className="checkmark bg-white group-hover:border-gray-400" />
                <span className="ml-3 text-[14px] font-semibold text-gray-600 transition-colors group-hover:text-gray-800">
                  Remember for 30 days
                </span>
              </label>
              <a href="#" className="text-[13px] font-bold text-accent hover:text-[#5b52e0] transition-colors">
                Forgot password?
              </a>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-accent hover:bg-[#5b52e0] text-white font-bold py-4 rounded-xl shadow-[0_8px_20px_rgba(108,99,255,0.25)] hover:shadow-[0_12px_25px_rgba(108,99,255,0.35)] transition-all active:scale-[0.98] mt-4 flex items-center justify-center animate-[slideIn_0.8s_ease-out] disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Sign in'}
            </button>
            

          </form>

          <p className="text-center text-[14px] font-medium text-gray-500 mt-8 animate-[slideIn_1.0s_ease-out]">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent hover:text-[#5b52e0] font-bold underline decoration-2 underline-offset-4 decoration-accent/30 hover:decoration-accent transition-colors">
              Sign up
            </Link>
          </p>

          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-10 animate-[slideIn_1.1s_ease-out]">
            <div className="text-center">
              <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Admin</span>
              <span className="text-[13px] font-semibold text-gray-600 border border-gray-200 px-3 py-1 rounded-md bg-gray-50 shadow-sm">admin@cctv.ai / admin123</span>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div className="text-center">
              <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Operator</span>
              <span className="text-[13px] font-semibold text-gray-600 border border-gray-200 px-3 py-1 rounded-md bg-gray-50 shadow-sm">operator@cctv.ai / operator123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
