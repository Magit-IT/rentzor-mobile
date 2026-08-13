/**
 * Dependency-free mini icons drawn with plain Views/Text so components render
 * without react-native-svg. Any component that takes an `icon` prop can be
 * given a real SVG (see src/assets) once react-native-svg is set up.
 */
import React from 'react';
import { Text, View, ViewStyle } from 'react-native';
import Svg, { Circle as SvgCircle, Path, Rect as SvgRect } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

type IconProps = { size?: number; color?: string; style?: ViewStyle };

export function Chevron({
  size = 24,
  color,
  direction = 'left',
  style,
}: IconProps & { direction?: 'left' | 'right' | 'up' | 'down' }) {
  const t = useTheme();
  color = color ?? t.colors.text;
  const rotation = { left: '45deg', up: '135deg', right: '225deg', down: '315deg' }[direction];
  const side = size * 0.32;
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <View
        style={{
          width: side,
          height: side,
          borderLeftWidth: 1.5,
          borderBottomWidth: 1.5,
          borderColor: color,
          transform: [{ rotate: rotation }],
        }}
      />
    </View>
  );
}

export function Check({ size = 14, color = '#FFFFFF', style }: IconProps) {
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <View
        style={{
          width: size * 0.65,
          height: size * 0.35,
          borderLeftWidth: 2,
          borderBottomWidth: 2,
          borderColor: color,
          transform: [{ rotate: '-45deg' }, { translateY: -size * 0.08 }],
        }}
      />
    </View>
  );
}

export function Star({ size = 12, color }: IconProps) {
  const t = useTheme();
  color = color ?? t.colors.text;
  return <Text style={{ fontSize: size, lineHeight: size + 2, color }}>★</Text>;
}

/**
 * Figma: Filter / "Star" (293:12190;746:6626;747:10587;338:20876) — the
 * exact outlined 5-point star vector, unlike the Unicode-glyph `Star` above.
 * Used where the design's stroke-based star shape matters (Filter rating).
 */
export function StarOutlineIcon({ size = 24, color, filled = false, style }: IconProps & { filled?: boolean }) {
  const t = useTheme();
  color = color ?? t.colors.text;
  return (
    <View style={style}>
      <Svg width={size} height={size} viewBox="0 0 36.3354 36.3329" fill="none">
        <Path
          d="M13.423 7.18063C15.534 3.39354 16.5896 1.5 18.1677 1.5C19.7458 1.5 20.8013 3.39354 22.9124 7.18062L23.4586 8.16039C24.0585 9.23656 24.3584 9.77464 24.8261 10.1297C25.2938 10.4847 25.8763 10.6165 27.0412 10.8801L28.1018 11.12C32.2012 12.0476 34.251 12.5114 34.7386 14.0796C35.2263 15.6477 33.8289 17.2818 31.0342 20.5499L30.3111 21.3954C29.517 22.3241 29.1199 22.7884 28.9412 23.3629C28.7626 23.9373 28.8226 24.5569 28.9427 25.7959L29.052 26.924C29.4745 31.2843 29.6858 33.4645 28.4091 34.4337C27.1324 35.4029 25.2132 34.5192 21.3749 32.752L20.3819 32.2947C19.2911 31.7925 18.7458 31.5414 18.1677 31.5414C17.5896 31.5414 17.0442 31.7925 15.9535 32.2947L14.9605 32.7519C11.1221 34.5192 9.20297 35.4029 7.92626 34.4337C6.64955 33.4645 6.86081 31.2843 7.28334 26.924L7.39265 25.7959C7.51272 24.5569 7.57276 23.9373 7.39412 23.3629C7.21548 22.7884 6.81839 22.3241 6.02421 21.3954L5.30117 20.5499C2.50643 17.2818 1.10905 15.6477 1.59671 14.0796C2.08437 12.5114 4.13411 12.0476 8.23357 11.12L9.29416 10.8801C10.4591 10.6165 11.0416 10.4847 11.5093 10.1297C11.9769 9.77464 12.2769 9.23656 12.8768 8.16039L13.423 7.18063Z"
          stroke={color}
          strokeWidth={filled ? 0 : 3}
          fill={filled ? color : 'none'}
        />
      </Svg>
    </View>
  );
}

