export const portfolio = {
  hero: {
    name: 'Dhurgesh M J',
    role: 'Offensive Security // Bug Bounty Hunter',
    tagline: 'I break things so others can build them safer.'
  },
  about: {
    bio: '19, second-year CS at SRMIST Chennai. While most of my peers are still in theory, I operate in the field — pentesting live targets, dissecting malware in isolated labs, and building the Python tools that don\u2019t exist yet. Certified Social Engineering Defense Practitioner (with Merit). Building toward red teaming and malware research: the engineer who finds CVEs before they\u2019re published.',
    interests: ['Bug Bounty', 'Malware Analysis', 'Python Tooling', 'CTF Challenges', 'OSINT & Recon'],
    location: 'Chennai, India'
  },
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
  contact: {
    email: 'dhurgeshj@gmail.com',
    github: 'https://github.com/Dhurgesh-mj',
    linkedin: 'https://www.linkedin.com/in/dhurgesh-mj/',
    tagline: 'Got something that needs breaking first? Open to offensive-security internships, malware research collabs, and bounty team-ups.'
  }
};
