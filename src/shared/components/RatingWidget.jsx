import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";
import { getStorageItem, setStorageItem } from "@/shared/utils/safariLocalStorage";
import api from "../../shared/services/Api";

const RatingWidget = ({ onClose }) => {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const fetchAverageRating = async () => {
      try {
        const res = await api.get("/averageRating"); // 👈 Await here
        setSummary(res.data);
      } catch (error) {
        
      }
    };

    fetchAverageRating();
  }, []);

  const submitRating = async () => {
    if (!rating) return alert("Please select a rating");

    try {
      const res = await api.post("/rating", {
        stars: rating,
        feedback: feedback,
      });
      if (res.data) {
        setSubmitted(true);
        setStorageItem("hasRated", "true");

        setTimeout(() => {
          onClose();
        }, 3000);
      }
    } catch (error) {
      
    }
    setRating(0);
  };

  return (
    <>
      <div className="w-[100%] mt-10 shadow-sm shadow-xl p-6 text-center bg-white">
        {submitted ? (
          <div className="p-8 ">
            <h3>Thanks for rating my site!</h3>
          </div>
        ) : (
          <div className=" flex flex-col sm:flex-row items-center justify-end gap-4 ">
            <div className="hidden md:flex mt-6 text-center text-gray-600">
              <p className="text-sm"> Average Rating: {summary} ⭐(s) </p>
            </div>
            <div className="">
              <h2 className="text-lg font-bold text-center text-gray-9 mb-4">
                Rate My Site
              </h2>

              <div className="flex justify-center mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={25}
                    className={`cursor-pointer transition-transform duration-200 ${
                      (hovered || rating) >= star
                        ? "text-yellow-400 scale-110 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-row items-center gap-8">
              <div
                onClick={submitRating}
                className="w-fit px-8 text-14 py-1 border-1 cursor-pointer text-[#4d4d4d] transition"
              >
                Submit
              </div>
              <div
                onClick={() => onClose()}
                className="w-fit border text-14 px-8 py-1 cursor-pointer text-[#4d4d4d] transition"
              >
                Remind me later
              </div>

              {submitted && (
                <motion.p
                  className="mt-4 text-green-600 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  Thank you for your feedback! 🙌
                </motion.p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default RatingWidget;
