"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import { 
  FaBath, FaBed, FaMapMarkerAlt, FaUserFriends, FaWifi, FaSwimmingPool, 
  FaParking, FaPlay, FaExpand, FaChevronLeft, FaChevronRight, FaImages,
  FaSnowflake, FaShieldAlt, FaTv, FaUtensils, FaDumbbell, FaCar,
  FaWifi as FaWifiIcon, FaTimes, FaChevronDown, FaHome
} from "react-icons/fa";
import { getApartmentDetails } from "../../../../endpoint";
import Footer from "@/app/footer";

const ApartmentInfo = () => {
  const { apartmentId } = useParams();
  const [apartment, setApartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [mediaType, setMediaType] = useState('image');
  const [videoError, setVideoError] = useState(false);
  const [fullScreenMedia, setFullScreenMedia] = useState(null);
  const [fullScreenType, setFullScreenType] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const videoRef = useRef(null);

  const toggleFullScreen = (media = null, type = null) => {
    setFullScreenMedia(media);
    setFullScreenType(type);
    if (!media) {
      setIsPlaying(false);
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }
  };

  const goToNext = () => {
    if (mediaType === 'image' && apartment?.media?.images?.length > 0) {
      setActiveMediaIndex((prev) => 
        prev === apartment.media.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const goToPrevious = () => {
    if (mediaType === 'image' && apartment?.media?.images?.length > 0) {
      setActiveMediaIndex((prev) => 
        prev === 0 ? apartment.media.images.length - 1 : prev - 1
      );
    }
  };

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
    return 'video/mp4';
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
    if (!apartmentId) {
      setLoading(false);
      setError("No apartment ID provided");
      return;
    }

    let isMounted = true;
    const abortController = new AbortController();

    const fetchApartmentDetails = async () => {
      if (!isMounted) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const url = getApartmentDetails(apartmentId);
        console.log("Fetching apartment from:", url);
        console.log("Apartment ID:", apartmentId);
        
        // Use fetch as primary method for better browser compatibility
        const fetchAbortController = new AbortController();
        const fetchTimeout = setTimeout(() => {
          fetchAbortController.abort();
        }, 20000);
        
        let response;
        try {
          const fetchResponse = await fetch(url, {
            signal: fetchAbortController.signal,
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            cache: 'no-store',
          });
          
          clearTimeout(fetchTimeout);
          
          if (!fetchResponse.ok) {
            throw new Error(`HTTP error! status: ${fetchResponse.status} ${fetchResponse.statusText}`);
          }
          
          const data = await fetchResponse.json();
          response = { data, status: fetchResponse.status };
        } catch (fetchError) {
          clearTimeout(fetchTimeout);
          
          // If fetch fails, try axios as fallback
          console.log("Fetch failed, trying axios:", fetchError.message);
          
          try {
            const axiosResponse = await axios.get(url, {
              timeout: 20000,
              signal: abortController.signal,
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              withCredentials: false,
            });
            
            response = axiosResponse;
          } catch (axiosError) {
            // Both failed, throw the original fetch error
            throw fetchError;
          }
        }
        
        console.log("Response received:", response.status);
        console.log("Apartment data received:", response.data);
        
        if (!isMounted) return;
        
        if (!response.data) {
          throw new Error("No data received from server");
        }
        
        const processedMedia = {
          images: response.data.media?.images || [],
          videos: (response.data.media?.videos || []).filter(video => 
            isValidVideoUrl(video)
          ).map(video => decodeURIComponent(video))
        };

        if (!isMounted) return;

        setApartment({
          ...response.data,
          media: processedMedia
        });

        if (processedMedia.videos.length > 0) {
          setMediaType('video');
        }
        
        setLoading(false);
      } catch (error) {
        if (!isMounted) return;
        
        console.error("Error fetching apartment details:", error);
        console.error("Error details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          config: error.config?.url,
        });
        
        setLoading(false);
        
        // Check if request was aborted
        if (axios.isCancel(error) || error.name === 'AbortError' || error.message.includes('aborted')) {
          console.log("Request was aborted");
          return;
        }
        
        if (error.response) {
          // Server responded with error status
          setError(`Failed to load apartment: ${error.response.status} ${error.response.statusText || 'Server Error'}`);
        } else if (error.request) {
          // Request made but no response
          setError("Network error: Unable to reach the server. Please check your internet connection or try again.");
        } else if (error.message?.includes('timeout')) {
          setError("Request timeout: The server took too long to respond. Please try again.");
        } else {
          // Something else happened
          setError(`Error: ${error.message || 'Unknown error occurred'}`);
        }
      }
    };

    fetchApartmentDetails();

    // Cleanup function
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [apartmentId]);

  // Prevent body scroll when fullscreen is open
  useEffect(() => {
    if (fullScreenMedia) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [fullScreenMedia]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (fullScreenMedia) {
        if (e.key === 'Escape') {
          toggleFullScreen(null, null);
        } else if (e.key === 'ArrowLeft' && mediaType === 'image') {
          goToPrevious();
        } else if (e.key === 'ArrowRight' && mediaType === 'image') {
          goToNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [fullScreenMedia, mediaType]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg">Loading apartment details...</p>
          {/* <p className="text-gray-400 text-sm mt-2">Apartment ID: {apartmentId}</p> */}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 shadow-lg">
            <div className="text-red-600 text-4xl mb-4">⚠️</div>
            <p className="text-red-700 text-xl font-bold mb-3">Error Loading Apartment</p>
            <p className="text-gray-700 mb-4">{error}</p>
            <p className="text-gray-500 text-sm mb-6">Apartment ID: {apartmentId}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!apartment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-8 shadow-lg">
            <div className="text-yellow-600 text-4xl mb-4">🔍</div>
            <p className="text-yellow-800 text-xl font-bold mb-3">Apartment Not Found</p>
            <p className="text-gray-600 mb-4">The apartment you&apos;re looking for is not available.</p>
            <p className="text-gray-500 text-sm">Apartment ID: {apartmentId}</p>
          </div>
        </div>
      </div>
    );
  }

  const parsedAmenities = (() => {
    try {
      if (!apartment.amenities?.length) return [];
      
      if (typeof apartment.amenities[0] === 'string' && apartment.amenities[0].startsWith('[')) {
        return JSON.parse(apartment.amenities[0]);
      }
      
      return apartment.amenities;
    } catch (error) {
      console.error("Error parsing amenities:", error);
      return apartment.amenities || [];
    }
  })();

  const totalMedia = (apartment.media?.images?.length || 0) + (apartment.media?.videos?.length || 0);
  
  const amenityIcons = {
    'WiFi': <FaWifiIcon className="text-blue-600 text-xl" />,
    'Wi-Fi': <FaWifiIcon className="text-blue-600 text-xl" />,
    'Superfast 5G WiFi': <FaWifiIcon className="text-blue-600 text-xl" />,
    'Pool': <FaSwimmingPool className="text-blue-600 text-xl" />,
    'Parking': <FaParking className="text-blue-600 text-xl" />,
    'Free Parking': <FaParking className="text-blue-600 text-xl" />,
    'Free Parking Space': <FaParking className="text-blue-600 text-xl" />,
    'Air Conditioning': <FaSnowflake className="text-blue-600 text-xl" />,
    'Security': <FaShieldAlt className="text-blue-600 text-xl" />,
    'Top Notch Security': <FaShieldAlt className="text-blue-600 text-xl" />,
    'Security Cameras': <FaShieldAlt className="text-blue-600 text-xl" />,
    'TV': <FaTv className="text-blue-600 text-xl" />,
    'Smart TVs': <FaTv className="text-blue-600 text-xl" />,
    'Kitchen': <FaUtensils className="text-blue-600 text-xl" />,
    'Fully Equipped Kitchen': <FaUtensils className="text-blue-600 text-xl" />,
    'Gym': <FaDumbbell className="text-blue-600 text-xl" />,
    'Car Park': <FaCar className="text-blue-600 text-xl" />,
  };

  const displayAmenities = showAllAmenities ? parsedAmenities : parsedAmenities.slice(0, 6);

  return (
    <div className="flex flex-col min-h-screen bg-white w-full overflow-x-hidden max-w-full">
      {/* Hero Section with Large Image */}
      <div className="relative w-full h-[35vh] sm:h-[40vh] md:h-[45vh] lg:h-[55vh] xl:h-[60vh] overflow-hidden bg-gray-100">
        {apartment.media?.images?.length > 0 ? (
          <div className="relative w-full h-full">
            <Image
              src={apartment.media.images[0]}
              alt={apartment.apartmentName || "Apartment"}
              fill
              className="object-cover"
              priority
              unoptimized
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/placeholder-image.jpg';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
            
            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-12 text-white">
              <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-2 sm:mb-3 drop-shadow-lg leading-tight">
                  {apartment.apartmentName || "Apartment Name"}
                </h1>
                <div className="flex items-center gap-2 text-sm sm:text-base md:text-lg lg:text-xl">
                    <FaMapMarkerAlt className="text-yellow-400 flex-shrink-0" />
                    <span className="font-medium truncate">
                     {apartment.city}, {apartment.state}
                    </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Fallback when no images */
          <div className="relative w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <div className="text-center p-6">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 text-gray-800">
                {apartment.apartmentName || "Apartment Name"}
              </h1>
              <div className="flex items-center justify-center gap-2 text-sm sm:text-base md:text-lg text-gray-600">
                <FaMapMarkerAlt className="text-blue-600 flex-shrink-0" />
                <span className="font-medium">
                  {apartment.city}, {apartment.state}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8 md:py-12 overflow-x-hidden">
        {/* Quick Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8 -mt-4 sm:-mt-6 md:-mt-10 relative z-10">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 md:p-6 text-center hover:shadow-xl transition-shadow duration-300">
            <FaUserFriends className="text-blue-600 text-xl sm:text-2xl md:text-3xl mx-auto mb-1 sm:mb-2" />
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">{apartment.guests || 0}</p>
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 mt-1">Guests</p>
          </div>
          <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 md:p-6 text-center hover:shadow-xl transition-shadow duration-300">
            <FaBed className="text-blue-600 text-xl sm:text-2xl md:text-3xl mx-auto mb-1 sm:mb-2" />
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">{apartment.beds || 0}</p>
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 mt-1">Beds</p>
          </div>
          <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 md:p-6 text-center hover:shadow-xl transition-shadow duration-300">
            <FaBed className="text-blue-600 text-xl sm:text-2xl md:text-3xl mx-auto mb-1 sm:mb-2" />
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">{apartment.bedrooms || 0}</p>
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 mt-1">Bedrooms</p>
          </div>
          <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 md:p-6 text-center hover:shadow-xl transition-shadow duration-300">
            <FaBath className="text-blue-600 text-xl sm:text-2xl md:text-3xl mx-auto mb-1 sm:mb-2" />
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">{apartment.bathrooms || 0}</p>
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 mt-1">Bathrooms</p>
          </div>
        </div>

        {/* Description Section */}
        <div className="mb-8 sm:mb-10 md:mb-12">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">About this place</h2>
          <p className="text-gray-600 text-sm sm:text-base md:text-lg leading-relaxed max-w-4xl">
            {apartment.description || "No description available."}
          </p>
        </div>

        {/* Property Type Section */}
        {apartment.apartmentType && (
          <div className="mb-8 sm:mb-10 md:mb-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3">
                <FaHome className="text-blue-600 text-lg sm:text-xl" />
                <span className="text-sm sm:text-base text-gray-600 font-medium">Property Type</span>
              </div>
              <div className="flex flex-col items-end sm:items-end">
                <span className="text-base sm:text-lg font-semibold text-gray-800 capitalize">
                  {apartment.apartmentType === 'unit' ? 'Unit in Building' : 'Private Apartment'}
                </span>
                {apartment.apartmentType === 'unit' && apartment.numberOfUnits && (
                  <span className="text-xs sm:text-sm text-gray-500 mt-1">
                    {apartment.numberOfUnits} {apartment.numberOfUnits === 1 ? 'unit' : 'units'}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Media Gallery Section */}
        {totalMedia > 0 && (
          <div className="mb-8 sm:mb-10 md:mb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Photo Gallery</h2>
              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                <FaImages className="text-blue-600 flex-shrink-0" />
                <span className="whitespace-nowrap">
                  {totalMedia} {totalMedia === 1 ? 'photo' : 'photos'}
                  {apartment.media?.videos?.length > 0 && (
                    <span className="ml-1 sm:ml-2 text-blue-600 font-medium">
                      + Video tour
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Main Media Display */}
            <div className="relative group mb-4 sm:mb-6">
              <div 
                className="relative w-full h-[250px] sm:h-[350px] md:h-[450px] lg:h-[500px] xl:h-[600px] rounded-xl sm:rounded-2xl overflow-hidden bg-gray-100 cursor-pointer shadow-xl hover:shadow-2xl transition-all duration-300" 
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
                          className="w-full h-full object-cover"
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
                        
                        {!isPlaying && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 transition-opacity duration-200">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleVideoPlayback();
                              }}
                              className="bg-white rounded-full p-6 md:p-8 shadow-2xl transition-all duration-200 hover:scale-110"
                            >
                              <FaPlay className="text-gray-800 text-3xl md:text-4xl ml-1" />
                            </button>
                          </div>
                        )}
                        
                        <div className="absolute bottom-6 left-6 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                          <FaPlay className="text-sm" />
                          Video Tour
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 text-white text-center p-6">
                        <div>
                          <FaPlay className="w-20 h-20 mx-auto text-gray-400 mb-4" />
                          <p className="mb-2 text-xl font-semibold">Video tour unavailable</p>
                          <p className="mb-6 text-sm text-gray-300">Cannot play in browser</p>
                          <a 
                            href={apartment.media.videos[0]} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
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
                      className="object-cover"
                      unoptimized
                      priority={activeMediaIndex === 0}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/placeholder-image.jpg';
                      }}
                    />
                    
                    {apartment.media.images.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            goToPrevious();
                          }}
                          className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-2 sm:p-3 md:p-4 rounded-full shadow-xl transition-all duration-200 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-110 z-10"
                          aria-label="Previous image"
                        >
                          <FaChevronLeft className="text-lg sm:text-xl" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            goToNext();
                          }}
                          className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-2 sm:p-3 md:p-4 rounded-full shadow-xl transition-all duration-200 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-110 z-10"
                          aria-label="Next image"
                        >
                          <FaChevronRight className="text-lg sm:text-xl" />
                        </button>
                      </>
                    )}

                    {apartment.media.images.length > 1 && (
                      <div className="absolute bottom-3 sm:bottom-4 md:bottom-6 right-3 sm:right-4 md:right-6 bg-black bg-opacity-70 text-white px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-lg text-xs sm:text-sm md:text-base font-medium">
                        {activeMediaIndex + 1} / {apartment.media.images.length}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                    <div className="text-center text-gray-500">
                      <FaImages className="w-20 h-20 mx-auto mb-4 text-gray-400" />
                      <p className="text-xl">No media available</p>
                    </div>
                  </div>
                )}

                <button 
                  className="absolute top-3 sm:top-4 md:top-6 right-3 sm:right-4 md:right-6 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-2 sm:p-2.5 md:p-3 rounded-full shadow-xl transition-all duration-200 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (mediaType === 'video' && apartment.media?.videos?.length > 0) {
                      toggleFullScreen(apartment.media.videos[0], 'video');
                    } else if (apartment.media?.images?.length > 0) {
                      toggleFullScreen(apartment.media.images[activeMediaIndex], 'image');
                    }
                  }}
                  aria-label="View fullscreen"
                >
                  <FaExpand className="text-sm sm:text-base" />
                </button>
              </div>
            </div>

            {/* Thumbnail Gallery */}
            {(apartment.media?.images?.length > 1 || apartment.media?.videos?.length > 0) && (
              <div className="w-full overflow-x-auto pb-2 sm:pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <div className="flex gap-2 sm:gap-3 w-max">
                  {/* Video Thumbnail */}
                  {apartment.media?.videos?.length > 0 && (
                    <button
                      onClick={() => {
                        setMediaType('video');
                        setVideoError(false);
                      }}
                      className={`flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-lg sm:rounded-xl overflow-hidden transition-all duration-300 ${
                        mediaType === 'video' 
                          ? 'ring-2 sm:ring-4 ring-blue-500 shadow-xl scale-105' 
                          : 'opacity-70 hover:opacity-100 hover:shadow-lg hover:scale-105'
                      }`}
                    >
                      <div className="relative w-full h-full bg-gradient-to-br from-gray-800 to-black">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-white bg-opacity-30 rounded-full p-3">
                            <FaPlay className="w-6 h-6 md:w-8 md:h-8 text-white" />
                          </div>
                        </div>
                        <div className="absolute bottom-2 left-2 right-2">
                          <div className="bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded text-center font-medium">
                            Video
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
                      className={`flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-lg sm:rounded-xl overflow-hidden transition-all duration-300 ${
                        mediaType === 'image' && activeMediaIndex === index
                          ? 'ring-2 sm:ring-4 ring-blue-500 shadow-xl scale-105' 
                          : 'opacity-70 hover:opacity-100 hover:shadow-lg hover:scale-105'
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        width={128}
                        height={128}
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
            )}
          </div>
        )}

        {/* Amenities Section */}
        {parsedAmenities.length > 0 && (
          <div className="mb-8 sm:mb-10 md:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">Amenities</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {displayAmenities.map((amenity, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-2 sm:gap-3 bg-gray-50 hover:bg-blue-50 p-3 sm:p-4 rounded-lg sm:rounded-xl transition-colors duration-200 border border-gray-100 hover:border-blue-200"
                >
                  <div className="flex-shrink-0">
                    {amenityIcons[amenity] || <FaWifiIcon className="text-blue-600 text-lg sm:text-xl" />}
                  </div>
                  <span className="text-xs sm:text-sm md:text-base font-medium text-gray-700 break-words">{amenity}</span>
                </div>
              ))}
            </div>
            {parsedAmenities.length > 6 && (
              <button
                onClick={() => setShowAllAmenities(!showAllAmenities)}
                className="mt-6 text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2 transition-colors duration-200"
              >
                {showAllAmenities ? (
                  <>
                    Show less <FaChevronDown className="rotate-180 transition-transform" />
                  </>
                ) : (
                  <>
                    Show all {parsedAmenities.length} amenities <FaChevronDown />
                  </>
                )}
              </button>
            )}
          </div>
        )}

      </div>

      {/* Full Screen Media Modal */}
      {fullScreenMedia && (
        <div 
          className="fixed inset-0 bg-black z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-hidden"
          onClick={() => toggleFullScreen(null, null)}
        >
          <div className="relative w-full h-full flex items-center justify-center max-w-full">
            {fullScreenType === 'video' ? (
              <video
                src={fullScreenMedia}
                controls
                autoPlay
                className="max-w-full max-h-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
                onError={(e) => {
                  console.error("Full screen video failed to load:", fullScreenMedia, e);
                }}
              >
                <source src={fullScreenMedia} type={getVideoType(fullScreenMedia)} />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                <Image
                  src={fullScreenMedia}
                  alt="Full screen view"
                  width={1920}
                  height={1080}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  unoptimized
                />
                {apartment.media?.images?.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newIndex = activeMediaIndex === 0 ? apartment.media.images.length - 1 : activeMediaIndex - 1;
                        setActiveMediaIndex(newIndex);
                        setFullScreenMedia(apartment.media.images[newIndex]);
                      }}
                      className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-3 sm:p-4 rounded-full shadow-xl transition-all duration-200 hover:scale-110 z-10"
                      aria-label="Previous image"
                    >
                      <FaChevronLeft className="text-xl sm:text-2xl" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newIndex = activeMediaIndex === apartment.media.images.length - 1 ? 0 : activeMediaIndex + 1;
                        setActiveMediaIndex(newIndex);
                        setFullScreenMedia(apartment.media.images[newIndex]);
                      }}
                      className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-3 sm:p-4 rounded-full shadow-xl transition-all duration-200 hover:scale-110 z-10"
                      aria-label="Next image"
                    >
                      <FaChevronRight className="text-xl sm:text-2xl" />
                    </button>
                    <div className="absolute bottom-3 sm:bottom-4 md:bottom-6 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base font-medium">
                      {activeMediaIndex + 1} / {apartment.media.images.length}
                    </div>
                  </>
                )}
              </div>
            )}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleFullScreen(null, null);
              }}
              className="absolute top-3 sm:top-4 md:top-6 right-3 sm:right-4 md:right-6 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-3 sm:p-4 text-xl sm:text-2xl transition-all duration-200 hover:scale-110 z-10"
              aria-label="Close"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ApartmentInfo;