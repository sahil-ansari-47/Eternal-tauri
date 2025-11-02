const SourceControl = ({ active }: { active: boolean }) => {
  return (
    // <svg
    //   className="size-6"
    //   viewBox="0 -3.03 93.622 93.622"
    //   xmlns="http://www.w3.org/2000/svg"
    //   fill="#000000"
    // >
    //   <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
    //   <g
    //     id="SVGRepo_tracerCarrier"
    //     strokeLinecap="round"
    //     strokeLinejoin="round"
    //   ></g>
    //   <g id="SVGRepo_iconCarrier">
    //     {" "}
    //     <g
    //       id="Group_8"
    //       data-name="Group 8"
    //       transform="translate(-1222.248 -664)"
    //     >
    //       {" "}
    //       <path
    //         id="Path_43"
    //         data-name="Path 43"
    //         d="M1255.5,731.8a15.685,15.685,0,1,1-13.5-13.5A15.705,15.705,0,0,1,1255.5,731.8Z"
    //         fill={active ? "#FFFFFF" : "none"}
    //         stroke="#FFFFFF"
    //         strokeMiterlimit="10"
    //         strokeWidth="4"
    //       ></path>{" "}
    //       <path
    //         id="Path_44"
    //         data-name="Path 44"
    //         d="M1292.4,687.1a12.38,12.38,0,0,1-13.9,13.9,12.517,12.517,0,0,1-10.7-10.7,12.4,12.4,0,1,1,24.6-3.2Z"
    //         fill={active ? "#FFFFFF" : "none"}
    //         stroke="#FFFFFF"
    //         strokeLinecap="round"
    //         strokeMiterlimit="10"
    //         strokeWidth="4"
    //       ></path>{" "}
    //       <path
    //         id="Path_45"
    //         data-name="Path 45"
    //         d="M1313.7,732a11.163,11.163,0,1,1-9.1-9.1A10.93,10.93,0,0,1,1313.7,732Z"
    //         fill={active ? "#FFFFFF" : "none"}
    //         stroke="#FFFFFF"
    //         strokeLinecap="round"
    //         strokeMiterlimit="10"
    //         strokeWidth="4"
    //       ></path>{" "}
    //       <line
    //         id="Line_20"
    //         data-name="Line 20"
    //         y1="26.6"
    //         x2="17.9"
    //         transform="translate(1250.6 694.5)"
    //         fill="none"
    //         stroke="#FFFFFF"
    //         strokeLinecap="round"
    //         strokeMiterlimit="10"
    //         strokeWidth="4"
    //       ></line>{" "}
    //       <line
    //         id="Line_21"
    //         data-name="Line 21"
    //         x1="10.3"
    //         y1="23.5"
    //         transform="translate(1287.4 699.2)"
    //         fill="none"
    //         stroke="#FFFFFF"
    //         strokeLinecap="round"
    //         strokeMiterlimit="10"
    //         strokeWidth="4"
    //       ></line>{" "}
    //       <path
    //         id="Path_46"
    //         data-name="Path 46"
    //         d="M1254.8,686.5s-3.3-20.5,16.7-20.5"
    //         fill="none"
    //         stroke="#FFFFFF"
    //         strokeLinecap="round"
    //         strokeMiterlimit="10"
    //         strokeWidth="4"
    //       ></path>{" "}
    //     </g>{" "}
    //   </g>
    // </svg>
    <svg
      className="size-6.5"
      fill={active ? "#000000" : "#FFFFFF"}
      viewBox="0 0 32 32"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
      <g
        id="SVGRepo_tracerCarrier"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></g>
      <g id="SVGRepo_iconCarrier">
        <title>git</title>
        <path d="M30.428 14.663l-13.095-13.094c-0.35-0.349-0.833-0.565-1.367-0.565s-1.017 0.216-1.367 0.565l0-0-2.713 2.718 3.449 3.449c0.22-0.077 0.473-0.121 0.737-0.121 1.269 0 2.297 1.028 2.297 2.297 0 0.269-0.046 0.526-0.131 0.766l0.005-0.016 3.322 3.324c0.222-0.079 0.479-0.125 0.746-0.125 1.268 0 2.296 1.028 2.296 2.296s-1.028 2.296-2.296 2.296c-1.268 0-2.296-1.028-2.296-2.296 0-0.313 0.063-0.611 0.176-0.883l-0.006 0.015-3.11-3.094v8.154c0.764 0.385 1.279 1.163 1.279 2.061 0 1.27-1.030 2.3-2.3 2.3s-2.3-1.030-2.3-2.3c0-0.634 0.256-1.207 0.671-1.623l-0 0c0.211-0.211 0.462-0.382 0.741-0.502l0.015-0.006v-8.234c-0.842-0.354-1.422-1.173-1.422-2.126 0-0.32 0.065-0.624 0.183-0.901l-0.006 0.015-3.389-3.405-8.98 8.974c-0.348 0.351-0.562 0.834-0.562 1.368s0.215 1.017 0.563 1.368l13.096 13.092c0.349 0.35 0.832 0.566 1.366 0.566s1.016-0.216 1.366-0.566l13.034-13.034c0.35-0.349 0.567-0.833 0.567-1.366s-0.217-1.017-0.567-1.366l-0-0z"></path>
      </g>
    </svg>
  );
};

export default SourceControl;
