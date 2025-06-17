import React from 'react'
import Image from "next/image";


export default function media() {
  return (
    <div>
         <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 lg:w-[100%] gap-2 py-6">
    <Image src="/house.jpg" alt="apartment image"
        width={290} height={400}
        className="rounded-xl md:w-[100%]"
        style={{ height: '300px', objectFit: 'cover' }}></Image>

    <Image src="/house3.jpg" alt="apartment image"
        width={290} height={400}
        className="rounded-xl md:w-[100%]"
        style={{ height: '300px', objectFit: 'cover' }}></Image>

    <Image src="/house2.jpg" alt="apartment image"
        width={290} height={400}
        className="rounded-xl md:w-[100%]"
        style={{ height: '300px', objectFit: 'cover' }}></Image>

    <Image src="/house3.jpg" alt="apartment image"
        width={290} height={400}
        className="rounded-xl md:w-[100%]"
        style={{ height: '300px', objectFit: 'cover' }}></Image>
    </div>

    </div>
  )
}
