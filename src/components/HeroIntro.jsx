import React from "react";
import HeroSection from "./HeroSection";

const HeroIntro = ({ title, totalSlides, currentSlide, videoDuration, imageUrl, videoLink }) => {
  const hasVideo = !!videoLink;
  const hasImage = !!imageUrl;

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
      hasImage={!hasVideo && hasImage} // image only used if video doesn't exist
    />
  );
};


export default HeroIntro;
