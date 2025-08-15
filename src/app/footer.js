import React from 'react';
import Image from "next/image";

export default function Footer() {
  return (
    <div className="bg-[#FEf8DE] flex flex-row justify-center items-center gap-0.5 text-center py-0.5 px-1 mt-auto w-full">
      <Image src="/playstore-icon.png" alt="Africartz logo" width={8} height={8} className="object-contain"></Image>
      <span className="text-gray-600 dark:text-black text-[10px] font-extralight">Powered by Africartz</span>
    </div>
  );
}