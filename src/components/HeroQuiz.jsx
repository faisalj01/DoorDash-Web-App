// HeroQuiz.jsx
import React from "react";
import HeroSection from "./HeroSection";

const HeroQuiz = ({ totalSlides, currentSlide }) => {
  return (
    <HeroSection 
      type="quiz"
      title="Knowledge Check"
      para="Test your understanding of monitor ergonomics"
      totalSlides={totalSlides}
      currentSlide={currentSlide}
    />
  );
};

export default HeroQuiz;