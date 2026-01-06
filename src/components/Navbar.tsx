import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="absolute top-0 left-0 right-0 z-50 bg-transparent">
      <div className="container mx-auto px-6 md:px-12 lg:px-20 min-[1920px]:px-32">
        <div className="flex items-center justify-between h-14 min-[1920px]:h-18">
          {/* Left: Logo */}
          <div className="flex items-center gap-3 min-[1920px]:gap-4">
            <Link to="/" className="flex items-center gap-2 min-[1920px]:gap-3">
              <span className="text-lg min-[1920px]:text-xl font-bold text-[hsl(0,0%,100%)]">StepFun</span>
              <span className="text-[hsl(220,10%,40%)]">|</span>
              <span className="text-sm min-[1920px]:text-base text-[hsl(195,100%,50%)]">Open Platform</span>
            </Link>
          </div>

          {/* Center: Navigation Links */}
          <div className="hidden md:flex items-center gap-8 min-[1920px]:gap-12">
            <Link to="/" className="text-sm min-[1920px]:text-base text-[hsl(0,0%,100%)] hover:text-[hsl(195,100%,50%)] transition-colors">
              Home
            </Link>
            <a href="#" className="text-sm min-[1920px]:text-base text-white/60 hover:text-white transition-colors">
              Documentation
            </a>
            <Link to="/playground" className="flex items-center gap-1 text-sm min-[1920px]:text-base text-white/60 hover:text-white transition-colors">
              Playground
              <ChevronDown size={14} className="min-[1920px]:w-4 min-[1920px]:h-4" />
            </Link>
            <a href="#" className="text-sm min-[1920px]:text-base text-white/60 hover:text-white transition-colors">
              Star Program
            </a>
            <a href="#" className="text-sm min-[1920px]:text-base text-white/60 hover:text-white transition-colors">
              Official Website
            </a>
          </div>

          {/* Right: User Center */}
          <button className="flex items-center gap-1 text-sm min-[1920px]:text-base text-white/60 hover:text-white transition-colors">
            User Center
            <ChevronDown size={14} className="min-[1920px]:w-4 min-[1920px]:h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
