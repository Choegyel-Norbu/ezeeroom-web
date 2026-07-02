import React from "react";
import { SiTailwindcss } from "react-icons/si";

export default function TailwindCard() {
  return (
    <div className="flex items-center justify-center  w-fit">
      <div className="relative w-70 h-80 perspective-1000">
        <div className="group w-full h-full relative preserve-3d transition-transform duration-700 hover:rotate-y-180">
          {/* Front Side */}
          <div className="absolute inset-0 w-full h-full backface-hidden rounded-xl shadow-xl border border-gray-200 flex flex-col items-center justify-center">
            <div className="mb-6">
              {/* Tailwind CSS Icon */}
              <SiTailwindcss className="text-6xl text-primary mb-2" />
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-3 text-center">
              Tailwind CSS
            </h2>

            <div className="text-center space-y-2 text-gray-600">
              <p className="text-sm font-medium">Utility-First CSS Framework</p>

              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <span className="px-3 py-1 text-blue-700 rounded-full text-xs font-medium">
                  Responsive
                </span>
                <span className="px-3 py-1 text-blue-700 rounded-full text-xs font-medium">
                  Utility-First
                </span>
                <span className="px-3 py-1 text-blue-700 rounded-full text-xs font-medium">
                  Customizable
                </span>
              </div>
            </div>

            <div className="mt-6 text-xs text-gray-400 flex items-center">
              <span>Hover to see code →</span>
            </div>
          </div>

          {/* Back Side */}
          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-gray-900 rounded-xl shadow-xl border border-gray-700 p-4 overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Tailwind CSS
                </h3>
                <div className="flex space-x-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
              </div>

              <div className="flex-1 bg-gray-800 rounded-lg p-4 overflow-auto">
                <pre className="text-xs text-gray-300 leading-relaxed">
                  <code>{`<div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
  <div className="flex items-center space-x-4">
    <div className="shrink-0">
      <div className="h-12 w-12 rounded-full bg-green-500 
           flex items-center justify-center text-white">
        TW
      </div>
    </div>
    <div>
      <h4 className="text-xl font-medium text-gray-900">
        Tailwind Component
      </h4>
      <p className="text-gray-500">
        Styled with utility classes
      </p>
    </div>
  </div>
  
  <div className="mt-4 flex space-x-3">
    <button className="px-4 py-2 bg-green-500 text-white 
            rounded-md hover:bg-green-600 transition">
      Primary
    </button>
    <button className="px-4 py-2 border border-gray-300 
            rounded-md hover:bg-gray-50 transition">
      Secondary
    </button>
  </div>
</div>`}</code>
                </pre>
              </div>

              <div className="mt-3 text-xs text-gray-400 text-center">
                Utility-first component example
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .group:hover .hover\\:rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
