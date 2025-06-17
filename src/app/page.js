import ApartmentInfo from "./apartmentInfo";
import Media from './media'
import Footer from './footer'

export default function Home() {
  return (
   <>
   <div className="m-2 sm:m-5 sm:ml-16 sm:mr-16 ml-6 mr-6">

    {/* APARTMENT INFO */}
    <ApartmentInfo />
    
   {/* MEDIA */}
    <Media />

    </div>
    
    {/* FOOTER */}
    <Footer />
  </>
    
  );
}
