"use client";

import { clsx } from "clsx";
import React from "react";
import type { IconType } from "react-icons";
import {
  LuAccessibility, LuActivity, LuAlarmClock, LuAlignCenter, LuAlignLeft, LuAlignRight, LuArchive,
  LuArchiveRestore, LuArrowDown, LuArrowDownWideNarrow, LuArrowLeft, LuArrowRight, LuArrowRightLeft,
  LuArrowUp, LuArrowUpDown, LuArrowUpNarrowWide, LuAtSign, LuBadgeCheck, LuBadgePercent, LuBan, LuBanknote,
  LuBarcode, LuBattery, LuBell, LuBellOff, LuBellRing, LuBold, LuBookOpen, LuBookmark, LuBug, LuBuilding2,
  LuCalculator, LuCalendar, LuCalendarClock, LuCalendarPlus, LuCalendarRange, LuCamera, LuChartColumn,
  LuChartLine, LuChartPie, LuCheck, LuChevronDown, LuChevronLeft, LuChevronRight, LuChevronUp,
  LuChevronsDownUp, LuChevronsLeft, LuChevronsRight, LuChevronsUpDown, LuCircleAlert, LuCircleCheck,
  LuCircleDashed, LuCircleDollarSign, LuCircleHelp, LuCircleUser, LuCircleX, LuClipboardPaste, LuClock,
  LuCloud, LuCloudDownload, LuCloudOff, LuCloudUpload, LuCode, LuCoins, LuColumns3, LuCommand, LuCompass,
  LuContact, LuCopy, LuCopyPlus, LuCreditCard, LuDatabase, LuDownload, LuEllipsis, LuEllipsisVertical,
  LuExternalLink, LuEye, LuEyeOff, LuFile, LuFileArchive, LuFileCode, LuFileInput, LuFileOutput,
  LuFileSpreadsheet, LuFileText, LuFilter, LuFingerprint, LuFlag, LuFolder, LuFolderOpen, LuFolderPlus,
  LuForward, LuGift, LuGlobe, LuGrip, LuHeading, LuHeart, LuHistory, LuHourglass, LuHouse, LuIdCard, LuImage,
  LuInbox, LuInfo, LuItalic, LuKeyRound, LuKeyboard, LuLandmark, LuLanguages, LuLaptop, LuLayers,
  LuLayoutDashboard, LuLayoutGrid, LuLayoutList, LuLifeBuoy, LuLightbulb, LuLink, LuList, LuListChecks,
  LuListOrdered, LuLoaderCircle, LuLock, LuLockOpen, LuLogIn, LuLogOut, LuMail, LuMap, LuMapPin, LuMaximize,
  LuMaximize2, LuMegaphone, LuMenu, LuMessageSquare, LuMessagesSquare, LuMic, LuMicOff, LuMinimize,
  LuMinimize2, LuMinus, LuMonitor, LuMoon, LuMoveDiagonal2, LuNavigation, LuOctagonAlert, LuPackage,
  LuPalette, LuPanelLeftClose, LuPanelLeftOpen, LuPanelRightClose, LuPanelRightOpen, LuPaperclip, LuPause,
  LuPencil, LuPercent, LuPhone, LuPiggyBank, LuPin, LuPinOff, LuPlay, LuPlug, LuPlus, LuPower, LuPrinter,
  LuPuzzle, LuQrCode, LuQuote, LuReceipt, LuReceiptText, LuRedo2, LuRefreshCcw, LuRefreshCw,
  LuRemoveFormatting, LuRepeat, LuReply, LuReplyAll, LuRocket, LuSave, LuScanLine, LuScissors, LuSearch,
  LuSend, LuServer, LuSettings, LuShare2, LuShield, LuShieldCheck, LuShoppingCart, LuSignature, LuSkipBack,
  LuSkipForward, LuSlidersHorizontal, LuSmartphone, LuSparkles, LuSquare, LuSquareTerminal, LuStar, LuStore,
  LuStrikethrough, LuSun, LuTable, LuTablet, LuTag, LuTarget, LuThumbsDown, LuThumbsUp, LuTimer, LuTrash2,
  LuTrendingDown, LuTrendingUp, LuTriangleAlert, LuTrophy, LuTruck, LuUnderline, LuUndo2, LuUnlink, LuUnplug,
  LuUpload, LuUser, LuUserCheck, LuUserCog, LuUserMinus, LuUserPlus, LuUsers, LuVideo, LuVolume2, LuVolumeX,
  LuWallet, LuWifi, LuWifiOff, LuX, LuZoomIn, LuZoomOut,
} from "react-icons/lu";
import { SiGithub } from "react-icons/si";
import { usePresentation } from "../../style/presentation/presentation";
import styles from "./icon.module.css";

