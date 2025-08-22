"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import { FaBath, FaBed, FaMapMarkerAlt, FaUserFriends, FaWifi, FaSwimmingPool, FaParking, FaPlay, FaExpand, FaChevronLeft, FaChevronRight, FaImages } from "react-icons/fa";
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
  const [fullScreenMedia, setFullScreenMedia] = useState(null);
  const [fullScreenType, setFullScreenType] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  // Simple modal toggle
  const toggleModal = (image = null) => {
    setSelectedImage(image);
  };

  // Full screen media toggle
  const toggleFullScreen = (media = null, type = null) => {
    setFullScreenMedia(media);
    setFullScreenType(type);
  };

  // Navigation functions
  const goToNext = () => {
    if (mediaType === 'image' && apartment.media?.images?.length > 0) {
      setActiveMediaIndex((prev) => 
        prev === apartment.media.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const goToPrevious = () => {
    if (mediaType === 'image' && apartment.media?.images?.length > 0) {
      setActiveMediaIndex((prev) => 
        prev === 0 ? apartment.media.images.length - 1 : prev - 1
      );
    }
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

  const toggleVideoPlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
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

  const totalMedia = (apartment.media?.images?.length || 0) + (apartment.media?.videos?.length || 0);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow mx-4 md:mx-10">
        <div className="mt-6">
          <h1 className="font-normal text-xl text-gray-400 bg-[#FEf8DE] inline-block px-3 py-1 rounded-lg mb-2">
            {apartment.apartmentName || "Apartment Name"}
          </h1>

          <div className="flex gap-[3px] items-center">
            <FaMapMarkerAlt className="text-gray-400 mr-2 text-xl" />
            <span className="text-gray-400">
             {apartment.city}, {apartment.state}
            </span>
          </div>

          <p className="text-gray-400 md:w-2/3 my-4">
            {apartment.description || "No description available."}
          </p>

          {/* Enhanced Media Gallery */}
          <div className="my-8 max-w-4xl">
            {/* Media Counter and Type Indicator */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <FaImages className="text-gray-500" />
                <span className="text-sm text-gray-600">
                  {totalMedia} media file{totalMedia !== 1 ? 's' : ''}
                  {apartment.media?.videos?.length > 0 && (
                    <span className="ml-2 text-blue-600 text-xs">
                      • Includes video tour
                    </span>
                  )}
                </span>
              </div>
              {mediaType === 'image' && apartment.media?.images?.length > 1 && (
                <span className="text-sm text-gray-500">
                  {activeMediaIndex + 1} of {apartment.media.images.length}
                </span>
              )}
            </div>

            {/* Main Media Display with Enhanced UI */}
            <div className="relative group">
              <div 
                className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden bg-gray-100 cursor-pointer shadow-lg hover:shadow-xl transition-shadow duration-300" 
                onClick={() => {
                  if (mediaType === 'video' && apartment.media?.videos?.length > 0) {
                    toggleFullScreen(apartment.media.videos[0], 'video');
                  } else if (apartment.media?.images?.length > 0) {
                    toggleFullScreen(apartment.media.images[activeMediaIndex], 'image');
                  }
                }}
              >
                {mediaType === 'video' && apartment.media?.videos?.length > 0 ? (
                  <div className="relative w-full h-full">
                    {!videoError ? (
                      <>
                        <video
                          key={apartment.media.videos[0]}
                          ref={videoRef}
                          className="w-full h-full object-cover rounded-xl"
                          autoPlay={false}
                          muted
                          playsInline
                          preload="metadata"
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                          onError={(e) => {
                            console.error("Video failed to load:", apartment.media.videos[0], e);
                            setVideoError(true);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleVideoPlayback();
                          }}
                        >
                          <source
                            src={apartment.media.videos[0]}
                            type={getVideoType(apartment.media.videos[0])}
                          />
                          Your browser does not support the video tag.
                        </video>
                        
                        {/* Video Play/Pause Overlay */}
                        {!isPlaying && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 transition-opacity duration-200">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleVideoPlayback();
                              }}
                              className="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-4 transition-all duration-200 hover:scale-110"
                            >
                              <FaPlay className="text-gray-800 text-2xl ml-1" />
                            </button>
                          </div>
                        )}
                        
                        {/* Video Label */}
                        <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm font-medium">
                          <FaPlay className="inline mr-2" />
                          Video Tour
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 text-white text-center p-6 rounded-xl">
                        <div>
                          <div className="mb-4">
                            <FaPlay className="w-16 h-16 mx-auto text-gray-400" />
                          </div>
                          <p className="mb-4 text-lg">Video tour unavailable</p>
                          <p className="mb-4 text-sm text-gray-300">Cannot play in browser</p>
                          <a 
                            href={apartment.media.videos[0]} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors duration-200"
                          >
                            Open in new tab
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                ) : apartment.media?.images?.length > 0 ? (
                  <>
                    <Image
                      src={apartment.media.images[activeMediaIndex]}
                      alt={`Apartment image ${activeMediaIndex + 1}`}
                      fill
                      className="object-cover rounded-xl"
                      unoptimized
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/placeholder-image.jpg';
                      }}
                    />
                    
                    {/* Image Navigation Arrows */}
                    {apartment.media.images.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            goToPrevious();
                          }}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
                        >
                          <FaChevronLeft />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            goToNext();
                          }}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
                        >
                          <FaChevronRight />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl">
                    <div className="text-center text-gray-500">
                      <FaImages className="w-16 h-16 mx-auto mb-4" />
                      <p className="text-lg">No media available</p>
                    </div>
                  </div>
                )}

                {/* Expand Icon */}
                <button className="absolute top-4 right-4 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100">
                  <FaExpand />
                </button>
              </div>
            </div>

            {/* Enhanced Media Thumbnails */}
            <div className="mt-6">
              <div className="flex gap-3 overflow-x-auto py-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {/* Video Thumbnail */}
                {apartment.media?.videos?.length > 0 && (
                  <button
                    onClick={() => {
                      setMediaType('video');
                      setVideoError(false);
                    }}
                    className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden transition-all duration-200 ${
                      mediaType === 'video' 
                        ? 'ring-3 ring-blue-500 shadow-lg' 
                        : 'opacity-70 hover:opacity-100 hover:shadow-md'
                    }`}
                  >
                    <div className="relative w-full h-full bg-gradient-to-br from-gray-800 to-black">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white bg-opacity-20 rounded-full p-2">
                          <FaPlay className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded text-center">
                          Video Tour
                        </div>
                      </div>
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
                    onDoubleClick={() => {
                      toggleFullScreen(image, 'image');
                    }}
                    className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden transition-all duration-200 ${
                      mediaType === 'image' && activeMediaIndex === index
                        ? 'ring-3 ring-blue-500 shadow-lg'
                        : 'opacity-70 hover:opacity-100 hover:shadow-md'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      width={96}
                      height={96}
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
              
              {/* Thumbnail Helper Text */}
              <p className="text-xs text-gray-500 mt-2 text-center">
                Tap to view • Double-tap images for fullscreen
              </p>
            </div>
          </div>

          {/* Full Screen Media Modal */}
          {fullScreenMedia && (
            <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center">
              <div className="relative w-full h-full flex items-center justify-center p-4">
                {fullScreenType === 'video' ? (
                  <video
                    src={fullScreenMedia}
                    controls
                    autoPlay
                    className="max-w-full max-h-full object-contain rounded-lg"
                    onError={(e) => {
                      console.error("Full screen video failed to load:", fullScreenMedia, e);
                    }}
                  >
                    <source src={fullScreenMedia} type={getVideoType(fullScreenMedia)} />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <Image
                    src={fullScreenMedia}
                    alt="Full screen view"
                    width={1920}
                    height={1080}
                    className="max-w-full max-h-full object-contain rounded-lg"
                    unoptimized
                  />
                )}
                <button 
                  onClick={() => toggleFullScreen(null, null)}
                  className="absolute top-6 right-6 bg-black bg-opacity-70 hover:bg-opacity-90 text-white rounded-full p-4 text-2xl transition-all duration-200 hover:scale-110"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Property Details */}
          <div className="my-8">
            <hr className="md:w-[600px] border-gray-200" />
            <div className="grid grid-cols-2 sm:grid-cols-4 font-semibold md:my-4 my-2 p-2 gap-4 md:p-4 md:w-[600px]">
              <span className="text-gray-800 dark:text-gray-300 flex gap-2 items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <FaUserFriends className="text-gray-400 text-xl" /> 
                <span className="text-sm">{apartment.guests} guests</span>
              </span>
              <span className="text-gray-800 dark:text-gray-200 flex gap-2 items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <FaBed className="text-gray-400 text-xl" /> 
                <span className="text-sm">{apartment.beds} bed{apartment.beds !== 1 ? 's' : ''}</span>
              </span>
              <span className="text-gray-800 dark:text-gray-200 flex gap-2 items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <FaBed className="text-gray-400 text-xl" /> 
                <span className="text-sm">{apartment.bedrooms} bedroom{apartment.bedrooms !== 1 ? 's' : ''}</span>
              </span>
              <span className="text-gray-800 dark:text-gray-200 flex gap-2 items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <FaBath className="text-gray-400 text-xl" /> 
                <span className="text-sm">{apartment.bathrooms} bathroom{apartment.bathrooms !== 1 ? 's' : ''}</span>
              </span>
            </div>
            <hr className="md:w-[600px] border-gray-200" />
          </div>

          {/* Amenities */}
          {parsedAmenities.length > 0 && (
            <div className="my-8">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Amenities</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:w-[600px]">
                {parsedAmenities.map((amenity, index) => (
                  <span key={index} className="text-gray-800 dark:text-gray-200 flex gap-3 items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    {amenity === "WiFi" && <FaWifi className="text-blue-500 text-xl" />}
                    {amenity === "Pool" && <FaSwimmingPool className="text-blue-500 text-xl" />}
                    {amenity === "Parking" && <FaParking className="text-blue-500 text-xl" />}
                    <span className="text-sm font-medium">{amenity}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ApartmentInfo;