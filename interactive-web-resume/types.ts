export interface Education {
  institution: string;
  degree: string;
  startDate: string;
  endDate: string;
  score: string; // CGPA or Percentage
  location?: string;
}

export interface Internship {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  location: string; // Remote/Hybrid/City
  points: string[];
}

export interface Project {
  name: string;
  technologies?: string; // Optional subtitle like (Portable Humidifier)
  startDate: string;
  points: string[];
}

export interface Certificate {
  name: string;
  issuer: string;
  date: string;
}

export interface Extracurricular {
  organization: string;
  role: string;
  startDate: string;
  endDate: string;
  points: string[];
}

export interface ResumeData {
  fullName: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  linkedin: string;
  github: string;
  portfolio: string;
  
  education: Education[];
  
  technicalSkills: {
    tools: string;
    skills: string;
  };
  
  internships: Internship[];
  projects: Project[];
  
  achievements: string[]; // List of strings for simplicity based on OCR
  
  certificates: Certificate[];
  
  extracurricular: Extracurricular[];
}

// Initial State for the Resume
export const INITIAL_RESUME_STATE: ResumeData = {
  fullName: "ABC XYZ",
  city: "Ghaziabad",
  state: "Uttar Pradesh",
  phone: "1234567890",
  email: "email@gmail.com",
  linkedin: "linkedin.com/in/username",
  github: "github.com/username",
  portfolio: "Portfolio Link",
  education: [
    {
      institution: "ABES Engineering College",
      degree: "B.Tech in ECE (AKTU)",
      startDate: "Nov 2022",
      endDate: "July 2026",
      score: "CGPA-7.0",
      location: ""
    },
    {
      institution: "Ch. Chhabil Dass Public School",
      degree: "Class 12th (CBSE)",
      startDate: "",
      endDate: "2022",
      score: "76.2%",
      location: ""
    }
  ],
  technicalSkills: {
    tools: "Arduino IDE, BLYNK IOT, Firebase, MATLAB, Proteus, LT Spice",
    skills: "Embedded Programming & Firmware, Hardware Integration, C language, Circuit simulation"
  },
  internships: [
    {
      company: "Humble Bee @ Buzzworthy",
      role: "Embedded Intern",
      startDate: "March 2025",
      endDate: "Present",
      location: "Hybrid",
      points: [
        "Developing real-time signal processing solutions using ESP32 for embedded applications",
        "Implementing audio signal acquisition and preprocessing using ADC and filtering techniques"
      ]
    }
  ],
  projects: [
    {
      name: "ARDUMIST (Portable Humidifier)",
      startDate: "May 2024",
      points: [
        "Developed a portable humidifier using an Arduino UNO microcontroller to maintain room humidity levels above 75%",
        "Integrated a DHT sensor for real-time humidity monitoring and an ultrasonic vibration mechanism for water spray"
      ]
    }
  ],
  achievements: [
    "GATE 2025 - Qualified in Electronics & Communication"
  ],
  certificates: [
    {
      name: "The Complete Python Developer",
      issuer: "Udemy",
      date: "Oct 2023-Nov 2023"
    }
  ],
  extracurricular: [
    {
      organization: "Light De Literacy (NGO Initiative)",
      role: "Camp Coordinator",
      startDate: "Dec 2022",
      endDate: "Present",
      points: [
        "Educating 50+ underprivileged students in slum areas on STEM subjects, emphasizing basic electronics."
      ]
    }
  ]
};