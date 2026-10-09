export const portfolio = {
  // Single source for the positioning line. index.html's meta description and
  // JSON-LD jobTitle both mirror this — keep the three in sync.
  positioning: 'Offensive Security & Bug Bounty Hunter',
  hero: {
    name: 'Dhurgesh M J',
    role: 'Offensive Security // Bug Bounty Hunter',
    tagline: 'I break things so others can build them safer.'
  },
  about: {
    bio: 'I’m 19, a second-year CS student at SRMIST Chennai. While most of my peers are still in theory, I operate in the field — pentesting live targets, dissecting malware in isolated labs, and building the Python tools that don\u2019t exist yet. Certified Social Engineering Defense Practitioner (with Merit). Building toward red teaming and malware research: the engineer who finds CVEs before they\u2019re published.',
    interests: ['Bug Bounty', 'Malware Analysis', 'Python Tooling', 'CTF Challenges', 'OSINT & Recon'],
    // Surfaced in the About chapter — previously declared here and rendered nowhere.
    experience: [
      {
        role: 'Cyber Security Intern',
        organization: 'Cybertracs Technologies & Research',
        description: 'Hands-on security work on live engagements — testing, reporting, learning at field speed.'
      },
      {
        role: 'Cyber Security Specialist',
        organization: 'Axivo Websites and Software',
        description: 'End-to-end web assessments across auth, access control and injection surfaces, plus OWASP-aligned client security policies.'
      },
      {
        role: 'Web App Pentesting Intern',
        organization: 'Cappricio Securities',
        description: 'Black-box and grey-box pentests on live targets with bug bounty methodology — XSS, IDOR, broken access control, reported with repro steps.'
      }
    ],
    location: 'Chennai, India'
  },
  achievements: [
    {
      marker: '\u25C6',
      label: 'HALL OF FAME',
      caption: 'Listed in bug bounty halls of fame — vulnerabilities responsibly disclosed, fixed, and credited.',
      source: 'Bug Bounty',
    },
    {
      marker: '\u25C8',
      label: 'CVE TRIPLE',
      caption: 'Three assigned CVEs and counting: CVE-2026-103471, CVE-2026-103472, CVE-2026-102333.',
      source: 'CVE Program',
    },
    {
      marker: '\u2605',
      label: 'HAT-TRICK',
      caption: 'Three 1st-place finishes on stage: Bugathon, Secure Tooling Competition, and Tool Expo.',
      source: 'Competitions',
    },
    {
      marker: '\u2B23',
      label: 'DISCLOSED',
      caption: 'Vulnerability responsibly reported to and acknowledged by CERT-In, India\u2019s national cybersecurity agency.',
      source: 'CERT-In',
    },
  ],
  skills: [
    { name: 'Burp Suite', category: 'Tools', description: 'Web proxy, repeater, intruder — live-target testing' },
    { name: 'Python', category: 'Languages', description: 'Recon, exploitation and scanning automation' },
    { name: 'Web Pentesting', category: 'Security', description: 'XSS, IDOR, broken access control — OWASP Top 10' },
    { name: 'Malware Analysis', category: 'Security', description: 'Evasion, persistence and C2 patterns in isolated labs' },
    { name: 'Recon & OSINT', category: 'Systems', description: 'Subdomain enum, JS recon, dark-web intel gathering' },
    { name: 'Linux', category: 'Systems', description: 'Kali workflows, shell scripting, networking' },
    { name: 'Networking', category: 'Systems', description: 'Packet crafting, TCP/IP, traffic deception' },
    { name: 'Reverse Engineering', category: 'Security', description: 'Binaries, decompilers, figure-out-how-it-ticks' }
  ],
  projects: [
    {
      title: 'Deceptor',
      description: 'Real-time network deception and packet forgery engine in C with libpcap — forge packets to spin up fake hosts and deceptive terrain.',
      tech: ['C', 'libpcap', 'Deception'],
      role: 'Solo Developer',
      github: 'https://github.com/Dhurgesh-mj/Deceptor'
    },
    {
      title: 'Subdomainator-V2',
      description: 'High-performance subdomain enumeration in Python — async passive plus brute-force discovery for recon at speed.',
      tech: ['Python', 'AsyncIO', 'Recon'],
      role: 'Solo Developer',
      github: 'https://github.com/Dhurgesh-mj/Subdomainator-V2'
    },
    {
      title: 'ShinobiJS',
      description: 'Fast, focused JavaScript recon ninja — extract every hidden script, endpoint and JS clue from a web app in seconds.',
      tech: ['JavaScript', 'Recon', 'OSINT'],
      role: 'Solo Developer',
      github: 'https://github.com/Dhurgesh-mj/ShinobiJS'
    }
  ],
  contact: {
    email: 'dhurgeshj@gmail.com',
    github: 'https://github.com/Dhurgesh-mj',
    linkedin: 'https://www.linkedin.com/in/dhurgesh-mj/',
    // Drop a PDF at public/dhurgesh-mj-cv.pdf and it appears automatically.
    // The whole link is gated on the file existing, so no dead download.
    cv: '/dhurgesh-mj-cv.pdf',
    tagline: 'Got something that needs breaking first? Open to offensive-security internships, malware research collabs, and bounty team-ups.'
  }
};
