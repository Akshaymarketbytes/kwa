import React from "react";
import { NavLink } from "react-router-dom";
 
const Dashboard = () => {
  const sidebarSections = [
    {
      title: "Core",
      description: (
        <>Access essential features like the dashboard and profile settings.</>
      ),
    },
    {
      title: "Operations",
      description: (
        <>
          Manage complaints, blue brigade, running contracts, valves, area, and
          flows.
        </>
      ),
    },
    {
      title: "Admin",
      description: (
        <>Handle user management tasks, including roles and permissions.</>
      ),
    },
    {
      title: "E-Tap",
      description: (
        <>Access E-Tap portal, connection, and conversion features.</>
      ),
    },
  ];
 
  return (
    <div className="w-full mx-auto p-4">
      <h1 className="text-xl font-bold text-gray-800 mb-4 tracking-tight">
        Kerala Water Authority Dashboard
      </h1>
      <p className="text-sm text-gray-600 mb-8 max-w-3xl leading-relaxed">
        Welcome to the Kerala Water Authority Dashboard. Explore different
        sections to manage and monitor water-related operations and
        administration.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sidebarSections.map((section, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              {section.title}
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              {section.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
 
export default Dashboard;
 
 