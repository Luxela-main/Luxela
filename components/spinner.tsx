import { Loader } from 'lucide-react';
import React from 'react'

const Spinner = () => {  
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <Loader />
    </div>
  );
}

export default Spinner