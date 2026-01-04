import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PlaygroundCTASection = () => {
  return (
    <section className="bg-[#5E8DFB] py-20 px-4">
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center gap-8">
        <h2 className="text-3xl md:text-4xl font-medium text-white text-center tracking-tight" style={{ fontFamily: 'HFTerse, sans-serif' }}>
          Visit the Playground for full capabilities
        </h2>
        <Link to="/playground">
          <Button className="px-12 py-3 h-auto text-base font-semibold bg-[#AD0606] hover:bg-[#8a0505] text-white rounded-[3px] transition-all duration-300">
            Try now
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default PlaygroundCTASection;
