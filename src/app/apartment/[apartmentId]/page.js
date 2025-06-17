"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import { FaBath, FaBed, FaMapMarkerAlt, FaUserFriends, FaWifi, FaSwimmingPool, FaParking } from "react-icons/fa";
import { getApartmentDetails } from "../../../../endpoint";
import Footer from "@/app/footer";


const ApartmentInfo = () => {
  const { apartmentId } = useParams();
  const [apartment, setApartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  // Simple modal toggle
  const toggleModal = (image = null) => {
    setSelectedImage(image);
  };

  useEffect(() => {
    if (!apartmentId) return;

    const fetchApartmentDetails = async () => {
      try {
        const { data } = await axios.get(getApartmentDetails(apartmentId));
        setApartment(data);
      } catch (error) {
        console.error("Error fetching apartment details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApartmentDetails();
  }, [apartmentId]);

  if (loading) return <p>Loading apartment details...</p>;
  if (!apartment) return <p>No apartment data available.</p>;

   // Parse amenities (they're stored as a stringified array)
  const parsedAmenities = apartment.amenities?.length > 0 
    ? JSON.parse(apartment.amenities[0]) 
    : [];


  return (
    <div className="flex flex-col min-h-screen">

      <div className="flex-grow mx-10">
         <div className="bg-[#FEf8DE] md:w-[400px] p-2 mt-8">
          <h1 className="text-2xl font-extrabold text-gray-800 uppercase">
          
          {`${apartment.agentId?.firstName || ''} ${apartment.agentId?.lastName || ''}`.trim() || 
   'Agent Name Not Available'} shared you this apartment
      
          </h1>
        </div>

        <div className="mt-6">
          <h1 className="font-normal text-xl text-gray-400">
            {apartment.apartmentName || "Apartment Name"}
          </h1>

            <div className="flex gap-[3px] items-center">
            <FaMapMarkerAlt className="text-gray-400 mr-2 text-xl" />
            <span className="text-gray-400">
              {apartment.address}, {apartment.city}, {apartment.state}
            </span>
          </div>


          <p className="text-gray-400 md:w-2/3 my-4">
            {apartment.description || "No description available."}
          </p>



     



            {/* Image Grid */}
            {apartment.media?.images?.length > 0 && (
              <div className="my-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {apartment.media.images.map((image, index) => (
                  <div 
                    key={index} 
                    className="relative w-full h-64 cursor-pointer"
                    onClick={() => toggleModal(image)}
                  >
                    <Image
                      src={image}
                      alt={`Apartment image ${index + 1}`}
                      fill
                      className="rounded-lg object-cover hover:opacity-90 transition-opacity"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Image Modal */}
            {selectedImage && (
              <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
                <div className="relative w-full h-full max-w-6xl max-h-screen">
                  <Image
                    src={selectedImage}
                    alt="Enlarged view"
                    fill
                    className="object-contain"
                  />
                  <button 
                    onClick={() => toggleModal(null)}
                    className="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full p-2 text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

           <div className="my-5">
            <hr className="md:w-[600px]" />
            <div className="grid grid-cols-2 sm:grid-cols-4 font-semibold md:my-2 my-1 p-1 gap-2 md:p-2 md:w-[600px]">
              <span className="text-gray-800 dark:text-gray-200 flex gap-1 items-center">
                <FaUserFriends className="text-gray-400 mr-2 text-2xl" /> {apartment.guests} guests
              </span>
              <span className="text-gray-800 dark:text-gray-200 flex gap-1 items-center">
                <FaBed className="text-gray-400 mr-2 text-2xl" /> {apartment.beds} bed(s)
              </span>
              <span className="text-gray-800 dark:text-gray-200 flex gap-1 items-center">
                <FaBed className="text-gray-400 mr-2 text-2xl" /> {apartment.bedrooms} bedroom(s)
              </span>
              <span className="text-gray-800 dark:text-gray-200 flex gap-1 items-center">
                <FaBath className="text-gray-400 mr- text-2xl" /> {apartment.bathrooms} bathroom(s)
              </span>
            </div>
            <hr className="md:w-[600px]" />
          </div>

          {parsedAmenities.length > 0 && (
            <div className="my-5">
              <hr className="md:w-[600px]" />
              <div className="grid grid-cols-2 sm:grid-cols-4 font-semibold md:my-2 my-1 p-1 gap-2 md:p-2 md:w-[600px]">
                {parsedAmenities.map((amenity, index) => (
                  <span key={index} className="text-gray-800 dark:text-gray-200 flex gap-1 items-center">
                    {amenity === "WiFi" && <FaWifi className="text-gray-400 mr-2 text-2xl" />}
                    {amenity === "Pool" && <FaSwimmingPool className="text-gray-400 mr-2 text-2xl" />}
                    {amenity === "Parking" && <FaParking className="text-gray-400 mr-2 text-2xl" />}
                    {amenity}
                  </span>
                ))}
              </div>
              <hr className="md:w-[600px]" />
            </div>
          )}




        </div>
        
      </div>
        <Footer />
    </div>
  );
};

export default ApartmentInfo;