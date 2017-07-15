import { extend } from './Utils';
import { COURSES } from '../background/Databases/Courses';
import { Constants } from './Constants'

export namespace Structs {
    export interface Program {
        pid: string;
        name: string;
        requiredCredits: number;
        totalCredits: number;
        courses: string[];
        cred: string | ProgramCredential;
        type: string | ProgramDeliveryType;
    }

    export interface Programs {
        [programId: string]: Program
    }

    export interface Course {
        cid: string
        name: string;
        credits: number;
        programs: string[];
    }

    export interface UPrograms {
        [programId: string]: UProgram
    }

    export interface UProgram extends Program {
        contributionByCompleteCourses: number;
        finalContributionByCurrentCourses: number;
        presentContributionByCurrentCourses: number;
        currentCourses: UCourses & Courses;
        completeCourses: UCourses & Courses;
        inCompleteCourses: Courses;
        isTracked?: boolean;
    }

    export interface Renderable {
        [oKey: string]: { html: string; }
    }

    export interface Courses {
        [courseId: string]: Course
    }

    export interface UCourse {
        cid: string
        crn: string;
        semester: Constants.Semester;
        year: number;
        /**
         * ISO Formatted date
         */
        startDate: string | 'NOT_RELEVANT_ANYMORE';
        /**
         * ISO Formatted date
         */
        endDate: string | 'NOT_RELEVANT_ANYMORE';
    }

    export interface UCoursesPlus {
        [courseId: string]: UCourse & Course
    }

    export interface UCourses {
        [courseId: string]: UCourse
    }

    export interface MyBCITScrape {
        [courseId: string]: {
            semester: Constants.Semester;
            year: number;
        }
    }

    type ProgramCredential = 'cert' | 'acert' | 'N/A' | 'dip' | 'advdip' | 'ipcert';
    type ProgramDeliveryType = 'pt' | 'ft' | 'coop' | 'dist';
    export interface D2LScrape {
        [courseId: string]: {
            crn: string
        }
    }
}