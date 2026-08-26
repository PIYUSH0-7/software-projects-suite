import { SemesterCurriculum } from "../types";

export const CURRICULUM: SemesterCurriculum[] = [
  {
    semester: 1,
    totalCredits: 22,
    subjects: [
      { code: "BAS101/102", name: "Engineering Physics/Chemistry", credits: 4, type: "Theory" },
      { code: "BAS103", name: "Engineering Mathematics-I", credits: 4, type: "Theory" },
      { code: "BEE101/BEC101", name: "Basic Electrical/Electronics Engg", credits: 3, type: "Theory" },
      { code: "BCS101/BME101", name: "Prog. for Problem Solving/Mech. Engg", credits: 3, type: "Theory" },
      { code: "BAS104/105", name: "Env. & Ecology/Soft Skills", credits: 3, type: "Theory" },
      { code: "BAS151/152", name: "Physics/Chemistry Lab", credits: 1, type: "Practical" },
      { code: "BEE151/BEC151", name: "Electrical/Electronics Lab", credits: 1, type: "Practical" },
      { code: "BCS151/BAS155", name: "PPS Lab / English Lang Lab", credits: 1, type: "Practical" },
      { code: "BCE151/BWS151", name: "Engg Graphics / Workshop Practice", credits: 2, type: "Practical" }
    ]
  },
  {
    semester: 2,
    totalCredits: 22,
    subjects: [
      { code: "BAS202/201", name: "Engineering Chemistry/Physics", credits: 4, type: "Theory" },
      { code: "BAS203", name: "Engineering Mathematics-II", credits: 4, type: "Theory" },
      { code: "BEC201/BEE201", name: "Fund. of Electronics/Electrical Engg", credits: 3, type: "Theory" },
      { code: "BME201/BCS201", name: "Fund. of Mech Engg/Prog. Problem Solving", credits: 3, type: "Theory" },
      { code: "BAS205/204", name: "Soft Skills/Env. & Ecology", credits: 3, type: "Theory" },
      { code: "BAS252/251", name: "Chemistry/Physics Lab", credits: 1, type: "Practical" },
      { code: "BEC251/BEE251", name: "Electronics/Electrical Lab", credits: 1, type: "Practical" },
      { code: "BAS255/BCS251", name: "English Lab / PPS Lab", credits: 1, type: "Practical" },
      { code: "BWS251/BCE251", name: "Workshop Practice / Engg Graphics", credits: 2, type: "Practical" }
    ]
  },
  {
    semester: 3,
    totalCredits: 25,
    subjects: [
      { code: "BOE3**/BAS303", name: "Science Based OE / Maths-IV", credits: 4, type: "Theory" },
      { code: "BVE301/BAS301", name: "Universal Human Value / Tech Comm", credits: 3, type: "Theory" },
      { code: "BCS301", name: "Data Structure", credits: 4, type: "Theory" },
      { code: "BCS302", name: "Computer Organization & Arch", credits: 4, type: "Theory" },
      { code: "BCS303", name: "Discrete Structures & Logic", credits: 3, type: "Theory" },
      { code: "BCS351", name: "Data Structure Lab", credits: 1, type: "Practical" },
      { code: "BCS352", name: "COA Lab", credits: 1, type: "Practical" },
      { code: "BCS353", name: "Web Designing Workshop", credits: 1, type: "Practical" },
      { code: "BCC301/302", name: "Cyber Security / Python Prog", credits: 2, type: "Theory" },
      { code: "BCC351", name: "Internship Assessment", credits: 2, type: "Practical" }
    ]
  },
  {
    semester: 4,
    totalCredits: 23,
    subjects: [
      { code: "BAS403/BOE4**", name: "Maths-IV / Science Based OE", credits: 4, type: "Theory" },
      { code: "BAS401/BVE401", name: "Tech Comm / Universal Human Value", credits: 3, type: "Theory" },
      { code: "BCS401", name: "Operating System", credits: 4, type: "Theory" },
      { code: "BCS402", name: "Theory of Automata", credits: 4, type: "Theory" },
      { code: "BCS403", name: "OOP with Java", credits: 3, type: "Theory" },
      { code: "BCS451", name: "Operating System Lab", credits: 1, type: "Practical" },
      { code: "BCS452", name: "OOP with Java Lab", credits: 1, type: "Practical" },
      { code: "BCS453", name: "Cyber Security Workshop", credits: 1, type: "Practical" },
      { code: "BCC402/401", name: "Python Prog / Cyber Security", credits: 2, type: "Theory" },
      { code: "BVE451/452", name: "Sports and Yoga / NSS", credits: 0, type: "Audit" }
    ]
  },
  {
    semester: 5,
    totalCredits: 23,
    subjects: [
      { code: "BCS501", name: "Database Management System", credits: 4, type: "Theory" },
      { code: "BCS502", name: "Web Technology", credits: 4, type: "Theory" },
      { code: "BCS503", name: "Design and Analysis of Algo", credits: 4, type: "Theory" },
      { code: "BCS051-054", name: "Departmental Elective-I", credits: 3, type: "Theory" },
      { code: "BCS055-058", name: "Departmental Elective-II", credits: 3, type: "Theory" },
      { code: "BCS551", name: "DBMS Lab", credits: 1, type: "Practical" },
      { code: "BCS552", name: "Web Technology Lab", credits: 1, type: "Practical" },
      { code: "BCS553", name: "DAA Lab", credits: 1, type: "Practical" },
      { code: "BCS554", name: "Mini Project/Internship", credits: 2, type: "Practical" },
      { code: "BNC501/502", name: "Constitution of India", credits: 0, type: "Audit" }
    ]
  },
  {
    semester: 6,
    totalCredits: 21,
    subjects: [
      { code: "BCS601", name: "Software Engineering", credits: 4, type: "Theory" },
      { code: "BIT601", name: "Data Analytics", credits: 4, type: "Theory" },
      { code: "BCS603", name: "Computer Networks", credits: 4, type: "Theory" },
      { code: "BCS061-064", name: "Departmental Elective-III", credits: 3, type: "Theory" },
      { code: "OE-I", name: "Open Elective-I", credits: 3, type: "Theory" },
      { code: "BCS651", name: "Software Engineering Lab", credits: 1, type: "Practical" },
      { code: "BIT651", name: "Data Analytics Lab", credits: 1, type: "Practical" },
      { code: "BCS653", name: "Computer Networks Lab", credits: 1, type: "Practical" },
      { code: "BNC601/602", name: "Constitution / Trad. Knowledge", credits: 0, type: "Audit" }
    ]
  },
  {
    semester: 7,
    totalCredits: 19,
    subjects: [
      { code: "BCS701", name: "Artificial Intelligence", credits: 3, type: "Theory" },
      { code: "DE-IV", name: "Departmental Elective-IV", credits: 3, type: "Theory" },
      { code: "OE-II", name: "Open Elective-II", credits: 3, type: "Theory" },
      { code: "BCS751", name: "Artificial Intelligence LAB", credits: 1, type: "Practical" },
      { code: "BIT752", name: "Mini Project / Internship", credits: 2, type: "Practical" },
      { code: "BIT753", name: "Project-I", credits: 5, type: "Practical" },
      { code: "BIT754", name: "Startup Activity", credits: 2, type: "Practical" }
    ]
  },
  {
    semester: 8,
    totalCredits: 16,
    subjects: [
      { code: "OE-III", name: "Open Elective-III", credits: 3, type: "Theory" },
      { code: "OE-IV", name: "Open Elective-IV", credits: 3, type: "Theory" },
      { code: "BIT851", name: "Project-II", credits: 10, type: "Practical" }
    ]
  }
];

export const getSemesterData = (sem: number) => CURRICULUM.find(c => c.semester === sem);