export type IconSize = "inherit" | "sm" | "md" | "lg" | "control";

export interface IconProps extends Omit<React.SVGAttributes<SVGElement>, "children"> {
  /** Accessible name. Give one when the icon carries meaning on its own;
   *  omit it for decorative icons next to text (they are hidden from
   *  assistive technology). */
  label?: string;
  /** `inherit` (default) follows the surrounding text; `sm`/`md`/`lg` use
   *  the type scale; `control` matches the current Presentation register's
   *  control icon size. */
  size?: IconSize;
}

/** A library icon component: the curated glyph plus sizing and accessibility. */
export type Icon = React.FC<IconProps>;

/**
 * Wrap a React Icons glyph as a library icon. The curated set below is the
 * public API; glyphs come only from packs with permissive licences (see
 * icon-sources.test.ts and THIRD_PARTY_NOTICES.md).
 */
export function createIcon(Glyph: IconType, name: string): Icon {
  function LibraryIcon({ label, size = "inherit", className, style, ...props }: IconProps) {
    const register = usePresentation();
    return (
      <Glyph
        {...props}
        className={clsx(styles.root, className)}
        style={{ "--icon-control-size": `var(--squonk-presentation-icon-size-${register})`, ...style }}
        data-icon={name}
        data-size={size}
        focusable="false"
        aria-hidden={label ? undefined : true}
        role={label ? "img" : undefined}
        aria-label={label}
      />
    );
  }
  LibraryIcon.displayName = `${name[0].toUpperCase()}${name.slice(1)}Icon`;
  return LibraryIcon;
}

