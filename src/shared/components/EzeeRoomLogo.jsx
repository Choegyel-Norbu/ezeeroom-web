import ezeeroomLogo from '@/assets/images/ezeeroomLogo.png';

const sizeMap = {
  small:   "h-9",
  default: "h-12",
  large:   "h-16",
};

const EzeeRoomLogo = ({ size = "default", className = "" }) => (
  <img
    src={ezeeroomLogo}
    alt="EzeeRoom"
    className={`${sizeMap[size] ?? sizeMap.default} w-auto ${className}`}
  />
);

export default EzeeRoomLogo;
