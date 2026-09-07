"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";

const FIGMA_WIDTH = 763;
const FIGMA_HEIGHT = 531;
const ARROWS_START_AT = 1.18;

type Frame = {
  height: number;
  left: number;
  top: number;
  width: number;
};

type ProgramWindowProps = {
  alt: string;
  blurRegionStyle?: CSSProperties;
  delay: number;
  frame: Frame;
  imageClassName?: string;
  imageStyle?: CSSProperties;
  pointer: PointerMotion;
  response: ParallaxResponse;
  src: string;
};

type AccessoryProps = {
  alt: string;
  delay: number;
  frame: Frame;
  pointer: PointerMotion;
  response: ParallaxResponse;
  src: string;
};

type ArrowProps = {
  delay: number;
  direction: "left-to-right" | "right-to-left";
  frame: Frame;
  innerHeight: number;
  innerWidth: number;
  pointer: PointerMotion;
  response: ParallaxResponse;
  src: string;
  transform: string;
};

type PointerMotion = {
  x: MotionValue<number>;
  y: MotionValue<number>;
};

type ParallaxResponse = {
  crossX?: number;
  crossY?: number;
  rotate?: number;
  x: number;
  y: number;
};

const PARALLAX = {
  registerWindow: { x: 7, y: -5, crossX: 2, crossY: 1, rotate: 0.35 },
  staffWindow: { x: -6, y: 6, crossX: -2, crossY: 1, rotate: -0.28 },
  sheetBack: { x: -3, y: -2, crossX: 1, crossY: -1, rotate: -0.1 },
  sheetMiddle: { x: -5, y: -3, crossX: 1, crossY: -2, rotate: -0.16 },
  sheetFront: { x: -8, y: -4, crossX: 2, crossY: -2, rotate: -0.24 },
  spreadsheetWindow: { x: 8, y: 5, crossX: -2, crossY: 2, rotate: 0.22 },
  rkeeperWindow: { x: -4, y: 7, crossX: 2, crossY: -1, rotate: -0.2 },
  videoWindow: { x: 6, y: -4, crossX: -2, crossY: 2, rotate: 0.16 },
  excel: { x: -14, y: 10, crossX: 4, crossY: -3, rotate: -1.4 },
  importantFolder: { x: 11, y: -14, crossX: -3, crossY: 3, rotate: 1.7 },
  newFolder: { x: -10, y: -8, crossX: 3, crossY: -2, rotate: -1.15 },
  document: { x: 13, y: 8, crossX: -4, crossY: 2, rotate: 1.35 },
  acrobat: { x: -9, y: 12, crossX: 2, crossY: -3, rotate: -1.1 },
  photoshop: { x: 12, y: -10, crossX: -3, crossY: 3, rotate: 1.25 },
  biotime: { x: 8, y: 9, crossX: 3, crossY: -2, rotate: 0.55 },
  app: { x: -14, y: 6, crossX: 4, crossY: 3, rotate: -1.25 },
  service: { x: 3, y: -3, crossX: -1, crossY: 1, rotate: 0.2 },
  arrowOne: { x: 2, y: -2, crossX: 1, crossY: 0 },
  arrowTwo: { x: -2, y: 2, crossX: 0, crossY: -1 },
  arrowThree: { x: 2, y: 1, crossX: -1, crossY: 0 },
  arrowFour: { x: -2, y: -1, crossX: 1, crossY: 0 },
  arrowFive: { x: 1, y: 2, crossX: 0, crossY: 1 },
  arrowSix: { x: -1, y: -2, crossX: -1, crossY: 0 },
} satisfies Record<string, ParallaxResponse>;

function percent(value: number, total: number) {
  return `${(value / total) * 100}%`;
}

function frameStyle(frame: Frame): CSSProperties {
  return {
    height: percent(frame.height, FIGMA_HEIGHT),
    left: percent(frame.left, FIGMA_WIDTH),
    top: percent(frame.top, FIGMA_HEIGHT),
    width: percent(frame.width, FIGMA_WIDTH),
  };
}

