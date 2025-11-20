import React from 'react';
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-[#FEf8DE] w-full mt-auto border-t border-yellow-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6">
        <div className="flex flex-row justify-center items-center gap-2 sm:gap-2.5 text-center">
          <Image 
            src="/playstore-icon.png" 
            alt="Africartz logo" 
            width={16} 
            height={16} 
            className="sm:w-5 sm:h-5 md:w-6 md:h-6 object-contain"
          />
          <span className="text-gray-700 dark:text-gray-800 text-xs sm:text-sm md:text-base font-medium">
            Powered by <span className="font-semibold">AfriBooking</span>
          </span>
        </div>
      </div>
    </footer>
  );
}