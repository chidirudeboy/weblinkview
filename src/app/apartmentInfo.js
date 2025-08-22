"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Image from "next/image";
import { useParams } from "next/navigation";
import { FaBath, FaBed, FaMapMarkerAlt, FaUserFriends } from "react-icons/fa";

export default function ApartmentInfo() {
  console.log('ApartmentInfo component rendered');
  const { apartmentId } = useParams();
  const [apartment, setApartment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [mediaType, setMediaType] = useState('image'); // 'image' or 'video'
  const videoRef = useRef(null);

  useEffect(() => {
    if (apartmentId) {
      fetchApartmentDetails(apartmentId);
    }
  }, [apartmentId]);

  const fetchApartmentDetails = async (id) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `https://api.africartz.com/api/apartment/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      // Process media with URL decoding
      const processedMedia = {
        images: response.data.media?.images || [],
        videos: (response.data.media?.videos || []).filter(video => 
          isValidVideoUrl(video)
        ).map(video => decodeURIComponent(video))
      };

      console.log('=== VIDEO DEBUG START ===');
      console.log('Raw videos from API:', response.data.media?.videos);
      console.log('Processed videos:', processedMedia.videos);
      console.log('Videos length:', processedMedia.videos.length);
      console.log('Will show video?', processedMedia.videos.length > 0);
      
      // Make it super visible
      if (processedMedia.videos.length > 0) {
        alert(`Found ${processedMedia.videos.length} video(s): ${processedMedia.videos[0]}`);
      } else {
        alert('No videos found in response');
      }
      console.log('=== VIDEO DEBUG END ===');

      setApartment({
        ...response.data,
        media: processedMedia
      });

      // Set initial media type if videos exist
      if (processedMedia.videos.length > 0) {
        console.log('Setting media type to video');
        setMediaType('video');
      } else {
        console.log('No videos found, keeping media type as image');
      }
    } catch (error) {
      console.error("Error fetching apartment details:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isValidVideoUrl = (url) => {
    if (!url) return false;
    try {
      const decodedUrl = decodeURIComponent(url);
      new URL(decodedUrl);
      const videoExtensions = ['.mp4', '.mov', '.webm', '.ogg'];
      const isValid = videoExtensions.some(ext => decodedUrl.toLowerCase().endsWith(ext));
      console.log('Checking video URL:', decodedUrl, 'Valid:', isValid);
      return isValid;
    } catch (error) {
      console.log('Invalid video URL:', url, error);
      return false;
    }
  };

  const getVideoType = (url) => {
    const decodedUrl = decodeURIComponent(url).toLowerCase();
    if (decodedUrl.endsWith('.mp4')) return 'video/mp4';
    if (decodedUrl.endsWith('.webm')) return 'video/webm';
    if (decodedUrl.endsWith('.ogg')) return 'video/ogg';
    if (decodedUrl.endsWith('.mov')) return 'video/quicktime'; // Set MIME type for .mov files
    return 'video/mp4'; // default
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading apartment details...</div>;
  if (!apartment) return <div className="flex justify-center items-center h-64">No apartment data available.</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Sharer's Info */}
      <div className="bg-[#FEf8DE] md:w-[400px] p-2 mt-8 rounded">
        <h1 className="text-sm font-medium">
          UDEE BOOKINGS SHARED YOU THIS APARTMENT
        </h1>
      </div>

      {/* About Apartment */}
      <div className="mt-6">
        <h1 className="font-semibold text-3xl">
          {apartment.apartmentName || "Apartment Name"}
        </h1>
        <p className="text-gray-600 md:w-2/3 my-4">
          {apartment.description || "No description available."}
        </p>

        {/* Location address has been removed*/}
        <div className="flex gap-[3px] items-center">
          <FaMapMarkerAlt className="text-gray-400 mr-2 text-xl" />
          <span className="text-gray-600">
          {apartment.city}, {apartment.state}
          </span>
        </div>

        {/* Media Gallery */}
        <div className="my-8">
          {/* Main Media Display */}
          <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden bg-gray-200">
            {mediaType === 'video' && apartment.media?.videos?.length > 0 ? (
              <div className="relative w-full h-full">
                <video
                  key={apartment.media.videos[0]} // Key ensures re-render when video changes
                  ref={videoRef}
                  controls
                  className="w-full h-full object-cover"
                  autoPlay={false}
                  playsInline
                  muted
                  preload="metadata"
                  onError={(e) => {
                    console.log("Video failed to load:", apartment.media.videos[0], e);
                    setMediaType('image');  // Fallback to image if video fails
                  }}
                  onLoadStart={() => console.log("Video loading started")}
                  onCanPlay={() => console.log("Video can play")}
                  onLoadedData={() => console.log("Video data loaded")}
                >
                  <source
                    src={apartment.media.videos[0]}
                    type={getVideoType(apartment.media.videos[0])}  // Ensuring correct MIME type
                  />
                  Your browser does not support the video tag.
                </video>
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
                  Video Tour
                </div>
              </div>
            ) : apartment.media?.images?.length > 0 ? (
              <Image
                src={apartment.media.images[activeMediaIndex]}
                alt={`Apartment image ${activeMediaIndex + 1}`}
                fill
                className="object-cover"
                unoptimized
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/placeholder-image.jpg';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <p>No media available</p>
              </div>
            )}
          </div>

          {/* Media Thumbnails */}
          <div className="flex gap-3 mt-4 overflow-x-auto py-2">
            {/* Video Thumbnail */}
            {apartment.media?.videos?.length > 0 && (() => {
              return (
                <button
                  onClick={() => {
                    setMediaType('video');
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
              );
            })()}

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

        {/* Apartment Details */}
        <div className="my-5">
          <hr className="border-gray-300" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-4">
            <div className="flex items-center text-gray-700">
              <FaUserFriends className="text-gray-400 mr-2 text-xl" />
              {apartment.guests} guests
            </div>
            <div className="flex items-center text-gray-700">
              <FaBed className="text-gray-400 mr-2 text-xl" />
              {apartment.beds} bed(s)
            </div>
            <div className="flex items-center text-gray-700">
              <FaBed className="text-gray-400 mr-2 text-xl" />
              {apartment.bedrooms} bedroom(s)
            </div>
            <div className="flex items-center text-gray-700">
              <FaBath className="text-gray-400 mr-2 text-xl" />
              {apartment.bathrooms} bathroom(s)
            </div>
          </div>
          <hr className="border-gray-300" />
        </div>

        {/* Optional Fees */}
        <div className="mt-6">
          <h2 className="font-semibold text-xl mb-2">Optional Fees</h2>
          <div className="space-y-2">
            <p className="text-gray-600">
              <span className="font-medium">Party Fee:</span> ₦
              {apartment.optionalFees?.partyFee?.toLocaleString() || "0"}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Movie Shoot Fee:</span> ₦
              {apartment.optionalFees?.movieShootFee?.toLocaleString() || "0"}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Photo Shoot Fee:</span> ₦
              {apartment.optionalFees?.photoShootFee?.toLocaleString() || "0"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