function ParallaxFrame({
  ariaHidden = false,
  children,
  className = "absolute",
  frame,
  pointer,
  response,
  style,
}: {
  ariaHidden?: boolean;
  children: ReactNode;
  className?: string;
  frame: Frame;
  pointer: PointerMotion;
  response: ParallaxResponse;
  style?: CSSProperties;
}) {
  const x = useTransform(
    [pointer.x, pointer.y],
    ([pointerX, pointerY]) =>
      Number(pointerX) * response.x +
      Number(pointerY) * (response.crossX ?? 0),
  );
  const y = useTransform(
    [pointer.x, pointer.y],
    ([pointerX, pointerY]) =>
      Number(pointerY) * response.y +
      Number(pointerX) * (response.crossY ?? 0),
  );
  const rotate = useTransform(
    [pointer.x, pointer.y],
    ([pointerX, pointerY]) =>
      (Number(pointerX) - Number(pointerY) * 0.35) * (response.rotate ?? 0),
  );

  return (
    <motion.div
      aria-hidden={ariaHidden || undefined}
      className={className}
      style={{ ...frameStyle(frame), ...style, x, y, rotate }}
    >
      {children}
    </motion.div>
  );
}

const programWindowVariants = {
  hidden: { opacity: 0, scale: 0.78, y: 18 },
  visible: (delay: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay,
      type: "spring" as const,
      stiffness: 310,
      damping: 24,
      mass: 0.72,
    },
  }),
};

const accessoryVariants = {
  hidden: { opacity: 0, scale: 0.7, y: 7 },
  visible: (delay: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay,
      type: "spring" as const,
      stiffness: 330,
      damping: 25,
      mass: 0.65,
    },
  }),
};

function ProgramWindow({
  alt,
  blurRegionStyle,
  delay,
  frame,
  imageClassName = "absolute inset-0 h-full w-full object-contain",
  imageStyle,
  pointer,
  response,
  src,
}: ProgramWindowProps) {
  return (
    <ParallaxFrame
      frame={frame}
      pointer={pointer}
      response={response}
      style={{ transformOrigin: "50% 100%" }}
    >
      <motion.div
        className="relative h-full w-full"
        custom={delay}
        variants={programWindowVariants}
      >
        <img
          alt={alt}
          className={imageClassName}
          draggable={false}
          src={src}
          style={imageStyle}
        />
        {blurRegionStyle ? (
          <img
            alt=""
            aria-hidden="true"
            className={`${imageClassName} pointer-events-none`}
            draggable={false}
            src={src}
            style={{ ...imageStyle, ...blurRegionStyle }}
          />
        ) : null}
      </motion.div>
    </ParallaxFrame>
  );
}

function Accessory({
  alt,
  delay,
  frame,
  pointer,
  response,
  src,
}: AccessoryProps) {
  return (
    <ParallaxFrame
      frame={frame}
      pointer={pointer}
      response={response}
      style={{ transformOrigin: "50% 70%" }}
    >
      <motion.div
        className="relative h-full w-full"
        custom={delay}
        variants={accessoryVariants}
      >
        <img
          alt={alt}
          className="absolute inset-0 h-full w-full object-contain"
          draggable={false}
          src={src}
        />
      </motion.div>
    </ParallaxFrame>
  );
}

