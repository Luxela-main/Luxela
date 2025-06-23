import React from "react";
import { ColorRing } from "react-loader-spinner";
interface IProps {}

export const ApLoader: React.FC<IProps> = () => {
  return (
    <div className="w-full h-full flex justify-center items-center">
      <ColorRing
        visible={true}
        height="120"
        width="120"
        ariaLabel="blocks-loading"
        wrapperStyle={{ textAlign: "center" }}
        wrapperClass="blocks-wrapper"
        colors={["	#80DAEB", "	#80DAEB", "#	#80DAEB", "	#80DAEB", "#80DAEB"]}
      />
    </div>
  );
};

export const ApSignInLoading = () => {
  return (
    <>
      <div className="animate-pulse">
        <div className="flex gap-4 justify-center align-center">
          <div className="w-3 h-3 border rounded-full bg-white"></div>
          <div className="w-3 h-3 border rounded-full bg-white"></div>
          <div className="w-3 h-3 border rounded-full bg-white"></div>
        </div>
      </div>
    </>
  );
};
