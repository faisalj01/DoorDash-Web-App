import React, { useState, useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";
import HeroFinal from "../components/HeroFinal";

const Results = () => {
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [modules, setModules] = useState([]);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/grouped-modules`);
                const result = await response.json();

                if (result.success) {
                    const groups = result.data;

                    // Extract modules
                    setModules(groups);

                    // Flatten questions
                    const allQuestions = [];
                    groups.forEach(group => {
                        const questions = group.questions || [];
                        questions.forEach(q => {
                            allQuestions.push({ ...q, groupNumber: group.groupNumber });
                        });
                    });
                    setQuestions(allQuestions);
                }
            } catch (err) {
                console.error(err);
            }
        };

        fetchAllData();
    }, []);

    // Suppose modulesData is the grouped modules fetched from API
    const flatPages = [];

    modules.forEach(group => {
        (group.modules || []).forEach(module => {
            flatPages.push({ type: "slide", module, groupNumber: group.groupNumber });
        });
        (group.questions || []).forEach(q => {
            flatPages.push({ type: "question", question: q, groupNumber: group.groupNumber });
        });
    });

    useEffect(() => {
        if (modules.length === 0) return;

        const completedModules = JSON.parse(
            sessionStorage.getItem("completedModules") || "[]"
        );

        const moduleQuizProgress = JSON.parse(
            sessionStorage.getItem("moduleQuizProgress") || "{}"
        );

        // Flatten pages like ModuleView
        const flatPages = [];

        modules.forEach(group => {
            (group.modules || []).forEach(module => {
                flatPages.push({
                    type: "slide",
                    groupNumber: group.groupNumber
                });
            });

            (group.questions || []).forEach((q, index) => {
                flatPages.push({
                    type: "question",
                    groupNumber: group.groupNumber,
                    questionIndex: index + 1,
                    questionId: q._id
                });
            });
        });

        //  Find the first unattempted question
        for (let i = 0; i < flatPages.length; i++) {
            const page = flatPages[i];

            if (page.type !== "question") continue;
            if (completedModules.includes(page.groupNumber)) continue;

            const answered = moduleQuizProgress[page.groupNumber] || {};

            if (!answered[page.questionId]) {
                // Navigate to the **first unattempted question**
                navigate(`/page/${i + 1}`, { replace: true });
                return;
            }
        }

        // If everything completed → allow result
        sessionStorage.setItem("quizCompleted", "true");

    }, [modules, navigate]);


    const handleNext = () => {
        navigate("/page/1"); // navigate to Final page
    };

    return (
        <>
            <HeroFinal totalSlides={flatPages.length + 1} currentSlide={flatPages.length + 1} />
            {/* Second main section */}
            <div className="left-1/2 transform -translate-x-1/2 relative w-full -mt-[4rem] max-w-[90%] rounded-lg flex flex-col gap-8 bg-white">

                {/* Key Takeaways */}
                <div className="w-full gap-6 rounded-lg flex flex-col items-center p-4 sm:p-6 border border-gray-300">
                    <h2 className="text-[1.1rem] sm:text-[1.2rem] md:text-[1.3rem] font-bold">
                        Key Takeaways
                    </h2>

                    {questions.length === 0 ? (
                        <p className="text-gray-500 text-[1rem] sm:text-[1.1rem] md:text-[1.2rem] py-4">
                            Loading answers...
                        </p>
                    ) : (
                        <div className="w-full max-w-[60rem] grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {questions.map((q, i) => (
                                <div
                                    key={q._id}
                                    className="flex gap-2 items-baseline rounded-[1rem] border border-gray-300 w-full p-4 sm:p-6 break-words"
                                >
                                    {/* Number */}
                                    <span className="font-bold text-[1rem] sm:text-[1.1rem] md:text-[1.2rem]">
                                        {String(i + 1).padStart(2, "0")}.
                                    </span>

                                    {/* Answer text */}
                                    <p className="text-sm sm:text-base text-[1rem] sm:text-[1.1rem] md:text-[1.2rem] break-words">
                                        {q.correctAnswer && q.options ? q.options[q.correctAnswer] : "No answer available"}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>



                {/* Call to Action */}
                <div className="flex flex-col items-center gap-4 rounded-lg border border-tertiary p-6 sm:p-8 bg-bgColor mb-10">
                    <h2 className="font-bold text-[1.1rem] sm:text-[1.2rem] md:text-[1.3rem] text-center">
                        Ready to Transform Your Workspace?
                    </h2>

                    <p className="text-center text-sm sm:text-base text-[1rem] sm:text-[1.1rem] md:text-[1.2rem]">
                        Apply these ergonomic principles today and feel the difference in your comfort and productivity.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4">

                        <button
                            onClick={handleNext}
                            className=" w-[8rem] sm:w-[13rem] h-[2.5rem] sm:h-[3rem]
              rounded-[0.463rem] text-tertiary
              flex items-center justify-center
              hover:bg-primary hover:text-white transition-colors duration-300
              text-[1rem] sm:text-[1.1rem] md:text-[1.2rem]  border-2 border-tertiary hover:border-transparent"
                        >
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>

        </>
    )
}

export default memo(Results);