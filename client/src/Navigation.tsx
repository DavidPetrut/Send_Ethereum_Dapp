import { useState } from 'react';
import logoPng from './public/logo-svg.svg'; 

function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    document.getElementById('mobile-menu')?.classList.toggle('translate-x-full');
  };

  return (
    <nav className="relative top-0 left-0 w-full gradient-background text-white z-10 border">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <img src={logoPng} alt="logo" className="absolute top-1 left-4 z-20 h-16 md:top-1 md:left-24 lg:left-24 lg:top-1 lg:h-32" />
        <div className="flex items-center space-x-4">
        </div>
        <div className="md:hidden">
          <button onClick={toggleMenu}>
            {isOpen ? <span>Close</span> : <span>Menu</span>}
          </button>
        </div>
        <div className={`fixed top-0 right-0 transform ${isOpen ? '' : 'translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out h-full md:h-auto w-64 md:w-auto bg-gray-800 md:bg-transparent py-4 px-6 md:py-0`} id="mobile-menu">
          <ul className={`space-y-6 md:space-y-0 md:flex md:space-x-14 md:items-center`}>
            <li className="nav-link" onClick={toggleMenu}>Home</li>
            <li className="nav-link" onClick={toggleMenu}>About</li>
            <li className="nav-link" onClick={toggleMenu}>Services</li>
            <li className="nav-link" onClick={toggleMenu}>Contact</li>
          </ul>
          <button className="absolute top-3 right-4 md:hidden" onClick={toggleMenu}>
            <span>X</span> 
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