/**
 * Figma: Filter / "Calendar Search" (293:12190;746:6626;747:10579;339:35800;
 * 339:35779) — composited from its 6 exported vector fragments (body/ring,
 * top ticks, magnifier circle, search handle, divider line) into one 24x24
 * icon, since the design has no single combined asset.
 */
export function CalendarSearchIcon({ size = 24, color, style }: IconProps) {
  const t = useTheme();
  color = color ?? t.colors.textSecondary;
  return (
    <View style={style}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M20.75 10.75V8.75C20.75 4.97876 20.75 3.09315 19.5784 1.92157C18.4069 0.750001 16.5212 0.750001 12.75 0.750001H8.75C4.97876 0.750001 3.09315 0.750001 1.92157 1.92157C0.750001 3.09315 0.750001 4.97876 0.750001 8.75V10.75C0.750001 14.5212 0.750001 16.4069 1.92157 17.5784C3.09315 18.75 4.97876 18.75 8.75 18.75H12.75"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          transform="translate(1.999, 4.001)"
        />
        <Path d="M0.75 2.25V0.75" stroke={color} strokeWidth={1.5} strokeLinecap="round" transform="translate(7.001, 2.501)" />
        <Path d="M0.75 2.25V0.75" stroke={color} strokeWidth={1.5} strokeLinecap="round" transform="translate(16.999, 2.501)" />
        <SvgCircle cx={18.75} cy={18.75} r={3} stroke={color} strokeWidth={1.5} />
        <Path d="M0.75 0.75L2.25 2.25" stroke={color} strokeWidth={1.5} strokeLinecap="round" transform="translate(20.501, 20.501)" />
        <Path d="M0.75 0.75H19.75" stroke={color} strokeWidth={1.5} strokeLinecap="round" transform="translate(2.501, 9)" />
      </Svg>
    </View>
  );
}

export function CloseX({ size = 24, color, style }: IconProps) {
  const t = useTheme();
  color = color ?? t.colors.text;
  const barWidth = size * 0.55;
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <View style={{ position: 'absolute', width: barWidth, height: 1.5, backgroundColor: color, transform: [{ rotate: '45deg' }] }} />
      <View style={{ position: 'absolute', width: barWidth, height: 1.5, backgroundColor: color, transform: [{ rotate: '-45deg' }] }} />
    </View>
  );
}

export function TrashIcon({ size = 24, color, style }: IconProps) {
  const t = useTheme();
  color = color ?? t.colors.critical;
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24" fill="none">
        <Path d="M4 6H20" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        <Path d="M9 6V4.5C9 3.67157 9.67157 3 10.5 3H13.5C14.3284 3 15 3.67157 15 4.5V6" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M18.5 6L17.7996 17.4021C17.6928 19.1379 17.6394 20.0058 17.2523 20.6629C16.9114 21.2416 16.4015 21.7013 15.7909 21.9814C15.0979 22.3 14.2284 22.3 12.4894 22.3H11.5106C9.77157 22.3 8.90205 22.3 8.20905 21.9814C7.59845 21.7013 7.08862 21.2416 6.74771 20.6629C6.36064 20.0058 6.30722 19.1379 6.20037 17.4021L5.5 6" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M10 10.5V16.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        <Path d="M14 10.5V16.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      </Svg>
    </View>
  );
}

export function CalendarIcon({ size = 16, color, style }: IconProps) {
  const t = useTheme();
  color = color ?? t.colors.textSecondary;
  return (
    <View style={style}>
      <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <SvgRect x={2} y={3} width={12} height={11} rx={2} stroke={color} strokeWidth={1.3} />
        <Path d="M2 6.5H14" stroke={color} strokeWidth={1.3} />
        <Path d="M5.5 1.5V4" stroke={color} strokeWidth={1.3} strokeLinecap="round" />
        <Path d="M10.5 1.5V4" stroke={color} strokeWidth={1.3} strokeLinecap="round" />
      </Svg>
    </View>
  );
}

