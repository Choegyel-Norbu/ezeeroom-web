import React from "react";
import { FaJava } from "react-icons/fa";

export default function JavaCard() {
  return (
    <div className="flex items-center justify-center  w-fit">
      <div className="relative w-70 h-80 perspective-1000">
        <div className="group w-full h-full relative preserve-3d transition-transform duration-700 hover:rotate-y-180">
          {/* Front Side */}
          <div className="absolute inset-0 w-full h-full backface-hidden rounded-xl shadow-xl border border-gray-200 flex flex-col items-center justify-center">
            <div className="mb-6">
              {/* Java Icon */}
              <FaJava className="text-6xl text-red-600 mb-2" />
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-3 text-center">
              Java
            </h2>

            <div className="text-center space-y-2 text-gray-600">
              <p className="text-sm font-medium">Programming Language</p>

              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <span className="px-3 py-1 text-blue-700 rounded-full text-xs font-medium">
                  OOP
                </span>
                <span className="px-3 py-1 text-blue-700 rounded-full text-xs font-medium">
                  Platform Independent
                </span>
                <span className="px-3 py-1 text-blue-700 rounded-full text-xs font-medium">
                  Multi-threading
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
                <h3 className="text-lg font-semibold text-white">Java</h3>
                <div className="flex space-x-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
              </div>

              <div className="flex-1 bg-gray-800 rounded-lg p-4 overflow-auto">
                <pre className="text-xs text-gray-300 leading-relaxed">
                  <code>{`public class Main {
    public static void main(String[] args) {
        // Simple Hello World
        System.out.println("Hello, Java!");
        
        // Demonstrate OOP
        Person john = new Person("John", 30);
        john.introduce();
    }
}

class Person {
    private String name;
    private int age;
    
    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }
    
    public void introduce() {
        System.out.printf(
            "Hi, I'm %s and I'm %d years old.%n", 
            name, age
        );
    }
    
    // Getters and setters
    public String getName() { return name; }
    public int getAge() { return age; }
}`}</code>
                </pre>
              </div>

              <div className="mt-3 text-xs text-gray-400 text-center">
                Object-Oriented Programming in Java
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
