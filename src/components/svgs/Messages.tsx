const Messages = ({ active = true }: { active: boolean }) => {
  return (
    // <svg
    //   className="size-6"
    //   viewBox="0 -15.4 108.5 108.5"
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
    //       id="Group_23"
    //       data-name="Group 23"
    //       transform="translate(-278.6 -471.2)"
    //     >
    //       {" "}
    //       <path
    //         id="Path_14"
    //         data-name="Path 14"
    //         d="M371.9,473.2H293.8a13.187,13.187,0,0,0-13.2,13.2v47.3a13.187,13.187,0,0,0,13.2,13.2h78.1a13.187,13.187,0,0,0,13.2-13.2V486.4A13.317,13.317,0,0,0,371.9,473.2Z"
    //         fill={solid ? "#FFFFFF" : "none"}
    //         stroke="#FFFFFF"
    //         strokeLinecap="round"
    //         strokeMiterlimit="10"
    //         strokeWidth="4"
    //       ></path>{" "}
    //       <path
    //         id="Path_15"
    //         data-name="Path 15"
    //         d="M282.1,488.2l51.1,21.9,25.2-10.8"
    //         fill="none"
    //         stroke={solid ? "#000000" : "#FFFFFF"}
    //         strokeLinecap="round"
    //         strokeMiterlimit="10"
    //         strokeWidth="4"
    //       ></path>{" "}
    //       <path
    //         id="Path_16"
    //         data-name="Path 16"
    //         d="M374,490.7a4.331,4.331,0,0,1-5,5,4.241,4.241,0,0,1-3.6-3.6,4.331,4.331,0,0,1,5-5A4.241,4.241,0,0,1,374,490.7Z"
    //         fill={solid ? "#000000" : "#FFFFFF"}
    //         stroke={solid ? "#000000" : "#FFFFFF"}
    //         strokeMiterlimit="10"
    //         strokeWidth="1"
    //       ></path>{" "}
    //       <line
    //         id="Line_1"
    //         data-name="Line 1"
    //         x1="19.5"
    //         y2="19.8"
    //         transform="translate(287.4 524)"
    //         fill="none"
    //         stroke={solid ? "#000000" : "#FFFFFF"}
    //         strokeLinecap="round"
    //         strokeMiterlimit="10"
    //         strokeWidth="4"
    //       ></line>{" "}
    //       <line
    //         id="Line_2"
    //         data-name="Line 2"
    //         x2="19.5"
    //         y2="19.8"
    //         transform="translate(358.7 524)"
    //         fill="none"
    //         stroke={solid ? "#000000" : "#FFFFFF"}
    //         strokeLinecap="round"
    //         strokeMiterlimit="10"
    //         strokeWidth="4"
    //       ></line>{" "}
    //     </g>{" "}
    //   </g>
    // </svg>
    // <svg
    //   className="size-7"
    //   viewBox="0 0 64 64"
    //   xmlns="http://www.w3.org/2000/svg"
    //   stroke-width="3"
    //   stroke="#FFFFFF"
    //   fill="none"
    // >
    //   <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
    //   <g
    //     id="SVGRepo_tracerCarrier"
    //     strokeLinecap="round"
    //     strokeLinejoin="round"
    //   ></g>
    //   <g id="SVGRepo_iconCarrier">
    //     <circle cx="31.89" cy="22.71" r="5.57"></circle>
    //     <path d="M43.16,43.74A11.28,11.28,0,0,0,31.89,32.47h0A11.27,11.27,0,0,0,20.62,43.74Z"></path>
    //     <circle cx="48.46" cy="22.71" r="5.57"></circle>
    //     <path d="M46.87,43.74H59.73A11.27,11.27,0,0,0,48.46,32.47h0a11.24,11.24,0,0,0-5.29,1.32"></path>
    //     <circle cx="15.54" cy="22.71" r="5.57"></circle>
    //     <path d="M17.13,43.74H4.27A11.27,11.27,0,0,1,15.54,32.47h0a11.24,11.24,0,0,1,5.29,1.32"></path>
    //   </g>
    // </svg>
    // <svg
    //   fill="#FFFFFF"
    //   className="size-6"
    //   version="1.1"
    //   xmlns="http://www.w3.org/2000/svg"
    //   xmlnsXlink="http://www.w3.org/1999/xlink"
    //   viewBox="0 0 24 24"
    //   xmlSpace="preserve"
    // >
    //   <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
    //   <g
    //     id="SVGRepo_tracerCarrier"
    //     strokeLinecap="round"
    //     strokeLinejoin="round"
    //   ></g>
    //   <g id="SVGRepo_iconCarrier">
    //     {" "}
    //     <g id="group">
    //       {" "}
    //       <path d="M24,15.9c0-2.8-1.5-5-3.7-6.1C21.3,8.8,22,7.5,22,6c0-2.8-2.2-5-5-5c-2.1,0-3.8,1.2-4.6,3c0,0,0,0,0,0c-0.1,0-0.3,0-0.4,0 c-0.1,0-0.3,0-0.4,0c0,0,0,0,0,0C10.8,2.2,9.1,1,7,1C4.2,1,2,3.2,2,6c0,1.5,0.7,2.8,1.7,3.8C1.5,10.9,0,13.2,0,15.9V20h5v3h14v-3h5 V15.9z M17,3c1.7,0,3,1.3,3,3c0,1.6-1.3,3-3,3c0-1.9-1.1-3.5-2.7-4.4c0,0,0,0,0,0C14.8,3.6,15.8,3,17,3z M13.4,4.2 C13.4,4.2,13.4,4.2,13.4,4.2C13.4,4.2,13.4,4.2,13.4,4.2z M15,9c0,1.7-1.3,3-3,3s-3-1.3-3-3s1.3-3,3-3S15,7.3,15,9z M10.6,4.2 C10.6,4.2,10.6,4.2,10.6,4.2C10.6,4.2,10.6,4.2,10.6,4.2z M7,3c1.2,0,2.2,0.6,2.7,1.6C8.1,5.5,7,7.1,7,9C5.3,9,4,7.7,4,6S5.3,3,7,3 z M5.1,18H2v-2.1C2,13.1,4.1,11,7,11v0c0,0,0,0,0,0c0.1,0,0.2,0,0.3,0c0,0,0,0,0,0c0.3,0.7,0.8,1.3,1.3,1.8 C6.7,13.8,5.4,15.7,5.1,18z M17,21H7v-2.1c0-2.8,2.2-4.9,5-4.9c2.9,0,5,2.1,5,4.9V21z M22,18h-3.1c-0.3-2.3-1.7-4.2-3.7-5.2 c0.6-0.5,1-1.1,1.3-1.8c0.1,0,0.2,0,0.4,0v0c2.9,0,5,2.1,5,4.9V18z"></path>{" "}
    //     </g>{" "}
    //   </g>
    // </svg>
    <svg
      className="size-7"
      fill={active ? "#000000" : "#FFFFFF"}
      viewBox="-3 0 32 32"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
      <g
        id="SVGRepo_tracerCarrier"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></g>
      <g id="SVGRepo_iconCarrier">
        {" "}
        <title>group</title>{" "}
        <path d="M20.906 20.75c1.313 0.719 2.063 2 1.969 3.281-0.063 0.781-0.094 0.813-1.094 0.938-0.625 0.094-4.563 0.125-8.625 0.125-4.594 0-9.406-0.094-9.75-0.188-1.375-0.344-0.625-2.844 1.188-4.031 1.406-0.906 4.281-2.281 5.063-2.438 1.063-0.219 1.188-0.875 0-3-0.281-0.469-0.594-1.906-0.625-3.406-0.031-2.438 0.438-4.094 2.563-4.906 0.438-0.156 0.875-0.219 1.281-0.219 1.406 0 2.719 0.781 3.25 1.938 0.781 1.531 0.469 5.625-0.344 7.094-0.938 1.656-0.844 2.188 0.188 2.469 0.688 0.188 2.813 1.188 4.938 2.344zM3.906 19.813c-0.5 0.344-0.969 0.781-1.344 1.219-1.188 0-2.094-0.031-2.188-0.063-0.781-0.188-0.344-1.625 0.688-2.25 0.781-0.5 2.375-1.281 2.813-1.375 0.563-0.125 0.688-0.469 0-1.656-0.156-0.25-0.344-1.063-0.344-1.906-0.031-1.375 0.25-2.313 1.438-2.719 1-0.375 2.125 0.094 2.531 0.938 0.406 0.875 0.188 3.125-0.25 3.938-0.5 0.969-0.406 1.219 0.156 1.375 0.125 0.031 0.375 0.156 0.719 0.313-1.375 0.563-3.25 1.594-4.219 2.188zM24.469 18.625c0.75 0.406 1.156 1.094 1.094 1.813-0.031 0.438-0.031 0.469-0.594 0.531-0.156 0.031-0.875 0.063-1.813 0.063-0.406-0.531-0.969-1.031-1.656-1.375-1.281-0.75-2.844-1.563-4-2.063 0.313-0.125 0.594-0.219 0.719-0.25 0.594-0.125 0.688-0.469 0-1.656-0.125-0.25-0.344-1.063-0.344-1.906-0.031-1.375 0.219-2.313 1.406-2.719 1.031-0.375 2.156 0.094 2.531 0.938 0.406 0.875 0.25 3.125-0.188 3.938-0.5 0.969-0.438 1.219 0.094 1.375 0.375 0.125 1.563 0.688 2.75 1.313z"></path>{" "}
      </g>
    </svg>
  );
};

export default Messages;
