const Files = ({ active }: { active: boolean }) =>
  // { theme }: { theme: string }
  {
    return (
      // <svg
      //   className="size-6"
      //   viewBox="0 -1.1 91.6 91.6"
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
      //       id="Group_12"
      //       data-name="Group 12"
      //       transform="translate(-1021.4 -458.6)"
      //     >
      //       {" "}
      //       <path
      //         id="Path_25"
      //         data-name="Path 25"
      //         d="M1104.6,501.3h-21.8a15.6,15.6,0,1,1-31.2,0h-21.8a6.554,6.554,0,0,0-6.4,6.6v31.5a6.554,6.554,0,0,0,6.4,6.6h74.8a6.554,6.554,0,0,0,6.4-6.6V507.9A6.554,6.554,0,0,0,1104.6,501.3Z"
      //         fill={solid ? "#FFFFFF" : "none"}
      //         stroke="#FFFFFF"
      //         strokeLinecap="round"
      //         strokeLinejoin="round"
      //         strokeMiterlimit="10"
      //         strokeWidth="4"
      //       ></path>{" "}
      //       <path
      //         id="Path_26"
      //         data-name="Path 26"
      //         d="M1100.1,500.9V478.8c0-11.1,1.8-17.8-7.7-18.2H1043c-9.9,0-8.8,6.6-8.8,16.6v24.2"
      //         fill="none"
      //         stroke="#FFFFFF"
      //         strokeLinecap="round"
      //         strokeMiterlimit="10"
      //         strokeWidth="4"
      //       ></path>{" "}
      //       <path
      //         id="Path_27"
      //         data-name="Path 27"
      //         d="M1049.2,477h-.4a1.11,1.11,0,0,1-1.1-1.1v-.4a1.11,1.11,0,0,1,1.1-1.1h.4a1.11,1.11,0,0,1,1.1,1.1v.4A1.11,1.11,0,0,1,1049.2,477Z"
      //         fill="#FFFFFF"
      //         stroke="#FFFFFF"
      //         strokeMiterlimit="10"
      //         strokeWidth="2"
      //       ></path>{" "}
      //       <path
      //         id="Path_28"
      //         data-name="Path 28"
      //         d="M1055,486.7h-.4a1.11,1.11,0,0,1-1.1-1.1v-.4a1.11,1.11,0,0,1,1.1-1.1h.4a1.11,1.11,0,0,1,1.1,1.1v.4A1,1,0,0,1,1055,486.7Z"
      //         fill="#FFFFFF"
      //         stroke="#FFFFFF"
      //         strokeMiterlimit="10"
      //         strokeWidth="2"
      //       ></path>{" "}
      //       <line
      //         id="Line_6"
      //         data-name="Line 6"
      //         x2="9.7"
      //         y2="26.5"
      //         transform="translate(1100.3 477.4)"
      //         fill="none"
      //         stroke="#FFFFFF"
      //         strokeLinecap="round"
      //         strokeMiterlimit="10"
      //         strokeWidth="4"
      //       ></line>{" "}
      //       <line
      //         id="Line_7"
      //         data-name="Line 7"
      //         y1="25.8"
      //         x2="9.6"
      //         transform="translate(1024.3 478.4)"
      //         fill="none"
      //         stroke="#FFFFFF"
      //         strokeLinecap="round"
      //         strokeMiterlimit="10"
      //         strokeWidth="4"
      //       ></line>{" "}
      //       <line
      //         id="Line_8"
      //         data-name="Line 8"
      //         x2="17.5"
      //         transform="translate(1057.2 475.7)"
      //         fill="none"
      //         stroke="#FFFFFF"
      //         strokeLinecap="round"
      //         strokeMiterlimit="10"
      //         strokeWidth="4"
      //       ></line>{" "}
      //       <line
      //         id="Line_9"
      //         data-name="Line 9"
      //         x2="17.5"
      //         transform="translate(1062.6 485.4)"
      //         fill="none"
      //         stroke="#FFFFFF"
      //         strokeLinecap="round"
      //         strokeMiterlimit="10"
      //         strokeWidth="4"
      //       ></line>{" "}
      //     </g>{" "}
      //   </g>
      // </svg>
      // <svg
      //   className="size-7"
      //   viewBox="0 0 192 192"
      //   xmlns="http://www.w3.org/2000/svg"
      //   fill="none"
      // >
      //   <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
      //   <g
      //     id="SVGRepo_tracerCarrier"
      //     stroke-linecap="round"
      //     stroke-linejoin="round"
      //   ></g>
      //   <g id="SVGRepo_iconCarrier">
      //     <path
      //       fill={active ? "#000000" : "#FFFFFF"}
      //       d="m80 38 4.243-4.243A6 6 0 0 0 80 32v6Zm16 16-4.243 4.243A6 6 0 0 0 96 60v-6Zm58 94H38v12h116v-12ZM28 138V54H16v84h12Zm10-94h42V32H38v12Zm37.757-1.757 16 16 8.486-8.486-16-16-8.486 8.486ZM164 70v68h12V70h-12ZM96 60h58V48H96v12Zm-58 88c-5.523 0-10-4.477-10-10H16c0 12.15 9.85 22 22 22v-12Zm116 12c12.15 0 22-9.85 22-22h-12c0 5.523-4.477 10-10 10v12Zm22-90c0-12.15-9.85-22-22-22v12c5.523 0 10 4.477 10 10h12ZM28 54c0-5.523 4.477-10 10-10V32c-12.15 0-22 9.85-22 22h12Z"
      //     ></path>
      //   </g>
      // </svg>
      <svg
        className="size-6.5"
        version="1.1"
        id="Icons"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        viewBox="0 0 32 32"
        xmlSpace="preserve"
        fill={active ? "#000000" : "#FFFFFF"}
      >
        <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
        <g
          id="SVGRepo_tracerCarrier"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></g>
        <g id="SVGRepo_iconCarrier">
          <style>{`
      .st0 {
        fill: none;
        stroke: #000000;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke-miterlimit: 10;
      }
    `}</style>
          <path d="M27,8h-8.9l-2.3-3.5C15.7,4.2,15.3,4,15,4H5C3.3,4,2,5.3,2,7v18c0,1.7,1.3,3,3,3h22c1.7,0,3-1.3,3-3V11C30,9.3,28.7,8,27,8z M28,23.6L19.4,10H27c0.6,0,1,0.4,1,1V23.6z"></path>
        </g>
      </svg>
    );
  };

export default Files;
