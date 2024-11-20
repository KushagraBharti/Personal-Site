import React, { useState } from "react";

const Contact: React.FC = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", form);
  };//work

  return (
    <section className="py-16">
      <div className="container mx-auto">
        <h2 className="section-heading">Contact Me</h2>
        <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <textarea
            name="message"
            placeholder="Your Message"
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            className="btn-primary w-full"
          >
            Send
          </button>
        </form>
      </div>
    </section>
  );
};

export default Contact;