// Actions
export const AddIcon = /* @__PURE__ */ createIcon(LuPlus, "add");
export const RemoveIcon = /* @__PURE__ */ createIcon(LuMinus, "remove");
export const EditIcon = /* @__PURE__ */ createIcon(LuPencil, "edit");
export const DeleteIcon = /* @__PURE__ */ createIcon(LuTrash2, "delete");
export const CopyIcon = /* @__PURE__ */ createIcon(LuCopy, "copy");
export const SaveIcon = /* @__PURE__ */ createIcon(LuSave, "save");
export const DownloadIcon = /* @__PURE__ */ createIcon(LuDownload, "download");
export const UploadIcon = /* @__PURE__ */ createIcon(LuUpload, "upload");
export const ShareIcon = /* @__PURE__ */ createIcon(LuShare2, "share");
export const PrintIcon = /* @__PURE__ */ createIcon(LuPrinter, "print");
export const RefreshIcon = /* @__PURE__ */ createIcon(LuRefreshCw, "refresh");
export const SearchIcon = /* @__PURE__ */ createIcon(LuSearch, "search");
export const FilterIcon = /* @__PURE__ */ createIcon(LuFilter, "filter");
export const AdjustIcon = /* @__PURE__ */ createIcon(LuSlidersHorizontal, "adjust");
export const CloseIcon = /* @__PURE__ */ createIcon(LuX, "close");
export const CheckIcon = /* @__PURE__ */ createIcon(LuCheck, "check");
export const ExternalLinkIcon = /* @__PURE__ */ createIcon(LuExternalLink, "externalLink");
export const LinkIcon = /* @__PURE__ */ createIcon(LuLink, "link");
export const LogOutIcon = /* @__PURE__ */ createIcon(LuLogOut, "logOut");
export const ExpandIcon = /* @__PURE__ */ createIcon(LuMaximize2, "expand");
export const CollapseIcon = /* @__PURE__ */ createIcon(LuMinimize2, "collapse");
export const DragHandleIcon = /* @__PURE__ */ createIcon(LuGrip, "dragHandle");
export const UndoIcon = /* @__PURE__ */ createIcon(LuUndo2, "undo");
export const RedoIcon = /* @__PURE__ */ createIcon(LuRedo2, "redo");
export const CutIcon = /* @__PURE__ */ createIcon(LuScissors, "cut");
export const PasteIcon = /* @__PURE__ */ createIcon(LuClipboardPaste, "paste");
export const DuplicateIcon = /* @__PURE__ */ createIcon(LuCopyPlus, "duplicate");
export const AttachIcon = /* @__PURE__ */ createIcon(LuPaperclip, "attach");
export const UnlinkIcon = /* @__PURE__ */ createIcon(LuUnlink, "unlink");
export const ArchiveIcon = /* @__PURE__ */ createIcon(LuArchive, "archive");
export const RestoreIcon = /* @__PURE__ */ createIcon(LuArchiveRestore, "restore");
export const ImportIcon = /* @__PURE__ */ createIcon(LuFileInput, "import");
export const ExportIcon = /* @__PURE__ */ createIcon(LuFileOutput, "export");
export const SendIcon = /* @__PURE__ */ createIcon(LuSend, "send");
export const ReplyIcon = /* @__PURE__ */ createIcon(LuReply, "reply");
export const ReplyAllIcon = /* @__PURE__ */ createIcon(LuReplyAll, "replyAll");
export const ForwardIcon = /* @__PURE__ */ createIcon(LuForward, "forward");
export const PinIcon = /* @__PURE__ */ createIcon(LuPin, "pin");
export const UnpinIcon = /* @__PURE__ */ createIcon(LuPinOff, "unpin");
export const LogInIcon = /* @__PURE__ */ createIcon(LuLogIn, "logIn");
export const ZoomInIcon = /* @__PURE__ */ createIcon(LuZoomIn, "zoomIn");
export const ZoomOutIcon = /* @__PURE__ */ createIcon(LuZoomOut, "zoomOut");
export const FullscreenIcon = /* @__PURE__ */ createIcon(LuMaximize, "fullscreen");
export const ExitFullscreenIcon = /* @__PURE__ */ createIcon(LuMinimize, "exitFullscreen");
export const ResizeIcon = /* @__PURE__ */ createIcon(LuMoveDiagonal2, "resize");
export const ScanIcon = /* @__PURE__ */ createIcon(LuScanLine, "scan");
export const SignIcon = /* @__PURE__ */ createIcon(LuSignature, "sign");
export const TransferIcon = /* @__PURE__ */ createIcon(LuArrowRightLeft, "transfer");
export const SyncIcon = /* @__PURE__ */ createIcon(LuRefreshCcw, "sync");
export const PowerIcon = /* @__PURE__ */ createIcon(LuPower, "power");