function Arrow({
  delay,
  direction,
  frame,
  innerHeight,
  innerWidth,
  pointer,
  response,
  src,
  transform,
}: ArrowProps) {
  const hiddenClip =
    direction === "left-to-right"
      ? "inset(0 100% 0 0)"
      : "inset(0 0 0 100%)";

  return (
    <ParallaxFrame
      ariaHidden
      className="pointer-events-none absolute flex items-center justify-center"
      frame={frame}
      pointer={pointer}
      response={response}
    >
      <motion.div
        className="relative"
        style={{
          height: percent(innerHeight, frame.height),
          transform,
          width: percent(innerWidth, frame.width),
        }}
        variants={{
          hidden: { clipPath: hiddenClip, opacity: 0 },
          visible: {
            clipPath: "inset(0 0 0 0)",
            opacity: 1,
            transition: {
              clipPath: {
                delay,
                duration: 0.62,
                ease: [0.22, 1, 0.36, 1],
              },
              opacity: { delay, duration: 0.12, ease: "linear" },
            },
          },
        }}
      >
        <img
          alt=""
          className="absolute inset-0 h-full w-full"
          draggable={false}
          src={src}
        />
      </motion.div>
    </ParallaxFrame>
  );
}

function Label({
  children,
  frame,
  pointer,
  response,
}: {
  children: string;
  frame: Frame;
  pointer: PointerMotion;
  response: ParallaxResponse;
}) {
  return (
    <ParallaxFrame
      ariaHidden
      frame={frame}
      pointer={pointer}
      response={response}
    >
      <motion.span
        className="flex h-full w-full items-center justify-center whitespace-nowrap font-[family-name:var(--font-inter)] font-normal leading-none text-[#322f2f]"
        custom={0.88}
        style={{ fontSize: "0.655cqw" }}
        variants={accessoryVariants}
      >
        {children}
      </motion.span>
    </ParallaxFrame>
  );
}

