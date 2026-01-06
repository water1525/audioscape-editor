import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="absolute top-0 left-0 right-0 z-50 bg-transparent">
      <div className="container mx-auto px-6 md:px-12 lg:px-20">
        <div className="flex items-center justify-between h-14">
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-lg font-bold text-[hsl(0,0%,100%)]">StepFun</span>
              <span className="text-[hsl(220,10%,40%)]">|</span>
              <span className="text-sm text-[hsl(195,100%,50%)]">Open Platform</span>
            </Link>
          </div>

          {/* Center: Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm text-[hsl(0,0%,100%)] hover:text-[hsl(195,100%,50%)] transition-colors">
              Home
            </Link>
            <a href="#" className="text-sm text-white/60 hover:text-white transition-colors">
              Documentation
            </a>
            <Link to="/playground" className="flex items-center gap-1 text-sm text-white/60 hover:text-white transition-colors">
              Playground
              <ChevronDown size={14} />
            </Link>
            <a href="#" className="text-sm text-white/60 hover:text-white transition-colors">
              Star Program
            </a>
            <a href="#" className="text-sm text-white/60 hover:text-white transition-colors">
              Official Website
            </a>
          </div>

          {/* Right: User Center */}
          <button className="flex items-center gap-1 text-sm text-white/60 hover:text-white transition-colors">
            User Center
            <ChevronDown size={14} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
