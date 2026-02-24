import React, { useState, useEffect, useRef, memo } from "react";
import HeroIntro from "../components/HeroIntro";
import { useNavigate, useParams } from "react-router-dom";
import ReactPlayer from "react-player";
import HeroQuiz from "../components/HeroQuiz";
import { getModules } from "../api/modules";

const ModuleView = () => {
  const navigate = useNavigate();
  const playerRef = useRef(null);
  const { pageNumber } = useParams();

  const [allGroups, setAllGroups] = useState([]);
  const [flatPages, setFlatPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const [answers, setAnswers] = useState(() => {
    const saved = sessionStorage.getItem("moduleQuizProgress");
    return saved ? JSON.parse(saved) : {};
  });

  const [error, setError] = useState(false);

  // Fetch all groups and flatten them into pages
  useEffect(() => {
    const fetchAllGroups = async () => {
      try {
        setLoading(true);
        const result = await getModules();

        if (result.success) {
          setAllGroups(result.data);


          let globalModuleUrl = null;

          for (const group of result.data) {
            const modules = group.modules || [];

            for (const module of modules) {
              if (module.content && module.content.length > 0) {
                try {
                  const parsedContent = JSON.parse(module.content[0]);

                  if (Array.isArray(parsedContent)) {
                    const urlItem = parsedContent.find(
                      item => item.type === "url" && item.url
                    );

                    if (urlItem) {
                      globalModuleUrl = urlItem.url;
                      break;
                    }
                  }
                } catch (err) { }
              }
            }

            if (globalModuleUrl) break;
          }
          // Flatten groups into pages
          const pages = [];

          result.data.forEach(group => {
            const modules = group.modules || [];
            const questions = group.questions || [];


            // Slides
            modules.forEach(module => {
              pages.push({
                type: "slide",
                groupNumber: group.groupNumber,
                module,
                moduleUrl: globalModuleUrl,
                groupName:
                  group.groupNumber <= 4
                    ? `Module ${group.groupNumber}`
                    : `Topic ${group.groupNumber}`,
              });
            });

            // Questions → attach SAME moduleUrl
            questions.forEach((question, index) => {
              pages.push({
                type: "question",
                groupNumber: group.groupNumber,
                question,
                questionIndex: index + 1,
                totalQuestions: questions.length,
                moduleUrl: globalModuleUrl,
                groupName:
                  group.groupNumber <= 4
                    ? `Module ${group.groupNumber}`
                    : `Topic ${group.groupNumber}`,
              });
            });
          });

          setFlatPages(pages);
        }
      } catch (err) {
        console.error("Error fetching groups:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllGroups();
  }, []);


  const getFirstUnattemptedPage = () => {
    const completedModules = JSON.parse(sessionStorage.getItem("completedModules") || "[]");
    const moduleQuizProgress = JSON.parse(sessionStorage.getItem("moduleQuizProgress") || "{}");

    for (let i = 0; i < flatPages.length; i++) {
      const page = flatPages[i];

      if (page.type !== "question") continue;
      if (completedModules.includes(page.groupNumber)) continue;

      const answered = moduleQuizProgress[page.groupNumber] || {};
      if (!answered[page.question._id]) {
        return i; // index of first unattempted question
      }
    }

    return null; // all completed
  };

  // Add a ref to track if this is the first load
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (flatPages.length === 0) return;

    let page = parseInt(pageNumber, 10);
    const firstUnattemptedIndex = getFirstUnattemptedPage();

    if (isNaN(page) || page < 1) {
      navigate(`/page/1`, { replace: true });
      setCurrentPage(0);
      return;
    }

    if (page > flatPages.length) {
      if (firstUnattemptedIndex !== null) {
        navigate(`/page/${firstUnattemptedIndex + 1}`, { replace: true });
        setCurrentPage(firstUnattemptedIndex);
      } else {
        navigate("/result", { replace: true });
      }
      return;
    }

    const targetIndex = page - 1;
    const targetPage = flatPages[targetIndex];

    // Skip completed module questions when navigating back via browser
    if (
      targetPage &&
      targetPage.type === "question" &&
      isModuleQuizCompleted(targetPage.groupNumber)
    ) {
      // Find previous non-completed page
      let validIndex = targetIndex - 1;
      while (validIndex >= 0) {
        const prevPage = flatPages[validIndex];
        if (prevPage.type === "question" && isModuleQuizCompleted(prevPage.groupNumber)) {
          validIndex--;
          continue;
        }
        break;
      }

      if (validIndex >= 0) {
        navigate(`/page/${validIndex + 1}`, { replace: true });
        setCurrentPage(validIndex);
      } else {
        navigate(`/page/1`, { replace: true });
        setCurrentPage(0);
      }
      return;
    }

    // Only redirect to unattempted on FIRST load
    if (isFirstLoad.current && firstUnattemptedIndex !== null && firstUnattemptedIndex < targetIndex) {
      navigate(`/page/${firstUnattemptedIndex + 1}`, { replace: true });
      setCurrentPage(firstUnattemptedIndex);
    } else {
      setCurrentPage(targetIndex);
    }

    isFirstLoad.current = false;
    setError(false);
  }, [flatPages, pageNumber, navigate]);

  const isModuleQuizCompleted = (groupNumber) => {
    const completedModules = JSON.parse(
      sessionStorage.getItem("completedModules") || "[]"
    );

    return completedModules.includes(groupNumber);
  };

  const handleNext = () => {
    const currentPageData = flatPages[currentPage];

    //  Block if current question not answered
    if (
      currentPageData.type === "question" &&
      !answers[currentPageData.groupNumber]?.[currentPageData.question._id]
    ) {
      setError(true);
      return;
    }

    // If current page is question → check if whole module completed
    if (currentPageData.type === "question") {
      const groupNumber = currentPageData.groupNumber;

      const moduleQuestions = flatPages.filter(
        p => p.type === "question" && p.groupNumber === groupNumber
      );

      const answered = answers[groupNumber] || {};

      const isCompleted = moduleQuestions.every(
        q => answered[q.question._id]
      );

      if (isCompleted) {
        //  Save completed module
        const savedCompleted = JSON.parse(
          sessionStorage.getItem("completedModules") || "[]"
        );

        if (!savedCompleted.includes(groupNumber)) {
          const updatedCompleted = [...savedCompleted, groupNumber];
          sessionStorage.setItem(
            "completedModules",
            JSON.stringify(updatedCompleted)
          );
        }

        // Remove its answers
        setAnswers(prev => {
          const updated = { ...prev };
          delete updated[groupNumber];
          sessionStorage.setItem(
            "moduleQuizProgress",
            JSON.stringify(updated)
          );
          return updated;
        });
      }
    }

    //Skip already completed module questions
    let nextIndex = currentPage + 1;

    while (nextIndex < flatPages.length) {
      const page = flatPages[nextIndex];

      if (
        page.type === "question" &&
        isModuleQuizCompleted(page.groupNumber)
      ) {
        nextIndex++;
        continue;
      }

      break;
    }

    //  Navigate
    if (nextIndex < flatPages.length) {
      navigate(`/page/${nextIndex + 1}`);
    } else {
      navigate("/result");
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrevious = () => {
    let prevIndex = currentPage - 1;

    while (prevIndex >= 0) {
      const page = flatPages[prevIndex];

      if (
        page.type === "question" &&
        isModuleQuizCompleted(page.groupNumber)
      ) {
        prevIndex--;
        continue;
      }

      break;
    }

    if (prevIndex >= 0) {
      navigate(`/page/${prevIndex + 1}`);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOptionClick = (groupNumber, questionId, optionKey) => {
    setError(false);

    setAnswers(prev => {
      const updated = {
        [groupNumber]: {
          ...(prev[groupNumber] || {}),
          [questionId]: optionKey
        }
      };

      sessionStorage.setItem("moduleQuizProgress", JSON.stringify(updated));
      return updated;
    });
  };

  const renderTextWithLinks = (text) => {
    if (!text) return null;

    const regex = /\[([^\]]+)\]\((https?:\/\/[^\s]+)\)/g;
    const elements = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        elements.push(text.slice(lastIndex, match.index));
      }

      elements.push(
        <a
          key={match.index}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800"
        >
          {match[1]}
        </a>
      );

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      elements.push(text.slice(lastIndex));
    }

    return elements;
  };

  const parseContent = (contentJson) => {
    if (!contentJson) return [];

    try {
      if (Array.isArray(contentJson) && contentJson.length > 0) {
        const firstItem = contentJson[0];
        if (typeof firstItem === 'string') {
          return JSON.parse(firstItem);
        }
        return contentJson;
      }
      return [];
    } catch (e) {
      console.error("Error parsing content:", e);
      return [];
    }
  };

  if (loading) {
    return (
      <>
        <HeroIntro totalSlides={flatPages.length} currentSlide={1} />
        <div className="left-1/2 transform -translate-x-1/2 relative -mt-[4rem] w-[90%] rounded-lg border border-gray-300 flex flex-col p-6 bg-white">
          <div className="text-center text-gray-600 text-[1rem] sm:text-[1.1rem] md:text-[1.2rem]">
            Loading...
          </div>
        </div>
      </>
    );
  }

  if (flatPages.length === 0) {
    return (
      <>
        <HeroIntro totalSlides={0} currentSlide={0} />
        <div className="left-1/2 transform -translate-x-1/2 relative -mt-[4rem] w-[90%] rounded-lg border border-gray-300 flex flex-col p-6 bg-white">
          <div className="flex flex-col items-center justify-center py-8">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-20 h-20 text-gray-400 mx-auto mb-4"
              viewBox="0 0 24 24"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth={2}
                fill="none"
              />
              <text
                x="12"
                y="16"
                textAnchor="middle"
                fontSize="12"
                fill="currentColor"
                fontFamily="sans-serif"
                fontWeight="bold"
              >
                ?
              </text>
            </svg>
            <p className="text-gray-600">No Content Found</p>
          </div>
        </div>
      </>
    );
  }

  const currentPageData = flatPages[currentPage];
  const totalPages = flatPages.length + 1;
  const currentPageNumber = currentPage + 1;

  // Render Question Page (with your exact Quizpage styling)
  if (currentPageData.type === 'question') {
    const question = currentPageData.question;
    const selected = answers[currentPageData.groupNumber]?.[question._id];
    const isCorrect = selected === question.correctAnswer;
    const optionsArray = Object.entries(question.options || {})
      .filter(([_, value]) => value && value.trim() !== "");

    return (
      <>
        <HeroQuiz
          totalSlides={totalPages}
          currentSlide={currentPageNumber}
        />

        <div className="left-1/2 transform -translate-x-1/2 relative -mt-[4rem] w-[90%] rounded-lg border border-gray-300 flex flex-col gap-4 p-6 bg-white mb-12">
          {/* Question */}
          <h2 className="text-[1.1rem] sm:text-[1.2rem] md:text-[1.3rem] font-bold break-words mb-2">
            {currentPageData.questionIndex}. {question.questionText}
          </h2>

          {/* Options */}
          <div className="flex flex-col gap-3">
            {optionsArray.map(([key, value]) => {
              const isSelectedOption = key === selected;
              let style = "border border-gray-300 bg-white";

              if (selected && isSelectedOption) {
                style =
                  key === question.correctAnswer
                    ? "border border-[#07C82E] bg-[#07C82E1A]"
                    : "border border-[#416DE7] bg-bgColor";
              }

              return (
                <button
                  key={key}
                  onClick={() =>
                    handleOptionClick(
                      currentPageData.groupNumber,
                      question._id,
                      key
                    )
                  }
                  className={`w-full min-h-[3rem] sm:min-h-[3.5rem] flex gap-2 p-2 sm:p-2.5 rounded-lg font-normal text-left break-words text-[1rem] sm:text-[1.1rem] md:text-[1.2rem] ${style}`}
                >
                  <span className="font-bold">{key}.</span> {value}
                </button>
              );
            })}
          </div>

          {/* Error */}
          {error && (
            <p className="text-[0.95rem] sm:text-[1rem] md:text-[1.1rem] text-tertiary mt-2">
              Please select an option before proceeding.
            </p>
          )}

          {/* Correct explanation or fallback */}
          {selected && isCorrect && (
            <div className="flex gap-2 mt-4 border border-[#07C82E] bg-[#07C82E1A] rounded-lg p-3 sm:p-4">
              <img
                src="/images/correct.png"
                alt="correct"
                className="w-5 h-5 sm:w-[1.5rem] sm:h-[1.5rem] mt-1"
              />
              <div className="flex flex-col break-words">
                <p className="font-bold text-[#07C82E] text-[1.1rem] sm:text-[1.2rem] md:text-[1.3rem]">
                  Correct
                </p>
                <p className="text-[1rem]">
                  {question.explanation
                    ? question.explanation
                    : question.options[question.correctAnswer]}
                </p>
              </div>
            </div>
          )}

          {/* Progress + Buttons */}
          <div className="flex flex-col md:flex-row min-h-[3rem] justify-between items-center md:items-end mt-4 gap-4 sm:gap-0">
            {/* Dynamic Progress Boxes */}
            <div className="flex flex-wrap justify-center md:justify-start gap-1.5 mb-4 md:mb-0 md:w-1/2">
              {Array.from({ length: totalPages }).map((_, index) => {
                const isCompleted = index < currentPageNumber;
                return (
                  <div
                    key={index}
                    className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-colors duration-300 ${isCompleted ? "bg-primary" : "bg-boxColor"
                      }`}
                  />
                );
              })}
            </div>

            {/* Buttons */}
            <div className="flex justify-center md:justify-end gap-2 sm:gap-[1.0425rem]">
              <button
                onClick={handlePrevious}
                className="group hover:bg-primary hover:text-white text-[1rem] sm:text-[1.1rem] md:text-[1.2rem] w-[7rem] sm:w-[10rem] h-[2.5rem] sm:h-[3rem] p-[0.9rem] sm:p-[1.125rem] rounded-[0.463rem] bg-secondary text-black flex items-center justify-center gap-2 sm:gap-3 transition-colors duration-300"
              >
                <img
                  src="/images/previous.png"
                  alt="Previous"
                  className="w-4 h-4 sm:w-5 sm:h-5 group-hover:brightness-0 group-hover:invert transition-all duration-300"
                />
                Previous
              </button>

              <button
                onClick={handleNext}
                className="hover:bg-buttonBG text-[1rem] sm:text-[1.1rem] md:text-[1.2rem] w-[7rem] sm:w-[10rem] h-[2.5rem] sm:h-[3rem] p-[0.9rem] sm:p-[1.125rem] rounded-[0.463rem] bg-primary text-white flex items-center justify-center gap-2 sm:gap-3 transition-colors duration-300"
              >
                Next
                <img
                  src="/images/next.png"
                  alt="Next"
                  className="w-4 h-4 sm:w-5 sm:h-5"
                />
              </button>
            </div>
          </div>

          {/* Disclaimer URL */}
          {currentPageData.moduleUrl && (
            <div className="flex gap-1 text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-gray-600 flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <circle cx="12" cy="16" r="1"></circle>
              </svg>
              <div>
                <span className="text-sm">
                  If you are experiencing any of the symptoms above make sure to schedule
                  a virtual ergonomic assessment{" "}
                </span>
                <a
                  href={currentPageData.moduleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  here
                </a>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  // Render Slide Page (keeping your existing slide styling)
  const module = currentPageData.module;
  const moduleUrl = currentPageData.moduleUrl;

  return (
    <>
      <HeroIntro
        title={module.name}
        totalSlides={totalPages}
        currentSlide={currentPageNumber}
        videoDuration={module?.videoDuration || ""}
        videoLink={module?.videoLink}
      />

      <div className="left-1/2 transform -translate-x-1/2 relative -mt-[4rem] w-[90%] rounded-lg border border-gray-300 flex flex-col p-8 bg-white mb-12">
        <div className="flex flex-col md:flex-row justify-between gap-6 md:gap-8">
          {/* Text Section */}
          <div className={`flex flex-col ${module.videoLink ? 'w-full md:w-1/2' : 'w-full'}`}>
            {(() => {
              const content = parseContent(module.content);
              return content.map((item, idx) => {
                switch (item.type) {
                  case "heading":
                    return (
                      <h2 key={item.id || idx} className="font-bold text-[1.1rem] sm:text-[1.2rem] md:text-[1.3rem] mb-1.5">
                        {item.content}
                      </h2>
                    );

                  case "paragraph":
                    return (
                      <p key={item.id || idx} className="text-[0.9rem] sm:text-[1rem] md:text-[1.1rem] mb-1.5">
                        {renderTextWithLinks(item.content)}
                      </p>
                    );

                  case "bullets":
                    return (
                      <ul
                        key={item.id || idx}
                        className="list-disc list-inside text-[0.9rem] sm:text-[1rem] md:text-[1.1rem] mb-3"
                      >
                        {Array.isArray(item.content) &&
                          item.content
                            .filter(b => b && b.text?.trim() !== "")
                            .map((bullet, bulletIdx) => (
                              <li key={bullet.id || bulletIdx} className="ml-4">
                                {bullet.text}
                                {bullet.subBullets && bullet.subBullets.length > 0 && (
                                  <ul className="list-[circle] list-inside ml-6 text-[0.9rem] sm:text-[1rem] md:text-[1.1rem]">
                                    {bullet.subBullets
                                      .filter(sub => sub && sub.text?.trim() !== "")
                                      .map((sub, subIdx) => (
                                        <li key={sub.id || subIdx} className="ml-4">
                                          {sub.text}
                                        </li>
                                      ))}
                                  </ul>
                                )}
                              </li>
                            ))}
                      </ul>
                    );

                  default:
                    return null;
                }
              });
            })()}
          </div>

          {/* Video Section */}
          {module.videoLink && (
            <div className="w-full md:w-1/2">
              <div className="w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
                <ReactPlayer
                  ref={playerRef}
                  src={module.videoLink}
                  controls
                  width="100%"
                  height="100%"
                  config={{
                    youtube: {
                      playerVars: { showinfo: 1 }
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Progress + Buttons */}
        <div className="mt-10 flex flex-col md:flex-row min-h-[3rem] justify-between items-center md:items-end gap-4">
          {/* Progress Dots */}
          <div className="flex flex-wrap justify-center md:justify-start gap-1.5">
            {Array.from({ length: totalPages }).map((_, index) => {
              const isCompleted = index < currentPageNumber;
              return (
                <div
                  key={index}
                  className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-colors duration-300 ${isCompleted ? "bg-primary" : "bg-boxColor"
                    }`}
                />
              );
            })}
          </div>

          {/* Buttons */}
          <div className="flex justify-center md:justify-end gap-2 sm:gap-[1.0425rem]">
            <button
              onClick={handlePrevious}
              disabled={currentPage === 0}
              className={`group hover:bg-primary hover:text-white text-[1rem] sm:text-[1.1rem] md:text-[1.2rem] w-[7rem] sm:w-[10rem] h-[2.5rem] sm:h-[3rem] p-[0.9rem] sm:p-[1.125rem] rounded-[0.463rem] bg-secondary text-black flex items-center justify-center gap-2 sm:gap-3 transition-colors duration-300 ${currentPage === 0 ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
              <img
                src="/images/previous.png"
                alt="Previous"
                className="w-4 h-4 sm:w-5 sm:h-5 group-hover:brightness-0 group-hover:invert transition-all duration-300"
              />
              Previous
            </button>

            <button
              onClick={handleNext}
              className="hover:bg-buttonBG text-[1rem] sm:text-[1.1rem] md:text-[1.2rem] w-[7rem] sm:w-[10rem] h-[2.5rem] sm:h-[3rem] p-[0.9rem] sm:p-[1.125rem] rounded-[0.463rem] bg-primary text-white flex items-center justify-center gap-2 sm:gap-3 transition-colors duration-300"
            >
              Next
              <img src="/images/next.png" alt="Next" className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Disclaimer URL */}
        {currentPageData.moduleUrl && (
          <div className="mt-3">
            <div className="flex gap-1 text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-gray-600 flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <circle cx="12" cy="16" r="1"></circle>
              </svg>
              <div>
                <span className="text-sm">
                  If you are experiencing any of the symptoms above make sure to schedule
                  a virtual ergonomic assessment{" "}
                </span>
                <a
                  href={currentPageData.moduleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  here
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default memo(ModuleView);