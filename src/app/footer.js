import React from 'react';
import Image from "next/image";


export default function Footer() {
  return (
    <div className="bg-[#FEf8DE] flex flex-row justify-center items-center gap-2 text-center p-6 mt-auto w-full" style={{ boxShadow: '0 -4px 6px rgba(0, 0, 0, 0.1)' }}>
      <Image src="/playstore-icon.png" alt="Africartz logo"  width={50} height={50}></Image>
      <span className="font-semibold text-gray-800 dark:text-black">Powered by Africartz</span>
    </div>
  );
}