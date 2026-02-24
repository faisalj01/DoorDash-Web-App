// HeroSection.jsx
import React from "react";
import { Link } from "react-router-dom";

const HeroSection = ({
  title,
  timerText,
  para,
  finaltitle,
  finalpara,
  type = "intro",
  totalSlides = 0,
  currentSlide = 1,
  hasVideo = false
}) => {
  const parentMinHeight = type === "result" ? "min-h-[33rem]" : "min-h-[25rem]";

  return (
    <div className={` bg-primary ${parentMinHeight} pt-10 pb-10 flex flex-col overflow-x-hidden`}>
      <div className="flex flex-col items-center gap-6">
        <div className="w-[90%] flex flex-col gap-10">
          <div className="opacity-100 mx-auto">
            <Link to="/page/1">
              <img
                src="/images/Group 1000008302.png"
                alt="Logo"
                className="h-[2rem] object-contain"
              />
            </Link>
          </div>

          <div className="flex flex-col gap-6">
            {/* Background bar */}
            <div
              className="h-[1.1rem] rounded-[21px] bg-white/30 overflow-hidden"
              style={{ transform: "rotate(0.03deg)" }}
            >
              {/* Filled bar */}
              <div
                className="h-full bg-white transition-all duration-500"
                style={{
                  width: `${Math.max((currentSlide / totalSlides) * 100, 10)}%`,
                }}
              />
            </div>

            {/* Slide text */}
            <p className=" text-white text-[1rem] sm:text-[1.1rem] md:text-[1.2rem]">
              Slide {currentSlide} of {totalSlides}
            </p>
          </div>

        </div>

        {type !== "result" && (
          <div className="w-full border-b border-black/40"></div>
        )}

        <div className="w-[90%] flex flex-col gap-6">
          <h1 className="font-bold text-[1.6rem] sm:text-[2rem] md:text-[2.2rem] leading-[100%] tracking-[0px] text-white">
            {title}
          </h1>

          {type === "intro" && (
            <div className="flex gap-6 flex-wrap">
              {/* Show timer only if there’s a video AND no image */}
              {timerText && hasVideo && (
                <div className="flex items-center gap-2">
                  <img
                    src="/images/timer.png"
                    alt="Timer"
                    className="w-[1.2rem] h-[1.2rem] object-contain rounded"
                  />
                  <span className="text-white text-[1rem] sm:text-[1.1rem] md:text-[1.2rem]">{timerText}</span>
                </div>
              )}



              <div className="flex items-center gap-2">
                <img
                  src="/images/play.png"
                  alt="Steps"
                  className="w-[1.2rem] h-[1.2rem] object-contain rounded"
                />
                <span className="text-white text-[1rem] sm:text-[1.1rem] md:text-[1.2rem]">{totalSlides} steps</span>
              </div>
            </div>
          )}

          {type === "quiz" && (
            <p className="text-white text-[1rem] sm:text-[1.1rem] md:text-[1.2rem]">{para}</p>
          )}
          {type === "result" && (
            <div>
              {para && <p className="text-white text-[0.9rem] text-[1rem] sm:text-[1.1rem] md:text-[1.2rem]">{para}</p>}
              <img
                src="./images/final.png"
                alt=""
                className="w-[5.5rem] h-[6.83rem] mx-auto"
              />
              <div className="flex flex-col gap-1 mt-2">
                <h1 className="text-white text-center text-[1.6rem] sm:text-[2rem] font-bold">{finaltitle}</h1>
                <p className="text-white text-center text-[0.9rem] text-[1rem] sm:text-[1.1rem] md:text-[1.2rem]">{finalpara}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
