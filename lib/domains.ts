/**
 * Single source of truth for the eight DOOMSDAY domains.
 * Copy and colours come from the campaign brand guide; every section
 * component reads from this config so adding a hero is a data change.
 */

export type DomainSlug =
  | "pcr"
  | "rnd"
  | "marketing"
  | "broadcasting"
  | "outreach"
  | "tech"
  | "design"
  | "content";

export type Motif =
  | "geometric"
  | "web-grid"
  | "lightning"
  | "target"
  | "network"
  | "circuit"
  | "energy"
  | "redacted";

export interface Palette {
  /** Primary domain accent */
  accent: string;
  /** Secondary accent */
  accent2: string;
  /** Background depth / gradients */
  deep: string;
  /** Main page background */
  bg: string;
  /** Primary text */
  fg: string;
}

/** A point the hero camera settles on while scrolling. */
export interface CameraStop {
  id: string;
  /**
   * Where the camera looks, 0 → 1.
   * Video media: fraction of the clip's duration.
   * Image media: vertical focus point on the tall image.
   */
  focus: number;
  /** Optional zoom at this stop (image media only). */
  zoom?: number;
  eyebrow?: string;
  title?: string;
  body?: string;
  cta?: { label: string; href: string };
  /** Which side of the screen the overlay copy sits on. */
  align?: "left" | "right";
  /** Pin the copy to the bottom of the screen instead of centring it vertically. */
  placement?: "middle" | "bottom";
}

/** Small cut-out placed on the hero floor (e.g. the sunglasses). */
export interface HeroProp extends Cutout {
  /** Horizontal centre, as a fraction of the figure's width (can exceed 0–1). */
  x: number;
  /** Width as a fraction of the figure's width. */
  scale: number;
}

export type HeroMedia =
  | { kind: "video"; src: string; poster?: string }
  | { kind: "image"; src: string; width: number; height: number; alt: string }
  /**
   * Transparent full-body figure composited over a blurred neon city,
   * with the hero title sitting behind it. Focus is the vertical point on the figure.
   */
  | {
      kind: "cutout";
      figure: Cutout;
      props?: HeroProp[];
      /** Blurred, tinted photo behind the figure; without it the page backdrop shows through. */
      backdrop?: { src: string; tint: string };
      /** Colour of the soft rim glow around the figure. */
      rim: string;
      /** Figure height in viewport heights (default 2.5); width is capped at 80% of the screen. */
      height?: number;
    };

export interface HeroConfig {
  media: HeroMedia;
  /** Accessible name for the section. */
  label: string;
  /** Optional giant display title that sits behind the character. */
  title?: string;
  /** "drop": falls in from above the screen before the first stop; "rise": slides up from below. */
  enter?: "drop" | "rise";
  stops: CameraStop[];
}

export interface SplitSide {
  eyebrow: string;
  title: string;
  body: string;
}

export interface Cutout {
  src: string;
  width: number;
  height: number;
  alt: string;
}

export interface SwingConfig {
  /** Transparent cut-out of the character mid-swing. */
  figure: Cutout & {
    /** Where the web leaves the image, as fractions of its box. Defaults to top centre. */
    webAttach?: { x: number; y: number };
    /** Angle of that web line in degrees from vertical, positive leaning right. */
    webAngle?: number;
    /** Where the trailing leg meets the bottom, as a fraction of the image width; the colour split passes just left of it. */
    splitFoot?: number;
  };
  /** Photo of the city at night; it is tinted with the two colours below. */
  city: { src: string; width: number; height: number; alt: string };
  /** Colour the city turns to behind the character's path. */
  trailColor: string;
  /** Colour of the untouched side. */
  restColor: string;
  left: SplitSide;
  right: SplitSide;
}

export interface JoinConfig {
  /** Full-width cut-out of the character resting in a web hammock (web included). */
  figure: Cutout;
  heading: string;
  subheading: string;
  button: { label: string; href: string };
}

/** Real-time 3D kunai intro: flies in spinning, the camera pushes in on an etched word, then it leaves. */
export interface KunaiConfig {
  /** Word etched into the blade. */
  etch: string;
  /** Giant line shown alone first; the kunai slices through it. */
  title: string;
  eyebrow: string;
  /** Line revealed when the camera pulls back out. */
  tagline: string;
}

export interface CtaConfig {
  /** "dial": round magnetic dial; "claw": angular vibranium plate with claw strikes. */
  button: { label: string; href: string; style?: "dial" | "claw" };
  heading: string;
  subheading: string;
  /** Small line under the button label. */
  buttonTagline: string;
}

