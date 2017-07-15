import { Structs } from '../common/Structs'
import { Constants } from '../common/Constants'
import { extend, sortObject } from '../common/Utils'
import { PROGRAMS, COURSES } from './Database'
import Chrome from './Chrome'
export class Server {
    public static init() {
        Chrome.registerResponder({
            'getUserProgramList': Server.getUserProgramList
        })
    }

    public static getUserCourses(): Promise<Structs.UCourses> {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.get('courses', (items) => {
                resolve(items['courses'] || {})
            })
        })
    }

    public static saveUserCourses(updatedCourses: Structs.UCourses): Promise<boolean> {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.set({ 'courses': updatedCourses }, () => {
                resolve(true)
            })
        })
    }

    public static getQueuedJobs() {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.get('queuedJobs', (items) => {
                resolve(items['queuedJobs'] || {})
            })
        })
    }

    public static queueJob(forWhom: 'd2l' | 'bcit.ca') {
        return new Promise(async (resolve, reject) => {
            let jobs = await Server.getQueuedJobs()
            jobs[forWhom] = true
            chrome.storage.sync.set({ 'queuedJobs': jobs }, () => {
                resolve(true)
            })
        })
    }

    public static unQueueJob(forWhom: 'd2l' | 'bcit.ca') {
        return new Promise(async (resolve, reject) => {
            let jobs = await Server.getQueuedJobs()
            jobs[forWhom] = false
            chrome.storage.sync.set({ 'queuedJobs': jobs }, () => {
                resolve(true)
            })
        })
    }

    // public static getUserProgramList(options: { sort_by?: 'progress' } = {}) {
    //     return new Promise(async (resolve, reject) => {
    //         console.log(Object.keys(PROGRAMS));

    //         let userCourses = await Server.getUserCourses()
    //         let userPrograms: Structs.UPrograms = {}
    //         for (let courseId in userCourses) {

    //             // extend user's course with indexed course to create course object
    //             let course = extend({}, COURSES[courseId], userCourses[courseId])

    //             if (course.programs) {
    //                 course.programs.forEach(programId => {
    //                     if (programId == '6992acert') {
    //                         //debugger
    //                     }
    //                     // extend user's program with indexed program to create a program object
    //                     let program: Structs.UProgram =
    //                         // If exists already from previous runs (if any)
    //                         userPrograms[programId]
    //                         ||
    //                         // if not then create new entry
    //                         extend({}, <Structs.Program>PROGRAMS[programId], <Structs.UProgram>{
    //                             contributionByCompleteCourses: 0,
    //                             finalContributionByCurrentCourses: 0,
    //                             presentContributionByCurrentCourses: 0,
    //                             currentCourses: {},
    //                             completeCourses: {},
    //                             inCompleteCourses: {}
    //                         })

    //                     if (Server.calcCourseProgress(course) === 100) {
    //                         program.completeCourses[courseId] = course
    //                     }
    //                     else {
    //                         program.currentCourses[courseId] = course
    //                     }
    //                     // create/replace program record
    //                     userPrograms[programId] = program
    //                 })
    //             }
    //         }
    //         console.log('before', userPrograms);

    //         for (let pid in userPrograms) {
    //             let program = userPrograms[pid]
    //             let coursesTakenByUser = extend({}, program.completeCourses, program.currentCourses)
    //             program.courses.forEach(courseId => {
    //                 if (coursesTakenByUser[courseId]) {
    //                 } else {

    //                     program.inCompleteCourses[courseId] = COURSES[courseId]
    //                 }
    //             })
    //             Server.calcAndFillProgramProgression(program)
    //         }
    //         console.log('after', userPrograms);
    //         if (options.sort_by) {
    //             // console.log('before', userPrograms);

    //             userPrograms = Server.sortUserProgramList(userPrograms, options.sort_by)
    //             // console.log('after', userPrograms);
    //         }
    //         console.log('after sort', userPrograms);

    //         resolve(userPrograms)
    //     })
    // }

    private static calcAndFillProgramProgression(program: Structs.UProgram) {
        let completeCredits = 0
        for (let courseId in program.completeCourses) {
            let course = program.completeCourses[courseId]
            completeCredits += course.credits
        }
        program.contributionByCompleteCourses = (completeCredits / program.totalCredits) * 100

        let currentCredits = 0, currentCoursesProgress = 0, x = 0 // to avoid division by zero err
        for (let courseId in program.currentCourses) {
            let course = program.currentCourses[courseId]
            let courseCompletionPercent = Server.calcCourseProgress(course)
            x += (course.credits * courseCompletionPercent) / 100
            currentCoursesProgress += courseCompletionPercent
            currentCredits += course.credits
        }
        program.finalContributionByCurrentCourses = (currentCredits / program.totalCredits) * 100
        program.presentContributionByCurrentCourses = (x / program.totalCredits) * 100
        return
    }

    private static sortUserProgramList(userProgramList, sortModifier) {
        let userProgramListSorted = {}
        switch (sortModifier) {
            case 'progress':
                userProgramListSorted = sortObject(userProgramList, (programA: Structs.UProgram, programB: Structs.UProgram) => {
                    let a_reqCreditsAsPct = (programA.requiredCredits / programA.totalCredits) * 100
                    let b_reqCreditsAsPct = (programB.requiredCredits / programB.totalCredits) * 100
                    let a_progress = (programA.contributionByCompleteCourses + programA.presentContributionByCurrentCourses) / a_reqCreditsAsPct
                    let b_progress = (programB.contributionByCompleteCourses + programB.presentContributionByCurrentCourses) / b_reqCreditsAsPct
                    if (a_progress < b_progress) return 1
                    if (a_progress > b_progress) return -1
                    else return 0
                })
                break;

            default:
                break;
        }
        return userProgramListSorted
    }

    public static getLastScrapeTime(): Promise<Date> {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.get('lastScrapeTime', (items) => {
                resolve(items['lastScrapeTime'])
            })
        })
    }

    public static getActiveSemester(): Constants.Semester {
        let currentMonth = new Date().getMonth() + 1
        let {Fall, Spring, Winter} = Constants.Semester
        // This function will fail terribly if earlier months are computed first because currentMonth will likely be greater than say Winter(1) or Spring(4)
        if (currentMonth > Fall)
            return Fall
        if (currentMonth > Spring)
            return Spring
        if (currentMonth > Winter)
            return Winter
    }



    public static calcCourseProgress(courseOrCourses: Structs.UCourse | Structs.UCourse[]): number {
        if (courseOrCourses.constructor.name === 'Array') {
            let courses = courseOrCourses as Structs.UCourse[]
            let coursesProgress = {}
            courses.forEach(course => {
                coursesProgress[course.cid] = Server.calcCourseProgress(course)
            });
        }
        let course = courseOrCourses as Structs.UCourse
        let today = new Date()
        if (!course.endDate || !course.startDate) {
            console.error('ERRORED AT: ', Date.now(), 'ON', course.cid)
            throw new TypeError(`startDate and endDate of course cannot be null or undefined. It must be a ISO Formatted Date or a string of value 'NOT_RELEVANT_ANYMORE' that concludes the course is fully complete`)
        }
        if (course.endDate === 'NOT_RELEVANT_ANYMORE' && course.startDate === 'NOT_RELEVANT_ANYMORE') {
            return 100
        }

        let courseStartDate = new Date(course.startDate)
        let millisSinceCourseStart = today.getTime() - courseStartDate.getTime()
        if (millisSinceCourseStart < 0) {
            return 0
        }

        let courseLengthInMillis = (new Date(course.endDate).getTime() - courseStartDate.getTime())
        return (millisSinceCourseStart / courseLengthInMillis) * 100;
    }
}