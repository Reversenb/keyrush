"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

// 🌟 คอลเลกชันธีมสีระดับพรีเมียม 10 สีสำหรับแผงควบคุม KeyRush
export const TERMINAL_THEMES: Record<string, { hex: string; rgb: string; foreground: string }> = {
  orange: { hex: '#f97316', rgb: '249;115;22', foreground: '#ffedd5' },       // 1. Cute Orange
  green: { hex: '#4ade80', rgb: '74;222;128', foreground: '#e8fcd8' },       // 2. Hacker Green
  blue: { hex: '#3b82f6', rgb: '59;130;246', foreground: '#dbeafe' },       // 3. Cyber Blue
  purple: { hex: '#a855f7', rgb: '168;85;247', foreground: '#f3e8ff' },     // 4. Dracula Purple
  pink: { hex: '#f472b6', rgb: '244;114;182', foreground: '#fce7f3' },       // 5. Sakura Pink
  red: { hex: '#ef4444', rgb: '239;68;68', foreground: '#fee2e2' },         // 6. Red Alert
  yellow: { hex: '#fbbf24', rgb: '251;191;36', foreground: '#fef3c7' },      // 7. Amber Gold
  cyan: { hex: '#22d3ee', rgb: '34;211;238', foreground: '#ecfeff' },        // 8. Neon Cyan
  white: { hex: '#ffffff', rgb: '255;255;255', foreground: '#f1f5f9' },      // 9. Minimal White
  retro: { hex: '#39ff14', rgb: '57;255;20', foreground: '#dcfce7' },        // 10. Retro Matrix
};

// สร้าง theme object ของ xterm จากชุดสี — ตัวหนังสือหลักใช้โทนอ่อน (foreground)
// ให้อ่านง่าย ส่วนสีจัดเต็ม (hex) เก็บไว้ที่ cursor / selection / accent
const buildXtermTheme = (t: { hex: string; rgb: string; foreground: string }, bg: string) => ({
  background: bg,
  foreground: t.foreground,
  cursor: t.hex,
  cursorAccent: '#000000',
  selectionBackground: `rgba(${t.rgb}, 0.3)`,
  black: '#000000',
  red: '#fb7185',
  green: '#4ade80',
  yellow: '#fbbf24',
  blue: '#60a5fa',
  magenta: t.hex,
  cyan: '#22d3ee',
  white: '#ffffff',
  brightBlack: '#64748b',
  brightRed: '#fda4af',
  brightGreen: '#86efac',
  brightYellow: '#fde68a',
  brightBlue: '#93c5fd',
  brightMagenta: t.hex,
  brightCyan: '#a5f3fc',
  brightWhite: '#ffffff',
});

export interface TerminalHandle {
  writeLine: (text: string) => void;
  prompt: (path: string) => void;
  reset: (path: string) => void;
}

interface TerminalBoxProps {
  initialPath: string;
  onCommand: (command: string) => void;
  isMuted: boolean;
  fontSize?: number;
  themeName?: string;
  bgColor?: string;
}

