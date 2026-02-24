import React from "react";
import HeroSection from "./HeroSection";

const HeroIntro = ({ title, totalSlides, currentSlide, videoDuration,videoLink }) => {
  const hasVideo = !!videoLink;

  // Timer only shows if video exists AND duration is provided
  const showTimer = hasVideo && !!videoDuration;

  return (
    <HeroSection
      type="intro"
      title={title}
      timerText={showTimer ? videoDuration : ""}
      totalSlides={totalSlides}
      currentSlide={currentSlide}
      hasVideo={hasVideo}
    />
  );
};


export default HeroIntro;
