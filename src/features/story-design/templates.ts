import { STORY_COLORS } from "./colors";
import {
  drawCover,
  formatPrice,
  roundRect,
  wrapText,
} from "./canvas-utils";

export interface StoryDesignData {
  starter: string;
  main_course: string;
  dessert: string;
  price: number;
}

export type StoryTemplateId =
  | "top-banner"
  | "bottom-gradient"
  | "center-card"
  | "corner-badge";

export interface StoryTemplate {
  id: StoryTemplateId;
  name: string;
  description: string;
  draw(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    img: HTMLImageElement,
    data: StoryDesignData
  ): void;
}

function drawTopBanner(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  img: HTMLImageElement,
  data: StoryDesignData
) {
  const bannerH = h * 0.24;

  drawCover(ctx, img, 0, bannerH, w, h - bannerH);

  ctx.fillStyle = STORY_COLORS.terracotta;
  ctx.fillRect(0, 0, w, bannerH);

  ctx.fillStyle = STORY_COLORS.cream;
  ctx.textAlign = "center";
  ctx.font = `700 ${w * 0.065}px sans-serif`;
  ctx.fillText("MENÚ DEL DÍA", w / 2, bannerH * 0.38);

  ctx.font = `600 ${w * 0.045}px sans-serif`;

  wrapText(ctx, data.main_course, w * 0.86)
    .slice(0, 2)
    .forEach((line, index) => {
      ctx.fillText(
        line,
        w / 2,
        bannerH * 0.66 + index * w * 0.055
      );
    });

  ctx.fillStyle = STORY_COLORS.pine;
  roundRect(
    ctx,
    w * 0.35,
    h - h * 0.09,
    w * 0.3,
    h * 0.06,
    999
  );
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = `700 ${w * 0.04}px sans-serif`;
  ctx.fillText(
    formatPrice(data.price),
    w / 2,
    h - h * 0.052
  );
}

function drawBottomGradient(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  img: HTMLImageElement,
  data: StoryDesignData
) {
  drawCover(ctx, img, 0, 0, w, h);

  const gradH = h * 0.44;
  const gradient = ctx.createLinearGradient(
    0,
    h - gradH,
    0,
    h
  );

  gradient.addColorStop(0, "rgba(20,14,10,0)");
  gradient.addColorStop(1, "rgba(20,14,10,0.85)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, h - gradH, w, gradH);

  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 ${w * 0.06}px sans-serif`;
  ctx.fillText(
    "Menú del día",
    w * 0.07,
    h - gradH * 0.72
  );

  ctx.font = `500 ${w * 0.04}px sans-serif`;

  let y = h - gradH * 0.52;

  [data.starter, data.main_course, data.dessert]
    .filter(Boolean)
    .forEach((item) => {
      wrapText(ctx, `• ${item}`, w * 0.86).forEach(
        (line) => {
          ctx.fillText(line, w * 0.07, y);
          y += w * 0.052;
        }
      );
    });

  ctx.font = `700 ${w * 0.05}px sans-serif`;
  ctx.fillStyle = "#F2B26B";
  ctx.fillText(
    formatPrice(data.price),
    w * 0.07,
    h * 0.955
  );
}

function drawCenterCard(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  img: HTMLImageElement,
  data: StoryDesignData
) {
  drawCover(ctx, img, 0, 0, w, h);

  ctx.fillStyle = "rgba(15,10,8,0.4)";
  ctx.fillRect(0, 0, w, h);

  const cardW = w * 0.84;
  const cardH = h * 0.4;
  const cardX = (w - cardW) / 2;
  const cardY = (h - cardH) / 2;

  ctx.fillStyle = STORY_COLORS.cream;
  roundRect(ctx, cardX, cardY, cardW, cardH, 32);
  ctx.fill();

  ctx.fillStyle = STORY_COLORS.terracottaDark;
  ctx.textAlign = "center";
  ctx.font = `700 ${w * 0.06}px sans-serif`;
  ctx.fillText(
    "MENÚ DEL DÍA",
    w / 2,
    cardY + cardH * 0.18
  );

  ctx.fillStyle = STORY_COLORS.dark;
  ctx.font = `500 ${w * 0.038}px sans-serif`;

  let y = cardY + cardH * 0.36;

  [data.starter, data.main_course, data.dessert]
    .filter(Boolean)
    .forEach((item) => {
      wrapText(ctx, item, cardW * 0.85).forEach(
        (line) => {
          ctx.fillText(line, w / 2, y);
          y += w * 0.05;
        }
      );
    });

  ctx.fillStyle = STORY_COLORS.terracotta;
  ctx.font = `700 ${w * 0.05}px sans-serif`;
  ctx.fillText(
    formatPrice(data.price),
    w / 2,
    cardY + cardH * 0.9
  );
}

function drawCornerBadge(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  img: HTMLImageElement,
  data: StoryDesignData
) {
  drawCover(ctx, img, 0, 0, w, h);

  ctx.fillStyle = STORY_COLORS.pine;
  roundRect(
    ctx,
    w * 0.06,
    h * 0.05,
    w * 0.62,
    h * 0.075,
    999
  );
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.font = `700 ${w * 0.037}px sans-serif`;
  ctx.fillText("MENÚ DEL DÍA", w * 0.1, h * 0.104);

  const captionH = h * 0.16;

  ctx.fillStyle = "rgba(15,10,8,0.55)";
  ctx.fillRect(0, h - captionH, w, captionH);

  ctx.fillStyle = "#ffffff";
  ctx.font = `600 ${w * 0.043}px sans-serif`;

  let y = h - captionH * 0.6;

  wrapText(ctx, data.main_course, w * 0.6)
    .slice(0, 2)
    .forEach((line) => {
      ctx.fillText(line, w * 0.07, y);
      y += w * 0.05;
    });

  const badgeW = w * 0.26;
  const badgeX = w * 0.68;
  const badgeY = h - captionH * 0.78;

  ctx.fillStyle = STORY_COLORS.terracotta;
  roundRect(ctx, badgeX, badgeY, badgeW, h * 0.07, 999);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = `700 ${w * 0.04}px sans-serif`;
  ctx.fillText(
    formatPrice(data.price),
    badgeX + badgeW / 2,
    badgeY + h * 0.045
  );
}

export const STORY_TEMPLATES: StoryTemplate[] = [
  {
    id: "top-banner",
    name: "Franja superior",
    description:
      "Barra de color arriba con el plato principal y el precio.",
    draw: drawTopBanner,
  },
  {
    id: "bottom-gradient",
    name: "Degradado inferior",
    description:
      "El menú completo sobre un degradado en la parte baja de la foto.",
    draw: drawBottomGradient,
  },
  {
    id: "center-card",
    name: "Tarjeta centrada",
    description:
      "Tarjeta clara centrada con los datos del menú.",
    draw: drawCenterCard,
  },
  {
    id: "corner-badge",
    name: "Etiquetas",
    description:
      "Insignia del menú arriba y precio destacado abajo.",
    draw: drawCornerBadge,
  },
];
