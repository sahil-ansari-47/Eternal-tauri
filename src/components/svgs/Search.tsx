const Search = ({ active }: { active: boolean }) => {
  return (
    // <svg
    //   className="size-6"
    //   viewBox="0 -0.42 95.125 95.125"
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
    //       id="Group_13"
    //       data-name="Group 13"
    //       transform="translate(-825.375 -463.025)"
    //     >
    //       {" "}
    //       <path
    //         id="Path_21"
    //         data-name="Path 21"
    //         d="M882.7,473.2a33.339,33.339,0,1,1-44,0A33.367,33.367,0,0,1,882.7,473.2Z"
    //         fill={solid ? "#FFFFFF" : "none"}
    //         stroke="#FFFFFF"
    //         strokeLinecap="round"
    //         strokeLinejoin="round"
    //         strokeMiterlimit="10"
    //         strokeWidth="4"
    //       ></path>{" "}
    //       <path
    //         id="Path_22"
    //         data-name="Path 22"
    //         d="M850.8,510.5a14.885,14.885,0,0,1,5.8-28.6"
    //         fill="none"
    //         stroke={solid ? "#fff" : "#FFFFFF"}
    //         strokeLinecap="round"
    //         strokeLinejoin="round"
    //         strokeMiterlimit="10"
    //         strokeWidth="4"
    //       ></path>{" "}
    //       <path
    //         id="Path_23"
    //         data-name="Path 23"
    //         d="M894.5,526.1l-5.3,5.3a5.191,5.191,0,0,1-7.3,0h0a5.191,5.191,0,0,1,0-7.3l5.3-5.3a5.191,5.191,0,0,1,7.3,0h0A5.191,5.191,0,0,1,894.5,526.1Z"
    //         fill={solid ? "#fff" : "none"}
    //         stroke="#FFFFFF"
    //         strokeLinecap="round"
    //         strokeLinejoin="round"
    //         strokeMiterlimit="10"
    //         strokeWidth="4"
    //       ></path>{" "}
    //       <path
    //         id="Path_24"
    //         data-name="Path 24"
    //         d="M917,553.8h0a5.07,5.07,0,0,1-7.2,0l-17.3-17.3a5.07,5.07,0,0,1,0-7.2h0a5.07,5.07,0,0,1,7.2,0L917,546.6A5.07,5.07,0,0,1,917,553.8Z"
    //         fill={solid ? "#FFFFFF" : "none"}
    //         stroke="#FFFFFF"
    //         strokeLinecap="round"
    //         strokeLinejoin="round"
    //         strokeMiterlimit="10"
    //         strokeWidth="4"
    //       ></path>{" "}
    //     </g>{" "}
    //   </g>
    // </svg>
    // <svg
    //   className="size-6"
    //   viewBox="0 0 32 32"
    //   version="1.1"
    //   xmlns="http://www.w3.org/2000/svg"
    //   xmlnsXlink="http://www.w3.org/1999/xlink"
    //   // xmlns:sketch="http://www.bohemiancoding.com/sketch/ns"
    //   fill={active ? "#FFFFFF" : "#000000"}
    // >
    //   <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
    //   <g
    //     id="SVGRepo_tracerCarrier"
    //     strokeLinecap="round"
    //     strokeLinejoin="round"
    //   ></g>
    //   <g id="SVGRepo_iconCarrier">
    //     {" "}
    //     <title>search</title> <desc>Created with Sketch Beta.</desc>{" "}
    //     <defs> </defs>{" "}
    //     <g
    //       id="Page-1"
    //       stroke="none"
    //       strokeWidth="1"
    //       fill="none"
    //       fillRule="evenodd"
    //       // sketch:type="MSPage"
    //     >
    //       {" "}
    //       <g
    //         id="Icon-Set"
    //         // sketch:type="MSLayerGroup"
    //         transform="translate(-256.000000, -1139.000000)"
    //         fill={active ? "#000000" : "#FFFFFF"}
    //       >
    //         {" "}
    //         <path
    //           d="M269.46,1163.45 C263.17,1163.45 258.071,1158.44 258.071,1152.25 C258.071,1146.06 263.17,1141.04 269.46,1141.04 C275.75,1141.04 280.85,1146.06 280.85,1152.25 C280.85,1158.44 275.75,1163.45 269.46,1163.45 L269.46,1163.45 Z M287.688,1169.25 L279.429,1161.12 C281.591,1158.77 282.92,1155.67 282.92,1152.25 C282.92,1144.93 276.894,1139 269.46,1139 C262.026,1139 256,1144.93 256,1152.25 C256,1159.56 262.026,1165.49 269.46,1165.49 C272.672,1165.49 275.618,1164.38 277.932,1162.53 L286.224,1170.69 C286.629,1171.09 287.284,1171.09 287.688,1170.69 C288.093,1170.3 288.093,1169.65 287.688,1169.25 L287.688,1169.25 Z"
    //           id="search"
    //           // sketch:type="MSShapeGroup"
    //         >
    //           {" "}
    //         </path>{" "}
    //       </g>{" "}
    //     </g>{" "}
    //   </g>
    // </svg>
    <svg
      className="size-6.5"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
      <g
        id="SVGRepo_tracerCarrier"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></g>
      <g id="SVGRepo_iconCarrier">
        {" "}
        <path
          d="M11 6C13.7614 6 16 8.23858 16 11M16.6588 16.6549L21 21M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
          stroke={active ? "#000000" : "#FFFFFF"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></path>{" "}
      </g>
    </svg>
  );
};

export default Search;
