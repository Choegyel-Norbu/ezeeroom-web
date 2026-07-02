import React from "react";
import { Link } from "react-router-dom";

const FeatureCard = ({ icon: Icon, title, description, to }) => {
  const CardContent = (
    <div className="group relative flex h-full flex-col items-center text-center p-6 bg-white rounded-2xl border border-gray-200 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
      {/* Icon */}
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-md transition-transform duration-300 group-hover:scale-110">
        {Icon && <Icon className="w-7 h-7" />}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>

      {/* Description */}
      <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="h-full block no-underline">
        {CardContent}
      </Link>
    );
  }

  return CardContent;
};

export default FeatureCard;
