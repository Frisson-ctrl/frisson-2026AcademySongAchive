export type TimeTheme = {
  name: "dawn" | "morning" | "day" | "sunset" | "evening" | "night";
  background: string;
  backgroundImage: string;
  text: string;
  mutedText: string;
  faintText: string;
  panel: string;
  panelStrong: string;
  border: string;
  grid: string;
  accent: string;
  accentRgb: string;
  button: string;
  buttonHover: string;
  buttonText: string;
  input: string;
};

export const DEFAULT_TIME_THEME: TimeTheme = {
  name: "day",
  background: "#f3f5f7",
  backgroundImage:
    "radial-gradient(circle at 50% 16%, rgba(255,255,255,0.9), transparent 32%), radial-gradient(circle at 18% 86%, rgba(165,183,196,0.2), transparent 28%), linear-gradient(145deg, #fbfcfd 0%, #f3f5f7 52%, #eceff2 100%)",
  text: "#171d24",
  mutedText: "rgba(42,53,64,0.72)",
  faintText: "rgba(72,86,99,0.56)",
  panel: "rgba(255,255,255,0.46)",
  panelStrong: "rgba(255,255,255,0.68)",
  border: "rgba(88,108,127,0.16)",
  grid: "rgba(91,112,132,0.045)",
  accent: "#7da9c9",
  accentRgb: "125,169,201",
  button: "rgba(23,29,36,0.88)",
  buttonHover: "rgba(23,29,36,0.96)",
  buttonText: "#ffffff",
  input: "rgba(255,255,255,0.58)",
};

const TIME_THEMES: Record<TimeTheme["name"], TimeTheme> = {
  dawn: {
    name: "dawn",
    background: "#111827",
    backgroundImage:
      "radial-gradient(circle at 50% 16%, rgba(210,225,240,0.1), transparent 34%), radial-gradient(circle at 18% 86%, rgba(126,166,208,0.12), transparent 28%), linear-gradient(145deg, #111827 0%, #172033 52%, #202b3f 100%)",
    text: "#eef6ff",
    mutedText: "rgba(218,231,244,0.72)",
    faintText: "rgba(200,218,235,0.5)",
    panel: "rgba(225,235,245,0.06)",
    panelStrong: "rgba(225,235,245,0.12)",
    border: "rgba(205,222,238,0.16)",
    grid: "rgba(205,222,238,0.018)",
    accent: "#b9d7f5",
    accentRgb: "185,215,245",
    button: "rgba(238,246,255,0.88)",
    buttonHover: "rgba(255,255,255,0.96)",
    buttonText: "#101827",
    input: "rgba(255,255,255,0.08)",
  },
  morning: {
    name: "morning",
    background: "#edf4f8",
    backgroundImage:
      "radial-gradient(circle at 50% 16%, rgba(255,255,255,0.92), transparent 32%), radial-gradient(circle at 20% 84%, rgba(104,172,216,0.16), transparent 28%), linear-gradient(145deg, #f9fbfc 0%, #edf4f8 52%, #e2ebf1 100%)",
    text: "#142334",
    mutedText: "rgba(37,58,78,0.72)",
    faintText: "rgba(72,96,118,0.58)",
    panel: "rgba(255,255,255,0.48)",
    panelStrong: "rgba(255,255,255,0.7)",
    border: "rgba(78,111,138,0.16)",
    grid: "rgba(78,111,138,0.045)",
    accent: "#68acd8",
    accentRgb: "104,172,216",
    button: "rgba(20,35,52,0.88)",
    buttonHover: "rgba(20,35,52,0.96)",
    buttonText: "#ffffff",
    input: "rgba(255,255,255,0.62)",
  },
  day: DEFAULT_TIME_THEME,
  sunset: {
    name: "sunset",
    background: "#dfe3e6",
    backgroundImage:
      "radial-gradient(circle at 50% 16%, rgba(255,255,255,0.54), transparent 34%), radial-gradient(circle at 82% 82%, rgba(255,135,61,0.12), transparent 30%), linear-gradient(145deg, #f0f1ef 0%, #dfe3e6 48%, #c9d0d7 100%)",
    text: "#1b2129",
    mutedText: "rgba(50,58,67,0.72)",
    faintText: "rgba(78,88,99,0.54)",
    panel: "rgba(255,255,255,0.36)",
    panelStrong: "rgba(255,255,255,0.58)",
    border: "rgba(84,92,102,0.16)",
    grid: "rgba(84,92,102,0.032)",
    accent: "#ff873d",
    accentRgb: "255,135,61",
    button: "rgba(27,33,41,0.88)",
    buttonHover: "rgba(27,33,41,0.96)",
    buttonText: "#ffffff",
    input: "rgba(255,255,255,0.54)",
  },
  evening: {
    name: "evening",
    background: "#1a2230",
    backgroundImage:
      "radial-gradient(circle at 50% 16%, rgba(226,230,248,0.1), transparent 34%), radial-gradient(circle at 82% 82%, rgba(150,142,220,0.13), transparent 30%), linear-gradient(145deg, #202938 0%, #1a2230 54%, #121927 100%)",
    text: "#f3f5ff",
    mutedText: "rgba(221,225,244,0.72)",
    faintText: "rgba(201,207,232,0.48)",
    panel: "rgba(226,230,248,0.06)",
    panelStrong: "rgba(226,230,248,0.12)",
    border: "rgba(210,214,245,0.16)",
    grid: "rgba(210,214,245,0.018)",
    accent: "#c5b9ff",
    accentRgb: "197,185,255",
    button: "rgba(243,245,255,0.9)",
    buttonHover: "rgba(255,255,255,0.98)",
    buttonText: "#121927",
    input: "rgba(255,255,255,0.08)",
  },
  night: {
    name: "night",
    background: "#0b1019",
    backgroundImage:
      "radial-gradient(circle at 50% 16%, rgba(220,230,240,0.08), transparent 34%), radial-gradient(circle at 82% 82%, rgba(132,154,181,0.12), transparent 30%), linear-gradient(145deg, #090d14 0%, #0d1422 48%, #171f34 100%)",
    text: "#eef2f7",
    mutedText: "rgba(210,221,232,0.68)",
    faintText: "rgba(201,215,228,0.43)",
    panel: "rgba(220,230,240,0.065)",
    panelStrong: "rgba(220,230,240,0.115)",
    border: "rgba(202,215,231,0.14)",
    grid: "rgba(210,221,232,0.018)",
    accent: "#cad7e7",
    accentRgb: "202,215,231",
    button: "rgba(238,242,247,0.9)",
    buttonHover: "rgba(255,255,255,0.98)",
    buttonText: "#0b1019",
    input: "rgba(255,255,255,0.08)",
  },
};

export function getTimeTheme(hour: number, minute = 0): TimeTheme {
  const timeValue = Math.min(23.99, Math.max(0, hour + minute / 60));

  if (timeValue >= 5 && timeValue < 7) return TIME_THEMES.dawn;
  if (timeValue >= 7 && timeValue < 12) return TIME_THEMES.morning;
  if (timeValue >= 12 && timeValue < 17) return TIME_THEMES.day;
  if (timeValue >= 17 && timeValue < 20) return TIME_THEMES.sunset;
  if (timeValue >= 20 && timeValue < 23) return TIME_THEMES.evening;
  return TIME_THEMES.night;
}