// Navigation and disclosure
export const MenuIcon = /* @__PURE__ */ createIcon(LuMenu, "menu");
export const MoreIcon = /* @__PURE__ */ createIcon(LuEllipsis, "more");
export const MoreVerticalIcon = /* @__PURE__ */ createIcon(LuEllipsisVertical, "moreVertical");
export const ChevronDownIcon = /* @__PURE__ */ createIcon(LuChevronDown, "chevronDown");
export const ChevronUpIcon = /* @__PURE__ */ createIcon(LuChevronUp, "chevronUp");
export const ChevronLeftIcon = /* @__PURE__ */ createIcon(LuChevronLeft, "chevronLeft");
export const ChevronRightIcon = /* @__PURE__ */ createIcon(LuChevronRight, "chevronRight");
export const ArrowUpIcon = /* @__PURE__ */ createIcon(LuArrowUp, "arrowUp");
export const ArrowDownIcon = /* @__PURE__ */ createIcon(LuArrowDown, "arrowDown");
export const ArrowLeftIcon = /* @__PURE__ */ createIcon(LuArrowLeft, "arrowLeft");
export const ArrowRightIcon = /* @__PURE__ */ createIcon(LuArrowRight, "arrowRight");
export const SortIcon = /* @__PURE__ */ createIcon(LuArrowUpDown, "sort");
export const HomeIcon = /* @__PURE__ */ createIcon(LuHouse, "home");
export const SidebarOpenIcon = /* @__PURE__ */ createIcon(LuPanelLeftOpen, "sidebarOpen");
export const SidebarCloseIcon = /* @__PURE__ */ createIcon(LuPanelLeftClose, "sidebarClose");
export const DetailPanelOpenIcon = /* @__PURE__ */ createIcon(LuPanelRightOpen, "detailPanelOpen");
export const DetailPanelCloseIcon = /* @__PURE__ */ createIcon(LuPanelRightClose, "detailPanelClose");
export const GridViewIcon = /* @__PURE__ */ createIcon(LuLayoutGrid, "gridView");
export const ListViewIcon = /* @__PURE__ */ createIcon(LuLayoutList, "listView");
export const ColumnsIcon = /* @__PURE__ */ createIcon(LuColumns3, "columns");
export const DashboardIcon = /* @__PURE__ */ createIcon(LuLayoutDashboard, "dashboard");
export const ExpandAllIcon = /* @__PURE__ */ createIcon(LuChevronsUpDown, "expandAll");
export const CollapseAllIcon = /* @__PURE__ */ createIcon(LuChevronsDownUp, "collapseAll");
export const FirstPageIcon = /* @__PURE__ */ createIcon(LuChevronsLeft, "firstPage");
export const LastPageIcon = /* @__PURE__ */ createIcon(LuChevronsRight, "lastPage");
export const SortAscendingIcon = /* @__PURE__ */ createIcon(LuArrowUpNarrowWide, "sortAscending");
export const SortDescendingIcon = /* @__PURE__ */ createIcon(LuArrowDownWideNarrow, "sortDescending");
export const LayersIcon = /* @__PURE__ */ createIcon(LuLayers, "layers");
export const MapIcon = /* @__PURE__ */ createIcon(LuMap, "map");
export const ExploreIcon = /* @__PURE__ */ createIcon(LuCompass, "explore");
export const DirectionsIcon = /* @__PURE__ */ createIcon(LuNavigation, "directions");

// Status
export const InfoIcon = /* @__PURE__ */ createIcon(LuInfo, "info");
export const SuccessIcon = /* @__PURE__ */ createIcon(LuCircleCheck, "success");
export const WarningIcon = /* @__PURE__ */ createIcon(LuTriangleAlert, "warning");
export const ErrorIcon = /* @__PURE__ */ createIcon(LuCircleAlert, "error");
export const CancelIcon = /* @__PURE__ */ createIcon(LuCircleX, "cancel");
export const HelpIcon = /* @__PURE__ */ createIcon(LuCircleHelp, "help");
export const LoadingIcon = /* @__PURE__ */ createIcon(LuLoaderCircle, "loading");
export const LockIcon = /* @__PURE__ */ createIcon(LuLock, "lock");
export const VisibleIcon = /* @__PURE__ */ createIcon(LuEye, "visible");
export const HiddenIcon = /* @__PURE__ */ createIcon(LuEyeOff, "hidden");
export const TrendUpIcon = /* @__PURE__ */ createIcon(LuTrendingUp, "trendUp");
export const TrendDownIcon = /* @__PURE__ */ createIcon(LuTrendingDown, "trendDown");
export const CriticalIcon = /* @__PURE__ */ createIcon(LuOctagonAlert, "critical");
export const BlockedIcon = /* @__PURE__ */ createIcon(LuBan, "blocked");
export const PendingIcon = /* @__PURE__ */ createIcon(LuHourglass, "pending");
export const DraftIcon = /* @__PURE__ */ createIcon(LuCircleDashed, "draft");
export const VerifiedIcon = /* @__PURE__ */ createIcon(LuBadgeCheck, "verified");
export const UnlockIcon = /* @__PURE__ */ createIcon(LuLockOpen, "unlock");
export const OfflineIcon = /* @__PURE__ */ createIcon(LuCloudOff, "offline");
export const NetworkIcon = /* @__PURE__ */ createIcon(LuWifi, "network");
export const NoNetworkIcon = /* @__PURE__ */ createIcon(LuWifiOff, "noNetwork");
export const ConnectedIcon = /* @__PURE__ */ createIcon(LuPlug, "connected");
export const DisconnectedIcon = /* @__PURE__ */ createIcon(LuUnplug, "disconnected");
export const ActivityIcon = /* @__PURE__ */ createIcon(LuActivity, "activity");

