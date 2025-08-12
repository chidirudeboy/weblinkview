"use client";

import React, { useState, useEffect, useRef } from "react";
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
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [mediaType, setMediaType] = useState('image'); // 'image' or 'video'
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);

  // Simple modal toggle
  const toggleModal = (image = null) => {
    setSelectedImage(image);
  };

  // Helper functions for video handling
  const isValidVideoUrl = (url) => {
    if (!url) return false;
    try {
      const decodedUrl = decodeURIComponent(url);
      new URL(decodedUrl);
      const videoExtensions = ['.mp4', '.mov', '.webm', '.ogg'];
      return videoExtensions.some(ext => decodedUrl.toLowerCase().endsWith(ext));
    } catch (error) {
      return false;
    }
  };

  const getVideoType = (url) => {
    const decodedUrl = decodeURIComponent(url).toLowerCase();
    if (decodedUrl.endsWith('.mp4')) return 'video/mp4';
    if (decodedUrl.endsWith('.webm')) return 'video/webm';
    if (decodedUrl.endsWith('.ogg')) return 'video/ogg';
    if (decodedUrl.endsWith('.mov')) return 'video/quicktime';
    return 'video/mp4'; // default
  };

  useEffect(() => {
    if (!apartmentId) return;

    const fetchApartmentDetails = async () => {
      try {
        const { data } = await axios.get(getApartmentDetails(apartmentId));
        
        // Process media with URL decoding
        const processedMedia = {
          images: data.media?.images || [],
          videos: (data.media?.videos || []).filter(video => 
            isValidVideoUrl(video)
          ).map(video => decodeURIComponent(video))
        };

        setApartment({
          ...data,
          media: processedMedia
        });

        // Set initial media type if videos exist
        if (processedMedia.videos.length > 0) {
          setMediaType('video');
        }
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

   // Parse amenities (they might be stored as strings or a stringified array)
  const parsedAmenities = (() => {
    try {
      if (!apartment.amenities?.length) return [];
      
      // If the first item looks like JSON (starts with '['), try to parse it
      if (typeof apartment.amenities[0] === 'string' && apartment.amenities[0].startsWith('[')) {
        return JSON.parse(apartment.amenities[0]);
      }
      
      // Otherwise, treat the amenities array as-is
      return apartment.amenities;
    } catch (error) {
      console.error("Error parsing amenities:", error);
      return apartment.amenities || [];
    }
  })();


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



     



            {/* Media Gallery */}
            <div className="my-8 max-w-4xl">
              {/* Main Media Display */}
              <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden bg-gray-100">
                {mediaType === 'video' && apartment.media?.videos?.length > 0 ? (
                  <div className="relative w-full h-full">
                    {!videoError ? (
                      <video
                        key={apartment.media.videos[0]}
                        ref={videoRef}
                        controls
                        className="w-full h-full object-contain rounded-lg"
                        autoPlay={false}
                        playsInline
                        preload="metadata"
                        onError={(e) => {
                          console.error("Video failed to load:", apartment.media.videos[0], e);
                          setVideoError(true);
                        }}
                        onLoadStart={() => console.log("Video loading started")}
                        onLoadedMetadata={() => console.log("Video metadata loaded")}
                        onCanPlay={() => console.log("Video can play")}
                      >
                        <source
                          src={apartment.media.videos[0]}
                          type={getVideoType(apartment.media.videos[0])}
                        />
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white text-center p-4 rounded-lg">
                        <div>
                          <div className="mb-4">
                            <svg className="w-16 h-16 mx-auto text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                            </svg>
                          </div>
                          <p className="mb-3 text-sm">Video cannot be played in browser</p>
                          <a 
                            href={apartment.media.videos[0]} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors"
                          >
                            Open video in new tab
                          </a>
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                      Video Tour
                    </div>
                  </div>
                ) : apartment.media?.images?.length > 0 ? (
                  <Image
                    src={apartment.media.images[activeMediaIndex]}
                    alt={`Apartment image ${activeMediaIndex + 1}`}
                    fill
                    className="object-contain rounded-lg"
                    unoptimized
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder-image.jpg';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-lg">
                    <p>No media available</p>
                  </div>
                )}
              </div>

              {/* Media Thumbnails */}
              <div className="flex gap-3 mt-4 overflow-x-auto py-2">
                {/* Video Thumbnail */}
                {apartment.media?.videos?.length > 0 && (
                  <button
                    onClick={() => {
                      setMediaType('video');
                      setVideoError(false);
                    }}
                    className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden ${
                      mediaType === 'video' ? 'ring-2 ring-blue-500' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="relative w-full h-full bg-black">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </div>
                      <span className="absolute bottom-1 left-1 text-white text-xs bg-black bg-opacity-50 px-1 rounded">
                        Video
                      </span>
                    </div>
                  </button>
                )}

                {/* Image Thumbnails */}
                {apartment.media?.images?.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setMediaType('image');
                      setActiveMediaIndex(index);
                    }}
                    className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden ${
                      mediaType === 'image' && activeMediaIndex === index
                        ? 'ring-2 ring-blue-500'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                      unoptimized
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/placeholder-image.jpg';
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

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