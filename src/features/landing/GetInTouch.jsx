import React, { useState } from "react";
import api from "../../shared/services/Api";
import { toast } from "sonner";

const GetInTouch = React.forwardRef((props, ref) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    consent: false,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await api.post("/getIntouch", formData);

      if (response.status === 200) {
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
          consent: false,
        });
        toast.success("SUCCESS! Your information was submitted successfully.");
      } else {
        throw new Error("Submission failed");
      }
    } catch (error) {
      
      toast.error("ERROR! There was a problem submitting your information.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <section ref={ref} class="py-16 sm:px-6 lg:px-8 ">
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-4">
          <h2 class="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Get in Touch
          </h2>
          <p class=" px-4 text-14 text-gray-700">
            Have a project in mind or want to collaborate? Drop me a message
            below.
          </p>
        </div>

        <div class="bg-white shadow-xl overflow-hidden">
          <div class="p-8 sm:p-10">
            <form class="space-y-6">
              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label
                    for="name"
                    class="block text-sm font-medium text-gray-700"
                  >
                    Full Name
                  </label>
                  <div class="mt-1">
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      class="block w-full px-4 py-1 md:py-2  border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label
                    for="email"
                    class="block text-sm font-medium text-gray-700"
                  >
                    Email Address
                  </label>
                  <div class="mt-1">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      class="block w-full px-4 py-1 md:py-2  border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  for="subject"
                  class="block text-sm font-medium text-gray-700"
                >
                  Subject
                </label>
                <div class="mt-1">
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    class="block w-full px-4 py-1 md:py-2  border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                    placeholder="What's this about?"
                  />
                </div>
              </div>

              <div>
                <label
                  for="message"
                  class="block text-sm font-medium text-gray-700"
                >
                  Your Message
                </label>
                <div class="mt-1">
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="5"
                    class="block w-full px-4 py-1 md:py-2  border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                    placeholder="Tell me about your project..."
                  ></textarea>
                </div>
              </div>

              <div class="flex items-center">
                <input
                  id="consent"
                  name="consent"
                  type="checkbox"
                  checked={formData.consent}
                  onChange={handleChange}
                  class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label for="consent" class="ml-2 block text-sm text-gray-700">
                  I consent to having this website store my submitted
                  information so I can receive a response.
                </label>
              </div>

              <div>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={!formData.consent}
                  className={`${
                    formData.consent
                      ? "bg-blue-400 hover:bg-blue-500 cursor-pointer"
                      : "bg-blue-300 cursor-not-allowed opacity-70"
                  } w-full text-white py-2 rounded-md transition duration-200 flex items-center justify-center gap-2`}
                >
                  Send Message
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="ml-2 h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </form>
          </div>

          <div class="bg-gray-50 px-8 py-6 sm:flex sm:items-center sm:justify-between">
            <div class="text-center sm:text-left">
              <h3 class="text-lg font-medium text-gray-900">Prefer email?</h3>
              <p class="mt-1 text-sm text-gray-600">
                You can also reach me directly at{" "}
                <span class="font-medium text-primary">
                  choegyell@gmail.com
                </span>
              </p>
            </div>
            <div class="mt-4 sm:mt-0">
              <a
                href="mailto:choegyell@gmail.com"
                class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
              >
                Open Email
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="ml-2 -mr-1 h-5 w-5 text-gray-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

export default GetInTouch;