// Objects
export const UserIcon = /* @__PURE__ */ createIcon(LuUser, "user");
export const UsersIcon = /* @__PURE__ */ createIcon(LuUsers, "users");
export const AccountIcon = /* @__PURE__ */ createIcon(LuCircleUser, "account");
export const SettingsIcon = /* @__PURE__ */ createIcon(LuSettings, "settings");
export const NotificationIcon = /* @__PURE__ */ createIcon(LuBell, "notification");
export const MailIcon = /* @__PURE__ */ createIcon(LuMail, "mail");
export const PhoneIcon = /* @__PURE__ */ createIcon(LuPhone, "phone");
export const LocationIcon = /* @__PURE__ */ createIcon(LuMapPin, "location");
export const GlobeIcon = /* @__PURE__ */ createIcon(LuGlobe, "globe");
export const CalendarIcon = /* @__PURE__ */ createIcon(LuCalendar, "calendar");
export const ClockIcon = /* @__PURE__ */ createIcon(LuClock, "clock");
export const FileIcon = /* @__PURE__ */ createIcon(LuFile, "file");
export const DocumentIcon = /* @__PURE__ */ createIcon(LuFileText, "document");
export const FolderIcon = /* @__PURE__ */ createIcon(LuFolder, "folder");
export const ImageIcon = /* @__PURE__ */ createIcon(LuImage, "image");
export const PaymentIcon = /* @__PURE__ */ createIcon(LuCreditCard, "payment");
export const TagIcon = /* @__PURE__ */ createIcon(LuTag, "tag");
export const BookmarkIcon = /* @__PURE__ */ createIcon(LuBookmark, "bookmark");
export const FlagIcon = /* @__PURE__ */ createIcon(LuFlag, "flag");
export const StarIcon = /* @__PURE__ */ createIcon(LuStar, "star");
export const FavoriteIcon = /* @__PURE__ */ createIcon(LuHeart, "favorite");
export const LightModeIcon = /* @__PURE__ */ createIcon(LuSun, "lightMode");
export const DarkModeIcon = /* @__PURE__ */ createIcon(LuMoon, "darkMode");

// Text formatting
export const BoldIcon = /* @__PURE__ */ createIcon(LuBold, "bold");
export const ItalicIcon = /* @__PURE__ */ createIcon(LuItalic, "italic");
export const UnderlineIcon = /* @__PURE__ */ createIcon(LuUnderline, "underline");
export const StrikethroughIcon = /* @__PURE__ */ createIcon(LuStrikethrough, "strikethrough");
export const HeadingIcon = /* @__PURE__ */ createIcon(LuHeading, "heading");
export const BulletListIcon = /* @__PURE__ */ createIcon(LuList, "bulletList");
export const NumberedListIcon = /* @__PURE__ */ createIcon(LuListOrdered, "numberedList");
export const QuoteIcon = /* @__PURE__ */ createIcon(LuQuote, "quote");
export const CodeIcon = /* @__PURE__ */ createIcon(LuCode, "code");
export const AlignLeftIcon = /* @__PURE__ */ createIcon(LuAlignLeft, "alignLeft");
export const AlignCenterIcon = /* @__PURE__ */ createIcon(LuAlignCenter, "alignCenter");
export const AlignRightIcon = /* @__PURE__ */ createIcon(LuAlignRight, "alignRight");
export const ClearFormattingIcon = /* @__PURE__ */ createIcon(LuRemoveFormatting, "clearFormatting");

// Communication
export const ChatIcon = /* @__PURE__ */ createIcon(LuMessagesSquare, "chat");
export const CommentIcon = /* @__PURE__ */ createIcon(LuMessageSquare, "comment");
export const InboxIcon = /* @__PURE__ */ createIcon(LuInbox, "inbox");
export const MentionIcon = /* @__PURE__ */ createIcon(LuAtSign, "mention");
export const NotificationOffIcon = /* @__PURE__ */ createIcon(LuBellOff, "notificationOff");
export const NewNotificationIcon = /* @__PURE__ */ createIcon(LuBellRing, "newNotification");
export const AnnouncementIcon = /* @__PURE__ */ createIcon(LuMegaphone, "announcement");
export const ContactIcon = /* @__PURE__ */ createIcon(LuContact, "contact");
export const VideoCallIcon = /* @__PURE__ */ createIcon(LuVideo, "videoCall");
export const MicrophoneIcon = /* @__PURE__ */ createIcon(LuMic, "microphone");
export const MicrophoneOffIcon = /* @__PURE__ */ createIcon(LuMicOff, "microphoneOff");
export const SupportIcon = /* @__PURE__ */ createIcon(LuLifeBuoy, "support");

