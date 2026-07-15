// =========================================================================
// 🌟 Command Simulation Engine ของ KeyRush
// จำลองผลของคำสั่งที่เกมสอน (ครอบคลุมคำสั่งทั้งหมดใน /api/docs/linux + windows)
// - คืน output ปลอมที่ดูสมจริงให้ terminal
// - คืนการเปลี่ยนแปลงของ Virtual File System / path
// - คืน effect ให้ VirtualFileSystemPanel เล่นอนิเมชันตามหมวดคำสั่ง
// เพิ่มคำสั่งใหม่ = เพิ่ม case ในไฟล์นี้ไฟล์เดียว ไม่ต้องแตะหน้าเล่น
// =========================================================================

export type VirtualFile = { name: string; type: 'folder' | 'file' };

export type SimEffect =
  | { kind: 'pulse'; label: string }
  | { kind: 'copy'; label: string }
  | { kind: 'move'; label: string }
  | { kind: 'archive'; mode: 'pack' | 'unpack'; label: string }
  | { kind: 'permission'; targets: string[]; label: string }
  | { kind: 'scan'; targets: string[]; label: string }
  | { kind: 'network'; label: string }
  | { kind: 'process'; mode: 'list' | 'kill'; label: string }
  | { kind: 'sysinfo'; label: string };

export interface SimContext {
  os: 'linux' | 'windows';
  username: string;
  currentPath: string;
  fileSystem: VirtualFile[];
}

export interface SimResult {
  // ข้อความตอบกลับ (บรรทัดเดียวหรือหลายบรรทัดคั่น \r\n)
  output?: string;
  // หลายบรรทัดแบบทยอยพิมพ์ (ping, tracert, ...) + ดีเลย์ต่อบรรทัด
  outputLines?: string[];
  streamDelayMs?: number;
  newFileSystem?: VirtualFile[];
  newPath?: string;
  effect?: SimEffect;
  clearScreen?: boolean;
  // false = คำสั่งไม่ถูกต้อง/ไม่รู้จัก (ใช้ตัดสินเสียง error)
  valid: boolean;
}

// ---------- ANSI helpers ----------
const R = '\x1b[0m';
const B = '\x1b[1m';
const DIM = '\x1b[2m';
const RED = '\x1b[31m';
const GRN = '\x1b[32m';
const YEL = '\x1b[33m';
const BLU = '\x1b[1;34m';
const CYN = '\x1b[36m';

// ---------- เนื้อไฟล์ปลอมสำหรับ cat/grep/head/tail ----------
const FILE_CONTENT: Record<string, string[]> = {
  'config.json': ['{', `  ${CYN}"app"${R}: "keyrush",`, `  ${CYN}"version"${R}: "2.0.4",`, `  ${CYN}"debug"${R}: false`, '}'],
  'server.log': [
    `${DIM}[09:12:44]${R} ${GRN}INFO${R}  server started on :8080`,
    `${DIM}[09:13:02]${R} ${YEL}WARN${R}  high memory usage 81%`,
    `${DIM}[09:13:20]${R} ${RED}ERROR${R} connection timeout from 10.0.0.7`,
    `${DIM}[09:14:11]${R} ${GRN}INFO${R}  retry ok`,
  ],
  'readme.md': [`${B}# KeyRush Project${R}`, 'Training mission workspace.', 'Type commands to complete objectives.'],
  'app.ts': [`${CYN}import${R} { boot } ${CYN}from${R} './core';`, '', 'boot({ mode: "training" });'],
};
const fileLines = (name: string) => FILE_CONTENT[name] || [`${DIM}[ content of ${name} ]${R}`];

const FAKE_PROCS = [
  ['1', 'init', '00:01'],
  ['214', 'sshd', '00:04'],
  ['982', 'node server.js', '12:40'],
  ['1044', 'cron', '00:00'],
  ['1337', 'keyrushd', '05:22'],
];

const notFound = (os: string, action: string): SimResult => ({
  output: `${RED}${os === 'linux' ? 'bash' : 'cmd'}: ${action}: command not found${R}`,
  valid: false,
});
const missing = (action: string, what = 'operand'): SimResult => ({
  output: `${RED}${action}: missing ${what}${R}`,
  valid: false,
});
const ok = (r: Omit<SimResult, 'valid'>): SimResult => ({ ...r, valid: true });

