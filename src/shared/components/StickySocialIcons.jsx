import React from "react";
import { motion } from "framer-motion";
import { Facebook, Instagram } from "lucide-react";
import TikTokIcon from "./TikTokIcon";

const StickySocialIcons = () => {
  const socialLinks = [
    {
      name: "Facebook",
      icon: Facebook,
      url: "https://www.facebook.com/share/16FrEJNPGS/",
      iconColor: "text-blue-600",
      hoverColor: "hover:text-blue-700",
      bgColor: "hover:bg-blue-50",
    },
    {
      name: "Instagram",
      icon: Instagram,
      url: "https://www.instagram.com/ezeeroom/", // Update with actual Instagram URL if available
      iconColor: "text-foreground",
      hoverColor: "hover:text-foreground",
      bgColor: "hover:bg-gray-100 dark:hover:bg-gray-800",
    },
    {
      name: "TikTok",
      icon: TikTokIcon,
      url: "https://www.tiktok.com/@ezeeroom?_t=ZS-90GXYrhhzYW&_r=1",
      iconColor: "text-[#050203] dark:text-white",
      hoverColor: "hover:text-[#050203] dark:hover:text-white",
      bgColor: "hover:bg-gray-100 dark:hover:bg-gray-800",
    },
  ];

  const handleClick = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.div
      className="fixed right-4 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col items-center gap-3"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      {socialLinks.map((social, index) => {
        const IconComponent = social.icon;
        return (
          <motion.button
            key={social.name}
            onClick={() => handleClick(social.url)}
            className={`
              w-12 h-12 rounded-full 
              bg-white dark:bg-gray-800
              border border-border 
              shadow-lg 
              flex items-center justify-center
              transition-all duration-300
              ${social.bgColor}
              backdrop-blur-sm
            `}
            aria-label={social.name}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.3,
              delay: 0.4 + index * 0.1,
              type: "spring",
              stiffness: 200,
            }}
            whileHover={{ 
              scale: 1.15, 
              y: -5,
              boxShadow: "0 10px 25px rgba(0,0,0,0.15)"
            }}
            whileTap={{ scale: 0.95 }}
          >
            <IconComponent 
              className={`w-5 h-5 ${social.iconColor} ${social.hoverColor}`} 
            />
          </motion.button>
        );
      })}
    </motion.div>
  );
};

export default StickySocialIcons;