// People and access
export const AddUserIcon = /* @__PURE__ */ createIcon(LuUserPlus, "addUser");
export const RemoveUserIcon = /* @__PURE__ */ createIcon(LuUserMinus, "removeUser");
export const UserVerifiedIcon = /* @__PURE__ */ createIcon(LuUserCheck, "userVerified");
export const UserSettingsIcon = /* @__PURE__ */ createIcon(LuUserCog, "userSettings");
export const KeyIcon = /* @__PURE__ */ createIcon(LuKeyRound, "key");
export const SecurityIcon = /* @__PURE__ */ createIcon(LuShield, "security");
export const ProtectedIcon = /* @__PURE__ */ createIcon(LuShieldCheck, "protected");
export const BiometricIcon = /* @__PURE__ */ createIcon(LuFingerprint, "biometric");
export const IdentityIcon = /* @__PURE__ */ createIcon(LuIdCard, "identity");
export const OrganisationIcon = /* @__PURE__ */ createIcon(LuBuilding2, "organisation");

// Money and commerce
export const WalletIcon = /* @__PURE__ */ createIcon(LuWallet, "wallet");
export const ReceiptIcon = /* @__PURE__ */ createIcon(LuReceipt, "receipt");
export const InvoiceIcon = /* @__PURE__ */ createIcon(LuReceiptText, "invoice");
export const BankIcon = /* @__PURE__ */ createIcon(LuLandmark, "bank");
export const CashIcon = /* @__PURE__ */ createIcon(LuBanknote, "cash");
export const CoinsIcon = /* @__PURE__ */ createIcon(LuCoins, "coins");
export const SavingsIcon = /* @__PURE__ */ createIcon(LuPiggyBank, "savings");
export const PriceIcon = /* @__PURE__ */ createIcon(LuCircleDollarSign, "price");
export const PercentIcon = /* @__PURE__ */ createIcon(LuPercent, "percent");
export const DiscountIcon = /* @__PURE__ */ createIcon(LuBadgePercent, "discount");
export const CartIcon = /* @__PURE__ */ createIcon(LuShoppingCart, "cart");
export const StoreIcon = /* @__PURE__ */ createIcon(LuStore, "store");
export const CalculatorIcon = /* @__PURE__ */ createIcon(LuCalculator, "calculator");
export const PackageIcon = /* @__PURE__ */ createIcon(LuPackage, "package");
export const DeliveryIcon = /* @__PURE__ */ createIcon(LuTruck, "delivery");
export const GiftIcon = /* @__PURE__ */ createIcon(LuGift, "gift");

// Time
export const HistoryIcon = /* @__PURE__ */ createIcon(LuHistory, "history");
export const TimerIcon = /* @__PURE__ */ createIcon(LuTimer, "timer");
export const DateRangeIcon = /* @__PURE__ */ createIcon(LuCalendarRange, "dateRange");
export const ScheduleIcon = /* @__PURE__ */ createIcon(LuCalendarClock, "schedule");
export const AddEventIcon = /* @__PURE__ */ createIcon(LuCalendarPlus, "addEvent");
export const ReminderIcon = /* @__PURE__ */ createIcon(LuAlarmClock, "reminder");
export const RecurringIcon = /* @__PURE__ */ createIcon(LuRepeat, "recurring");