export function ItAdminVisual({ reduced = false }: { reduced?: boolean | null }) {
  const pointerTargetX = useMotionValue(0);
  const pointerTargetY = useMotionValue(0);
  const pointerX = useSpring(pointerTargetX, {
    damping: 24,
    mass: 0.42,
    stiffness: 125,
  });
  const pointerY = useSpring(pointerTargetY, {
    damping: 26,
    mass: 0.5,
    stiffness: 110,
  });
  const pointer = { x: pointerX, y: pointerY };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (reduced || event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerTargetX.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 2);
    pointerTargetY.set(((event.clientY - bounds.top) / bounds.height - 0.5) * 2);
  };

  const resetPointer = () => {
    pointerTargetX.set(0);
    pointerTargetY.set(0);
  };

  return (
    <motion.div
      aria-label="Схема системного IT-администрирования"
      className="relative aspect-[763/531] w-full overflow-hidden bg-transparent"
      data-cursor-parallax="true"
      initial={reduced ? false : "hidden"}
      onPointerCancel={resetPointer}
      onPointerLeave={resetPointer}
      onPointerMove={handlePointerMove}
      role="img"
      style={{ containerType: "inline-size" }}
      viewport={{ amount: 0.3, once: true }}
      whileInView={reduced ? undefined : "visible"}
    >
      <ProgramWindow
        alt="Окно регистрации"
        delay={0.06}
        frame={{ left: 324.02, top: 105.69, width: 88.307, height: 90.273 }}
        pointer={pointer}
        response={PARALLAX.registerWindow}
        src="/it-admin/register-window.png"
      />
      <ProgramWindow
        alt="Окно учёта сотрудников"
        delay={0.2}
        frame={{ left: 72.56, top: 352.84, width: 140.444, height: 120.641 }}
        pointer={pointer}
        response={PARALLAX.staffWindow}
        src="/it-admin/staff-window.png"
      />
      <ProgramWindow
        alt="Окно электронной таблицы"
        delay={0.32}
        frame={{ left: 26.07, top: 146.51, width: 163.061, height: 112.105 }}
        pointer={pointer}
        response={PARALLAX.sheetBack}
        src="/it-admin/onlyoffice-window.png"
      />
      <ProgramWindow
        alt="Окно электронной таблицы"
        delay={0.4}
        frame={{ left: 51.33, top: 158.58, width: 163.061, height: 112.105 }}
        pointer={pointer}
        response={PARALLAX.sheetMiddle}
        src="/it-admin/onlyoffice-window.png"
      />
      <ProgramWindow
        alt="Окно электронной таблицы"
        delay={0.48}
        frame={{ left: 71.43, top: 172.12, width: 163.061, height: 112.105 }}
        pointer={pointer}
        response={PARALLAX.sheetFront}
        src="/it-admin/onlyoffice-window.png"
      />
      <ProgramWindow
        alt="Окно офисной таблицы"
        delay={0.61}
        frame={{ left: 443.9, top: 366.58, width: 189.179, height: 107.083 }}
        pointer={pointer}
        response={PARALLAX.spreadsheetWindow}
        src="/it-admin/spreadsheet-window.png"
      />
      <ProgramWindow
        alt="Окно r_keeper"
        blurRegionStyle={{
          clipPath: "inset(71.4% 2.25% 6.1% 86.35%)",
          filter: "blur(4.5px) saturate(0.75)",
        }}
        delay={0.74}
        frame={{ left: 292.14, top: 307.68, width: 195.324, height: 127.286 }}
        imageClassName="absolute inset-0 h-full w-full rounded-[5px] object-cover shadow-[0_8px_40px_rgba(0,0,0,0.15)]"
        pointer={pointer}
        response={PARALLAX.rkeeperWindow}
        src="/it-admin/rkeeper-window.png"
      />
      <ProgramWindow
        alt="Окно видеонаблюдения"
        delay={0.88}
        frame={{ left: 568.63, top: 94.72, width: 194.373, height: 126.926 }}
        imageClassName="absolute max-w-none object-fill"
        imageStyle={{
          clipPath: "inset(15.46% 14.57% 23.19% 14.57% round 8px)",
          height: "163.03%",
          left: "-20.58%",
          top: "-25.21%",
          width: "141.16%",
        }}
        pointer={pointer}
        response={PARALLAX.videoWindow}
        src="/it-admin/video-window.png"
      />

      <Accessory
        alt="Excel"
        delay={0.42}
        frame={{ left: 80.63, top: 74.06, width: 20, height: 20 }}
        pointer={pointer}
        response={PARALLAX.excel}
        src="/it-admin/xlsx.svg"
      />
      <Label
        frame={{ left: 75.25, top: 92, width: 33, height: 10 }}
        pointer={pointer}
        response={PARALLAX.excel}
      >
        Отчет за май
      </Label>
      <Accessory
        alt="Важная папка"
        delay={0.5}
        frame={{ left: 215.1, top: 103.61, width: 28.56, height: 34.07 }}
        pointer={pointer}
        response={PARALLAX.importantFolder}
        src="/it-admin/important-folder.png"
      />
      <Label
        frame={{ left: 218.61, top: 135, width: 20, height: 10 }}
        pointer={pointer}
        response={PARALLAX.importantFolder}
      >
        Важное
      </Label>
      <Accessory
        alt="Новая папка"
        delay={0.68}
        frame={{ left: 317.22, top: 232.22, width: 28.56, height: 24.335 }}
        pointer={pointer}
        response={PARALLAX.newFolder}
        src="/it-admin/folder-mac.svg"
      />
      <Label
        frame={{ left: 315.51, top: 253, width: 31.982, height: 10 }}
        pointer={pointer}
        response={PARALLAX.newFolder}
      >
        Новая папка
      </Label>
      <Accessory
        alt="Новый документ"
        delay={0.75}
        frame={{ left: 576.14, top: 262.87, width: 19.938, height: 19.938 }}
        pointer={pointer}
        response={PARALLAX.document}
        src="/it-admin/doc.svg"
      />
      <Label
        frame={{ left: 567.65, top: 282, width: 42, height: 10 }}
        pointer={pointer}
        response={PARALLAX.document}
      >
        Новый документ
      </Label>
      <Accessory
        alt="Adobe Acrobat"
        delay={0.8}
        frame={{ left: 500.45, top: 99.62, width: 25.03, height: 25.01 }}
        pointer={pointer}
        response={PARALLAX.acrobat}
        src="/it-admin/adobe-acrobat.svg"
      />
      <Accessory
        alt="Adobe Photoshop"
        delay={0.82}
        frame={{ left: 435.47, top: 159.13, width: 23.05, height: 23.05 }}
        pointer={pointer}
        response={PARALLAX.photoshop}
        src="/it-admin/adobe-photoshop.svg"
      />
      <Accessory
        alt="BioTime"
        delay={0.86}
        frame={{ left: 575.86, top: 302.51, width: 67.586, height: 31.046 }}
        pointer={pointer}
        response={PARALLAX.biotime}
        src="/it-admin/biotime-logo.png"
      />
      <Accessory
        alt="Приложение"
        delay={0.76}
        frame={{ left: 426.66, top: 270.42, width: 21.158, height: 21.158 }}
        pointer={pointer}
        response={PARALLAX.app}
        src="/it-admin/app-icon.png"
      />
      <Accessory
        alt="Центральный сервис"
        delay={0.7}
        frame={{ left: 413.84, top: 260.32, width: 46.785, height: 39.864 }}
        pointer={pointer}
        response={PARALLAX.service}
        src="/it-admin/ellipse.svg"
      />

      <Arrow
        delay={ARROWS_START_AT}
        direction="left-to-right"
        frame={{ left: 372.78, top: 114.64, width: 192.169, height: 153.227 }}
        innerHeight={107.346}
        innerWidth={148.681}
        pointer={pointer}
        response={PARALLAX.arrowOne}
        src="/it-admin/arrow-1.svg"
        transform="rotate(-153.81deg) skewX(-7.93deg) scaleY(0.99)"
      />
      <Arrow
        delay={ARROWS_START_AT + 0.1}
        direction="right-to-left"
        frame={{ left: 196.99, top: 235.44, width: 131.314, height: 137.434 }}
        innerHeight={132.972}
        innerWidth={65.1285}
        pointer={pointer}
        response={PARALLAX.arrowTwo}
        src="/it-admin/arrow-2.svg"
        transform="rotate(-153.81deg) skewX(-7.93deg) scaleY(0.99)"
      />
      <Arrow
        delay={ARROWS_START_AT + 0.2}
        direction="left-to-right"
        frame={{ left: 240.56, top: 58.39, width: 124.125, height: 98.227 }}
        innerHeight={68.3408}
        innerWidth={100.347}
        pointer={pointer}
        response={PARALLAX.arrowThree}
        src="/it-admin/arrow-3.svg"
        transform="rotate(-153.81deg) skewX(-7.93deg) scaleY(-0.99)"
      />
      <Arrow
        delay={ARROWS_START_AT + 0.3}
        direction="left-to-right"
        frame={{ left: 472.77, top: 283.98, width: 136.427, height: 112.37 }}
        innerHeight={83.1953}
        innerWidth={104.416}
        pointer={pointer}
        response={PARALLAX.arrowFour}
        src="/it-admin/arrow-4.svg"
        transform="rotate(-153.81deg) skewX(-7.93deg) scaleY(0.99)"
      />
      <Arrow
        delay={ARROWS_START_AT + 0.4}
        direction="right-to-left"
        frame={{ left: 80.13, top: 284.54, width: 75.82, height: 63.971 }}
        innerHeight={49.5184}
        innerWidth={56.4904}
        pointer={pointer}
        response={PARALLAX.arrowFive}
        src="/it-admin/arrow-5.svg"
        transform="rotate(-26.19deg) skewX(7.93deg) scaleY(0.99)"
      />
      <Arrow
        delay={ARROWS_START_AT + 0.5}
        direction="right-to-left"
        frame={{ left: 42.55, top: 78.16, width: 69.022, height: 72.55 }}
        innerHeight={70.8676}
        innerWidth={34.2039}
        pointer={pointer}
        response={PARALLAX.arrowSix}
        src="/it-admin/arrow-6.svg"
        transform="rotate(-26.19deg) skewX(7.93deg) scaleY(0.99)"
      />
    </motion.div>
  );
}
