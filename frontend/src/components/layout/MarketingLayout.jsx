import Navbar from '../Navbar';
import Footer from '../Footer';

export default function MarketingLayout({ children, mainRef }) {
  return (
    <>
      <Navbar />
      <main ref={mainRef} className="nav-offset pb-xl w-full min-w-0 max-w-full overflow-x-hidden">
        {children}
      </main>
      <Footer />
    </>
  );
}