// Files and data
export const FolderOpenIcon = /* @__PURE__ */ createIcon(LuFolderOpen, "folderOpen");
export const NewFolderIcon = /* @__PURE__ */ createIcon(LuFolderPlus, "newFolder");
export const SpreadsheetIcon = /* @__PURE__ */ createIcon(LuFileSpreadsheet, "spreadsheet");
export const CodeFileIcon = /* @__PURE__ */ createIcon(LuFileCode, "codeFile");
export const ArchiveFileIcon = /* @__PURE__ */ createIcon(LuFileArchive, "archiveFile");
export const DatabaseIcon = /* @__PURE__ */ createIcon(LuDatabase, "database");
export const ServerIcon = /* @__PURE__ */ createIcon(LuServer, "server");
export const CloudIcon = /* @__PURE__ */ createIcon(LuCloud, "cloud");
export const CloudUploadIcon = /* @__PURE__ */ createIcon(LuCloudUpload, "cloudUpload");
export const CloudDownloadIcon = /* @__PURE__ */ createIcon(LuCloudDownload, "cloudDownload");
export const TableIcon = /* @__PURE__ */ createIcon(LuTable, "table");
export const ChartIcon = /* @__PURE__ */ createIcon(LuChartColumn, "chart");
export const LineChartIcon = /* @__PURE__ */ createIcon(LuChartLine, "lineChart");
export const PieChartIcon = /* @__PURE__ */ createIcon(LuChartPie, "pieChart");

// Media and devices
export const PlayIcon = /* @__PURE__ */ createIcon(LuPlay, "play");
export const PauseIcon = /* @__PURE__ */ createIcon(LuPause, "pause");
export const StopIcon = /* @__PURE__ */ createIcon(LuSquare, "stop");
export const SkipForwardIcon = /* @__PURE__ */ createIcon(LuSkipForward, "skipForward");
export const SkipBackIcon = /* @__PURE__ */ createIcon(LuSkipBack, "skipBack");
export const VolumeIcon = /* @__PURE__ */ createIcon(LuVolume2, "volume");
export const MuteIcon = /* @__PURE__ */ createIcon(LuVolumeX, "mute");
export const CameraIcon = /* @__PURE__ */ createIcon(LuCamera, "camera");
export const DesktopIcon = /* @__PURE__ */ createIcon(LuMonitor, "desktop");
export const LaptopIcon = /* @__PURE__ */ createIcon(LuLaptop, "laptop");
export const MobileIcon = /* @__PURE__ */ createIcon(LuSmartphone, "mobile");
export const TabletIcon = /* @__PURE__ */ createIcon(LuTablet, "tablet");
export const KeyboardIcon = /* @__PURE__ */ createIcon(LuKeyboard, "keyboard");
export const BatteryIcon = /* @__PURE__ */ createIcon(LuBattery, "battery");
export const QrCodeIcon = /* @__PURE__ */ createIcon(LuQrCode, "qrCode");
export const BarcodeIcon = /* @__PURE__ */ createIcon(LuBarcode, "barcode");

// Ideas and feedback
export const LikeIcon = /* @__PURE__ */ createIcon(LuThumbsUp, "like");
export const DislikeIcon = /* @__PURE__ */ createIcon(LuThumbsDown, "dislike");
export const IdeaIcon = /* @__PURE__ */ createIcon(LuLightbulb, "idea");
export const AiIcon = /* @__PURE__ */ createIcon(LuSparkles, "ai");
export const LaunchIcon = /* @__PURE__ */ createIcon(LuRocket, "launch");
export const ExtensionIcon = /* @__PURE__ */ createIcon(LuPuzzle, "extension");
export const AchievementIcon = /* @__PURE__ */ createIcon(LuTrophy, "achievement");
export const GoalIcon = /* @__PURE__ */ createIcon(LuTarget, "goal");
export const TaskListIcon = /* @__PURE__ */ createIcon(LuListChecks, "taskList");
export const DocumentationIcon = /* @__PURE__ */ createIcon(LuBookOpen, "documentation");
export const AccessibilityIcon = /* @__PURE__ */ createIcon(LuAccessibility, "accessibility");
export const LanguageIcon = /* @__PURE__ */ createIcon(LuLanguages, "language");
export const ThemeIcon = /* @__PURE__ */ createIcon(LuPalette, "theme");
export const TerminalIcon = /* @__PURE__ */ createIcon(LuSquareTerminal, "terminal");
export const ShortcutIcon = /* @__PURE__ */ createIcon(LuCommand, "shortcut");
export const BugIcon = /* @__PURE__ */ createIcon(LuBug, "bug");

// Brands (Simple Icons, CC0)
export const GitHubIcon = /* @__PURE__ */ createIcon(SiGithub, "github");