const TerminalBox = forwardRef<TerminalHandle, TerminalBoxProps>(({
  initialPath, onCommand, isMuted, fontSize = 15, themeName = 'orange', bgColor = '#050505'
}, ref) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstance = useRef<Terminal | null>(null);
  const fitAddonInstance = useRef<FitAddon | null>(null);
  const inputBuffer = useRef<string>('');

  const usernameRef = useRef<string>('operative');
  const onCommandRef = useRef(onCommand);
  const currentPathRef = useRef(initialPath);
  const isMutedRef = useRef(isMuted);

  const currentThemeRef = useRef(TERMINAL_THEMES[themeName] || TERMINAL_THEMES.orange);

  const cmdHistory = useRef<string[]>([]);
  const historyIdx = useRef<number>(-1);

  useEffect(() => { onCommandRef.current = onCommand; }, [onCommand]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  // 🌟 อัปเดต Font Size
  useEffect(() => {
    if (termInstance.current) {
      termInstance.current.options.fontSize = fontSize;
      setTimeout(() => {
        try { fitAddonInstance.current?.fit(); } catch (e) { }
      }, 50);
    }
  }, [fontSize]);

  // 🌟 อัปเดตสีข้อความ (Theme) และสีพื้นหลัง (bgColor) ทันที
  useEffect(() => {
    const selectedTheme = TERMINAL_THEMES[themeName] || TERMINAL_THEMES.orange;
    currentThemeRef.current = selectedTheme;

    if (termInstance.current) {
      termInstance.current.options.theme = buildXtermTheme(selectedTheme, bgColor);
      // บังคับให้ Terminal วาดตัวเองใหม่ทั้งหมด
      termInstance.current.refresh(0, termInstance.current.rows - 1);
    }
  }, [themeName, bgColor]);

  const playTypingSound = () => {
    if (isMutedRef.current) return;
    const audio = new Audio('/sounds/typing.mp3');
    audio.volume = 0.2;
    audio.play().catch(() => { });
  };

  // 🌟 Prompt สีตามธีม: user@keyrush เป็นสี accent (truecolor), path เหลือง, $ เป็น accent
  const drawPrompt = (term: Terminal, path: string) => {
    const accent = `\x1b[1;38;2;${currentThemeRef.current.rgb}m`;
    term.write(`\r\n${accent}${usernameRef.current}@keyrush\x1b[0m\x1b[2m:\x1b[0m\x1b[1;33m${path}\x1b[0m ${accent}$\x1b[0m `);
  };

  // 🌟 Banner ต้อนรับ — หัวเรื่องสี accent + คำอธิบายจางๆ
  const drawBanner = (term: Terminal) => {
    const accent = `\x1b[1;38;2;${currentThemeRef.current.rgb}m`;
    term.writeln(`${accent}╭─[ KEYRUSH TERMINAL ]─────────────────╮\x1b[0m`);
    term.writeln(`${accent}│\x1b[0m  \x1b[2mInteractive Command Training v2.0\x1b[0m   ${accent}│\x1b[0m`);
    term.writeln(`${accent}╰──────────────────────────────────────╯\x1b[0m`);
  };

  useImperativeHandle(ref, () => ({
    writeLine: (text: string) => {
      termInstance.current?.writeln(text);
    },
    prompt: (path: string) => {
      currentPathRef.current = path;
      if (termInstance.current) drawPrompt(termInstance.current, path);
    },
    reset: (path: string) => {
      currentPathRef.current = path;
      inputBuffer.current = '';
      historyIdx.current = -1;

      const term = termInstance.current;
      if (term) {
        term.write('\x1bc'); // Clear Screen
        drawBanner(term);
        drawPrompt(term, path);
      }
    }
  }));

  useEffect(() => {
    if (!terminalRef.current || termInstance.current) return;

    const userStr = localStorage.getItem('keyrush_user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        usernameRef.current = u.displayName?.replace(/\s+/g, '_') || u.username?.split('@')[0] || 'operative';
      } catch (e) { }
    }

    const initialTheme = TERMINAL_THEMES[themeName] || TERMINAL_THEMES.orange;

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
      fontSize: fontSize,
      fontWeight: '500',
      lineHeight: 1.5,
      theme: buildXtermTheme(initialTheme, bgColor)
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    termInstance.current = term;
    fitAddonInstance.current = fitAddon;

    let isTerminalOpened = false;

    const resizeObserver = new ResizeObserver(() => {
      if (!terminalRef.current) return;

      if (terminalRef.current.clientWidth > 0 && terminalRef.current.clientHeight > 0) {
        if (!isTerminalOpened) {
          term.open(terminalRef.current);
          isTerminalOpened = true;

          setTimeout(() => {
            try {
              fitAddon.fit();
              drawBanner(term);
              drawPrompt(term, currentPathRef.current);
            } catch (err) { }
          }, 20);
        } else {
          try { fitAddon.fit(); } catch (err) { }
        }
      }
    });

    resizeObserver.observe(terminalRef.current);

    const replaceInput = (newInput: string) => {
      for (let i = 0; i < inputBuffer.current.length; i++) term.write('\b \b');
      inputBuffer.current = newInput;
      term.write(newInput);
    };

    term.onKey(({ key, domEvent }) => {
      const ev = domEvent;
      const printable = !ev.altKey && !ev.ctrlKey && !ev.metaKey;

      if (ev.keyCode === 13) {
        const cmd = inputBuffer.current.trim();
        if (cmd) cmdHistory.current.push(cmd);
        historyIdx.current = -1;
        onCommandRef.current(cmd);
        inputBuffer.current = '';
      } else if (ev.keyCode === 8) {
        playTypingSound();
        if (inputBuffer.current.length > 0) {
          inputBuffer.current = inputBuffer.current.slice(0, -1);
          term.write('\b \b');
        }
      } else if (ev.keyCode === 38) {
        if (cmdHistory.current.length > 0) {
          historyIdx.current = Math.min(historyIdx.current + 1, cmdHistory.current.length - 1);
          replaceInput(cmdHistory.current[cmdHistory.current.length - 1 - historyIdx.current]);
        }
      } else if (ev.keyCode === 40) {
        if (historyIdx.current > 0) {
          historyIdx.current--;
          replaceInput(cmdHistory.current[cmdHistory.current.length - 1 - historyIdx.current]);
        } else if (historyIdx.current === 0) {
          historyIdx.current = -1;
          replaceInput('');
        }
      } else if (printable && key.length === 1) {
        playTypingSound();
        inputBuffer.current += key;
        term.write(key);
      }
    });

    return () => {
      resizeObserver.disconnect();
      term.dispose();
      termInstance.current = null;
      fitAddonInstance.current = null;
    };
  }, []);

  const activeThemeHex = TERMINAL_THEMES[themeName]?.hex || TERMINAL_THEMES.orange.hex;

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        .xterm-viewport::-webkit-scrollbar {
          width: 8px;
        }
        .xterm-viewport::-webkit-scrollbar-track {
          background: transparent;
        }
        .xterm-viewport::-webkit-scrollbar-thumb {
          background: ${activeThemeHex}33;
          border-radius: 10px;
        }
        .xterm-viewport::-webkit-scrollbar-thumb:hover {
          background: ${activeThemeHex}80;
        }
        .xterm .xterm-cursor {
          box-shadow: 0 0 10px ${activeThemeHex};
        }
      `}} />

      <div className="w-full h-full p-4 md:p-6 overflow-hidden relative" style={{ minHeight: '300px' }}>
        <div ref={terminalRef} className="absolute inset-0 p-4 md:p-6" />

        {/* 🎞️ CRT scanlines จางๆ ให้ฟีลจอเก่า (ไม่บังการคลิก/พิมพ์) */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{ background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 3px)' }}
        />
        {/* 🌘 Vignette มืดตามขอบ + แสงเรืองสี accent บางๆ */}
        <div
          className="absolute inset-0 pointer-events-none z-10 transition-shadow duration-500"
          style={{ boxShadow: `inset 0 0 110px rgba(0,0,0,0.45), inset 0 0 26px ${activeThemeHex}26` }}
        />
      </div>
    </>
  );
});

TerminalBox.displayName = 'TerminalBox';
export default TerminalBox;