// ---------- main ----------
export function simulateCommand(rawCommand: string, ctx: SimContext): SimResult {
  const { os, username, currentPath, fileSystem } = ctx;
  const normalized = rawCommand.trim().replace(/\s+/g, ' ');
  const parts = normalized.split(' ');
  let action = parts[0].toLowerCase();
  let args = parts.slice(1);

  // sudo/runas = สิทธิ์ admin — แสดง effect แล้วจำลองคำสั่งข้างใน
  if ((action === 'sudo' || action === 'runas') && args.length > 0) {
    const inner = simulateCommand(args.join(' '), ctx);
    return {
      ...inner,
      effect: inner.effect || { kind: 'permission', targets: [], label: 'ELEVATED PRIVILEGES' },
    };
  }
  if (action === 'sudo' || action === 'runas') return missing(action, 'command');

  const targets = args.filter(t => !t.startsWith('-') && !t.startsWith('/') && t !== '>' && !t.includes('>'));
  const exists = (name: string) => fileSystem.some(f => f.name === name);
  const t0 = targets[0];

  switch (action) {
    // ==================== จอ / พื้นฐาน ====================
    case 'clear': case 'cls':
      return ok({ clearScreen: true });

    case 'pwd':
      return ok({ output: currentPath === '~' ? `/home/${username}` : `/home/${username}/${currentPath.replace('~/', '')}` });

    case 'ls': case 'dir': case 'll': {
      if (fileSystem.length === 0) return ok({ output: '(empty directory)' });
      const detailed = args.includes('-la') || args.includes('-l') || args.includes('-al') || action === 'll';
      const output = detailed
        ? fileSystem.map(f => {
          const perms = f.type === 'folder' ? 'drwxr-xr-x' : '-rw-r--r--';
          const size = f.type === 'folder' ? '4096' : Math.floor(Math.random() * 50000 + 100).toString();
          const date = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
          return `${perms} 1 ${username} staff ${size.padStart(5)} ${date} ${f.type === 'folder' ? `${BLU}${f.name}${R}` : f.name}`;
        }).join('\r\n')
        : fileSystem.map(f => (f.type === 'folder' ? `${BLU}${f.name}${R}` : f.name)).join('  ');
      return ok({ output });
    }

    case 'cd': {
      // แค่คำนวณ path ใหม่ — รายการไฟล์ของแต่ละห้องหน้าเล่นเป็นคนจำ (fsMapRef)
      let newPath = currentPath;
      const cdTarget = t0;
      if (!cdTarget || cdTarget === '~') newPath = '~';
      else if (cdTarget === '..') newPath = currentPath === '~' ? '~' : currentPath.split('/').slice(0, -1).join('/') || '~';
      else if (cdTarget === '/') newPath = '/';
      else if (cdTarget === '.') newPath = currentPath;
      else newPath = currentPath === '~' ? `~/${cdTarget}` : currentPath.endsWith('/') ? `${currentPath}${cdTarget}` : `${currentPath}/${cdTarget}`;
      return ok({ newPath });
    }

    case 'echo': {
      // echo text > file = สร้างไฟล์, echo text = พิมพ์ข้อความ
      const redirect = normalized.match(/>\s*(\S+)/);
      if (redirect) {
        const fname = redirect[1];
        const newFileSystem = exists(fname) ? fileSystem : [...fileSystem, { name: fname, type: 'file' as const }];
        return ok({ newFileSystem, effect: { kind: 'copy', label: `WRITE → ${fname}` } });
      }
      return ok({ output: args.join(' ') || '' });
    }

    case 'history':
      return ok({ output: [`${DIM}  1${R}  pwd`, `${DIM}  2${R}  ls -la`, `${DIM}  3${R}  ${normalized}`].join('\r\n') });

    case 'exit':
      return ok({ output: `${DIM}logout — session preserved by KeyRush trainer${R}` });

    // ==================== สร้าง/ลบไฟล์ (มีภาพจาก FS เดิม) ====================
    case 'mkdir': case 'md':
      if (targets.length === 0) return missing(action);
      return ok({ newFileSystem: [...fileSystem, ...targets.filter(t => !exists(t)).map(t => ({ name: t, type: 'folder' as const }))] });

    case 'touch':
      if (targets.length === 0) return missing(action, 'file operand');
      return ok({ newFileSystem: [...fileSystem, ...targets.filter(t => !exists(t)).map(t => ({ name: t, type: 'file' as const }))] });

    case 'rm': case 'del': case 'rd': case 'rmdir':
      if (targets.length === 0) return missing(action);
      return ok({ newFileSystem: fileSystem.filter(f => !targets.includes(f.name)) });

    // ==================== คัดลอก / ย้าย / เปลี่ยนชื่อ ====================
    case 'cp': case 'copy': case 'xcopy': case 'robocopy': case 'scp': case 'rsync': {
      if (targets.length < 2) return missing(action, 'destination');
      const [src, dest] = [targets[0], targets[targets.length - 1]];
      const srcFile = fileSystem.find(f => f.name === src);
      const newFileSystem = srcFile && !exists(dest) && !dest.includes('/') && !dest.includes(':')
        ? [...fileSystem, { name: dest, type: srcFile.type }]
        : fileSystem;
      const isRemote = action === 'scp' || action === 'rsync';
      const base = ok({
        newFileSystem,
        output: `${GRN}✓${R} ${src} → ${dest}`,
        effect: isRemote ? { kind: 'network', label: `${action.toUpperCase()} TRANSFER` } : { kind: 'copy', label: `COPY → ${dest}` },
      });
      if (isRemote) return { ...base, output: undefined, outputLines: [`${DIM}connecting to remote host...${R}`, `${src}  ${'#'.repeat(18)}  100%`, `${GRN}✓ transfer complete${R}`], streamDelayMs: 260 };
      return base;
    }

    case 'mv': case 'move': case 'ren': {
      if (targets.length < 2) return missing(action, 'destination');
      const [src, dest] = [targets[0], targets[targets.length - 1]];
      const srcFile = fileSystem.find(f => f.name === src);
      const newFileSystem = srcFile
        ? fileSystem.map(f => (f.name === src ? { ...f, name: dest.includes('/') ? f.name : dest } : f)).filter(f => (dest.includes('/') ? f.name !== src : true))
        : fileSystem;
      return ok({ newFileSystem, output: `${GRN}✓${R} ${src} → ${dest}`, effect: { kind: 'move', label: `${action === 'ren' ? 'RENAME' : 'MOVE'} → ${dest}` } });
    }

    // ==================== อ่าน / ค้นหา ====================
    case 'cat': case 'type': case 'less': case 'more':
      if (!t0) return missing(action, 'file operand');
      if (!exists(t0)) return { output: `${RED}${action}: ${t0}: No such file or directory${R}`, valid: false };
      return ok({ output: fileLines(t0).join('\r\n'), effect: { kind: 'scan', targets: [t0], label: `READ ${t0}` } });

    case 'head': case 'tail': {
      if (!t0) return missing(action, 'file operand');
      const lines = fileLines(exists(t0) ? t0 : 'server.log');
      const sliced = action === 'head' ? lines.slice(0, 3) : lines.slice(-3);
      return ok({ output: sliced.join('\r\n'), effect: { kind: 'scan', targets: [t0], label: `${action.toUpperCase()} ${t0}` } });
    }

    case 'grep': case 'findstr': {
      if (args.length < 2) return missing(action, 'pattern or file');
      const term = targets[0];
      const file = targets[1] || 'server.log';
      const lines = fileLines(exists(file) ? file : 'server.log');
      const matched = lines.filter(l => l.toLowerCase().includes(term?.toLowerCase() || ''));
      const output = matched.length
        ? matched.map(l => l.replaceAll(term, `${B}${YEL}${term}${R}`)).join('\r\n')
        : `${DIM}(no matches for "${term}")${R}`;
      return ok({ output, effect: { kind: 'scan', targets: [file], label: `SEARCH "${term}"` } });
    }

    case 'find': {
      if (os === 'windows') { // windows find = ค้นข้อความ
        const term = (normalized.match(/"([^"]+)"/)?.[1]) || targets[0] || '';
        return ok({ output: fileLines('server.log').filter(l => l.toLowerCase().includes(term.toLowerCase())).join('\r\n') || `${DIM}(no matches)${R}`, effect: { kind: 'scan', targets: targets.slice(1), label: `FIND "${term}"` } });
      }
      const nameIdx = args.indexOf('-name');
      const pattern = (nameIdx >= 0 ? args[nameIdx + 1] : targets[1] || targets[0] || '*').replaceAll('"', '').replaceAll('*', '');
      const found = fileSystem.filter(f => f.name.includes(pattern));
      return ok({ output: found.length ? found.map(f => `./${f.name}`).join('\r\n') : `${DIM}(nothing found)${R}`, effect: { kind: 'scan', targets: found.map(f => f.name), label: 'FIND FILES' } });
    }

    case 'comp': case 'fc':
      if (targets.length < 2) return missing(action, 'files to compare');
      return ok({ output: `Comparing ${targets[0]} and ${targets[1]}...\r\n${GRN}FC: no differences encountered${R}`, effect: { kind: 'scan', targets: targets.slice(0, 2), label: 'COMPARE FILES' } });

    // ==================== บีบอัด ====================
    case 'tar': case 'zip': {
      const archive = targets.find(t => t.includes('.tar') || t.includes('.zip') || t.includes('.gz')) || (action === 'zip' ? `${targets[0] || 'archive'}.zip` : 'archive.tar.gz');
      const isExtract = args.includes('-xvf') || args.includes('-xzvf') || args.includes('-x');
      if (isExtract) {
        return ok({
          newFileSystem: [...fileSystem, { name: 'extracted_data', type: 'folder' as const }].filter((f, i, a) => a.findIndex(x => x.name === f.name) === i),
          output: `${GRN}✓${R} extracted ${archive}`,
          effect: { kind: 'archive', mode: 'unpack', label: `EXTRACT ${archive}` },
        });
      }
      return ok({
        newFileSystem: exists(archive) ? fileSystem : [...fileSystem, { name: archive, type: 'file' as const }],
        output: `${GRN}✓${R} created ${archive}`,
        effect: { kind: 'archive', mode: 'pack', label: `PACK → ${archive}` },
      });
    }

    case 'gzip':
      if (!t0) return missing(action, 'file operand');
      return ok({
        newFileSystem: fileSystem.map(f => (f.name === t0 ? { ...f, name: `${t0}.gz` } : f)),
        effect: { kind: 'archive', mode: 'pack', label: `GZIP → ${t0}.gz` },
      });

    case 'gunzip': case 'unzip': {
      if (!t0) return missing(action, 'file operand');
      const newName = t0.replace(/\.(gz|zip)$/, '');
      return ok({
        newFileSystem: fileSystem.map(f => (f.name === t0 ? { ...f, name: newName || t0 } : f)),
        output: `${GRN}✓${R} extracted ${t0}`,
        effect: { kind: 'archive', mode: 'unpack', label: `EXTRACT ${t0}` },
      });
    }

    // ==================== สิทธิ์ / ความปลอดภัย ====================
    case 'chmod': case 'chown': case 'attrib': case 'icacls': case 'cipher': {
      const fileTargets = targets.filter(exists);
      if (targets.length === 0) return missing(action);
      return ok({
        output: `${GRN}✓${R} ${action === 'chown' ? 'owner changed' : 'permissions updated'}: ${targets.join(' ')}`,
        effect: { kind: 'permission', targets: fileTargets.length ? fileTargets : targets, label: action.toUpperCase() },
      });
    }

    case 'passwd':
      return ok({ output: `${DIM}passwd: password updated successfully (simulated)${R}`, effect: { kind: 'permission', targets: [], label: 'PASSWORD CHANGED' } });

    // ==================== เครือข่าย ====================
    case 'ping': {
      const host = t0 || 'keyrush.dev';
      const ms = () => (Math.random() * 20 + 8).toFixed(0);
      const lines = os === 'linux'
        ? [`PING ${host} (104.21.8.14): 56 data bytes`, ...[0, 1, 2, 3].map(i => `64 bytes from 104.21.8.14: icmp_seq=${i} ttl=57 time=${ms()} ms`), `${DIM}--- ${host} ping statistics ---${R}`, `4 packets transmitted, 4 received, ${GRN}0% packet loss${R}`]
        : [`Pinging ${host} [104.21.8.14] with 32 bytes of data:`, ...[0, 1, 2, 3].map(() => `Reply from 104.21.8.14: bytes=32 time=${ms()}ms TTL=57`), `Packets: Sent = 4, Received = 4, Lost = 0 ${GRN}(0% loss)${R}`];
      return ok({ outputLines: lines, streamDelayMs: 300, effect: { kind: 'network', label: `PING ${host}` } });
    }

    case 'tracert': case 'traceroute': {
      const host = t0 || 'keyrush.dev';
      return ok({
        outputLines: [`Tracing route to ${host} [104.21.8.14]`, ` 1  ${DIM}<1 ms${R}   192.168.1.1`, ` 2   4 ms   10.20.0.1`, ` 3  11 ms   172.16.4.9`, ` 4  ${GRN}14 ms   104.21.8.14${R}`, `${GRN}Trace complete.${R}`],
        streamDelayMs: 320,
        effect: { kind: 'network', label: `TRACE ${host}` },
      });
    }

    case 'curl': case 'wget': {
      const url = t0 || 'https://keyrush.dev';
      return ok({
        outputLines: [`${DIM}Resolving ${url.replace(/https?:\/\//, '')}...${R}`, `HTTP/2 ${GRN}200 OK${R}`, `{ "status": "online", "latency": "${(Math.random() * 30 + 10).toFixed(0)}ms" }`],
        streamDelayMs: 240,
        effect: { kind: 'network', label: `HTTP GET` },
      });
    }

    case 'ssh': {
      const host = t0 || 'server01';
      return ok({
        outputLines: [`${DIM}Connecting to ${host}...${R}`, `${GRN}✓ Authenticated (publickey)${R}`, `Welcome to ${host} — last login ${new Date().toLocaleDateString()}`],
        streamDelayMs: 300,
        effect: { kind: 'network', label: `SSH ${host}` },
      });
    }

    case 'ifconfig': case 'ipconfig': case 'ip': {
      const output = os === 'linux'
        ? [`${B}eth0${R}: flags=4163<UP,BROADCAST,RUNNING>  mtu 1500`, `    inet ${CYN}192.168.1.42${R}  netmask 255.255.255.0`, `    ether 3c:22:fb:9a:1e:07`].join('\r\n')
        : [`${B}Ethernet adapter Ethernet:${R}`, `   IPv4 Address. . . . . . : ${CYN}192.168.1.42${R}`, `   Subnet Mask . . . . . . : 255.255.255.0`, `   Default Gateway . . . . : 192.168.1.1`].join('\r\n');
      return ok({ output, effect: { kind: 'network', label: 'NETWORK CONFIG' } });
    }

    case 'netstat': case 'ss':
      return ok({
        output: [`Proto  Local Address        State`, `TCP    0.0.0.0:8080         ${GRN}LISTENING${R}`, `TCP    192.168.1.42:52114   ${YEL}ESTABLISHED${R}`].join('\r\n'),
        effect: { kind: 'network', label: 'OPEN CONNECTIONS' },
      });

    case 'nslookup':
      return ok({ output: [`Server:  8.8.8.8`, `Name:    ${t0 || 'keyrush.dev'}`, `Address: ${CYN}104.21.8.14${R}`].join('\r\n'), effect: { kind: 'network', label: `DNS LOOKUP` } });

    case 'getmac':
      return ok({ output: `3C-22-FB-9A-1E-07   ${DIM}\\Device\\Tcpip_{A4...}${R}`, effect: { kind: 'network', label: 'MAC ADDRESS' } });

    case 'netsh':
      return ok({ output: `${GRN}Ok.${R} ${DIM}(netsh simulated)${R}`, effect: { kind: 'network', label: 'NETSH' } });

    case 'hostname':
      return ok({ output: `keyrush-station-01`, effect: { kind: 'sysinfo', label: 'HOSTNAME' } });

    // ==================== โปรเซส / เซอร์วิส ====================
    case 'ps': case 'top': case 'htop': case 'tasklist':
      return ok({
        output: [`${B}${os === 'linux' ? '  PID TTY      TIME     CMD' : 'Image Name        PID   Mem Usage'}${R}`, ...FAKE_PROCS.map(([pid, cmd, time]) => (os === 'linux' ? `${pid.padStart(5)} pts/0    ${time}    ${cmd}` : `${cmd.padEnd(17)} ${pid.padStart(4)}   ${(Math.random() * 90 + 10).toFixed(0)},512 K`))].join('\r\n'),
        effect: { kind: 'process', mode: 'list', label: 'RUNNING PROCESSES' },
      });

    case 'kill': case 'pkill': case 'taskkill': {
      if (targets.length === 0) return missing(action, 'pid or name');
      return ok({ output: `${GRN}✓${R} terminated: ${targets.join(' ')}`, effect: { kind: 'process', mode: 'kill', label: `KILL ${targets[0]}` } });
    }

    case 'systemctl': case 'service': {
      const svc = targets[1] || targets[0] || 'nginx';
      const verb = args.find(a => ['start', 'stop', 'restart', 'status', 'enable', 'disable'].includes(a)) || 'status';
      return ok({
        output: verb === 'status'
          ? [`${GRN}●${R} ${svc}.service - ${svc}`, `   Active: ${GRN}active (running)${R} since ${new Date().toLocaleTimeString()}`].join('\r\n')
          : `${GRN}✓${R} ${svc}: ${verb} completed`,
        effect: { kind: 'process', mode: 'list', label: `SERVICE ${verb.toUpperCase()}` },
      });
    }

    case 'net':
      return ok({ output: `${GRN}The command completed successfully.${R}`, effect: { kind: 'process', mode: 'list', label: 'NET SERVICE' } });

    // ==================== ข้อมูลระบบ ====================
    case 'whoami':
      return ok({ output: os === 'windows' ? `keyrush\\${username}` : username, effect: { kind: 'sysinfo', label: 'IDENTITY' } });
    case 'id':
      return ok({ output: `uid=1000(${username}) gid=1000(${username}) groups=1000,27(sudo)`, effect: { kind: 'sysinfo', label: 'USER ID' } });
    case 'uname':
      return ok({ output: `Linux keyrush-station 6.8.0-keyrush #1 SMP x86_64 GNU/Linux`, effect: { kind: 'sysinfo', label: 'KERNEL INFO' } });
    case 'ver':
      return ok({ output: `Microsoft Windows [Version 10.0.26200] ${DIM}(KeyRush Sim)${R}`, effect: { kind: 'sysinfo', label: 'OS VERSION' } });
    case 'systeminfo':
      return ok({ output: [`Host Name:        KEYRUSH-STATION`, `OS Name:          Microsoft Windows 11 Pro`, `Total Memory:     16,384 MB`].join('\r\n'), effect: { kind: 'sysinfo', label: 'SYSTEM INFO' } });
    case 'df':
      return ok({ output: [`Filesystem      Size  Used Avail Use%`, `/dev/sda1       238G   96G  130G  ${YEL}43%${R}`].join('\r\n'), effect: { kind: 'sysinfo', label: 'DISK USAGE' } });
    case 'du':
      return ok({ output: fileSystem.slice(0, 4).map(f => `${(Math.random() * 900 + 10).toFixed(0)}K\t./${f.name}`).join('\r\n') || '0K\t.', effect: { kind: 'sysinfo', label: 'DIR SIZE' } });
    case 'free':
      return ok({ output: [`              total    used    free`, `Mem:          16032    6544    9488`, `Swap:          2048       0    2048`].join('\r\n'), effect: { kind: 'sysinfo', label: 'MEMORY' } });
    case 'uptime':
      return ok({ output: ` ${new Date().toLocaleTimeString()} up 3 days,  2 users,  load average: 0.42, 0.35, 0.28`, effect: { kind: 'sysinfo', label: 'UPTIME' } });
    case 'date': case 'time':
      return ok({ output: new Date().toString(), effect: { kind: 'sysinfo', label: 'CLOCK' } });
    case 'set': case 'path':
      return ok({ output: [`PATH=C:\\Windows\\system32;C:\\Windows;C:\\keyrush\\bin`, `USERNAME=${username}`].join('\r\n'), effect: { kind: 'sysinfo', label: 'ENVIRONMENT' } });
    case 'wmic':
      return ok({ output: `${DIM}(wmic simulated)${R} Caption=KeyRush Virtual Disk  Size=256GB`, effect: { kind: 'sysinfo', label: 'WMIC' } });
    case 'gpresult':
      return ok({ output: `${DIM}Applied Group Policy: KeyRushTraining-Policy${R}`, effect: { kind: 'sysinfo', label: 'GROUP POLICY' } });
    case 'gpupdate':
      return ok({ outputLines: [`Updating policy...`, `${GRN}Computer Policy update has completed successfully.${R}`], streamDelayMs: 350, effect: { kind: 'sysinfo', label: 'POLICY UPDATE' } });
    case 'sfc':
      return ok({ outputLines: [`Beginning system scan...`, `Verification 100% complete.`, `${GRN}Windows Resource Protection did not find any integrity violations.${R}`], streamDelayMs: 350, effect: { kind: 'scan', targets: [], label: 'SYSTEM FILE CHECK' } });
    case 'chkdsk':
      return ok({ outputLines: [`Checking file system on C:`, `Stage 1: examining basic file system structure...`, `${GRN}Windows has scanned the file system and found no problems.${R}`], streamDelayMs: 350, effect: { kind: 'scan', targets: [], label: 'DISK CHECK' } });
    case 'diskpart': case 'dism': case 'format':
      return ok({ output: `${YEL}⚠ ${action} is restricted in training mode${R} ${DIM}(simulated)${R}`, effect: { kind: 'sysinfo', label: action.toUpperCase() } });
    case 'assoc': case 'ftype':
      return ok({ output: `.txt=txtfile`, effect: { kind: 'sysinfo', label: 'FILE ASSOC' } });

    default:
      return notFound(os, action);
  }
}