export type SectionConfig =
  | { type: "scroll-pan"; id: string; hero: HeroConfig }
  | { type: "swing"; id: string; swing: SwingConfig }
  | { type: "hammock"; id: string; join: JoinConfig }
  | { type: "kunai"; id: string; kunai: KunaiConfig }
  | { type: "cta"; id: string; cta: CtaConfig };

/** The fixed scene behind every section of a domain page. */
export type Backdrop = { kind: "photo"; src: string } | { kind: "smoke" };

export interface Domain {
  slug: DomainSlug;
  name: string;
  character: string;
  identity: string;
  why: string;
  personality: string[];
  palette: Palette;
  motif: Motif;
  headline: string;
  altHeadlines: string[];
  caption: string;
  /** Attribution for third-party artwork used on the domain page. */
  credits?: string;
  /** Present once the domain's assets and sections are ready. Sections render in order. */
  experience?: {
    backdrop: Backdrop;
    sections: SectionConfig[];
  };
}

export const APPLY_HREF = "#apply";

export const DOMAINS: Domain[] = [
  {
    slug: "pcr",
    name: "PCR",
    character: "Loki",
    identity: "The Master of Mischief",
    why: "Strategy, adaptability and composure under pressure: PCR is for those who navigate the unpredictable and still make the right move.",
    personality: ["Strategic", "Adaptive", "Composed under pressure", "Resourceful", "Good at anticipating outcomes"],
    palette: { accent: "#176B45", accent2: "#C5A15B", deep: "#0A2419", bg: "#090909", fg: "#F2F0EC" },
    motif: "geometric",
    headline: "Every move has a purpose.",
    altHeadlines: ["Strategy Changes Everything.", "Think Ahead. Stay Ahead.", "The Best Move Is Never Accidental."],
    caption:
      "Every situation has a strategy. Every challenge has another angle. PCR is for those who can adapt, think ahead and make the right move when it matters.",
  },
  {
    slug: "rnd",
    name: "R&D",
    character: "Spider-Man",
    identity: "The Curious Problem Solver",
    why: "Spider-Man represents curiosity, experimentation, technical improvisation and learning through experience: analyse fast, build creatively, test again.",
    personality: ["Curious", "Analytical", "Experimental", "Resourceful", "Innovative"],
    palette: { accent: "#E62429", accent2: "#1769D2", deep: "#101D32", bg: "#171717", fg: "#F2F5F8" },
    motif: "web-grid",
    credits:
      "Spider-Man renders by thatKONNORguy and AkiTheFull (DeviantArt); hammock Spider-Man from Spider-Man: Homecoming promotional art (Sony / Marvel). City photo “New York City at night HDR” by Paulo Barcellos Jr. (CC BY-SA 2.0, tinted). Sunglasses from pngimg.com (CC BY-NC 4.0). Spider-Man © Marvel / Sony. Non-commercial student project.",
    headline: "Question everything.",
    altHeadlines: ["Curiosity Builds Tomorrow.", "Test. Learn. Build Again.", "Ideas Are Only the Beginning."],
    caption:
      "The next breakthrough starts with a question. R&D is where curiosity meets experimentation, where ideas are tested and where problems become opportunities to build something better.",
    experience: {
      backdrop: { kind: "photo", src: "/domains/rnd/city-night.webp" },
      sections: [
        {
          type: "scroll-pan",
          id: "hero",
          hero: {
            label: "Question everything",
            media: {
              kind: "cutout",
              figure: { src: "/domains/rnd/hero-figure.webp", width: 741, height: 1924, alt: "Spider-Man in the integrated suit" },
              backdrop: { src: "/domains/rnd/city-night.webp", tint: "#18a99c" },
              rim: "rgba(24,169,156,0.3)",
              props: [{ src: "/domains/rnd/glasses.webp", width: 594, height: 355, alt: "Sunglasses on the ground", x: 0.98, scale: 0.3 }],
            },
            title: "Question Everything",
            stops: [
              {
                id: "head",
                focus: 0.06,
                eyebrow: "R&D · Spider-Man",
                body: "The Curious Problem Solver. Eight domains, one mission — this one starts with a question.",
                cta: { label: "Apply for R&D", href: APPLY_HREF },
                align: "left",
                placement: "bottom",
              },
              {
                id: "chest",
                focus: 0.28,
                eyebrow: "Domain personality",
                title: "Curious. Analytical. Experimental.",
                body: "Analyse situations quickly, improvise technically and turn a messy problem into a working idea.",
                align: "left",
              },
              {
                id: "legs",
                focus: 0.82,
                eyebrow: "Recruitment 2026",
                title: "Test. Learn. Build again.",
                body: "If you always ask “what if we tried this instead?”, this might be your domain.",
                cta: { label: "Recruitment details", href: "#join" },
                align: "left",
              },
            ],
          },
        },
        {
          type: "swing",
          id: "city",
          swing: {
            figure: {
              src: "/domains/rnd/swing.webp",
              width: 1217,
              height: 1497,
              alt: "Spider-Man swinging across the city",
              webAttach: { x: 0.995, y: 0 },
              webAngle: 36,
              splitFoot: 0.16,
            },
            city: { src: "/domains/rnd/city-night.webp", width: 2910, height: 1940, alt: "Manhattan at night" },
            trailColor: "#E62429",
            restColor: "#1769D2",
            left: {
              eyebrow: "Why Spider-Man",
              title: "Curiosity is a superpower.",
              body: "He analyses fast, improvises with what he has and learns from every fall. That is exactly how research works: question, experiment, iterate.",
            },
            right: {
              eyebrow: "What R&D does",
              title: "Ideas get tested here.",
              body: "R&D is where curiosity meets experimentation — researching, prototyping and turning problems into opportunities to build something better.",
            },
          },
        },
        {
          type: "hammock",
          id: "join",
          join: {
            figure: { src: "/domains/rnd/hammock.webp", width: 2048, height: 553, alt: "Spider-Man lying in a web hammock, texting" },
            heading: "Join Us",
            subheading: "Your story starts here. Find your domain, bring your strengths, become part of the mission.",
            button: { label: "Apply Now", href: APPLY_HREF },
          },
        },
      ],
    },
  },
  {
    slug: "marketing",
    name: "Marketing",
    character: "Thor",
    identity: "The God of Impact",
    why: "Presence, confidence and unmistakable impact — bold campaigns and making people pay attention.",
    personality: ["Bold", "Persuasive", "Energetic", "Audience-focused", "Impact-driven"],
    palette: { accent: "#24B9F2", accent2: "#145DA0", deep: "#07121F", bg: "#07121F", fg: "#F2F0EC" },
    motif: "lightning",
    headline: "Make your presence felt.",
    altHeadlines: ["Don't Just Reach. Resonate.", "Make Noise. Make an Impact.", "Attention Is Earned."],
    caption:
      "A great idea means little if nobody hears about it. Marketing turns ideas into conversations, campaigns into experiences and visibility into meaningful engagement.",
  },
  {
    slug: "broadcasting",
    name: "Broadcasting",
    character: "Hawkeye",
    identity: "Precision Under Pressure",
    why: "Concentration, timing and accuracy — clear communication delivered at exactly the right moment.",
    personality: ["Articulate", "Focused", "Confident", "Composed", "Precise"],
    palette: { accent: "#7546B8", accent2: "#A16BFF", deep: "#34343D", bg: "#0B0B0F", fg: "#F2F0EC" },
    motif: "target",
    headline: "Every word. On target.",
    altHeadlines: ["Own the Moment.", "The Right Voice. The Right Time.", "Speak So They Remember."],
    caption:
      "Every event has a moment that matters. Broadcasting is about finding your voice, connecting with an audience and delivering the right message at the right time.",
  },
  {
    slug: "outreach",
    name: "Outreach",
    character: "Nick Fury",
    identity: "The Man Who Assembles the Team",
    why: "Relationship-building and bringing the right people together around a shared mission.",
    personality: ["Connected", "Strategic", "Persuasive", "Relationship-driven", "Resourceful"],
    palette: { accent: "#3676B8", accent2: "#8A929B", deep: "#10243B", bg: "#15181D", fg: "#F2F0EC" },
    motif: "network",
    headline: "Great teams don't assemble themselves.",
    altHeadlines: ["Every Connection Opens a Door.", "Build Relationships. Create Possibilities.", "The Mission Starts With People."],
    caption:
      "Behind every meaningful collaboration is someone who made the connection. Outreach brings people, organisations and opportunities together.",
  },
  {
    slug: "tech",
    name: "Tech",
    character: "Black Panther",
    identity: "The Technological Genius",
    why: "Engineering, invention and turning complex ideas into working technology.",
    personality: ["Innovative", "Technical", "Analytical", "Future-focused", "Solution-oriented"],
    // Dark vibranium purple and suit silver, taken from T'Challa's suit.
    palette: { accent: "#5B21A6", accent2: "#B8BEC9", deep: "#0D0619", bg: "#040208", fg: "#ECEEF3" },
    motif: "circuit",
    credits:
      "Black Panther (2018) promotional render © Marvel Studios, via pngarts.com. The kunai is a real-time 3D model built for this page. Non-commercial student project.",
    headline: "Build what doesn't exist.",
    altHeadlines: ["The Future Is Engineered.", "Turn Logic Into Possibility.", "Innovation Is Built, Not Imagined."],
    caption:
      "The future does not build itself. Tech is where ideas become systems, problems become solutions and innovation becomes something people can actually use.",
    experience: {
      backdrop: { kind: "smoke" },
      sections: [
        {
          type: "kunai",
          id: "hero",
          kunai: {
            etch: "TECH",
            title: "Innovate",
            eyebrow: "Tech · Black Panther",
            tagline: "Build what doesn't exist.",
          },
        },
        {
          type: "scroll-pan",
          id: "panther",
          hero: {
            label: "The Technological Genius",
            enter: "rise",
            media: {
              kind: "cutout",
              figure: { src: "/domains/tech/panther-4k.webp", width: 2880, height: 3986, alt: "Black Panther, T'Challa, in the vibranium suit" },
              rim: "rgba(91,33,166,0.6)",
              height: 1.9,
            },
            stops: [
              {
                id: "head",
                focus: 0.05,
                eyebrow: "Tech · Black Panther",
                title: "The Technological Genius.",
                body: "Engineering, invention and the patience to turn a complex idea into technology that actually works.",
                align: "left",
              },
              {
                id: "chest",
                focus: 0.25,
                eyebrow: "Domain personality",
                title: "Innovative. Technical. Analytical.",
                body: "Future-focused and solution-oriented — you build systems, test them hard and make them better.",
                align: "right",
              },
              {
                id: "legs",
                focus: 0.78,
                eyebrow: "Recruitment 2026",
                title: "The future is engineered.",
                body: "If you enjoy building, experimenting and making technology work, bring your skills to the mission.",
                cta: { label: "Apply for Tech", href: APPLY_HREF },
                align: "left",
              },
            ],
          },
        },
        {
          type: "cta",
          id: "join",
          cta: {
            heading: "Join Us",
            subheading: "Your story starts here. Find your domain, bring your strengths, become part of the mission.",
            button: { label: "Apply Now", href: APPLY_HREF, style: "claw" },
            buttonTagline: "Wakanda forever",
          },
        },
      ],
    },
  },
  {
    slug: "design",
    name: "Design",
    character: "Ms. Marvel (Kamala Khan)",
    identity: "The Creative Visionary",
    why: "Confidence, visual presence and turning an abstract idea into something immediately recognisable.",
    personality: ["Creative", "Visionary", "Expressive", "Bold", "Detail-oriented"],
    palette: { accent: "#173F75", accent2: "#F2B632", deep: "#D7263D", bg: "#0A0A0C", fg: "#F7F4EF" },
    motif: "energy",
    headline: "Imagine. Create. Redefine.",
    altHeadlines: ["Make Your Imagination Visible.", "Ideas Have No Limits.", "Create Beyond the Ordinary."],
    caption:
      "Every idea deserves a visual identity. Design turns concepts into experiences, messages into visuals and ordinary communication into something people remember.",
  },
  {
    slug: "content",
    name: "Content",
    character: "Deadpool",
    identity: "The Unfiltered Storyteller",
    why: "Wit, a distinctive voice and unconventional storytelling — ideas communicated memorably.",
    personality: ["Witty", "Original", "Sharp", "Relatable", "Unconventional"],
    palette: { accent: "#C8102E", accent2: "#777B82", deep: "#700D1B", bg: "#0A0A0A", fg: "#F2F0EC" },
    motif: "redacted",
    headline: "Break the fourth wall.",
    altHeadlines: ["We Don't Do Boring.", "Your Words. Our Weapon.", "Unfiltered By Design."],
    caption:
      "The internet has enough content. What it needs is something worth remembering. No boring scripts. No forgettable stories. Just content with a personality.",
  },
];

export function getDomain(slug: string): Domain | undefined {
  return DOMAINS.find((d) => d.slug === slug);
}
