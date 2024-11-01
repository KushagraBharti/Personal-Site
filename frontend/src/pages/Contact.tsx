import React, { useState } from "react";
import Navbar from "../components/Navbar";

const Contact: React.FC = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", form);
  };

  return (
    <div>
      <Navbar />
      <section className="container mx-auto px-4 mt-10">
        <h2 className="text-2xl font-semibold mb-6">Contact Me</h2>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
          />
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
          />
          <textarea
            name="message"
            placeholder="Your Message"
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
          />
          <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md">
            Send
          </button>
        </form>
      </section>
    </div>
  );
};

export default Contact;
