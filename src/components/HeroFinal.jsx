// HeroFinal.jsx
import React from "react";
import HeroSection from "./HeroSection";

const HeroFinal = ({ totalSlides, currentSlide }) => {
  return (
    <div>
      <HeroSection 
        type="result"
        finaltitle="Congratulations!"
        finalpara="You've completed the Office Ergonomics module."
        totalSlides={totalSlides}
        currentSlide={currentSlide}
      />
    </div>
  );
};

export default HeroFinal;