export function ClockIcon({ size = 16, color, style }: IconProps) {
  const t = useTheme();
  color = color ?? t.colors.textSecondary;
  return (
    <View style={style}>
      <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <SvgCircle cx={8} cy={8} r={6.2} stroke={color} strokeWidth={1.3} />
        <Path
          d="M8 4.8V8L10.2 9.3"
          stroke={color}
          strokeWidth={1.3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

export function BanknoteIcon({ size = 16, color, style }: IconProps) {
  const t = useTheme();
  color = color ?? t.colors.textSecondary;
  return (
    <View style={style}>
      <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <SvgRect x={1.5} y={4} width={13} height={8} rx={1.5} stroke={color} strokeWidth={1.3} />
        <SvgCircle cx={8} cy={8} r={1.8} stroke={color} strokeWidth={1.3} />
        <Path d="M4 8H4.01" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
        <Path d="M12 8H12.01" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      </Svg>
    </View>
  );
}

export function PhoneIcon({ size = 20, color, style }: IconProps) {
  const t = useTheme();
  color = color ?? t.colors.text;
  return (
    <View style={style}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M8.2 3.6L9.7 6.5C10 7.1 9.9 7.8 9.4 8.3L7.9 9.8C8.9 12.2 11.8 15.1 14.2 16.1L15.7 14.6C16.2 14.1 16.9 14 17.5 14.3L20.4 15.8C21.1 16.2 21.4 17 21.1 17.7L20.3 19.6C19.9 20.5 19 21.1 18 21C10.5 20.2 3.8 13.5 3 6C2.9 5 3.5 4.1 4.4 3.7L6.3 2.9C7 2.6 7.8 2.9 8.2 3.6Z"
          stroke={color}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

/** Three vertical dots — overflow menu. */
export function KebabIcon({ size = 24, color, style }: IconProps) {
  const t = useTheme();
  color = color ?? t.colors.text;
  const dot = size * 0.15;
  return (
    <View
      style={[
        { width: size, height: size, alignItems: 'center', justifyContent: 'center', gap: dot * 0.85 },
        style,
      ]}
    >
      <View style={{ width: dot, height: dot, borderRadius: dot / 2, backgroundColor: color }} />
      <View style={{ width: dot, height: dot, borderRadius: dot / 2, backgroundColor: color }} />
      <View style={{ width: dot, height: dot, borderRadius: dot / 2, backgroundColor: color }} />
    </View>
  );
}

/** Filled red rounded triangle with a white "!" — destructive-action warning. */
export function WarningTriangleIcon({ size = 64, color, style }: IconProps) {
  const t = useTheme();
  color = color ?? t.colors.critical;
  return (
    <View style={style}>
      <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <Path
          d="M26.9 10.9C29.2 7.1 34.8 7.1 37.1 10.9L56.1 43.7C58.4 47.6 55.6 52.5 51 52.5H13C8.4 52.5 5.6 47.6 7.9 43.7L26.9 10.9Z"
          fill={color}
        />
        <Path d="M32 24V36" stroke="#FFFFFF" strokeWidth={4.5} strokeLinecap="round" />
        <SvgCircle cx={32} cy={43.5} r={2.6} fill="#FFFFFF" />
      </Svg>
    </View>
  );
}

/** Circle with a diagonal slash — cancel/forbidden. */
export function BanIcon({ size = 24, color, style }: IconProps) {
  const t = useTheme();
  color = color ?? t.colors.text;
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={size * 0.85} height={size * 0.85} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
          stroke={color}
          strokeWidth={1.5}
        />
        <Path d="M5.7 5.7L18.3 18.3" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      </Svg>
    </View>
  );
}

/** Document with a download arrow. */
export function FileDownIcon({ size = 24, color, style }: IconProps) {
  const t = useTheme();
  color = color ?? t.colors.text;
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={size * 0.85} height={size * 0.85} viewBox="0 0 24 24" fill="none">
        <Path
          d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"
          stroke={color}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        <Path d="M14 2V8H20" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
        <Path d="M12 11V17" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
        <Path
          d="M9.5 14.5L12 17L14.5 14.5"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

export function PlusIcon({ size = 24, color, style }: IconProps) {
  const t = useTheme();
  color = color ?? t.colors.text;
  const barLength = size * 0.4;
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <View style={{ position: 'absolute', width: barLength, height: 1.5, backgroundColor: color }} />
      <View style={{ position: 'absolute', width: 1.5, height: barLength, backgroundColor: color }} />
    </View>
  );
}
